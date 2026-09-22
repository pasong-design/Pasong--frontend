const PASONG_CURRENCY = {
  country: "UG",
  currency: "UGX",
  symbol: "UGX"
};

const PASONG_COUNTRY_CURRENCIES = {
  UG: {
    currency: "UGX",
    symbol: "UGX"
  },
  US: {
    currency: "USD",
    symbol: "$"
  },
  GB: {
    currency: "GBP",
    symbol: "£"
  },
  KE: {
    currency: "KES",
    symbol: "KSh"
  },
  TZ: {
    currency: "TZS",
    symbol: "TSh"
  },
  RW: {
    currency: "RWF",
    symbol: "FRw"
  },
  ZA: {
    currency: "ZAR",
    symbol: "R"
  },
  NG: {
    currency: "NGN",
    symbol: "₦"
  },
  GH: {
    currency: "GHS",
    symbol: "GH₵"
  },
  CA: {
    currency: "CAD",
    symbol: "C$"
  },
  AU: {
    currency: "AUD",
    symbol: "A$"
  },
  DE: {
    currency: "EUR",
    symbol: "€"
  },
  FR: {
    currency: "EUR",
    symbol: "€"
  },
  IT: {
    currency: "EUR",
    symbol: "€"
  },
  ES: {
    currency: "EUR",
    symbol: "€"
  }
};

function getPASONGCurrency(countryCode) {
  const country = String(countryCode || "").toUpperCase();

  return PASONG_COUNTRY_CURRENCIES[country] || {
    currency: "USD",
    symbol: "$"
  };
}

async function detectPASONGCountry() {
  try {
    const response = await fetch("https://ipapi.co/json/");

    if (!response.ok) {
      throw new Error("Country detection failed");
    }

    const data = await response.json();

    return {
      country: data.country_code || "UG",
      currency: getPASONGCurrency(data.country_code)
    };
  } catch (error) {
    return {
      country: "UG",
      currency: getPASONGCurrency("UG")
    };
  }
}

async function getPASONGCurrencyInfo() {
  return await detectPASONGCountry();
}

window.PASONGCurrency = {
  getCurrency: getPASONGCurrency,
  detectCountry: detectPASONGCountry,
  getInfo: getPASONGCurrencyInfo,
  countries: PASONG_COUNTRY_CURRENCIES
};

For now, don't connect this to "index.html", "producer.html", checkout, or any other PASONG page.

When we continue, we'll add the country-specific PASONG price table separately, so UGX 700 stays Uganda-only and isn't automatically converted into another country's price.
