/* Terminal typing animation */
(function() {
  var tb = document.getElementById('terminal-body');
  if (!tb || typeof terminalCalls === 'undefined') return;

  var calls = terminalCalls;
  var SP = 35, PA = 600, LD = 70, HO = 4000;
  var cc = 0, on = false;

  function mk(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function rl(j) {
    var s = '  '.repeat(j.indent), e = mk('div', 'terminal-line terminal-output');
    if (j.type === 'b') {
      if (j.key) {
        e.textContent = s;
        var k = mk('span', 'terminal-key');
        k.textContent = '"' + j.key + '"';
        e.appendChild(k);
        e.appendChild(document.createTextNode(': ' + j.val));
      } else {
        e.textContent = s + j.val;
      }
    } else if (j.type === 't') {
      e.textContent = s + j.val;
      e.style.color = '#7a8299';
    } else {
      e.textContent = s;
      if (j.key) {
        var k2 = mk('span', 'terminal-key');
        k2.textContent = '"' + j.key + '"';
        e.appendChild(k2);
        e.appendChild(document.createTextNode(': '));
      }
      var v = mk('span', j.type === 's' ? 'terminal-str' : 'terminal-val');
      v.textContent = j.val + j.trail;
      e.appendChild(v);
    }
    return e;
  }

  function bd(c) {
    tb.textContent = '';
    var p = [];
    c.cmd.forEach(function(t, i) {
      var d = mk('div', 'terminal-line'),
          pr = mk('span', 'terminal-prompt'),
          ty = mk('span', 'terminal-typed');
      pr.textContent = i === 0 ? '$' : '>';
      ty.setAttribute('data-text', t);
      d.appendChild(pr);
      d.appendChild(ty);
      tb.appendChild(d);
      p.push({ type: 'typed', el: ty, text: t });
    });
    tb.appendChild(mk('div', 'terminal-line terminal-blank'));
    var sl = mk('div', 'terminal-line terminal-output'),
        ss = mk('span', 'terminal-status'),
        ts = mk('span', 'terminal-time');
    ss.textContent = c.status;
    ts.textContent = c.time;
    sl.appendChild(ss);
    sl.appendChild(ts);
    tb.appendChild(sl);
    p.push({ type: 'output', el: sl });
    c.json.forEach(function(j) {
      var e = rl(j);
      tb.appendChild(e);
      p.push({ type: 'output', el: e });
    });
    return p;
  }

  function run(c, done) {
    var p = bd(c),
        ty = p.filter(function(x) { return x.type === 'typed'; }),
        ou = p.filter(function(x) { return x.type === 'output'; }),
        dl = 300;
    ty.forEach(function(ln) {
      var st = dl;
      setTimeout(function() {
        ln.el.style.overflow = 'visible';
        ln.el.style.width = 'auto';
        var i = 0;
        var iv = setInterval(function() {
          i++;
          ln.el.textContent = ln.text.substring(0, i);
          if (i >= ln.text.length) { clearInterval(iv); ln.el.classList.add('done'); }
        }, SP);
      }, st);
      dl += ln.text.length * SP + 150;
    });
    dl += PA;
    ou.forEach(function(ln, i) {
      setTimeout(function() { ln.el.classList.add('visible'); }, dl + i * LD);
    });
    setTimeout(done, dl + ou.length * LD + HO);
  }

  function cy() {
    if (!on) return;
    run(calls[cc], function() { cc = (cc + 1) % calls.length; cy(); });
  }

  setTimeout(function() {
    var ob = new IntersectionObserver(function(e) {
      if (e[0].isIntersecting && !on) { on = true; cy(); }
    }, { threshold: 0.2 });
    ob.observe(tb);
  }, 500);
})();
