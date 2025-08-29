// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import { cleanupOldAttendancePhotos } from "./utils/cleanup.js";
import bcrypt from "bcryptjs";
import Employee from "./models/Employee.js";

// routes
import authRoutes from "./routes/authRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";   // ✅ new GridFS file route

import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

// ✅ Fix __dirname issue in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ✅ still serve legacy /uploads folder for old images
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => res.send("Employee Attendance API is running 🚀"));

// ✅ Mount API routes
app.use("/api", authRoutes);
app.use("/api", attendanceRoutes);
app.use("/api", leaveRoutes);
app.use("/api", adminRoutes);
app.use("/api", fileRoutes);   // ✅ serves /api/file/:id (GridFS)

// error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 2000;

connectDB(process.env.MONGO_URI)
  .then(async () => {
    // --- Boss (fixed admin) seeding ---
    const ADMIN_EMP_ID = process.env.ADMIN_EMP_ID || "BOSS";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe123!";
    const ADMIN_NAME = process.env.ADMIN_NAME || "Company Boss";
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "boss@example.com";

    try {
      const existing = await Employee.findOne({ empId: ADMIN_EMP_ID });
      if (!existing) {
        const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await Employee.create({
          empId: ADMIN_EMP_ID,
          name: ADMIN_NAME,
          email: ADMIN_EMAIL,
          role: "boss",
          passwordHash: hash,
        });
        console.log(`✅ Boss user created (${ADMIN_EMP_ID}).`);
      } else if (!existing.passwordHash && process.env.ADMIN_PASSWORD) {
        existing.passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await existing.save();
        console.log("✅ Boss password set from env.");
      } else {
        console.log("✅ Boss user already exists, skipping seed.");
      }
    } catch (seedErr) {
      console.error("❌ Error seeding boss user:", seedErr);
    }

    app.listen(PORT, () => console.log(`🚀 Server listening on ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  });

// Run daily cleanup job
cron.schedule("0 2 * * *", () => {
  console.log("🕑 Running daily cleanup job...");
  cleanupOldAttendancePhotos();
});
