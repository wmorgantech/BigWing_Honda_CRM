import { existsSync } from "fs";
import path from "path";
import {
  privateImportUploadDirectory,
  uploadsDirectory,
} from "../../config/uploads.js";

export function getImportFilePath(fileName: string): string {
  if (
    !fileName ||
    fileName === "." ||
    fileName === ".." ||
    path.basename(fileName) !== fileName ||
    /[\\/]/.test(fileName)
  ) {
    throw new Error("Invalid import file name");
  }

  const privatePath = path.join(privateImportUploadDirectory, fileName);
  if (existsSync(privatePath)) return privatePath;

  return path.join(uploadsDirectory, fileName);
}
