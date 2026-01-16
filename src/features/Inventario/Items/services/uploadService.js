import { supabase } from "../../../../core/config/supabase/supabaseClientInventario";

// Subir imagen a cualquier bucket
export async function uploadImageToBucket(file, bucketName) {
  if (!file) return null;

  const fileExt = file.name?.split(".").pop() || "png";
  const fileName = `${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicData.publicUrl;
}
