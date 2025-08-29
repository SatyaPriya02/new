

// src/pages/EmployeeLeaveApprovals.jsx
import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../services/axiosInstance";
import "./leave.css";

export default function EmployeeLeaveApprovals() {
  const { user } = useAuth();
  const role = String(user?.role ?? "").trim().toLowerCase();
  const isHRorManager = role === "hr" || role === "manager";

  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [err, setErr] = useState("");
  const [notes, setNotes] = useState({}); // per-row decision note
  const [showAll, setShowAll] = useState(false); // toggle to show processed too

  const daysBetween = (f, t) => {
    if (!f || !t) return "-";
    const from = new Date(f);
    const to = new Date(t);
    const ms = to.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0);
    if (isNaN(ms)) return "-";
    return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1; // inclusive
  };

  // Backend returns EMPLOYEE requests for HR/MANAGER
  const load = async () => {
    if (!isHRorManager) return;
    setLoading(true);
    setErr("");
    try {
      // by default, show only Pending; toggle can fetch all
      const params = showAll ? {} : { status: "Pending" };
      const { data } = await api.get("/leave/inbox", { params });
      setInbox(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load requests");
      setInbox([]);
    } finally {
      setLoading(false);
    }
  };

  const act = async (id, action) => {
    const newStatus = action === "approve" ? "Approved" : "Rejected";
    const note = (notes[id] || "").trim();

    // optimistic update: keep row, update status, and hide buttons
    setActingId(id);
    const prev = inbox;
    setInbox((list) =>
      list.map((r) =>
        r._id === id
          ? {
              ...r,
              status: newStatus,
              _justDecided: true, // ensures visibility even when "Show processed" is off
            }
          : r
      )
    );

    try {
      if (action === "approve") {
        await api.post(`/leave/${id}/approve`, { note });
      } else {
        await api.post(`/leave/${id}/reject`, { note });
      }
      // optional: clear the note for that row after success
      setNotes((n) => {
        const c = { ...n };
        delete c[id];
        return c;
      });
    } catch (e) {
      // rollback if server fails
      setInbox(prev);
      alert(e?.response?.data?.message || "Action failed");
    } finally {
      setActingId(null);
    }
  };

  useEffect(() => {
    load(); // eslint-disable-next-line
  }, [role, showAll]);

  const visibleRows = useMemo(() => {
    if (showAll) return inbox || [];
    // show Pending + anything we just decided (so details remain visible)
    return (inbox || []).filter((r) => (r.status || "Pending") === "Pending" || r._justDecided);
  }, [inbox, showAll]);

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Employee Leave Approvals</h2>
          <span className="status-badge status-pending" title="Scope">
            Scope: EMPLOYEE requests
          </span>
          <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
            />
            Show processed
          </label>
          <button className="btn btn-outline" onClick={load}>
            Refresh
          </button>
        </div>

        {!isHRorManager && (
          <p style={{ color: "#a00" }}>
            Forbidden: Only HR or Manager can access this page.
          </p>
        )}

        {isHRorManager && (
          <>
            {loading && <div>Loading…</div>}
            {err && <p className="error">{err}</p>}

            <table className="leave-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Requester Role</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Applied On</th>
                  <th style={{ minWidth: 220 }}>Decision Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(visibleRows || []).map((r) => {
                  const emp = r.employeeId || {};
                  const status = r.status || "Pending";
                  const isPending = status === "Pending";
                  return (
                    <tr key={r._id}>
                      <td>{emp?.name || "-"}</td>
                      <td>{emp?.role || "-"}</td>
                      <td>{r.fromDate ? new Date(r.fromDate).toLocaleDateString() : "-"}</td>
                      <td>{r.toDate ? new Date(r.toDate).toLocaleDateString() : "-"}</td>
                      <td>{daysBetween(r.fromDate, r.toDate)}</td>
                      <td>{r.reason || "-"}</td>
                      <td>
                        <span className={`status-badge status-${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
                      <td>
                        <input
                          type="text"
                          placeholder="Optional note"
                          value={notes[r._id] || ""}
                          onChange={(e) => setNotes({ ...notes, [r._id]: e.target.value })}
                          style={{ width: "100%" }}
                          disabled={!isPending}
                        />
                      </td>
                      <td>
                        {isPending ? (
                          <>
                            <button
                              className="btn"
                              disabled={actingId === r._id}
                              onClick={() => act(r._id, "approve")}
                            >
                              {actingId === r._id ? "Approving…" : "Approve"}
                            </button>{" "}
                            <button
                              className="btn btn-danger"
                              disabled={actingId === r._id}
                              onClick={() => act(r._id, "reject")}
                            >
                              {actingId === r._id ? "Rejecting…" : "Reject"}
                            </button>
                          </>
                        ) : (
                          <em style={{ opacity: 0.7 }}>No actions</em>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!loading && !err && (visibleRows?.length || 0) === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: 16 }}>
                      {showAll ? "No requests." : "No pending Employee requests. 🎉"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </main>
    </>
  );
}


