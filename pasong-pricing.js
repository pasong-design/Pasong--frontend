/* PASONG Shared IP Pricing
 * Uses the existing PASONG backend as the source of truth.
 * Include once on pages that need song pricing:
 * <script src="https://pasong-api.vercel.app/pasong-pricing.js"></script>
 *
 * NOTE: The API server must serve this file at that URL, or host this JS
 * on your frontend and use the absolute API_BASE below.
 */
(function (global) {
  "use strict";

  const API_BASE = "https://pasong-api.vercel.app";
  const PRICING_URL = API_BASE + "/api/pricing";
  const CACHE_KEY = "pasong_ip_pricing_v1";
  const CACHE_TTL = 30 * 60 * 1000;

  let current = null;
  let pending = null;

  function normalize(data) {
    if (!data || typeof data !== "object") throw new Error("Pricing API returned invalid data.");
    const amount = Number(data.amount ?? data.price ?? data.price_amount);
    const currency = String(data.currency || data.price_currency || "").toUpperCase();
    const country = String(data.country || data.country_code || data.countryCode || "").toUpperCase();
    if (!Number.isFinite(amount) || amount < 0 || !/^[A-Z]{3}$/.test(currency)) {
      throw new Error("Pricing API response is missing a valid amount or currency.");
    }
    return {
      amount,
      price: amount,
      currency,
      country,
      detected: Boolean(data.detected),
      label: String(data.label || format(amount, currency)),
      source: "pasong-api",
      updatedAt: Date.now()
    };
  }

  function format(amount, currency) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (_) {
      return currency + " " + amount;
    }
  }

  function readCache() {
    try {
      const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (saved && Date.now() - Number(saved.updatedAt) < CACHE_TTL &&
          Number.isFinite(Number(saved.amount)) && saved.currency) return saved;
    } catch (_) {}
    return null;
  }

  function saveCache(price) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(price)); } catch (_) {}
  }

  function paintPage(price) {
    // Optional universal markup hook: <span data-pasong-price></span>
    document.querySelectorAll("[data-pasong-price]").forEach(el => {
      el.textContent = price.label;
      el.setAttribute("data-price-amount", String(price.amount));
      el.setAttribute("data-price-currency", price.currency);
      if (price.country) el.setAttribute("data-price-country", price.country);
    });
    document.documentElement.dataset.pasongCountry = price.country || "";
    document.documentElement.dataset.pasongCurrency = price.currency;
    document.dispatchEvent(new CustomEvent("pasong:pricing-ready", { detail: price }));
  }

  async function load(options) {
    options = options || {};
    if (pending && !options.force) return pending;

    if (!options.force) {
      const cached = readCache();
      if (cached) {
        current = cached;
        paintPage(current);
        // Refresh quietly in the background to keep country pricing current.
      }
    }

    pending = (async function () {
      const response = await fetch(PRICING_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        credentials: "omit"
      });
      if (!response.ok) throw new Error("PASONG pricing API returned HTTP " + response.status);
      const price = normalize(await response.json());
      current = price;
      saveCache(price);
      paintPage(price);
      return price;
    })();

    try {
      return await pending;
    } catch (error) {
      // Do not pretend fallback UGX is a successful country detection.
      document.dispatchEvent(new CustomEvent("pasong:pricing-error", { detail: { message: error.message } }));
      throw error;
    } finally {
      pending = null;
    }
  }

  function get() { return current || readCache(); }

  function priceForSong(song) {
    const p = get();
    if (!p) throw new Error("PASONG pricing has not loaded yet.");
    return Object.assign({}, song || {}, { price: p.amount, amount: p.amount, currency: p.currency, price_label: p.label, country: p.country });
  }

  global.PASONG_PRICING = {
    load,
    get,
    format,
    priceForSong,
    apiUrl: PRICING_URL
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { load().catch(function (e) { console.warn("[PASONG pricing]", e.message); }); }, { once: true });
  } else {
    load().catch(function (e) { console.warn("[PASONG pricing]", e.message); });
  }
})(window);
