/*
 * PASONG Global Price Controller (standalone shared asset)
 * Version 1.0.0
 *
 * Purpose: detect visitor country through PASONG API, resolve local currency,
 * and convert clearly currency-labelled prices in the rendered page.
 *
 * Load once globally (site-wide layout/template, or a single shared header script).
 * For prices without currency labels, add data-pasong-price="10000"
 * data-pasong-currency="UGX" to the price element.
 *
 * IMPORTANT: display-only. Never use this browser script to authorize payments.
 * Checkout/backend must calculate and validate the final amount server-side.
 */
(function () {
  'use strict';
  if (window.PASONGGlobalPriceController) return;

  var API_BASE = (window.PASONG_API_BASE || 'https://pasong-api.vercel.app').replace(/\/$/, '');
  var PRICING_ENDPOINT = API_BASE + '/api/pricing';
  var FX_ENDPOINT = 'https://open.er-api.com/v6/latest/USD';
  var COUNTRY_CURRENCY = {
    UG:'UGX', KE:'KES', TZ:'TZS', RW:'RWF', BI:'BIF', SS:'SSP', ET:'ETB',
    US:'USD', GB:'GBP', FR:'EUR', DE:'EUR', IT:'EUR', ES:'EUR', PT:'EUR', NL:'EUR',
    BE:'EUR', AT:'EUR', IE:'EUR', FI:'EUR', GR:'EUR', LU:'EUR', SK:'EUR', SI:'EUR',
    HR:'EUR', CY:'EUR', MT:'EUR', EE:'EUR', LV:'EUR', LT:'EUR', MC:'EUR', AD:'EUR',
    JP:'JPY', CN:'CNY', IN:'INR', CA:'CAD', AU:'AUD', NZ:'NZD', CH:'CHF',
    ZA:'ZAR', NG:'NGN', GH:'GHS', EG:'EGP', MA:'MAD', ZM:'ZMW', MW:'MWK',
    BR:'BRL', MX:'MXN', SG:'SGD', AE:'AED', SA:'SAR', TR:'TRY', PK:'PKR',
    SE:'SEK', NO:'NOK', DK:'DKK', PL:'PLN', CZ:'CZK', HU:'HUF', RO:'RON',
    BG:'BGN', IS:'ISK', HK:'HKD', KR:'KRW', ID:'IDR', MY:'MYR', TH:'THB',
    PH:'PHP', VN:'VND', AR:'ARS', CL:'CLP', CO:'COP', PE:'PEN'
  };
  var SYMBOLS = {
    UGX:'UGX', KES:'KES', TZS:'TZS', RWF:'RWF', BIF:'BIF', SSP:'SSP', ETB:'ETB',
    USD:'USD', GBP:'GBP', EUR:'EUR', JPY:'JPY', CNY:'CNY', INR:'INR', CAD:'CAD',
    AUD:'AUD', NZD:'NZD', CHF:'CHF', ZAR:'ZAR', NGN:'NGN', GHS:'GHS', EGP:'EGP',
    MAD:'MAD', ZMW:'ZMW', MWK:'MWK', BRL:'BRL', MXN:'MXN', SGD:'SGD', AED:'AED',
    SAR:'SAR', TRY:'TRY', PKR:'PKR', SEK:'SEK', NOK:'NOK', DKK:'DKK', PLN:'PLN',
    CZK:'CZK', HUF:'HUF', RON:'RON', BGN:'BGN', ISK:'ISK', HKD:'HKD', KRW:'KRW',
    IDR:'IDR', MYR:'MYR', THB:'THB', PHP:'PHP', VND:'VND', ARS:'ARS', CLP:'CLP',
    COP:'COP', PEN:'PEN'
  };
  var state = { ready:false, country:null, currency:null, rates:null, source:'IP', error:null };
  var originalText = new WeakMap();
  var processing = false;
  var supportedCodes = Object.keys(SYMBOLS).join('|');
  var currencyToken = new RegExp('(?:\\b(' + supportedCodes + ')\\b|([$£€¥₹])\\s*)', 'g');

  function fetchJson(url, timeoutMs) {
    var controller = window.AbortController ? new AbortController() : null;
    var timer = controller ? setTimeout(function(){ controller.abort(); }, timeoutMs || 7000) : null;
    return fetch(url, {cache:'no-store', credentials:'omit', signal:controller ? controller.signal : undefined})
      .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .finally(function(){ if (timer) clearTimeout(timer); });
  }
  function symbolCurrency(sym) {
    return ({'$':'USD','£':'GBP','€':'EUR','¥':'JPY','₹':'INR'})[sym] || null;
  }
  function parseAmount(raw) {
    var clean = String(raw).replace(/,/g, '').replace(/\s/g, '');
    var n = Number(clean);
    return Number.isFinite(n) ? n : null;
  }
  function formatMoney(amount, currency) {
    try {
      return new Intl.NumberFormat(undefined, {style:'currency', currency:currency,
        maximumFractionDigits: ['UGX','KES','TZS','RWF','BIF','JPY','KRW','VND','CLP'].indexOf(currency) >= 0 ? 0 : 2
      }).format(amount);
    } catch (_) { return currency + ' ' + amount.toFixed(2); }
  }
  function convert(amount, from, to) {
    if (from === to) return amount;
    if (!state.rates || !state.rates[from] || !state.rates[to]) return null;
    // FX table is expressed as units per USD.
    return (amount / state.rates[from]) * state.rates[to];
  }
  function skipNode(node) {
    var p = node.parentElement;
    if (!p) return true;
    if (p.closest('script,style,noscript,textarea,input,select,option,code,pre,[data-pasong-no-convert],.pasong-price-original')) return true;
    if (p.closest('[data-pasong-price]')) return true;
    return false;
  }
  function convertMarkedPrices(root) {
    (root || document).querySelectorAll('[data-pasong-price]').forEach(function(el){
      var amount = Number(el.getAttribute('data-pasong-price'));
      var from = (el.getAttribute('data-pasong-currency') || 'UGX').toUpperCase();
      if (!Number.isFinite(amount) || !state.currency) return;
      var result = convert(amount, from, state.currency);
      if (result !== null) {
        if (!el.hasAttribute('data-pasong-original-text')) el.setAttribute('data-pasong-original-text', el.textContent || '');
        el.textContent = formatMoney(result, state.currency);
        el.setAttribute('data-pasong-displayed-currency', state.currency);
      }
    });
  }
  function convertTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || skipNode(node)) return;
    var text = node.nodeValue;
    if (!text || !/(UGX|KES|TZS|RWF|BIF|SSP|ETB|USD|GBP|EUR|JPY|CNY|INR|CAD|AUD|NZD|CHF|ZAR|NGN|GHS|EGP|MAD|ZMW|MWK|BRL|MXN|SGD|AED|SAR|TRY|PKR|SEK|NOK|DKK|PLN|CZK|HUF|RON|BGN|ISK|HKD|KRW|IDR|MYR|THB|PHP|VND|ARS|CLP|COP|PEN|[$£€¥₹])/i.test(text)) return;
    if (!originalText.has(node)) originalText.set(node, text);
    var source = originalText.get(node);
    var changed = source.replace(/\b(UGX|KES|TZS|RWF|BIF|SSP|ETB|USD|GBP|EUR|JPY|CNY|INR|CAD|AUD|NZD|CHF|ZAR|NGN|GHS|EGP|MAD|ZMW|MWK|BRL|MXN|SGD|AED|SAR|TRY|PKR|SEK|NOK|DKK|PLN|CZK|HUF|RON|BGN|ISK|HKD|KRW|IDR|MYR|THB|PHP|VND|ARS|CLP|COP|PEN)\s*([0-9][0-9,.]*(?:\.[0-9]{1,2})?)/g,
      function(full, code, number){
        var from = code.toUpperCase(), amount = parseAmount(number);
        if (amount === null || !state.currency) return full;
        var converted = convert(amount, from, state.currency);
        return converted === null ? full : formatMoney(converted, state.currency);
      });
    // Convert symbol-labelled amounts only when the symbol unambiguously identifies currency.
    changed = changed.replace(/([$£€₹])\s*([0-9][0-9,.]*(?:\.[0-9]{1,2})?)/g, function(full, sym, number){
      var from = symbolCurrency(sym), amount = parseAmount(number);
      if (!from || amount === null || !state.currency) return full;
      var converted = convert(amount, from, state.currency);
      return converted === null ? full : formatMoney(converted, state.currency);
    });
    if (changed !== node.nodeValue) node.nodeValue = changed;
  }
  function scan(root) {
    if (!state.ready || processing) return;
    processing = true;
    try {
      convertMarkedPrices(root || document);
      var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
      var nodes = [], n;
      while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach(convertTextNode);
    } finally { processing = false; }
  }
  function startObserver() {
    if (!document.body || !window.MutationObserver) return;
    var observer = new MutationObserver(function(records){
      records.forEach(function(rec){
        if (rec.type === 'characterData') convertTextNode(rec.target);
        (rec.addedNodes || []).forEach(function(n){ if (n.nodeType === 1) scan(n); else if (n.nodeType === 3) convertTextNode(n); });
      });
    });
    observer.observe(document.body, {subtree:true, childList:true, characterData:true});
  }
  function init() {
    return fetchJson(PRICING_ENDPOINT, 7000).then(function(data){
      var country = String(data.country || data.country_code || '').toUpperCase();
      if (!/^[A-Z]{2}$/.test(country)) throw new Error('Country could not be detected by PASONG API');
      state.country = country;
      state.currency = COUNTRY_CURRENCY[country] || 'USD';
      state.source = 'PASONG IP pricing API';
      return fetchJson(FX_ENDPOINT, 7000).then(function(fx){
        if (!fx || !fx.rates || !fx.rates.USD) throw new Error('Exchange rates unavailable');
        state.rates = fx.rates;
        // Ensure USD base is present for currency conversions.
        state.rates.USD = 1;
        state.ready = true;
        document.documentElement.setAttribute('data-pasong-country', state.country);
        document.documentElement.setAttribute('data-pasong-currency', state.currency);
        scan(document);
        startObserver();
        window.dispatchEvent(new CustomEvent('pasong:currency-ready', {detail:{country:state.country,currency:state.currency,ratesUpdatedAt:fx.time_last_update_utc || null}}));
        return publicApi;
      });
    }).catch(function(err){
      state.error = err && err.message ? err.message : 'Price controller failed';
      window.dispatchEvent(new CustomEvent('pasong:currency-error', {detail:{message:state.error}}));
      console.warn('[PASONG pricing]', state.error);
      return publicApi;
    });
  }
  var publicApi = {
    version:'1.0.0',
    getState:function(){ return Object.assign({}, state); },
    refresh:function(){ return init(); },
    convertAmount:function(amount, fromCurrency){
      var result = convert(Number(amount), String(fromCurrency || 'UGX').toUpperCase(), state.currency);
      return result === null ? null : {amount:result,currency:state.currency,formatted:formatMoney(result,state.currency)};
    },
    scan:function(){ scan(document); },
    // Mark a price explicitly for dependable conversion, e.g. setPrice(element, 10000, 'UGX').
    setPrice:function(element, amount, fromCurrency){
      if (!element) return;
      element.setAttribute('data-pasong-price', String(amount));
      element.setAttribute('data-pasong-currency', String(fromCurrency || 'UGX').toUpperCase());
      if (state.ready) convertMarkedPrices(element.parentElement || document);
    }
  };
  window.PASONGGlobalPriceController = publicApi;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
