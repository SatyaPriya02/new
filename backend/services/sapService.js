
import axios from "axios";

const SAP_API_URL = process.env.SAP_API_URL; // set in .env
const SAP_USER = process.env.SAP_USER;
const SAP_PASS = process.env.SAP_PASS;

// Utility to push one attendance record to SAP
export async function pushAttendanceToSAP(attendance, employee) {
  try {
    const payload = {
      emp_id: employee.empId,
      date: attendance.checkInTime
        ? new Date(attendance.checkInTime).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      check_in: attendance.checkInTime
        ? new Date(attendance.checkInTime).toISOString().replace("T", " ").split(".")[0]
        : null,
      check_out: attendance.checkOutTime
        ? new Date(attendance.checkOutTime).toISOString().replace("T", " ").split(".")[0]
        : null,
      status: attendance.checkOutTime ? "PRESENT" : "IN_PROGRESS"
    };

    const response = await axios.post(SAP_API_URL, payload, {
      headers: { "Content-Type": "application/json" },
      auth: { username: SAP_USER, password: SAP_PASS } // Basic Auth
    });

    console.log("✅ Sent to SAP:", payload);
    return response.data;
  } catch (err) {
    console.error("❌ Failed to send to SAP:", err.response?.data || err.message);
    throw err;
  }
}
