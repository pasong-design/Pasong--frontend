/* PASONG GLOBAL PROFILE PHOTO UPLOADER */

window.PASONGProfilePhoto = window.PASONGProfilePhoto || {};

window.PASONGProfilePhoto.upload = async function (file, accessToken) {
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

  if (!allowed.includes(file.type)) {
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

  let response;

  try {
    response = await fetch(
      "https://pasong-api.onrender.com/api/profile/photo",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken
        },
        body: formData
      }
    );
  } catch (error) {
    throw new Error(
      "Could not connect to PASONG. Please check your internet connection and try again."
    );
  }

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(
      "PASONG returned an invalid profile photo response."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      "Profile photo upload failed. HTTP " + response.status
    );
  }

  if (!data.secure_url) {
    throw new Error(
      "PASONG did not return the processed profile photo."
    );
  }

  return data;
};

window.PASONGProfilePhoto.setPreview = function (imgElement, url) {
  if (!imgElement || !url) return;
  imgElement.src = url;
};
