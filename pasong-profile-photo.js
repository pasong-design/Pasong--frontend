/* PASONG Artist Dashboard — Profile Photo Auto-Crop Fix
   Add this after Supabase is initialized on the Artist Dashboard.
   It replaces only the profile-image upload behavior.
*/
(function () {
  const API_URL = "https://pasong-api.onrender.com";

  async function uploadArtistProfilePhoto(file) {
    if (!file) return null;
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
      throw new Error("Profile photo must be JPG, JPEG, PNG or WEBP.");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Profile photo must be 5MB or smaller.");
    }

    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    const token = data?.session?.access_token;
    if (!token) throw new Error("Your PASONG login session has expired. Please log in again.");

    const form = new FormData();
    form.append("file", file);

    const response = await fetch(API_URL + "/api/profile/photo", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: form
    });

    const raw = await response.text();
    let result = {};
    try { result = raw ? JSON.parse(raw) : {}; }
    catch (_) { throw new Error("PASONG returned an invalid profile-photo response."); }

    if (!response.ok) {
      throw new Error(result.error || result.message || "Profile photo upload failed. HTTP " + response.status);
    }
    if (!result.secure_url) {
      throw new Error("PASONG did not return the processed profile photo.");
    }

    return result.secure_url;
  }

  window.uploadArtistProfilePhoto = uploadArtistProfilePhoto;

  function showMessage(message, type) {
    const el = document.getElementById("profileMessage");
    if (!el) return;
    el.className = "message " + (type || "info") + " show";
    el.textContent = message;
  }

  const input = document.getElementById("profileImage");
  if (!input) return;

  input.addEventListener("change", async function () {
    const file = this.files?.[0];
    if (!file) return;

    const preview = document.getElementById("profilePreview");
    if (preview) {
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
    }

    try {
      showMessage("Processing profile photo…", "info");
      const url = await uploadArtistProfilePhoto(file);

      if (preview) {
        preview.src = url;
        preview.dataset.processedUrl = url;
      }

      /* Keep the URL available to saveArtistProfile(). */
      window.pasongProcessedArtistProfilePhotoUrl = url;
      showMessage("Profile photo automatically cropped and optimized. Click Save Profile.", "success");
    } catch (error) {
      console.error("Artist profile photo error:", error);
      showMessage(error?.message || "Unable to process profile photo.", "error");
    }
  });
})();
