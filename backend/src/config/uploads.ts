import path from "path";
import { env } from "./env.js";

export const uploadsDirectory = path.resolve(env.UPLOADS_DIR);
export const publicAvatarDirectory = path.join(uploadsDirectory, "avatars");
export const privateImportUploadDirectory = path.join(
  uploadsDirectory,
  "private",
  "imports"
);
