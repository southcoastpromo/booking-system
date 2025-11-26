import { Router } from "express";
import { readFileSync } from "fs";
import path from "path";

const router = Router();

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "../../package.json"), "utf-8"));

router.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    uptime: process.uptime(),
    version: pkg.version,
  });
});

export default router;
