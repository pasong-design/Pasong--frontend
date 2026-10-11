(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const defaultBase = "https://pasong-api.vercel.app";
  const knownNames = {UG:"Uganda",KE:"Kenya",TZ:"Tanzania",RW:"Rwanda",BI:"Burundi",SS:"South Sudan",ET:"Ethiopia",GB:"United Kingdom",US:"United States",NG:"Nigeria",ZA:"South Africa"};
  let lastGeo = null;

  function apiBase() {
    return ($("apiBase").value || defaultBase).trim().replace(/\/+$/, "");
  }
  function setStatus(id, text, good) {
    const el = $(id);
    el.textContent = text;
    el.className = "status " + (good === true ? "ok" : good === false ? "bad" : "");
  }
  function extractPricing(data) {
    if (!data || typeof data !== "object") return null;
    // Accept common response shapes without assuming the server's exact JSON contract.
    const currency = data.currency || data.price_currency || data.pricing?.currency || data.data?.currency;
    const amount = data.amount ?? data.price ?? data.price_amount ?? data.pricing?.amount ?? data.pricing?.price ?? data.data?.amount ?? data.data?.price;
    const country = data.country || data.country_code || data.countryCode || data.data?.country || data.data?.country_code;
    if (currency && amount !== undefined && amount !== null) {
      return {currency: String(currency).toUpperCase(), amount: Number(amount), country: country || null, raw: data};
    }
    return null;
  }
  function formatPrice(p) {
    if (!p || !Number.isFinite(p.amount)) return "API shape unknown";
    try {
      return new Intl.NumberFormat(undefined, {style:"currency", currency:p.currency}).format(p.amount);
    } catch (_) {
      return `${p.currency} ${p.amount}`;
    }
  }
  async function fetchApiPrice(countryCode) {
    const url = new URL(apiBase() + "/api/pricing");
    // Query parameter is for diagnostic testing only; the endpoint may ignore it.
    if (countryCode) url.searchParams.set("country", countryCode);
    const response = await fetch(url.toString(), {method:"GET", headers:{Accept:"application/json"}});
    const bodyText = await response.text();
    let body;
    try { body = JSON.parse(bodyText); } catch (_) { body = {raw: bodyText.slice(0, 1000)}; }
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(body).slice(0,700)}`);
    return {body, parsed:extractPricing(body), url:url.toString()};
  }
  async function testEndpoint(countryCode, statusId) {
    setStatus(statusId, "Requesting /api/pricing…");
    try {
      const result = await fetchApiPrice(countryCode);
      const summary = {
        request: result.url,
        parsed_price: result.parsed ? formatPrice(result.parsed) : "Could not recognize a currency + amount in response",
        response: result.body
      };
      setStatus(statusId, JSON.stringify(summary, null, 2), true);
      if (result.parsed) {
        $("price").textContent = formatPrice(result.parsed);
        $("priceNote").textContent = `Returned by API${result.parsed.country ? " · " + result.parsed.country : ""}`;
      } else {
        $("price").textContent = "Check response";
        $("priceNote").textContent = "API response format needs inspection";
      }
      return result;
    } catch (err) {
      setStatus(statusId, `${err.message}\n\nIf this says CORS or Failed to fetch, the API may not allow requests from this page, or the endpoint may be unavailable.`, false);
      $("price").textContent = "Unavailable";
      $("priceNote").textContent = "Do not guess or charge a browser-side price";
      return null;
    }
  }
  $("testApi").addEventListener("click", () => testEndpoint(null, "apiStatus"));
  $("testCountry").addEventListener("click", async () => {
    const cc = $("manualCountry").value;
    const result = await testEndpoint(cc, "manualStatus");
    if (result?.parsed) {
      $("country").textContent = result.parsed.country || cc;
      $("countryName").textContent = knownNames[cc] || cc;
    }
  });
  $("detect").addEventListener("click", async () => {
    setStatus("geoStatus", "Checking country from IP…");
    try {
      // Country only is needed; do not request/store the user's exact IP or address.
      const res = await fetch("https://ipapi.co/json/");
      if (!res.ok) throw new Error(`IP lookup HTTP ${res.status}`);
      const geo = await res.json();
      const cc = String(geo.country_code || "").toUpperCase();
      if (!/^[A-Z]{2}$/.test(cc)) throw new Error("The geolocation service did not return a valid country code.");
      lastGeo = {countryCode:cc, countryName:geo.country_name || knownNames[cc] || cc};
      $("country").textContent = cc;
      $("countryName").textContent = lastGeo.countryName;
      setStatus("geoStatus", `Country detected: ${lastGeo.countryName} (${cc}).\nThis is an approximate IP-based result; VPNs and mobile carriers may affect it.`, true);
      await testEndpoint(cc, "apiStatus");
    } catch (err) {
      setStatus("geoStatus", `${err.message}\nYou can still use the manual country test above.`, false);
    }
  });
})();
