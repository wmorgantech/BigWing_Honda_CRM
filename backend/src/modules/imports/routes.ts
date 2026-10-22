import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { importController } from "./controller.js";
import { importRepository } from "./repository.js";
import { privateImportUploadDirectory } from "../../config/uploads.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { rbac } from "../../middlewares/rbac.js";
import { mkdir } from "fs";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    mkdir(privateImportUploadDirectory, { recursive: true }, (error) => {
      callback(error, privateImportUploadDirectory);
    });
  },
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const originalName = file.originalname
      .split(/[\\/]/)
      .pop()
      ?.replace(/\s+/g, "_")
      .replace(/[^A-Za-z0-9._-]/g, "_")
      .slice(-160) || "upload";
    cb(null, `${ts}-${randomUUID()}-${originalName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".xlsx", ".xls", ".csv", ".xml"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .xlsx, .xls, .csv, and .xml files are accepted"));
    }
  },
});

router.use(authMiddleware);

function authorizeRequestedBrandAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestedBrand = (
    (req.query.brand as string | undefined) ||
    req.header("X-Brand") ||
    "BIGWING"
  ).toUpperCase();
  const brandAccess = req.user?.brandAccess?.toUpperCase();

  if (brandAccess !== "BOTH" && brandAccess !== requestedBrand) {
    res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "You cannot access this brand" },
    });
    return;
  }

  next();
}

router.use(authorizeRequestedBrandAccess);

async function authorizeBatchBrandAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const batchId = BigInt(req.params.id as string);
    const batch = await importRepository.findBatchById(batchId);
    if (!batch) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Import batch not found" },
      });
      return;
    }

    const brandAccess = req.user?.brandAccess?.toUpperCase();
    if (
      brandAccess !== "BOTH" &&
      brandAccess !== batch.brand.toUpperCase()
    ) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Import batch not found" },
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

router.get(
  "/active/status",
  rbac(["SUPER_ADMIN", "ADMIN", "MANAGER", "TELE_CALLER"]),
  (req, res, next) => importController.getActiveBatch(req, res, next)
);

router.get(
  "/",
  rbac(["SUPER_ADMIN", "ADMIN", "MANAGER", "TELE_CALLER"]),
  (req, res, next) => importController.getHistory(req, res, next)
);

router.post(
  "/upload",
  rbac(["SUPER_ADMIN", "ADMIN", "MANAGER", "TELE_CALLER"]),
  upload.single("file"),
  (req, res, next) => importController.upload(req, res, next)
);

// GET /:id — fetch batch status (for progress polling)
router.get(
  "/:id",
  rbac(["SUPER_ADMIN", "ADMIN", "MANAGER", "TELE_CALLER"]),
  authorizeBatchBrandAccess,
  async (req, res, next) => {
    try {
      const { importRepository } = await import("./repository.js");
      const batch = await importRepository.findBatchById(BigInt(req.params.id as string));
      if (!batch) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Batch not found" } });
        return;
      }
      res.json({
        success: true,
        data: {
          id: Number(batch.id),
          fileName: batch.fileName,
          status: batch.status,
          totalRows: batch.totalRows,
          successRows: batch.successRows,
          errorRows: batch.errorRows,
          skippedRows: batch.skippedRows,
          startedAt: batch.startedAt,
          completedAt: batch.completedAt,
          createdAt: batch.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/preview",
  rbac(["SUPER_ADMIN", "ADMIN", "MANAGER", "TELE_CALLER"]),
  authorizeBatchBrandAccess,
  (req, res, next) => importController.preview(req, res, next)
);

router.post(
  "/:id/commit",
  rbac(["SUPER_ADMIN", "ADMIN", "TELE_CALLER"]),
  authorizeBatchBrandAccess,
  (req, res, next) => importController.commit(req, res, next)
);

router.post(
  "/:id/cancel",
  rbac(["SUPER_ADMIN", "ADMIN", "TELE_CALLER"]),
  authorizeBatchBrandAccess,
  (req, res, next) => importController.cancel(req, res, next)
);

router.get(
  "/:id/errors.xlsx",
  rbac(["SUPER_ADMIN", "ADMIN", "MANAGER", "TELE_CALLER"]),
  authorizeBatchBrandAccess,
  (req, res, next) => importController.downloadErrors(req, res, next)
);

router.get(
  "/:id/file",
  rbac(["SUPER_ADMIN", "ADMIN", "MANAGER", "TELE_CALLER"]),
  authorizeBatchBrandAccess,
  (req, res, next) => importController.downloadOriginalFile(req, res, next)
);

export { router as importRoutes };
