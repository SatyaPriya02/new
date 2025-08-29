
// import multer from "multer";
// import path from "path";
// import fs from "fs";

// // Ensure directory
// function ensureDir(dir) {
//   fs.mkdirSync(dir, { recursive: true });
// }

// function storageFor(subdir) {
//   const dest = path.join(process.cwd(), "uploads", subdir);
//   ensureDir(dest);
//   return multer.diskStorage({
//     destination: (req, file, cb) => cb(null, dest),
//     filename: (req, file, cb) => {
//       const ext = path.extname(file.originalname) || ".jpg";
//       const base = path.basename(file.originalname, ext)
//         .replace(/\s+/g, "_")
//         .toLowerCase();
//       const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       cb(null, `${base}-${unique}${ext}`);
//     },
//   });
// }

// const imageOnly = (req, file, cb) => {
//   if (/^image\//.test(file.mimetype)) cb(null, true);
//   else cb(new Error("Only image uploads are allowed"), false);
// };

// // ✅ Employee photos (disk)
// export const employeePhotoUpload = multer({
//   storage: storageFor("employees"),
//   fileFilter: imageOnly,
//   limits: { fileSize: 5 * 1024 * 1024 },
// });

// // ✅ Attendance photos (GridFS via memory)
// export const attendancePhotoUpload = multer({
//   storage: multer.memoryStorage(),
//   fileFilter: imageOnly,
//   limits: { fileSize: 5 * 1024 * 1024 },
// });

// middlewares/upload.js
import multer from "multer";

const imageOnly = (req, file, cb) => {
  if (/^image\//.test(file.mimetype)) cb(null, true);
  else cb(new Error("Only image uploads are allowed"), false);
};

// ✅ registered employee photos → memory (we will put into GridFS in controller)
export const employeePhotoUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageOnly,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ✅ attendance photos already used memory + GridFS in your code (keep as-is)
export const attendancePhotoUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageOnly,
  limits: { fileSize: 5 * 1024 * 1024 },
});


