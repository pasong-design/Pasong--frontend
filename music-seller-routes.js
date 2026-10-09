// ============================================================
// PASONG MUSIC SELLER PROGRAM
// Registration + rights-cleared catalogue + admin review.
// This does NOT treat an ordinary stream/purchase as resale rights.
// Only catalog entries explicitly marked distribution_rights_confirmed
// and active are eligible to appear in the seller catalogue.
// ============================================================

function isMusicSellerAdmin(user) {
  const allowed = String(process.env.PASONG_MUSIC_SELLER_ADMIN_EMAILS || "")
    .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  return !!(user && user.email && allowed.includes(user.email.toLowerCase()));
}

app.get("/api/music-sellers/me", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Please sign in to continue." });
    const { data, error } = await supabase
      .from("music_sellers")
      .select("id,user_id,seller_type,legal_name,business_name,contact_phone,country,district,city,registration_number,status,review_note,created_at,updated_at")
      .eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    return res.json({ seller: data || null });
  } catch (error) {
    console.error("Music seller profile error:", error);
    return res.status(500).json({ error: "Could not load your Music Seller profile." });
  }
});

app.post("/api/music-sellers/register", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Please sign in to apply." });

    const body = req.body || {};
    const sellerType = String(body.seller_type || "").trim();
    const legalName = String(body.legal_name || "").trim();
    const businessName = String(body.business_name || "").trim();
    const phone = String(body.contact_phone || "").trim();
    const country = String(body.country || "Uganda").trim();
    const district = String(body.district || "").trim();
    const city = String(body.city || "").trim();
    const registrationNumber = String(body.registration_number || "").trim();
    const acceptedTerms = body.accepted_terms === true;

    if (!["individual", "shop"].includes(sellerType)) {
      return res.status(400).json({ error: "Choose individual seller or music shop." });
    }
    if (!legalName || !phone || !country || !district) {
      return res.status(400).json({ error: "Complete your legal name, phone, country and district." });
    }
    if (sellerType === "shop" && !businessName) {
      return res.status(400).json({ error: "Enter your music shop or business name." });
    }
    if (!acceptedTerms) {
      return res.status(400).json({ error: "Please accept the seller programme terms." });
    }

    const { data: existing, error: lookupError } = await supabase
      .from("music_sellers").select("id,status").eq("user_id", user.id).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing && ["pending", "approved", "suspended"].includes(existing.status)) {
      return res.status(409).json({ error: "You already have a Music Seller application.", seller_status: existing.status });
    }

    const payload = {
      user_id: user.id,
      email: user.email || null,
      seller_type: sellerType,
      legal_name: legalName,
      business_name: sellerType === "shop" ? businessName : null,
      contact_phone: phone,
      country,
      district,
      city: city || null,
      registration_number: registrationNumber || null,
      status: "pending",
      accepted_terms: true,
      accepted_terms_at: new Date().toISOString(),
      review_note: null,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from("music_sellers").upsert(payload, { onConflict: "user_id" })
      .select("id,user_id,seller_type,legal_name,business_name,contact_phone,country,district,city,registration_number,status,created_at,updated_at")
      .single();
    if (error) throw error;
    return res.status(201).json({
      message: "Application submitted. PASONG Admin must review it before you can access the authorized catalogue.",
      seller: data
    });
  } catch (error) {
    console.error("Music seller registration error:", error);
    return res.status(500).json({ error: "Could not submit your application. Check that music_sellers.sql has been run in Supabase." });
  }
});

app.get("/api/music-sellers/catalog", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Please sign in to continue." });
    const { data: seller, error: sellerError } = await supabase
      .from("music_sellers").select("id,status").eq("user_id", user.id).maybeSingle();
    if (sellerError) throw sellerError;
    if (!seller || seller.status !== "approved") {
      return res.status(403).json({ error: "Your Music Seller account must be approved before viewing the authorized catalogue." });
    }
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("music_seller_catalog")
      .select("id,title,artist_name,genre,format_options,license_summary,license_fee,currency,license_start,license_end")
      .eq("is_active", true)
      .eq("distribution_rights_confirmed", true)
      .lte("license_start", now)
      .gte("license_end", now)
      .order("title", { ascending: true });
    if (error) throw error;
    return res.json({ catalog: data || [], note: "Only catalogue entries with confirmed active distribution rights are listed. Follow the license scope and expiry for every title." });
  } catch (error) {
    console.error("Music seller catalogue error:", error);
    return res.status(500).json({ error: "Could not load the authorized catalogue." });
  }
});

app.get("/api/admin/music-sellers/pending", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Please sign in." });
    if (!isMusicSellerAdmin(user)) return res.status(403).json({ error: "Admin access required." });
    const { data, error } = await supabase.from("music_sellers")
      .select("id,user_id,email,seller_type,legal_name,business_name,contact_phone,country,district,city,registration_number,status,created_at")
      .eq("status", "pending").order("created_at", { ascending: true });
    if (error) throw error;
    return res.json({ applications: data || [] });
  } catch (error) {
    console.error("Music seller admin list error:", error);
    return res.status(500).json({ error: "Could not load applications." });
  }
});

app.patch("/api/admin/music-sellers/:id/review", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Please sign in." });
    if (!isMusicSellerAdmin(user)) return res.status(403).json({ error: "Admin access required." });
    const status = String((req.body || {}).status || "").trim();
    const reviewNote = String((req.body || {}).review_note || "").trim();
    if (!["approved", "rejected", "suspended"].includes(status)) {
      return res.status(400).json({ error: "Status must be approved, rejected, or suspended." });
    }
    const { data, error } = await supabase.from("music_sellers")
      .update({ status, review_note: reviewNote || null, reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", req.params.id).eq("status", "pending")
      .select("id,user_id,status,review_note,reviewed_at").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Pending application not found." });
    return res.json({ message: "Application reviewed.", seller: data });
  } catch (error) {
    console.error("Music seller review error:", error);
    return res.status(500).json({ error: "Could not review this application." });
  }
});
