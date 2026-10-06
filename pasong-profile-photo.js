/* PASONG GLOBAL PROFILE PHOTO UPLOADER
   Include this on Artist, Producer and DJ profile pages. */
window.PASONGProfilePhoto = window.PASONGProfilePhoto || {
  async upload(file, accessToken) {
    if (!file) throw new Error("Please choose a profile photo.");
    if (!accessToken) throw new Error("Your PASONG login session is missing. Please log in again.");
    const allowed = ["image/jpeg","image/jpg","image/png","image/webp"];
    if (!allowed.includes(file.type)) throw new Error("Profile photo must be JPG, JPEG, PNG or WEBP.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Profile photo must be 5MB or smaller.");
    const response = await fetch("https://pasong-api.onrender.com/api/profile/photo", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken },
      body: (() => { const fd = new FormData(); fd.append("file", file); return fd; })()
    });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { throw new Error("PASONG returned an invalid profile photo response."); }
    if (!response.ok) throw new Error(data.error || data.message || "Profile photo upload failed. HTTP " + response.status);
    if (!data.secure_url) throw new Error("PASONG did not return the processed profile photo.");
    return data;
  }
};
