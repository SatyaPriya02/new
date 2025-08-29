
// // src/pages/Leave.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import Navbar from "../components/Navbar";
// import { useAuth } from "../context/AuthContext";
// import api from "../services/axiosInstance";

// const th = { textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 };
// const td = { borderBottom: "1px solid #eee", padding: 8 };

// function normStatus(s) {
//   return String(s || "").trim();
// }
// function daysBetween(f, t) {
//   if (!f || !t) return "-";
//   const from = new Date(f);
//   const to = new Date(t);
//   const ms = to.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0);
//   if (isNaN(ms)) return "-";
//   return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1; // inclusive
// }

// // Validate YYYY-MM-DD with: year 4 digits, month 1–12, day 1–31 (and real date)
// // Also ensure date is today or in the future.
// function makeValidators(todayStr) {
//   const isValidYMD = (s) => {
//    if (!s) return false;
//   // Year exactly 4 digits, month 2 digits, day 2 digits
//   const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
//   if (!m) return false;

//   const y = +m[1], mo = +m[2], d = +m[3];
//   if (mo < 1 || mo > 12) return false;     // month 1–12
//   if (d < 1 || d > 31) return false;       // day 1–31 pre-check

//   // Check actual date exists (rejects 2025-02-31 etc.)
//   const dt = new Date(`${s}T00:00:00`);
//   if (Number.isNaN(dt.getTime())) return false;

//   // Ensure normalized ISO date matches
//   const iso = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()))
//     .toISOString()
//     .slice(0, 10);
//   return iso === s;
// }

//   const isTodayOrFuture = (s) => {
//     if (!s) return false;
//     // since both are in YYYY-MM-DD, string compare is fine
//     return s >= todayStr;
//   };

//   return { isValidYMD, isTodayOrFuture };
// }

// export default function Leave() {
//   const { user } = useAuth();
//   const role = (user?.role || "").toLowerCase();
//   const isBoss = role === "boss";

//   const [list, setList] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [actingId, setActingId] = useState(null);

//   // form state (for non-boss self-request)
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [reason, setReason] = useState("");
//   const [saving, setSaving] = useState(false);
//   const [err, setErr] = useState("");

//   // Local "today" in YYYY-MM-DD (not UTC), to use as <input min> and validator baseline
//   const todayStr = useMemo(() => {
//     const d = new Date();
//     const tzAdjusted = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
//     return tzAdjusted.toISOString().split("T")[0];
//   }, []);
//   const { isValidYMD, isTodayOrFuture } = useMemo(() => makeValidators(todayStr), [todayStr]);

//   async function load() {
//     setLoading(true);
//     try {
//       if (isBoss) {
//         // Boss sees only Pending on refresh; acted rows persist locally until refresh
//         const res = await api.get("/admin/leave-requests", { params: { status: "Pending" } });
//         setList(Array.isArray(res.data) ? res.data : []);
//       } else {
//         const res = await api.get("/leave-requests");
//         setList(Array.isArray(res.data) ? res.data : []);
//       }
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     load(); // eslint-disable-line
//   }, [role]);

//   function validateForm() {
//     if (!fromDate || !toDate || !reason.trim()) {
//       return "All fields are required";
//     }
//     if (!isValidYMD(fromDate)) return "From date must be YYYY-MM-DD with year=4 digits, month 1–12, day 1–31.";
//     if (!isValidYMD(toDate)) return "To date must be YYYY-MM-DD with year=4 digits, month 1–12, day 1–31.";
//     if (!isTodayOrFuture(fromDate)) return "From date cannot be in the past.";
//     if (!isTodayOrFuture(toDate)) return "To date cannot be in the past.";
//     // Optional but sensible: ensure range order (remove if you don't want this)
//     if (toDate < fromDate) return "To date cannot be earlier than From date.";
//     return "";
//   }

//   async function submitLeave(e) {
//     e.preventDefault();
//     setErr("");
//     const msg = validateForm();
//     if (msg) return setErr(msg);

//     try {
//       setSaving(true);
//       await api.post("/leave-request", { fromDate, toDate, reason });
//       setFromDate("");
//       setToDate("");
//       setReason("");
//       await load();
//       alert("Leave request submitted");
//     } catch (e) {
//       setErr(e?.response?.data?.message || "Submit failed");
//     } finally {
//       setSaving(false);
//     }
//   }

//   // Boss actions on HR/Manager requests
//   async function bossUpdateStatus(leaveRequestId, status) {
//     setActingId(leaveRequestId);
//     // Update row in place (keep visible, hide buttons)
//     setList((prev) =>
//       prev.map((r) => (r._id === leaveRequestId ? { ...r, status: status, __decided: true } : r))
//     );
//     try {
//       await api.put("/admin/leave-request", { leaveRequestId, status });
//       // no reload, row stays until Refresh
//     } catch (e) {
//       alert(e?.response?.data?.message || "Action failed");
//       await load(); // rollback if server fails
//     } finally {
//       setActingId(null);
//     }
//   }

//   return (
//     <>
//       <Navbar />
//       <main className="container" style={{ padding: 16 }}>
//         {/* Boss approvals table (HR/Manager requests) */}
//         {isBoss && (
//           <section className="card" style={{ padding: 16 }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//               <h2 style={{ marginBottom: 12, marginTop: 0 }}>Leave Approvals — HR & Managers</h2>
//               <button className="btn btn-outline" style={{ marginLeft: "auto" }} onClick={load}>
//                 Refresh
//               </button>
//             </div>
//             {loading && <div>Loading…</div>}
//             <table className="table" style={{ width: "100%" }}>
//               <thead>
//                 <tr>
//                   <th style={th}>Emp ID</th>
//                   <th style={th}>Name</th>
//                   <th style={th}>From</th>
//                   <th style={th}>To</th>
//                   <th style={th}>Days</th>
//                   <th style={th}>Reason</th>
//                   <th style={th}>Status</th>
//                   <th style={th}>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {(list || []).map((lr) => {
//                   const status = normStatus(lr.status || "Pending");
//                   const isPending = status.toLowerCase() === "pending";
//                   return (
//                     <tr key={lr._id}>
//                       <td style={td}>{lr.employeeId?.empId}</td>
//                       <td style={td}>{lr.employeeId?.name}</td>
//                       <td style={td}>
//                         {lr.fromDate ? new Date(lr.fromDate).toLocaleDateString() : "-"}
//                       </td>
//                       <td style={td}>
//                         {lr.toDate ? new Date(lr.toDate).toLocaleDateString() : "-"}
//                       </td>
//                       <td style={td}>{daysBetween(lr.fromDate, lr.toDate)}</td>
//                       <td style={td}>{lr.reason}</td>
//                       <td style={td}>{status}</td>
//                       <td style={td}>
//                         {isPending && !lr.__decided ? (
//                           <>
//                             <button
//                               className="btn"
//                               disabled={actingId === lr._id}
//                               onClick={() => bossUpdateStatus(lr._id, "Approved")}
//                             >
//                               {actingId === lr._id ? "Approving…" : "Approve"}
//                             </button>{" "}
//                             <button
//                               className="btn btn-danger"
//                               disabled={actingId === lr._id}
//                               onClick={() => bossUpdateStatus(lr._id, "Rejected")}
//                             >
//                               {actingId === lr._id ? "Rejecting…" : "Reject"}
//                             </button>
//                           </>
//                         ) : (
//                           <em style={{ opacity: 0.7 }}>No actions</em>
//                         )}
//                       </td>
//                     </tr>
//                   );
//                 })}
//                 {!loading && list?.length === 0 && (
//                   <tr>
//                     <td style={td} colSpan={8}>
//                       No pending leave requests.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </section>
//         )}

//         {/* Employee + HR/Manager: submit + see own requests */}
//         {!isBoss && (
//           <>
//             <section className="card" style={{ padding: 16, marginBottom: 12 }}>
//               <h2 style={{ marginBottom: 8 }}>Request Leave</h2>
//               <form onSubmit={submitLeave} className="row" style={{ gap: 8, alignItems: "end" }}>
//                 <label>
//                   From
//                   <br />
//                   <input
//                     type="date"
//                     value={fromDate}
//                     onChange={(e) => setFromDate(e.target.value)}
//                     min={todayStr} // disallow past
//                     required
//                     style={{backgroundColor:"white", color:"black"}}
//                   />
//                 </label>
//                 <label>
//                   To
//                   <br />
//                   <input
//                     type="date"
//                     value={toDate}
//                     onChange={(e) => setToDate(e.target.value)}
//                     min={todayStr} // disallow past
//                     required
//                     style={{backgroundColor:"white", color:"black"}}
//                   />
//                 </label>
//                 <label style={{ flex: 1 }}>
//                   Reason
//                   <br />
//                   <input
//                    value={reason}
//                        onChange={(e) => {
//                      const val = e.target.value;
//                     // ✅ Allow only letters, numbers, spaces, and . , ! ? - (basic punctuation)
//                     const clean = val.replace(/[^a-zA-Z0-9 .,!?-]/g, "");
//                     setReason(clean.slice(0, 200)); // also enforce 200 char max
//                       }}
//                       placeholder="Reason"
//                       maxLength={200}   // browser-level cap
//                       required
//                       style={{backgroundColor:"white", color:"black"}}
//                      />
//                 </label>
//                 <button className="btn" disabled={saving}>
//                   {saving ? "Submitting…" : "Submit"}
//                 </button>
//               </form>
//               {err && <div className="error" style={{ marginTop: 8 }}>{err}</div>}
//               {/* Small hint for users about allowed dates */}
//               <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
//                 Note: Dates must be in <code>YYYY-MM-DD</code> format with a 4-digit year, month 1–12,
//                 day 1–31, and cannot be in the past.
//               </div>
//             </section>

//             <section className="card" style={{ padding: 16 }}>
//               <h2 style={{ marginBottom: 12 }}>Your Leave Requests (Status)</h2>
//               {loading && <div>Loading…</div>}
//               <table className="table" style={{ width: "100%" }}>
//                 <thead>
//                   <tr>
//                     <th style={th}>From</th>
//                     <th style={th}>To</th>
//                     <th style={th}>Reason</th>
//                     <th style={th}>Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {(list || []).map((lr) => (
//                     <tr key={lr._id}>
//                       <td style={td}>
//                         {lr.fromDate ? new Date(lr.fromDate).toLocaleDateString() : "-"}
//                       </td>
//                       <td style={td}>
//                         {lr.toDate ? new Date(lr.toDate).toLocaleDateString() : "-"}
//                       </td>
//                       <td style={td}>{lr.reason}</td>
//                       <td style={td}>{lr.status || "Pending"}</td>
//                     </tr>
//                   ))}
//                   {!loading && list?.length === 0 && (
//                     <tr>
//                       <td style={td} colSpan={4}>
//                         No requests yet.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </section>
//           </>
//         )}
//       </main>
//     </>
//   );
// }







// src/pages/Leave.jsx
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../services/axiosInstance";

const th = { textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 };
const td = { borderBottom: "1px solid #eee", padding: 8 };

function normStatus(s) {
  return String(s || "").trim();
}
function daysBetween(f, t) {
  if (!f || !t) return "-";
  const from = new Date(f);
  const to = new Date(t);
  const ms = to.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0);
  if (isNaN(ms)) return "-";
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
}

// Validate YYYY-MM-DD and ensure not in the past
function makeValidators(todayStr) {
  const isValidYMD = (s) => {
    if (!s) return false;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return false;
    const y = +m[1], mo = +m[2], d = +m[3];
    if (mo < 1 || mo > 12) return false;
    if (d < 1 || d > 31) return false;
    const dt = new Date(`${s}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return false;
    const iso = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()))
      .toISOString()
      .slice(0, 10);
    return iso === s;
  };

  const isTodayOrFuture = (s) => {
    if (!s) return false;
    return s >= todayStr;
  };

  return { isValidYMD, isTodayOrFuture };
}

export default function Leave() {
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase();
  const isBoss = role === "boss";

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState(null);

  // toggle processed view
  const [showProcessed, setShowProcessed] = useState(false);

  // form state (for non-boss self-request)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Local "today" in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const tzAdjusted = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return tzAdjusted.toISOString().split("T")[0];
  }, []);
  const { isValidYMD, isTodayOrFuture } = useMemo(
    () => makeValidators(todayStr),
    [todayStr]
  );

  async function load(statusFilter) {
    setLoading(true);
    try {
      if (isBoss) {
        const res = await api.get("/admin/leave-requests", {
          params: statusFilter ? { status: statusFilter } : {},
        });
        setList(Array.isArray(res.data) ? res.data : []);
      } else {
        const res = await api.get("/leave-requests");
        setList(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isBoss) {
      load("Pending"); // default boss view
    } else {
      load();
    }
  }, [role]);

  function validateForm() {
    if (!fromDate || !toDate || !reason.trim()) {
      return "All fields are required";
    }
    if (!isValidYMD(fromDate))
      return "From date must be YYYY-MM-DD with year=4 digits, month 1–12, day 1–31.";
    if (!isValidYMD(toDate))
      return "To date must be YYYY-MM-DD with year=4 digits, month 1–12, day 1–31.";
    if (!isTodayOrFuture(fromDate)) return "From date cannot be in the past.";
    if (!isTodayOrFuture(toDate)) return "To date cannot be in the past.";
    if (toDate < fromDate) return "To date cannot be earlier than From date.";
    return "";
  }

  async function submitLeave(e) {
    e.preventDefault();
    setErr("");
    const msg = validateForm();
    if (msg) return setErr(msg);

    try {
      setSaving(true);
      await api.post("/leave-request", { fromDate, toDate, reason });
      setFromDate("");
      setToDate("");
      setReason("");
      await load();
      alert("Leave request submitted");
    } catch (e) {
      setErr(e?.response?.data?.message || "Submit failed");
    } finally {
      setSaving(false);
    }
  }

  // Boss actions
  async function bossUpdateStatus(leaveRequestId, status) {
    setActingId(leaveRequestId);
    try {
      await api.put("/admin/leave-request", { leaveRequestId, status });
      await load("Pending"); // refresh
    } catch (e) {
      alert(e?.response?.data?.message || "Action failed");
    } finally {
      setActingId(null);
    }
  }

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: 16 }}>
        {/* ───────── Boss role ───────── */}
        {isBoss && (
          <section className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ marginBottom: 12, marginTop: 0 }}>
                {showProcessed ? "Processed Leave Requests" : "Pending Leave Requests"}
              </h2>
              <button
                className="btn btn-outline"
                style={{ marginLeft: "auto" }}
                onClick={() => {
                  if (showProcessed) {
                    load("Pending");
                    setShowProcessed(false);
                  } else {
                    load(); // fetch all
                    setShowProcessed(true);
                  }
                }}
              >
                {showProcessed ? "Show Pending" : "Show Processed"}
              </button>
            </div>

            {loading && <div>Loading…</div>}
            <table className="table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={th}>Emp ID</th>
                  <th style={th}>Name</th>
                  <th style={th}>From</th>
                  <th style={th}>To</th>
                  <th style={th}>Days</th>
                  <th style={th}>Reason</th>
                  <th style={th}>Status</th>
                  {!showProcessed && <th style={th}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {(list || []).map((lr) => {
                  const status = normStatus(lr.status || "Pending");
                  return (
                    <tr key={lr._id}>
                      <td style={td}>{lr.employeeId?.empId}</td>
                      <td style={td}>{lr.employeeId?.name}</td>
                      <td style={td}>
                        {lr.fromDate ? new Date(lr.fromDate).toLocaleDateString() : "-"}
                      </td>
                      <td style={td}>
                        {lr.toDate ? new Date(lr.toDate).toLocaleDateString() : "-"}
                      </td>
                      <td style={td}>{daysBetween(lr.fromDate, lr.toDate)}</td>
                      <td style={td}>{lr.reason}</td>
                      <td style={td}>{status}</td>
                      {!showProcessed && (
                        <td style={td}>
                          {status.toLowerCase() === "pending" ? (
                            <>
                              <button
                                className="btn"
                                disabled={actingId === lr._id}
                                onClick={() => bossUpdateStatus(lr._id, "Approved")}
                              >
                                {actingId === lr._id ? "Approving…" : "Approve"}
                              </button>{" "}
                              <button
                                className="btn btn-danger"
                                disabled={actingId === lr._id}
                                onClick={() => bossUpdateStatus(lr._id, "Rejected")}
                              >
                                {actingId === lr._id ? "Rejecting…" : "Reject"}
                              </button>
                            </>
                          ) : (
                            <em style={{ opacity: 0.7 }}>No actions</em>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {!loading && list?.length === 0 && (
                  <tr>
                    <td style={td} colSpan={showProcessed ? 7 : 8}>
                      {showProcessed ? "No processed requests." : "No pending requests."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* ───────── Employee / HR / Manager role ───────── */}
        {!isBoss && (
          <>
            <section className="card" style={{ padding: 16, marginBottom: 12 }}>
              <h2 style={{ marginBottom: 8 }}>Request Leave</h2>
              <form onSubmit={submitLeave} className="row" style={{ gap: 8, alignItems: "end" }}>
                <label>
                  From
                  <br />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    min={todayStr}
                    required
                    style={{ backgroundColor: "white", color: "black" }}
                  />
                </label>
                <label>
                  To
                  <br />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    min={todayStr}
                    required
                    style={{ backgroundColor: "white", color: "black" }}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  Reason
                  <br />
                  <input
                    value={reason}
                    onChange={(e) => {
                      const val = e.target.value;
                      const clean = val.replace(/[^a-zA-Z0-9 .,!?-]/g, "");
                      setReason(clean.slice(0, 200));
                    }}
                    placeholder="Reason"
                    maxLength={200}
                    required
                    style={{ backgroundColor: "white", color: "black" }}
                  />
                </label>
                <button className="btn" disabled={saving}>
                  {saving ? "Submitting…" : "Submit"}
                </button>
              </form>
              {err && <div className="error" style={{ marginTop: 8 }}>{err}</div>}
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                Note: Dates must be in <code>YYYY-MM-DD</code> format with a 4-digit year, month 1–12,
                day 1–31, and cannot be in the past.
              </div>
            </section>

            <section className="card" style={{ padding: 16 }}>
              <h2 style={{ marginBottom: 12 }}>Your Leave Requests (Status)</h2>
              {loading && <div>Loading…</div>}
              <table className="table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={th}>From</th>
                    <th style={th}>To</th>
                    <th style={th}>Reason</th>
                    <th style={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(list || []).map((lr) => (
                    <tr key={lr._id}>
                      <td style={td}>
                        {lr.fromDate ? new Date(lr.fromDate).toLocaleDateString() : "-"}
                      </td>
                      <td style={td}>
                        {lr.toDate ? new Date(lr.toDate).toLocaleDateString() : "-"}
                      </td>
                      <td style={td}>{lr.reason}</td>
                      <td style={td}>{lr.status || "Pending"}</td>
                    </tr>
                  ))}
                  {!loading && list?.length === 0 && (
                    <tr>
                      <td style={td} colSpan={4}>
                        No requests yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </>
  );
}