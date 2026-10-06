/* PASONG GLOBAL PROFILE PHOTO HELPER
   Include this file on any PASONG page that uploads a
   public Artist / Producer / DJ profile picture.

   Usage:
     const url = await PASONGProfilePhoto.upload(file, accessToken);
*/
window.PASONGProfilePhoto = {
  async upload(file, accessToken) {
    if (!file) {
      throw new Error("Please choose a profile photo.");
    }

    if (!accessToken) {
      throw new Error(
        "Your PASONG login session is missing. Please log in again."
      );
    }

    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp"
    ];

    if (!allowed.includes(String(file.type || "").toLowerCase())) {
      throw new Error(
        "Profile photo must be JPG, JPEG, PNG or WEBP."
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(
        "Profile photo must be 5MB or smaller."
      );
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      "https://pasong-api.onrender.com/api/profile/photo",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + accessToken
        },
        body: formData
      }
    );

    const text = await response.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(
        "PASONG returned an invalid profile-photo response."
      );
    }

    if (!response.ok || !data.secure_url) {
      throw new Error(
        data.error ||
        data.message ||
        "PASONG could not process the profile photo."
      );
    }

    return data;
  }
};
