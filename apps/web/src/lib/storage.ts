import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export interface StoredImage {
  url: string;
  storageKey: string;
}

export interface ImageStorage {
  put(file: { buffer: Buffer; mimeType: string }, ownerId: string): Promise<StoredImage>;
}

class LocalDiskStorage implements ImageStorage {
  async put(file: { buffer: Buffer; mimeType: string }, ownerId: string): Promise<StoredImage> {
    const ext = mimeToExt(file.mimeType);
    const id = crypto.randomBytes(12).toString("hex");
    const key = `${ownerId}/${id}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", ownerId);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${id}.${ext}`), file.buffer);
    return { url: `/uploads/${key}`, storageKey: `local:${key}` };
  }
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

let _storage: ImageStorage | null = null;

export function getStorage(): ImageStorage {
  if (_storage) return _storage;
  const provider = process.env.IMAGE_STORAGE_PROVIDER ?? "local";

  switch (provider) {
    case "local":
      _storage = new LocalDiskStorage();
      return _storage;
    default:

      console.warn(
        `[storage] provider "${provider}" not implemented, using local disk. ` +
          `TODO: implement Cloudinary/S3 by replacing getStorage().`,
      );
      _storage = new LocalDiskStorage();
      return _storage;
  }
}
