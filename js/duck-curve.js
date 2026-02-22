/**
 * Duck Curve Module – Battery Energy Visualization
 *
 * Dependencies: Chart.js 4.x
 *
 * SETUP:
 *   Set window.DUCK_CURVE_CONFIG before this script loads.
 *
 * LIVE UPDATES:
 *   Call window.duckCurveUpdate({ batteryKwh: 27 }) to re-render
 *   when the customer changes their battery selection.
 *
 * SLIDESHOW:
 *   Call window.duckCurveInit() to initialize (or re-init) the chart.
 *   Call window.duckCurveDestroy() to tear it down when slide leaves.
 */

(function () {
  var cfg     = window.DUCK_CURVE_CONFIG || {};
  var DEMAND  = cfg.demand     || [];
  var SOLAR   = cfg.solar      || [];
  var BATTERY = cfg.batteryKwh || 0;
  var COST    = cfg.costPerKwh || 0.20;
  var GFEE    = cfg.gridFee   || 0;

  if (DEMAND.length !== 24 || SOLAR.length !== 24) {
    console.error('[DuckCurve] demand and solar must each be arrays of 24 numbers.');
    return;
  }

  // Build hour labels
  var HOURS = [];
  for (var i = 0; i < 24; i++) {
    if (i === 0) HOURS.push('12a');
    else if (i < 12) HOURS.push(i + 'a');
    else if (i === 12) HOURS.push('12p');
    else HOURS.push((i - 12) + 'p');
  }

  var shiftPct = 40;
  var chart = null;
  var sliderEl = null;
  var sliderHandler = null;

  function createChart() {
    var canvas = document.getElementById('dcChart');
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: HOURS,
        datasets: [
          {
            label: 'Demand', data: DEMAND.slice(),
            borderColor: '#3b82f6', backgroundColor: 'transparent',
            borderWidth: 2, fill: false, tension: 0.4,
            pointRadius: 0, pointHoverRadius: 4, order: 1
          },
          {
            label: 'Solar', data: SOLAR.slice(),
            borderColor: '#f59e0b', backgroundColor: 'transparent',
            borderWidth: 2, fill: false, tension: 0.4,
            pointRadius: 0, pointHoverRadius: 4, order: 2
          },
          {
            label: 'Grid', data: new Array(24).fill(0),
            borderColor: 'transparent', backgroundColor: 'rgba(239,68,68,0.15)',
            borderWidth: 0, fill: 'origin', tension: 0.4,
            pointRadius: 0, order: 0
          },
          {
            label: 'Solar+Batt', data: new Array(24).fill(null),
            borderColor: '#22c55e', backgroundColor: 'transparent',
            borderWidth: 2, borderDash: [5, 3], fill: false, tension: 0.4,
            pointRadius: 0, pointHoverRadius: 4, order: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1f2937',
            titleFont: { size: 12 },
            bodyFont: { size: 11 },
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: function (c) {
                if (c.dataset.label === 'Grid')
                  return c.parsed.y > 0.01 ? 'Grid: ' + c.parsed.y.toFixed(2) + ' kW' : null;
                var v = c.parsed.y;
                if (v === null || v === undefined) return null;
                return c.dataset.label + ': ' + v.toFixed(2) + ' kW';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, color: '#9ca3af', maxRotation: 0 }
          },
          y: {
            title: { display: true, text: 'kW', font: { size: 11, weight: '600' }, color: '#9ca3af' },
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 10 }, color: '#9ca3af' },
            beginAtZero: true
          }
        }
      }
    });
  }

  // Simulation
  function sim() {
    if (!chart) return;
    var cap = BATTERY;
    var sc = cap * (shiftPct / 100);
    var grid = new Array(24).fill(0);
    var bl = new Array(24).fill(null);
    var soc = 0;
    var maxRate = 5;

    if (cap > 0) {
      for (var h = 0; h < 24; h++) {
        var net = SOLAR[h] - DEMAND[h];
        if (net > 0) {
          var charge = Math.min(net, sc - soc, maxRate);
          soc += charge;
          grid[h] = 0;
          bl[h] = DEMAND[h];
        } else {
          var deficit = -net;
          var discharge = Math.min(deficit, soc, maxRate);
          soc -= discharge;
          grid[h] = deficit - discharge;
          bl[h] = SOLAR[h] + discharge;
        }
      }
      if (soc > 0.1) {
        for (var h2 = 0; h2 < 24; h2++) {
          if (soc <= 0.01) break;
          if (grid[h2] > 0.01) {
            var extra = Math.min(grid[h2], soc, maxRate);
            soc -= extra;
            grid[h2] -= extra;
            bl[h2] = (bl[h2] || SOLAR[h2]) + extra;
          }
        }
      }
    } else {
      for (var h3 = 0; h3 < 24; h3++) {
        grid[h3] = Math.max(0, DEMAND[h3] - SOLAR[h3]);
      }
    }

    chart.data.datasets[2].data = grid;
    chart.data.datasets[3].data = bl;
    chart.data.datasets[3].hidden = (cap === 0);
    chart.update('none');

    var legBatt = document.getElementById('dcLegBatt');
    if (legBatt) legBatt.style.display = cap > 0 ? 'flex' : 'none';

    var totalDemand = 0, totalGrid = 0;
    for (var j = 0; j < 24; j++) { totalDemand += DEMAND[j]; totalGrid += grid[j]; }
    var selfPowered = Math.round(((totalDemand - totalGrid) / totalDemand) * 100);
    var monthlyBill = Math.round((totalGrid * COST * 30) + GFEE);

    var elGrid = document.getElementById('dcStatGrid');
    var elSelf = document.getElementById('dcStatSelf');
    var elBill = document.getElementById('dcStatBill');
    if (elGrid) elGrid.textContent = totalGrid.toFixed(1);
    if (elSelf) elSelf.textContent = selfPowered + '%';
    if (elBill) elBill.textContent = '$' + monthlyBill;

    var elShiftPct = document.getElementById('dcShiftPct');
    var elBackupPct = document.getElementById('dcBackupPct');
    var elShiftKwh = document.getElementById('dcShiftKwh');
    var elBackupKwh = document.getElementById('dcBackupKwh');
    var elSlider = document.getElementById('dcShiftSlider');
    if (elShiftPct) elShiftPct.textContent = shiftPct + '%';
    if (elBackupPct) elBackupPct.textContent = (100 - shiftPct) + '%';
    if (elShiftKwh) elShiftKwh.textContent = (cap * shiftPct / 100).toFixed(2) + ' kWh';
    if (elBackupKwh) elBackupKwh.textContent = (cap * (100 - shiftPct) / 100).toFixed(2) + ' kWh';
    if (elSlider) elSlider.style.background =
      'linear-gradient(to right,#f57f06 0%,#f57f06 ' + shiftPct + '%,#e0e0e0 ' + shiftPct + '%,#e0e0e0 100%)';

    var elCap = document.getElementById('dcCapDisplay');
    if (elCap) elCap.innerHTML = cap.toFixed(2) + ' <span class="dc-battery-unit">kWh</span>';

    var backupKwh = cap * ((100 - shiftPct) / 100);
    var backupHours = 0;
    var backupSoc = backupKwh;
    for (var bh = 0; bh < 168; bh++) {
      var hourDemand = DEMAND[bh % 24];
      if (backupSoc <= hourDemand) { backupSoc = 0; break; }
      backupSoc -= hourDemand;
      backupHours++;
    }
    var days = Math.floor(backupHours / 24);
    var hrs = backupHours % 24;
    var timeStr = '';
    if (days > 0) timeStr += days + ' day' + (days > 1 ? 's' : '') + ' ';
    timeStr += hrs + ' hour' + (hrs !== 1 ? 's' : '');
    var elBackupTime = document.getElementById('dcBackupTime');
    if (elBackupTime) elBackupTime.textContent = timeStr;

    var elSliderSection = document.getElementById('dcSliderSection');
    if (elSliderSection) {
      if (cap === 0) {
        elSliderSection.style.opacity = '0.3';
        elSliderSection.style.pointerEvents = 'none';
      } else {
        elSliderSection.style.opacity = '1';
        elSliderSection.style.pointerEvents = 'auto';
      }
    }
  }

  // Initialize chart + slider
  window.duckCurveInit = function () {
    if (chart) return; // already initialized
    chart = createChart();
    if (!chart) return;

    sliderEl = document.getElementById('dcShiftSlider');
    if (sliderEl) {
      sliderHandler = function () {
        shiftPct = parseInt(sliderEl.value);
        sim();
      };
      sliderEl.addEventListener('input', sliderHandler);
    }
    sim();
  };

  // Destroy chart (for slideshow transitions)
  window.duckCurveDestroy = function () {
    if (sliderEl && sliderHandler) {
      sliderEl.removeEventListener('input', sliderHandler);
    }
    if (chart) {
      chart.destroy();
      chart = null;
    }
  };

  // Public API: update config after initial load
  window.duckCurveUpdate = function (newConfig) {
    if (newConfig.demand) DEMAND = newConfig.demand;
    if (newConfig.solar) SOLAR = newConfig.solar;
    if (newConfig.batteryKwh !== undefined) BATTERY = newConfig.batteryKwh;
    if (newConfig.costPerKwh !== undefined) COST = newConfig.costPerKwh;
    if (newConfig.gridFee !== undefined) GFEE = newConfig.gridFee;
    if (chart) {
      chart.data.datasets[0].data = DEMAND.slice();
      chart.data.datasets[1].data = SOLAR.slice();
    }
    sim();
  };

  // Auto-init if the chart element exists AND is not inside a slideshow
  // (slideshow handles init/destroy on slide change)
  var chartEl = document.getElementById('dcChart');
  if (chartEl && !chartEl.closest('.slide')) {
    window.duckCurveInit();
  }
})();
