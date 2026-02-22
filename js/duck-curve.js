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

  // ── Chart setup ──
  var ctx = document.getElementById('dcChart').getContext('2d');
  var chart = new Chart(ctx, {
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

  // ── Simulation ──
  function sim() {
    var cap = BATTERY;
    var sc = cap * (shiftPct / 100);
    var grid = new Array(24).fill(0);
    var bl = new Array(24).fill(null);
    var soc = 0;
    var maxRate = 5;

    if (cap > 0) {
      // Pass 1: charge from excess solar, discharge to meet demand
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
      // Pass 2: use any remaining charge to offset grid
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
      // No battery — grid covers everything solar doesn't
      for (var h3 = 0; h3 < 24; h3++) {
        grid[h3] = Math.max(0, DEMAND[h3] - SOLAR[h3]);
      }
    }

    // Update chart
    chart.data.datasets[2].data = grid;
    chart.data.datasets[3].data = bl;
    chart.data.datasets[3].hidden = (cap === 0);
    chart.update('none');

    // Battery legend visibility
    document.getElementById('dcLegBatt').style.display = cap > 0 ? 'flex' : 'none';

    // Stats
    var totalDemand = 0, totalGrid = 0;
    for (var j = 0; j < 24; j++) { totalDemand += DEMAND[j]; totalGrid += grid[j]; }
    var selfPowered = Math.round(((totalDemand - totalGrid) / totalDemand) * 100);
    var monthlyBill = Math.round((totalGrid * COST * 30) + GFEE);

    document.getElementById('dcStatGrid').textContent = totalGrid.toFixed(1);
    document.getElementById('dcStatSelf').textContent = selfPowered + '%';
    document.getElementById('dcStatBill').textContent = '$' + monthlyBill;

    // Slider labels
    document.getElementById('dcShiftPct').textContent = shiftPct + '%';
    document.getElementById('dcBackupPct').textContent = (100 - shiftPct) + '%';
    document.getElementById('dcShiftKwh').textContent = (cap * shiftPct / 100).toFixed(2) + ' kWh';
    document.getElementById('dcBackupKwh').textContent = (cap * (100 - shiftPct) / 100).toFixed(2) + ' kWh';
    document.getElementById('dcShiftSlider').style.background =
      'linear-gradient(to right,#f57f06 0%,#f57f06 ' + shiftPct + '%,#e0e0e0 ' + shiftPct + '%,#e0e0e0 100%)';

    // Capacity & backup time (step through demand hour by hour)
    document.getElementById('dcCapDisplay').innerHTML =
      cap.toFixed(2) + ' <span class="dc-battery-unit">kWh</span>';
    var backupKwh = cap * ((100 - shiftPct) / 100);
    var backupHours = 0;
    var backupSoc = backupKwh;
    for (var bh = 0; bh < 168; bh++) { // up to 7 days
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
    document.getElementById('dcBackupTime').textContent = timeStr;

    // Disable slider when no battery
    if (cap === 0) {
      document.getElementById('dcSliderSection').style.opacity = '0.3';
      document.getElementById('dcSliderSection').style.pointerEvents = 'none';
    } else {
      document.getElementById('dcSliderSection').style.opacity = '1';
      document.getElementById('dcSliderSection').style.pointerEvents = 'auto';
    }
  }

  // Slider event
  document.getElementById('dcShiftSlider').addEventListener('input', function () {
    shiftPct = parseInt(this.value);
    sim();
  });

  // ── Public API: update config after initial load ──
  window.duckCurveUpdate = function (newConfig) {
    if (newConfig.demand) DEMAND = newConfig.demand;
    if (newConfig.solar) SOLAR = newConfig.solar;
    if (newConfig.batteryKwh !== undefined) BATTERY = newConfig.batteryKwh;
    if (newConfig.costPerKwh !== undefined) COST = newConfig.costPerKwh;
    if (newConfig.gridFee !== undefined) GFEE = newConfig.gridFee;
    chart.data.datasets[0].data = DEMAND.slice();
    chart.data.datasets[1].data = SOLAR.slice();
    sim();
  };

  sim();
})();
