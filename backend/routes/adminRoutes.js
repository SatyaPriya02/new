
// routes/adminRoutes.js
import { Router } from "express";
import { auth, requireRole } from "../middlewares/authMiddleware.js";

import {
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
  getAllLeaveRequests,   // boss -> view HR/Manager leave requests
  createEmployee,
} from "../controllers/adminController.js";

import { updateLeaveRequestStatus } from "../controllers/leaveController.js"; // boss -> approve/reject

import { listAllAttendance } from "../controllers/attendanceController.js";
import { employeePhotoUpload } from "../middlewares/upload.js";

const router = Router();

/**
 * Employee CRUD - accessible to boss, hr, manager
 * Endpoints remain /admin/employees...
 */
router.get(
  "/admin/employees",
  auth,
  requireRole("boss", "hr", "manager"),
  getAllEmployees
);

router.post(
  "/admin/employees",
  auth,
  requireRole("boss", "hr", "manager"),
  employeePhotoUpload.single("photo"),
  createEmployee
);

/**
 * Update employee (Boss unrestricted; HR/Manager can only edit users with role === "employee")
 */
router.put(
  "/admin/employees/:empId",
  auth,
  requireRole("boss","hr","manager"),
  employeePhotoUpload.single("photo"), // <-- so FormData with photo works
  updateEmployee
);

router.delete(
  "/admin/employees/:empId",
  auth,
  requireRole("boss", "hr", "manager"),
  deleteEmployee
);

/**
 * Leave management - boss only
 * GET  /admin/leave-requests  -> list only HR/Manager requests
 * PUT  /admin/leave-request   -> approve/reject one
 */
router.get(
  "/admin/leave-requests",
  auth,
  requireRole("boss"),
  getAllLeaveRequests
);

router.put(
  "/admin/leave-request",
  auth,
  requireRole("boss"),
  updateLeaveRequestStatus
);

router.get(
  "/admin/attendance",
  auth,
  requireRole("boss", "hr", "manager"),
  listAllAttendance
);

export default router;












