

// routes/leaveRoutes.js
import { Router } from "express";
import { auth, requireRole } from "../middlewares/authMiddleware.js";
import {
  createLeaveRequest,
  getMyLeaveRequests,
  hrInboxForEmployeeLeaves,
  hrDecideEmployeeLeave,
} from "../controllers/leaveController.js";

const router = Router();

/**
 * Leave creation + self status (Employee, HR/Manager, Boss can all create and view their own list)
 */
router.post("/leave-request", auth, createLeaveRequest);
router.get("/leave-requests", auth, getMyLeaveRequests);

/**
 * HR/Manager inbox & actions for EMPLOYEE requests only
 * - GET /leave/inbox?status=Pending|Approved|Rejected (status optional)
 * - POST /leave/:id/approve
 * - POST /leave/:id/reject
 */
router.get("/leave/inbox", auth, requireRole("hr", "manager"), hrInboxForEmployeeLeaves);
router.post("/leave/:id/approve", auth, requireRole("hr", "manager"), (req, res) =>
  hrDecideEmployeeLeave(req, res, "Approved")
);
router.post("/leave/:id/reject", auth, requireRole("hr", "manager"), (req, res) =>
  hrDecideEmployeeLeave(req, res, "Rejected")
);

export default router;
