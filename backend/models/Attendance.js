// models/Attendance.js
import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    checkInPhoto: { type: String },  // base64 string from webcam
    checkOutPhoto: { type: String },
    totalMs: { type: Number }        // computed on checkout
  },
  { timestamps: true }
);

export default mongoose.model("Attendance", attendanceSchema);



