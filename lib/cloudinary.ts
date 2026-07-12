import { v2 as cloudinary } from "cloudinary";

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary no esta configurado. Revisa las variables de entorno.");
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

export async function uploadProductImage(file: File) {
  configureCloudinary();
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise<string>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: "erclav/products",
        resource_type: "image",
        unique_filename: true,
        overwrite: false,
        format: "webp",
        transformation: [{ width: 2400, height: 2400, crop: "limit", quality: "auto:good" }],
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(new Error(error?.message ?? "No se pudo subir la imagen a Cloudinary."));
          return;
        }

        resolve(result.secure_url);
      },
    );

    upload.end(buffer);
  });
}
