// Image upload helper using the ImageBB API.
// Uploads an image and returns its public HTTPS URL.
//
// ImageBB is a free image hosting service. We POST the image (base64) to
// https://api.imgbb.com/1/upload with our API key and get back a public URL
// that can be stored and displayed anywhere.

const IMGBB_KEY = "36c648f1719b1f016950580875484037";
const IMGBB_ENDPOINT = "https://api.imgbb.com/1/upload";

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image file to ImageBB and return its public URL.
 * Accepts a File/Blob. Returns "" when no file is provided. Throws with a
 * clean message so callers can fall back to "no photo".
 */
export async function uploadProfilePhoto(file) {
  if (!file) return "";

  const base64 = await toBase64(file);

  const form = new FormData();
  form.append("key", IMGBB_KEY);
  form.append("image", base64.split(",")[1]);

  const res = await fetch(IMGBB_ENDPOINT, { method: "POST", body: form });

  if (!res.ok) {
    throw new Error("Image upload failed.");
  }

  const json = await res.json();
  const url = json?.data?.url;

  if (!url) {
    throw new Error("Image upload failed.");
  }

  return url;
}
