import { useRef, useState } from "react";
import { uploadImageToCloudinary } from "../lib/cloudinary";
import { useStore } from "../context/StoreContext";

export function useProfilePhotoUpload() {
  const { updateProfileImage } = useStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    // Read the file into a data URL so the user can crop it first
    const reader = new FileReader();
    reader.onload = () => setCropSource(reader.result as string);
    reader.onerror = () => setError("Could not read the image file");
    reader.readAsDataURL(file);
  };

  const closeCrop = () => setCropSource(null);

  const uploadCropped = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImageToCloudinary(file);
      const result = await updateProfileImage(url);
      if (!result.success) throw new Error(result.error || "Failed to save photo");
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setCropSource(null);
    }
  };

  return {
    inputRef,
    uploading,
    error,
    openPicker,
    handleFile,
    cropSource,
    closeCrop,
    uploadCropped,
  };
}