(function () {
  'use strict';
  var WA = 'https://wa.me/50589271455?text=';
  var dlg = document.getElementById('pay-dialog');
  if (!dlg || typeof dlg.showModal !== 'function') return;

  var cfg = null, state = { plan: 'negocio', billing: 'anual' };
  var $ = function (s) { return dlg.querySelector(s); };
  var money = function (n) { return 'US$' + n.toLocaleString('es-NI'); };
  var safeUrl = function (u) { return typeof u === 'string' && /^https:\/\/[^\s]+$/i.test(u.trim()) ? u.trim() : ''; };

  function link(plan, billing) {
    return cfg && cfg.links && cfg.links[plan] ? safeUrl(cfg.links[plan][billing]) : '';
  }
  function bankReady() {
    var b = cfg && cfg.bank; return !!(b && b.banco && b.numero && b.titular);
  }
  function total(plan, billing) {
    var p = cfg.plans[plan];
    return p.setup + (billing === 'anual' ? p.year : p.month);
  }

  function render() {
    var p = cfg.plans[state.plan];
    var recurrent = state.billing === 'anual' ? p.year : p.month;
    $('[data-pay-plan]').textContent = p.name;
    $('[data-pay-setup]').textContent = money(p.setup);
    $('[data-pay-period]').textContent = state.billing === 'anual' ? 'plan anual (2 meses gratis)' : 'primer mes';
    $('[data-pay-recurrent]').textContent = money(recurrent);
    $('[data-pay-total]').textContent = money(total(state.plan, state.billing));
    dlg.querySelectorAll('[data-pay-plan-btn]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-pay-plan-btn') === state.plan));
    });
    dlg.querySelectorAll('[data-pay-billing-btn]').forEach(function (b) {
      var bill = b.getAttribute('data-pay-billing-btn');
      b.setAttribute('aria-pressed', String(bill === state.billing));
      b.hidden = !link(state.plan, bill);
    });
    var url = link(state.plan, state.billing);
    var go = $('[data-pay-go]'), none = $('[data-pay-none]'), terms = $('[data-pay-terms]');
    go.hidden = !url; terms.hidden = !url; none.hidden = !!url;
    go.disabled = !$('#pay-ok').checked;
    var msg = 'Hola, quiero pagar el plan ' + p.name + ' (' + state.billing + ') de Anaquel';
    $('[data-pay-wa]').href = WA + encodeURIComponent(msg);
    var bank = $('[data-pay-bank]');
    if (bankReady()) {
      var b = cfg.bank;
      bank.hidden = false;
      bank.querySelector('[data-bank-text]').textContent =
        b.banco + ' · cuenta ' + (b.tipo_cuenta || '') + ' ' + b.numero + ' · a nombre de ' + b.titular + ' (' + (b.moneda || 'USD') + ')';
    } else { bank.hidden = true; }
  }

  function open(plan) {
    if (plan && cfg.plans[plan]) state.plan = plan;
    if (!link(state.plan, state.billing)) state.billing = link(state.plan, 'anual') ? 'anual' : 'mensual';
    $('#pay-ok').checked = false;
    render();
    dlg.showModal();
  }

  dlg.addEventListener('click', function (e) {
    var t = e.target;
    if (t === dlg) { dlg.close(); return; }
    var pb = t.closest('[data-pay-plan-btn]'); if (pb) { state.plan = pb.getAttribute('data-pay-plan-btn'); if (!link(state.plan, state.billing)) state.billing = link(state.plan, 'anual') ? 'anual' : 'mensual'; render(); return; }
    var bb = t.closest('[data-pay-billing-btn]'); if (bb) { state.billing = bb.getAttribute('data-pay-billing-btn'); render(); return; }
    if (t.closest('[data-pay-close]')) { dlg.close(); return; }
    if (t.closest('[data-pay-go]')) {
      var url = link(state.plan, state.billing);
      if (url && $('#pay-ok').checked) { window.location.assign(url); }
    }
  });
  $('#pay-ok').addEventListener('change', render);

  fetch('assets/payments.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (c) {
      if (!c || c.enabled === false || !c.plans) return;
      cfg = c;
      var any = Object.keys(c.plans).some(function (p) { return link(p, 'mensual') || link(p, 'anual'); });
      if (!any) return;                      // sin enlaces: todo sigue por WhatsApp
      document.querySelectorAll('[data-pay]').forEach(function (btn) {
        var plan = btn.getAttribute('data-pay');
        if (!(link(plan, 'mensual') || link(plan, 'anual'))) return;
        btn.hidden = false;
        btn.addEventListener('click', function () { open(plan); });
        var wa = btn.parentNode.querySelector('a.btn[href^="https://wa.me"]');
        if (wa) { wa.classList.add('outline'); wa.firstChild.textContent = 'consultar por whatsapp '; }
      });
    })
    .catch(function () { /* sin configuración: la página funciona por WhatsApp */ });
})();
