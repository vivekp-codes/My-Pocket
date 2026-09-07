// ── Cloudinary config ───────────────────────────────────────────
// 1. Cloud Name — found on your Cloudinary Dashboard (cloudinary.com/console)
// 2. Upload Preset — create an UNSIGNED preset in:
//    Cloudinary Dashboard → Settings → Upload → "Add upload preset"
//    Signing mode: Unsigned. Then paste the preset name below.
// Both are safe to expose in client code (unsigned presets are made for this).
export const CLOUDINARY_CLOUD_NAME = "dmdvqqo4k";
export const CLOUDINARY_UPLOAD_PRESET = "my_pocket_avatar";

// ── Upload an image file directly to Cloudinary ─────────────────
// Returns the secure URL of the uploaded image.
export async function uploadImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await res.json();

  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "Image upload failed");
  }
  return data.secure_url;
}