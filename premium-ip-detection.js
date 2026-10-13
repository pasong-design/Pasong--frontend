/* PASONG Premium — IP country detection connection only.
   Uses the current PASONG API pricing endpoint; does not change page design.
   Include this file after the existing page script, or paste its contents into it. */
(async function pasongPremiumIpDetection() {
  "use strict";

  const API_BASE = "https://pasong-api.onrender.com";
  const ENDPOINT = API_BASE + "/api/premium/pricing";

  // Use the live country-specific prices returned by the Premium API.
  function labelFor(plan) {
    if (plan && plan.label) return String(plan.label);
    if (!plan) return "";
    const amount = Number(plan.amount);
    const currency = String(plan.currency || "USD").toUpperCase();
    if (!Number.isFinite(amount)) return "";
    return currency + " " + amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }

  function countryFromResponse(data) {
    const candidates = [
      data && data.country_code,
      data && data.countryCode,
      data && data.country,
      data && data.monthly && data.monthly.country,
      data && data.yearly && data.yearly.country,
      data && data.detected_country,
      data && data.geo && (data.geo.country_code || data.geo.countryCode || data.geo.country),
      data && data.location && (data.location.country_code || data.location.countryCode || data.location.country)
    ];
    for (const value of candidates) {
      const code = String(value || "").trim().toUpperCase();
      if (/^[A-Z]{2}$/.test(code)) return code;
      if (code === "UNITED KINGDOM") return "GB";
      if (code === "UNITED STATES") return "US";
      if (code === "UGANDA") return "UG";
      if (code === "KENYA") return "KE";
      if (code === "TANZANIA") return "TZ";
      if (code === "RWANDA") return "RW";
    }
    return "";
  }

  function regionFor(code) {
    if (["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"].includes(code)) return "EU";
    return code;
  }

  function updatePriceLabels(prices, country) {
    // Only update existing price text; keep layout, classes, and design unchanged.
    const monthlyNodes = [
      document.querySelector("#monthlyPrice"),
      document.querySelector("#monthly-price"),
      document.querySelector('[data-premium-price="monthly"]'),
      document.querySelector(".monthly-price"),
      document.querySelector("#monthlyPlan .plan-price"),
      document.querySelector('[data-plan="monthly"] .plan-price')
    ].filter(Boolean);
    const yearlyNodes = [
      document.querySelector("#yearlyPrice"),
      document.querySelector("#yearly-price"),
      document.querySelector('[data-premium-price="yearly"]'),
      document.querySelector(".yearly-price"),
      document.querySelector("#yearlyPlan .plan-price"),
      document.querySelector('[data-plan="yearly"] .plan-price')
    ].filter(Boolean);

    monthlyNodes.forEach(node => { node.textContent = prices.monthly.label; });
    yearlyNodes.forEach(node => { node.textContent = prices.yearly.label; });

    window.PASONG_PREMIUM_GEO = {
      detected: true,
      country,
      monthly: prices.monthly,
      yearly: prices.yearly
    };
    document.documentElement.dataset.pasongPremiumCountry = country;
    window.dispatchEvent(new CustomEvent("pasong:premium-country-detected", {
      detail: window.PASONG_PREMIUM_GEO
    }));
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: "GET",
      cache: "no-store",
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) throw new Error("PASONG pricing API returned HTTP " + response.status);
    const data = await response.json();
    const detectedCode = countryFromResponse(data);
    if (!detectedCode) throw new Error("The Premium pricing API response did not include a country code.");
    if (!data.monthly || !data.yearly) throw new Error("The Premium pricing API did not return monthly and yearly prices.");
    const prices = {
      monthly: { amount: Number(data.monthly.amount), currency: data.monthly.currency || data.currency || "USD", label: labelFor(data.monthly) },
      yearly: { amount: Number(data.yearly.amount), currency: data.yearly.currency || data.currency || "USD", label: labelFor(data.yearly) }
    };
    if (!prices.monthly.label || !prices.yearly.label) throw new Error("The Premium pricing API returned invalid prices.");
    updatePriceLabels(prices, detectedCode);
  } catch (error) {
    console.warn("[PASONG Premium] Country detection failed:", error);
    window.PASONG_PREMIUM_GEO = { detected: false, country: "" };
    window.dispatchEvent(new CustomEvent("pasong:premium-country-detection-failed"));
  }
})();
