import { useEffect, useState } from "react";
import { Plus, Edit2, Power, Trash2 } from "lucide-react";

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'; // <-- ¡AÑADE ESTO!

  // NUEVO: búsqueda
  const [search, setSearch] = useState("");

  // NUEVO: paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [editingUser, setEditingUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const token = localStorage.getItem("access");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/gyms/members/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        throw new Error("Error al obtener clientes");
      }
      const data = await res.json();
      setUsers([...data].sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at)));
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(u) {
    const updated = { is_active: !u.is_active };
    try {
      const res = await fetch(`${API_BASE_URL}/api/gyms/members/${u.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("No se pudo actualizar");
      const newUser = await res.json();
      setUsers((prev) => prev.map((p) => (p.id === newUser.id ? newUser : p)));
    } catch (err) {
      console.error(err);
      alert("Error al cambiar estado");
    }
  }

  async function deleteUser(userId) {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/gyms/members/${userId}/`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error(err);
      alert("Error al eliminar cliente");
    }
  }

  function openEdit(u) {
    setEditingUser(u);
  }

  async function saveEdit(values) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/gyms/members/${values.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Error al guardar");
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      alert("Error al guardar cambios");
    }
  }

  async function createUser(values) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/gyms/members/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(JSON.stringify(errorData));
      }
      const newUser = await res.json();
      setUsers((prev) =>
        [...prev, newUser].sort(
          (a, b) => new Date(b.joined_at) - new Date(a.joined_at)
        )
      );
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      alert("Error al crear cliente: " + err.message);
    }
  }

  // ===========================
  // FILTRO DE BÚSQUEDA EN TIEMPO REAL
  // ===========================
  const filteredUsers = users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.cedula || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  // ===========================
  // PAGINACIÓN
  // ===========================
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(start, start + itemsPerPage);

  function changePage(p) {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold">Gestión de Clientes</h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* NUEVO: INPUT DE BÚSQUEDA */}
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-60 px-3 py-1 border rounded"
          />

          <div className="flex gap-2">
            <button
              onClick={fetchUsers}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Recargar
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus size={18} />
              Nuevo Cliente
            </button>
          </div>
        </div>
      </div>

      {loading && <p>Cargando clientes...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* === SIN CLIENTES === */}
      {!loading && users.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No hay clientes registrados</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Registrar Primer Cliente
          </button>
        </div>
      )}

      {/* === TABLA === */}
      {!loading && users.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3">Nombre Completo</th>
                  <th className="p-3">Cédula</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Teléfono</th>
                  <th className="p-3">Membresía</th>
                  <th className="p-3">Fecha Registro</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{u.full_name || "—"}</td>
                    <td className="p-3">{u.cedula || "—"}</td>
                    <td className="p-3">{u.email || "—"}</td>
                    <td className="p-3">{u.phone || "—"}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {u.membership_type || "Sin membresía"}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.joined_at
                        ? new Date(u.joined_at).toLocaleDateString("es-ES")
                        : "—"}
                    </td>
                    <td
                      className={`p-3 font-semibold ${
                        u.is_active ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {u.is_active ? "Activo" : "Inactivo"}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => toggleActive(u)}
                          className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          title={u.is_active ? "Desactivar" : "Activar"}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ====================== PAGINACIÓN ====================== */}
          <div className="flex justify-center mt-4 gap-2 flex-wrap">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => changePage(p)}
                className={`px-3 py-1 border rounded ${
                  currentPage === p ? "bg-blue-600 text-white" : ""
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={saveEdit}
        />
      )}

      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} onSave={createUser} />
      )}
    </div>
  );
}

/* ============================================================
   =============   MODALES (NO LOS CAMBIÉ)  ===================
   ============================================================ */

function EditUserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    id: user.id,
    full_name: user.full_name || "",
    cedula: user.cedula || "",
    email: user.email || "",
    phone: user.phone || "",
    membership_type: user.membership_type || "Sin membresía",
    is_active: typeof user.is_active === "boolean" ? user.is_active : true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm({
      id: user.id,
      full_name: user.full_name || "",
      cedula: user.cedula || "",
      email: user.email || "",
      phone: user.phone || "",
      membership_type: user.membership_type || "Sin membresía",
      is_active: typeof user.is_active === "boolean" ? user.is_active : true,
    });
    setErrors({});
  }, [user]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validateForm() {
    const newErrors = {};
    if (!form.full_name.trim()) newErrors.full_name = "El nombre completo es obligatorio";
    if (!form.cedula.trim()) newErrors.cedula = "La cédula es obligatoria";
    if (!form.email.trim()) newErrors.email = "El email es obligatorio";
    if (!form.phone.trim()) newErrors.phone = "El teléfono es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validateForm()) return;
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Editar Cliente</h3>

        <div className="space-y-4">
          {/* CONTENIDO DEL MODAL (SIN CAMBIOS) */}
          <div>
            <label className="block text-sm mb-1">Nombre Completo</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className={`w-full border p-2 rounded ${errors.full_name ? "border-red-500" : ""}`}
              placeholder="Juan Pérez"
            />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1">
              Cédula <span className="text-red-500">*</span>
            </label>
            <input
              name="cedula"
              value={form.cedula}
              onChange={handleChange}
              className={`w-full border p-2 rounded ${errors.cedula ? "border-red-500" : ""}`}
              placeholder="1234567890"
            />
            {errors.cedula && <p className="text-red-500 text-xs mt-1">{errors.cedula}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full border p-2 rounded ${errors.email ? "border-red-500" : ""}`}
                placeholder="juan@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm mb-1">Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={`w-full border p-2 rounded ${errors.phone ? "border-red-500" : ""}`}
                placeholder="3001234567"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Tipo de Membresía</label>
            <select
              name="membership_type"
              value={form.membership_type}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="Sin membresía">Sin membresía</option>
              <option value="Mensual">Mensual</option>
              <option value="Quincena">Quincena</option>
              <option value="Semana">Semana</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active_edit"
              type="checkbox"
              name="is_active"
              checked={!!form.is_active}
              onChange={handleChange}
            />
            <label htmlFor="is_active_edit" className="text-sm">Cuenta activa</label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
              Cancelar
            </button>
            <button onClick={handleSubmit} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddUserModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    full_name: "",
    cedula: "",
    email: "",
    phone: "",
    membership_type: "Sin membresía",
    is_active: true,
  });

  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validateForm() {
    const newErrors = {};
    if (!form.full_name.trim()) newErrors.full_name = "El nombre completo es obligatorio";
    if (!form.cedula.trim()) newErrors.cedula = "La cédula es obligatoria";
    if (!form.email.trim()) newErrors.email = "El email es obligatorio";
    if (!form.phone.trim()) newErrors.phone = "El teléfono es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validateForm()) return;
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Registrar Nuevo Cliente</h3>

        <div className="space-y-4">
          {/* SIN CAMBIOS */}
          <div>
            <label className="block text-sm mb-1">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className={`w-full border p-2 rounded ${errors.full_name ? "border-red-500" : ""}`}
              placeholder="Juan Pérez García"
            />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1">
              Cédula <span className="text-red-500">*</span>
            </label>
            <input
              name="cedula"
              value={form.cedula}
              onChange={handleChange}
              className={`w-full border p-2 rounded ${errors.cedula ? "border-red-500" : ""}`}
              placeholder="1234567890"
            />
            {errors.cedula && <p className="text-red-500 text-xs mt-1">{errors.cedula}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full border p-2 rounded ${errors.email ? "border-red-500" : ""}`}
                placeholder="juan@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm mb-1">Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={`w-full border p-2 rounded ${errors.phone ? "border-red-500" : ""}`}
                placeholder="3001234567"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Tipo de Membresía</label>
            <select
              name="membership_type"
              value={form.membership_type}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="Sin membresía">Sin membresía</option>
              <option value="Mensual">Mensual</option>
              <option value="Trimestral">Trimestral</option>
              <option value="Semestral">Semestral</option>
              <option value="Anual">Anual</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active_new"
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            <label htmlFor="is_active_new" className="text-sm">
              Cuenta activa
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
              Cancelar
            </button>
            <button onClick={handleSubmit} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
              Registrar Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
