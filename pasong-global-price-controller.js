/* =========================================================
   PASONG GLOBAL PRICE CONTROLLER
   Detects visitor country and provides local-currency helpers.
   Display conversion only — never authorizes payment amounts.
   ========================================================= */

(function () {
  "use strict";

  if (window.PASONGGlobalPriceController) return;

  const API_BASE = "https://pasong-api.vercel.app";
  const FX_API = "https://open.er-api.com/v6/latest/USD";

  const COUNTRY_CURRENCY = {
    UG: "UGX",
    KE: "KES",
    TZ: "TZS",
    RW: "RWF",
    BI: "BIF",
    SS: "SSP",
    ET: "ETB",
    NG: "NGN",
    GH: "GHS",
    ZA: "ZAR",
    EG: "EGP",
    MA: "MAD",
    DZ: "DZD",
    TN: "TND",
    ZM: "ZMW",
    MW: "MWK",
    MZ: "MZN",
    BW: "BWP",
    NA: "NAD",
    SZ: "SZL",
    LS: "LSL",
    AO: "AOA",
    CM: "XAF",
    SN: "XOF",
    CI: "XOF",
    BF: "XOF",
    ML: "XOF",
    NE: "XOF",
    TG: "XOF",
    BJ: "XOF",
    GN: "GNF",
    LR: "LRD",
    SL: "SLL",
    GM: "GMD",
    MR: "MRU",
    CV: "CVE",
    MU: "MUR",
    SC: "SCR",
    KM: "KMF",
    DJ: "DJF",
    ER: "ERN",
    US: "USD",
    GB: "GBP",
    FR: "EUR",
    DE: "EUR",
    IT: "EUR",
    ES: "EUR",
    PT: "EUR",
    NL: "EUR",
    BE: "EUR",
    IE: "EUR",
    AT: "EUR",
    FI: "EUR",
    GR: "EUR",
    LU: "EUR",
    CY: "EUR",
    MT: "EUR",
    SK: "EUR",
    SI: "EUR",
    EE: "EUR",
    LV: "EUR",
    LT: "EUR",
    AU: "AUD",
    NZ: "NZD",
    CA: "CAD",
    CH: "CHF",
    SE: "SEK",
    NO: "NOK",
    DK: "DKK",
    PL: "PLN",
    CZ: "CZK",
    HU: "HUF",
    RO: "RON",
    BG: "BGN",
    TR: "TRY",
    IN: "INR",
    PK: "PKR",
    BD: "BDT",
    LK: "LKR",
    NP: "NPR",
    CN: "CNY",
    JP: "JPY",
    KR: "KRW",
    SG: "SGD",
    MY: "MYR",
    ID: "IDR",
    PH: "PHP",
    TH: "THB",
    VN: "VND",
    HK: "HKD",
    TW: "TWD",
    AE: "AED",
    SA: "SAR",
    QA: "QAR",
    KW: "KWD",
    BH: "BHD",
    OM: "OMR",
    IL: "ILS",
    JO: "JOD",
    MX: "MXN",
    BR: "BRL",
    AR: "ARS",
    CL: "CLP",
    CO: "COP",
    PE: "PEN",
    UY: "UYU",
    PA: "PAB",
    CR: "CRC",
    DO: "DOP",
    JM: "JMD",
    TT: "TTD",
    BS: "BSD",
    BB: "BBD",
    GD: "XCD",
    AG: "XCD",
    DM: "XCD",
    LC: "XCD",
    VC: "XCD",
    KN: "XCD"
  };

  const COUNTRY_NAMES = {
    UG: "Uganda",
    KE: "Kenya",
    TZ: "Tanzania",
    RW: "Rwanda",
    BI: "Burundi",
    SS: "South Sudan",
    ET: "Ethiopia",
    GB: "United Kingdom",
    US: "United States",
    FR: "France",
    DE: "Germany",
    AU: "Australia",
    CA: "Canada"
  };

  const state = {
    ready: false,
    country: null,
    countryName: null,
    currency: null,
    rates: null,
    source: null,
    error: null
  };

  let initPromise = null;

  function safeJSON(response) {
    if (!response.ok) {
      throw new Error("Request failed: " + response.status);
    }
    return response.json();
  }

  async function fetchCountry() {
    /*
      PASONG backend is the preferred source.
      The backend must detect the country from trusted
      request headers, not from a user-supplied country value.
    */
    try {
      const response = await fetch(API_BASE + "/api/pricing", {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        headers: {
          "Accept": "application/json"
        }
      });

      const data = await safeJSON(response);

      const country = String(data.country || "")
        .trim()
        .toUpperCase();

      if (/^[A-Z]{2}$/.test(country)) {
        state.country = country;
        state.countryName =
          COUNTRY_NAMES[country] || country;
        state.currency =
          COUNTRY_CURRENCY[country] || "USD";
        state.source = "PASONG API";

        return;
      }
    } catch (error) {
      console.warn(
        "[PASONG currency] Backend country detection failed:",
        error.message
      );
    }

    /*
      Fallback uses a public IP-country service.
      It is for display convenience only.
    */
    try {
      const response = await fetch(
        "https://ipwho.is/",
        {
          method: "GET",
          mode: "cors",
          credentials: "omit",
          cache: "no-store"
        }
      );

      const data = await safeJSON(response);

      if (data.success && data.country_code) {
        const country = String(data.country_code)
          .trim()
          .toUpperCase();

        if (/^[A-Z]{2}$/.test(country)) {
          state.country = country;
          state.countryName =
            data.country || COUNTRY_NAMES[country] || country;
          state.currency =
            COUNTRY_CURRENCY[country] || "USD";
          state.source = "IP fallback";

          return;
        }
      }
    } catch (error) {
      console.warn(
        "[PASONG currency] IP fallback failed:",
        error.message
      );
    }

    /*
      Safe fallback: use USD if the country cannot be detected.
    */
    state.country = null;
    state.countryName = "International";
    state.currency = "USD";
    state.source = "Default";
  }

  async function fetchExchangeRates() {
    try {
      const response = await fetch(FX_API, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store"
      });

      const data = await safeJSON(response);

      if (
        data.result === "success" &&
        data.rates &&
        typeof data.rates.USD === "number"
      ) {
        state.rates = data.rates;
        return;
      }

      throw new Error("Exchange rates were unavailable.");
    } catch (error) {
      console.warn(
        "[PASONG currency] Exchange-rate request failed:",
        error.message
      );

      state.rates = null;
    }
  }

  async function init() {
    if (initPromise) return initPromise;

    initPromise = (async function () {
      await fetchCountry();
      await fetchExchangeRates();

      state.ready = true;

      document.documentElement.dataset.pasongCountry =
        state.country || "unknown";

      document.documentElement.dataset.pasongCurrency =
        state.currency || "USD";

      window.dispatchEvent(
        new CustomEvent("pasong:currency-ready", {
          detail: getInfo()
        })
      );

      return getInfo();
    })();

    return initPromise;
  }

  function getInfo() {
    return {
      ready: state.ready,
      country: state.country,
      countryName: state.countryName,
      currency: state.currency,
      ratesAvailable: !!state.rates,
      source: state.source,
      error: state.error
    };
  }

  function convert(amount, fromCurrency, toCurrency) {
    const value = Number(amount);
    const from = String(fromCurrency || "").toUpperCase();
    const to = String(toCurrency || "").toUpperCase();

    if (!Number.isFinite(value)) {
      throw new Error("Invalid amount.");
    }

    if (!from || !to) {
      throw new Error("Currency code is required.");
    }

    if (from === to) return value;

    if (!state.rates) {
      throw new Error("Exchange rates are unavailable.");
    }

    /*
      Rates are quoted against USD:
      amount in source currency -> USD -> destination currency.
    */
    const fromRate = from === "USD" ? 1 : state.rates[from];
    const toRate = to === "USD" ? 1 : state.rates[to];

    if (
      typeof fromRate !== "number" ||
      typeof toRate !== "number" ||
      fromRate <= 0 ||
      toRate <= 0
    ) {
      throw new Error(
        "A required exchange rate is unavailable."
      );
    }

    return (value / fromRate) * toRate;
  }

  function format(amount, currency) {
    const code = String(currency || state.currency || "USD")
      .toUpperCase();

    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return String(amount);
    }

    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: code,
        maximumFractionDigits: 2
      }).format(value);
    } catch (error) {
      return value.toFixed(2) + " " + code;
    }
  }

  function convertAndFormat(amount, fromCurrency, toCurrency) {
    const target = toCurrency || state.currency || "USD";
    return format(convert(amount, fromCurrency, target), target);
  }

  /*
    Convert only elements that explicitly provide a numeric amount
    and the original currency in data attributes.

    Example:
      <span
        data-pasong-price
        data-amount="700"
        data-currency="UGX"
      >UGX 700</span>

    This avoids guessing what unlabeled numbers mean.
  */
  function renderPriceElement(element) {
    if (!element || !element.dataset) return;

    if (!element.hasAttribute("data-pasong-price")) return;

    const amount = Number(element.dataset.amount);
    const sourceCurrency = element.dataset.currency;

    if (!Number.isFinite(amount) || !sourceCurrency) return;

    try {
      const output = convertAndFormat(
        amount,
        sourceCurrency,
        state.currency
      );

      element.textContent = output;
      element.dataset.displayCurrency = state.currency;
    } catch (error) {
      /*
        If rates are unavailable, leave the original display intact.
      */
      console.warn(
        "[PASONG currency] Price not converted:",
        error.message
      );
    }
  }

  function renderMarkedPrices(root) {
    const container = root || document;

    if (container.matches &&
        container.matches("[data-pasong-price]")) {
      renderPriceElement(container);
    }

    if (container.querySelectorAll) {
      container
        .querySelectorAll("[data-pasong-price]")
        .forEach(renderPriceElement);
    }
  }

  function observeMarkedPrices() {
    renderMarkedPrices(document);

    if (!document.body || !window.MutationObserver) return;

    const observer = new MutationObserver(function (records) {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            renderMarkedPrices(node);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  window.PASONGGlobalPriceController = {
    init,
    getInfo,
    convert,
    format,
    convertAndFormat,
    renderMarkedPrices
  };

  init().then(observeMarkedPrices).catch(function (error) {
    state.error = error.message;
    console.error("[PASONG currency]", error);
  });
})();
