
// import React, { useEffect, useMemo, useState } from "react";
// import Navbar from "../components/Navbar";                 // ✅ fixed
// import api from "../services/axiosInstance";              // ✅ fixed
// import { useAuth } from "../context/AuthContext";         // ✅ fixed
// import WebcamCapture from "../components/WebcamCapture";  // ✅ fixed
// import { msToHMS } from "../utils/time";                  // ✅ fixed

// function rangeFromFilter(filter) {
//   const now = new Date();
//   let from;
//   if (filter === "daily") {
//     from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//   } else if (filter === "weekly") {
//     const day = now.getDay();
//     const diff = day === 0 ? 6 : day - 1;
//     from = new Date(now);
//     from.setDate(now.getDate() - diff);
//   } else if (filter === "monthly") {
//     from = new Date(now.getFullYear(), now.getMonth(), 1);
//   } else if (filter === "yearly") {
//     from = new Date(now.getFullYear(), 0, 1);
//   } else {
//     from = new Date(0);
//   }
//   return { from: from.toISOString(), to: now.toISOString() };
// }

// export default function Attendance() {
//   const { user } = useAuth();
//   const isBoss = user?.role === "boss";

//   // Boss view
//   const [bossFilter, setBossFilter] = useState("daily");
//   const [bossEmpId, setBossEmpId] = useState("");
//   const [allRows, setAllRows] = useState([]);

//   // Non-boss view
//   const [action, setAction] = useState("checkin");
//   const [captured, setCaptured] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [mineRows, setMineRows] = useState([]);

//   useEffect(() => {
//     if (!isBoss) return;
//     const load = async () => {
//       const { from, to } = rangeFromFilter(bossFilter);
//       const params = { from, to };
//       if (bossEmpId) params.empId = bossEmpId;
//       const res = await api.get("/admin/attendance", { params });
//       setAllRows(res.data || []);
//     };
//     load();
//   }, [isBoss, bossFilter, bossEmpId]);

//   const totalMsAll = useMemo(
//     () =>
//       (allRows || []).reduce((acc, r) => {
//         if (r.checkInTime && r.checkOutTime) {
//           acc += Math.max(0, new Date(r.checkOutTime) - new Date(r.checkInTime));
//         }
//         return acc;
//       }, 0),
//     [allRows]
//   );

//   useEffect(() => {
//     if (isBoss) return;
//     const loadMine = async () => {
//       const now = new Date();
//       const from = new Date(now);
//       from.setDate(now.getDate() - 7);
//       const res = await api.get(`/employee/${user.empId}/attendance`, {
//         params: { from: from.toISOString(), to: now.toISOString() },
//       });
//       setMineRows(res.data || []);
//     };
//     loadMine();
//   }, [isBoss, user?.empId]);

//   async function submitPhoto(base64) {
//     try {
//       setLoading(true);
//       const blob = await (await fetch(base64)).blob();
//       const fd = new FormData();
//       fd.append("photo", blob, "capture.jpg");
//       const url = `/employee/${user.empId}/${action === "checkin" ? "checkin" : "checkout"}`;
//       const res = await api.post(url, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       alert(res.data?.message || "Success");
//     } catch (err) {
//       alert(err?.response?.data?.message || "Failed");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <>
//       <Navbar />
//       <main className="container">
//         {isBoss ? (
//           <section className="card">
//             <div className="row between">
//               <h2>All Employees — Attendance (Boss)</h2>
//               <div className="row">
//                 <input
//                   placeholder="Filter by Emp ID"
//                   value={bossEmpId}
//                   onChange={(e) => setBossEmpId(e.target.value)}
//                 />
//                 <select value={bossFilter} onChange={(e) => setBossFilter(e.target.value)}>
//                   <option value="daily">Daily</option>
//                   <option value="weekly">Weekly</option>
//                   <option value="monthly">Monthly</option>
//                   <option value="yearly">Yearly</option>
//                   <option value="all">All</option>
//                 </select>
//               </div>
//             </div>

//             <table className="table" style={{ marginTop: 12 }}>
//               <thead>
//                 <tr>
//                   <th>#</th>
//                   <th>Emp ID</th>
//                   <th>Name</th>
//                   <th>Role</th>
//                   <th>Check-In</th>
//                   <th>Check-Out</th>
//                   <th>Worked</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {allRows.map((r, i) => {
//                   const worked =
//                     r.checkInTime && r.checkOutTime
//                       ? msToHMS(new Date(r.checkOutTime) - new Date(r.checkInTime))
//                       : "-";
//                   return (
//                     <tr key={r._id || i}>
//                       <td>{i + 1}</td>
//                       <td>{r.employee?.empId}</td>
//                       <td>{r.employee?.name}</td>
//                       <td>{r.employee?.role}</td>
//                       <td>{r.checkInTime ? new Date(r.checkInTime).toLocaleString() : "-"}</td>
//                       <td>{r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : "-"}</td>
//                       <td>{worked}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>

//             <div className="total" style={{ marginTop: 8 }}>
//               Total Worked (filtered): <strong>{msToHMS(totalMsAll)}</strong>
//             </div>
//           </section>
//         ) : (
//           <>
//             <section className="card">
//               <h2>Check In / Check Out</h2>
//               <div className="row">
//                 <select value={action} onChange={(e) => setAction(e.target.value)}>
//                   <option value="checkin">Check In</option>
//                   <option value="checkout">Check Out</option>
//                 </select>
//                 <WebcamCapture onCapture={(b64) => setCaptured(b64)} />
//                 <button
//                   className="btn"
//                   disabled={!captured || loading}
//                   onClick={() => submitPhoto(captured)}
//                 >
//                   {loading ? "Processing…" : `Submit ${action}`}
//                 </button>
//               </div>
//               <p style={{ opacity: 0.8, marginTop: 8 }}>
//                 Face verification (DS) is applied on both check-in and check-out.
//               </p>
//             </section>

//             <section className="card">
//               <h3>My Recent Attendance</h3>
//               <table className="table">
//                 <thead>
//                   <tr>
//                     <th>#</th>
//                     <th>Check-In</th>
//                     <th>Check-Out</th>
//                     <th>Worked</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {mineRows.map((r, i) => {
//                     const worked =
//                       r.checkInTime && r.checkOutTime
//                         ? msToHMS(new Date(r.checkOutTime) - new Date(r.checkInTime))
//                         : "-";
//                     return (
//                       <tr key={r._id || i}>
//                         <td>{i + 1}</td>
//                         <td>{r.checkInTime ? new Date(r.checkInTime).toLocaleString() : "-"}</td>
//                         <td>{r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : "-"}</td>
//                         <td>{worked}</td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </section>
//           </>
//         )}
//       </main>
//     </>
//   );
// }


import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/axiosInstance";
import { useAuth } from "../context/AuthContext";
import WebcamCapture from "../components/WebcamCapture";
import { msToHMS } from "../utils/time";

function rangeFromFilter(filter) {
  const now = new Date();
  let from;
  if (filter === "daily") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (filter === "weekly") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    from = new Date(now);
    from.setDate(now.getDate() - diff);
  } else if (filter === "monthly") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (filter === "yearly") {
    from = new Date(now.getFullYear(), 0, 1);
  } else {
    from = new Date(0);
  }
  return { from: from.toISOString(), to: now.toISOString() };
}

export default function Attendance() {
  const { user } = useAuth();
  const isBoss = user?.role === "boss";

  const [bossFilter, setBossFilter] = useState("daily");
  const [bossEmpId, setBossEmpId] = useState("");
  const [allRows, setAllRows] = useState([]);

  const [action, setAction] = useState("checkin");
  const [captured, setCaptured] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mineRows, setMineRows] = useState([]);

  useEffect(() => {
    if (!isBoss) return;
    const load = async () => {
      const { from, to } = rangeFromFilter(bossFilter);
      const params = { from, to };
      if (bossEmpId) params.empId = bossEmpId;
      const res = await api.get("/admin/attendance", { params });
      setAllRows(res.data || []);
    };
    load();
  }, [isBoss, bossFilter, bossEmpId]);

  const totalMsAll = useMemo(
    () =>
      (allRows || []).reduce((acc, r) => {
        if (r.checkInTime && r.checkOutTime) {
          acc += Math.max(0, new Date(r.checkOutTime) - new Date(r.checkInTime));
        }
        return acc;
      }, 0),
    [allRows]
  );

  useEffect(() => {
    if (isBoss) return;
    const loadMine = async () => {
      const now = new Date();
      const from = new Date(now);
      from.setDate(now.getDate() - 7);
      const res = await api.get(`/employee/${user.empId}/attendance`, {
        params: { from: from.toISOString(), to: now.toISOString() },
      });
      setMineRows(res.data || []);
    };
    loadMine();
  }, [isBoss, user?.empId]);

  async function submitPhoto(base64) {
    try {
      setLoading(true);
      const blob = await (await fetch(base64)).blob();
      const fd = new FormData();
      fd.append("photo", blob, "capture.jpg");
      const url = `/employee/${user.empId}/${action === "checkin" ? "checkin" : "checkout"}`;
      const res = await api.post(url, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(res.data?.message || "Success");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: "1100px", margin: "30px auto", padding: "0 16px", fontFamily: "Arial, sans-serif", color: "#333" }}>
        {isBoss ? (
          <section style={{ background: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginBottom: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#2c3e50" }}>📊 All Employees — Attendance</h2>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  placeholder="Filter by Emp ID"
                  value={bossEmpId}
                  onChange={(e) => setBossEmpId(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px" }}
                />
                <select
                  value={bossFilter}
                  onChange={(e) => setBossFilter(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px" }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#f0f4f8" }}>
                  {["#", "Emp ID", "Name", "Role", "Check-In", "Check-Out", "Worked"].map((h, idx) => (
                    <th key={idx} style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allRows.map((r, i) => {
                  const worked =
                    r.checkInTime && r.checkOutTime
                      ? msToHMS(new Date(r.checkOutTime) - new Date(r.checkInTime))
                      : "-";
                  return (
                    <tr key={r._id || i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>{i + 1}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>{r.employee?.empId}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{r.employee?.name}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>{r.employee?.role}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{r.checkInTime ? new Date(r.checkInTime).toLocaleString() : "-"}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : "-"}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center", fontWeight: "bold" }}>{worked}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: "12px", fontSize: "15px" }}>
              <strong>Total Worked:</strong> <span style={{ color: "#2e7d32" }}>{msToHMS(totalMsAll)}</span>
            </div>
          </section>
        ) : (
          <>
            <section style={{ background: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginBottom: "30px", textAlign: "center" }}>
              <h2 style={{ fontSize: "18px", marginBottom: "15px", color: "#2c3e50" }}>🕒 Check In / Check Out</h2>
              
              {/* Camera Section */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", marginTop: "12px" }}>
                <WebcamCapture onCapture={(b64) => setCaptured(b64)} style={{ width: "500px", height: "350px", borderRadius: "12px", border: "3px solid #2e7d32" }} />
                
                {/* Action + Button Row */}
                <div style={{ display: "grid", gridTemplateColumns: "150px auto", gap: "20px", alignItems: "center", marginTop: "10px" }}>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px", textAlign: "center" }}
                  >
                    <option value="checkin">Check In</option>
                    <option value="checkout">Check Out</option>
                  </select>
                  <button
                    disabled={!captured || loading}
                    onClick={() => submitPhoto(captured)}
                    style={{
                      padding: "12px 24px",
                      border: "none",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg,#43a047,#2e7d32)",
                      color: "#fff",
                      cursor: captured && !loading ? "pointer" : "not-allowed",
                      fontSize: "16px",
                      fontWeight: "bold",
                      opacity: !captured || loading ? 0.6 : 1,
                      transform: "scale(1)",
                      transition: "all 0.3s ease",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    {loading ? "Processing…" : `🚀 Submit ${action}`}
                  </button>
                </div>
              </div>

              {/* <p style={{ opacity: 0.7, marginTop: "15px", fontSize: "13px" }}>
                ✅ Face verification is applied on both check-in and check-out.
              </p> */}
            </section>

            {/* Recent Attendance Table */}
            <section style={{ background: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginBottom: "30px" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "10px", color: "#2c3e50" }}>📅 My Recent Attendance</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#f0f4f8" }}>
                    {["#", "Check-In", "Check-Out", "Worked"].map((h, idx) => (
                      <th key={idx} style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mineRows.map((r, i) => {
                    const worked =
                      r.checkInTime && r.checkOutTime
                        ? msToHMS(new Date(r.checkOutTime) - new Date(r.checkInTime))
                        : "-";
                    return (
                      <tr key={r._id || i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>{i + 1}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{r.checkInTime ? new Date(r.checkInTime).toLocaleString() : "-"}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : "-"}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center", fontWeight: "bold" }}>{worked}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </>
  );
}