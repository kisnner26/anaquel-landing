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
      b.hidden = !(link(state.plan, bill) || bankReady());
    });
    var url = link(state.plan, state.billing);
    var mode = url ? 'link' : (bankReady() ? 'bank' : 'none');
    var ok = $('#pay-ok').checked;
    var go = $('[data-pay-go]'), sent = $('[data-pay-sent]'), none = $('[data-pay-none]'), terms = $('[data-pay-terms]');
    go.hidden = mode !== 'link'; go.disabled = !ok;
    sent.hidden = mode !== 'bank'; sent.disabled = !ok;
    terms.hidden = mode === 'none'; none.hidden = mode !== 'none';
    var tot = money(total(state.plan, state.billing));
    var msg = 'Hola, quiero pagar el plan ' + p.name + ' (' + state.billing + ') de Anaquel';
    $('[data-pay-wa]').href = WA + encodeURIComponent(msg);
    sent.setAttribute('data-wa', WA + encodeURIComponent('Hola, ya hice la transferencia de Anaquel: plan ' + p.name + ' (' + state.billing + '), total ' + tot + '. Mi negocio es: '));
    var bank = $('[data-pay-bank]');
    if (bankReady() && mode !== 'none') {
      var b = cfg.bank;
      bank.hidden = false;
      $('[data-bank-banco]').textContent = b.banco;
      $('[data-bank-cuenta]').textContent = (b.tipo_cuenta ? b.tipo_cuenta + ' · ' : '') + b.numero + ' (' + (b.moneda || 'USD') + ')';
      $('[data-bank-titular]').textContent = b.titular;
      $('[data-bank-monto]').textContent = tot;
    } else { bank.hidden = true; }
  }

  function open(plan) {
    if (plan && cfg.plans[plan]) state.plan = plan;
    if (!(link(state.plan, state.billing) || bankReady())) state.billing = link(state.plan, 'anual') ? 'anual' : 'mensual';
    $('#pay-ok').checked = false;
    render();
    dlg.showModal();
  }

  dlg.addEventListener('click', function (e) {
    var t = e.target;
    if (t === dlg) { dlg.close(); return; }
    var pb = t.closest('[data-pay-plan-btn]'); if (pb) { state.plan = pb.getAttribute('data-pay-plan-btn'); if (!(link(state.plan, state.billing) || bankReady())) state.billing = link(state.plan, 'anual') ? 'anual' : 'mensual'; render(); return; }
    var bb = t.closest('[data-pay-billing-btn]'); if (bb) { state.billing = bb.getAttribute('data-pay-billing-btn'); render(); return; }
    if (t.closest('[data-pay-close]')) { dlg.close(); return; }
    var sb = t.closest('[data-pay-sent]');
    if (sb) { if ($('#pay-ok').checked) window.open(sb.getAttribute('data-wa'), '_blank', 'noopener'); return; }
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
      if (!any && !bankReady()) return;      // sin enlaces ni cuenta: todo sigue por WhatsApp
      document.querySelectorAll('[data-pay]').forEach(function (btn) {
        var plan = btn.getAttribute('data-pay');
        var hasLink = link(plan, 'mensual') || link(plan, 'anual');
        if (!hasLink && !bankReady()) return;
        btn.hidden = false;
        if (!hasLink) btn.firstChild.textContent = 'pagar por transferencia ';
        btn.addEventListener('click', function () { open(plan); });
        var wa = btn.parentNode.querySelector('a.btn[href^="https://wa.me"]');
        if (wa) { wa.classList.add('outline'); wa.firstChild.textContent = 'consultar por whatsapp '; }
      });
    })
    .catch(function () { /* sin configuración: la página funciona por WhatsApp */ });
})();
