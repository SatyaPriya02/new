// routes/fileRoutes.js
import { Router } from "express";
import { streamFromGridFS } from "../utils/gridfs.js";

const router = Router();

/** GET /api/file/:id  (serves from BOTH buckets; we try attendance first, then employees) */
router.get("/file/:id", async (req, res) => {
  const { id } = req.params;

  const tryBucket = async (bucketName) =>
    new Promise((resolve, reject) => {
      try {
        const stream = streamFromGridFS(id, bucketName);
        let sent = false;
        stream.on("file", (f) => {
          if (!sent && f?.contentType) res.setHeader("Content-Type", f.contentType);
        });
        stream.on("data", (c) => {
          if (!sent) { sent = true; res.status(200); }
          res.write(c);
        });
        stream.on("end", () => (sent ? res.end() : reject(new Error("notfound"))));
        stream.on("error", reject);
      } catch (e) {
        reject(e);
      }
    });

  try {
    await tryBucket("attendancePhotos");           // existing bucket (check-in/out)
  } catch {
    try {
      await tryBucket("employeePhotos");           // NEW bucket (registered pictures)
    } catch {
      res.status(404).json({ message: "File not found" });
    }
  }
});

export default router;
