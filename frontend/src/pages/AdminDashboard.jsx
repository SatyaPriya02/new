
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase();
  const canEditRole = role === "boss";

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // empId when editing
  const [form, setForm] = useState({
    empId: "",
    name: "",
    email: "",
    mobile: "",
    role: "employee",
    photo: null,
  });

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/employees");
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const hrManagers = employees.filter((e) =>
    ["hr", "manager"].includes((e.role || "").toLowerCase())
  );
  const onlyEmployees = employees.filter(
    (e) => (e.role || "").toLowerCase() === "employee"
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ empId: "", name: "", email: "", mobile: "", role: "employee", photo: null });
    setShowForm(true);
  };

  const openEdit = (emp) => {
    setEditing(emp.empId);
    setForm({
      empId: emp.empId,
      name: emp.name || "",
      email: emp.email || "",
      mobile: emp.mobile || "",
      role: emp.role || "employee",
      photo: null,
    });
    setShowForm(true);
  };

  const handleFile = (e) =>
    setForm((f) => ({ ...f, photo: e.target.files?.[0] || null }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      if (!editing) fd.append("empId", form.empId);
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("mobile", form.mobile);
      fd.append("role", canEditRole ? form.role : "employee");
      if (form.photo) fd.append("photo", form.photo);

      if (editing) {
        // Let Axios set multipart boundary automatically (no manual headers)
        await api.put(`/admin/employees/${editing}`, fd);
      } else {
        await api.post(`/admin/employees`, fd);
      }
      setShowForm(false);
      await fetchEmployees();
    } catch (e) {
      setError(e?.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (empId) => {
    if (!window.confirm("Delete employee?")) return;
    try {
      await api.delete(`/admin/employees/${empId}`);
      await fetchEmployees();
    } catch (e) {
      setError(e?.response?.data?.message || "Delete failed");
    }
  };

  const DisabledHint = ({ children, disabled }) => (
    <span title={disabled ? "Only Boss can modify HR/Manager" : ""}>
      {children}
    </span>
  );

  const Table = ({ title, data }) => (
    <section className="card">
      <div className="row between">
        <h2>{title}</h2>
        <button className="btn" onClick={openAdd}>Add</button>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((e, i) => {
            const rowRole = (e.role || "").toLowerCase();
            const restrict = (rowRole !== "employee") && !canEditRole; // HR/Manager editing HR/Manager is forbidden
            return (
              <tr key={e._id || e.empId || i}>
                <td>{i + 1}</td>
                <td>{e.empId}</td>
                <td>{e.name}</td>
                <td>{e.email}</td>
                <td>{e.mobile || "-"}</td>
                <td>{e.role}</td>
                <td className="actions">
                  <DisabledHint disabled={restrict}>
                    <button className="btn" onClick={() => !restrict && openEdit(e)} disabled={restrict}>
                      Edit
                    </button>
                  </DisabledHint>
                  <DisabledHint disabled={restrict}>
                    <button className="btn btn-danger" onClick={() => !restrict && remove(e.empId)} disabled={restrict}>
                      Delete
                    </button>
                  </DisabledHint>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );

  return (
    <>
      <Navbar />
      <main className="container">
        <Table title="HR & Managers" data={hrManagers} />
        <Table title="Employees" data={onlyEmployees} />

        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{editing ? "Edit Employee" : "Add Employee"}</h3>
              <form onSubmit={handleSubmit}>
                {!editing && (
                  <label>
                    Employee ID
                    <input
                      value={form.empId}
                      onChange={(e) => setForm({ ...form, empId: e.target.value })}
                      required
                    />
                  </label>
                )}

                <label>
                  Name
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Mobile
                  <input
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  />
                </label>

                {canEditRole ? (
                  <label>
                    Role
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      <option value="employee">Employee</option>
                      <option value="hr">HR</option>
                      <option value="manager">Manager</option>
                      <option value="boss">Boss</option>
                    </select>
                  </label>
                ) : (
                  <input type="hidden" value="employee" />
                )}

                <label>
                  {editing ? "Replace Photo (optional)" : "Photo (optional)"}
                  <input type="file" accept="image/*" onChange={handleFile} />
                </label>

                {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}

                <div className="actions">
                  <button className="btn" type="submit" disabled={loading}>
                    {loading ? "Saving…" : "Save"}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

