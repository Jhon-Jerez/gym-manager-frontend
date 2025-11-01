import { useEffect, useState } from "react";

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null); // usuario para editar
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/core/users/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        throw new Error("Error al obtener usuarios");
      }
      const data = await res.json();
      setUsers(data); // asume que API devuelve array
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(u) {
    // ejemplo: PATCH /api/core/users/:id/ -> { is_active: !u.is_active }
    const updated = { is_active: !u.is_active };
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/core/users/${u.id}/`, {
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

  function openEdit(u) {
    setEditingUser(u);
  }

  async function saveEdit(values) {
    // values: { id, nombre, membresia, ... }
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/core/users/${values.id}/`, {
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

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <button onClick={fetchUsers} className="px-3 py-1 bg-blue-600 text-white rounded">Recargar</button>
      </div>

      {loading && <p>Cargando usuarios...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3">Nombre</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Membresía</th>
              <th className="p-3">Fecha inscripción</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{u.full_name || u.username || u.email}</td>
                <td className={`p-3 font-semibold ${u.is_active ? "text-green-600" : "text-red-600"}`}>
                  {u.is_active ? "Activo" : "Inactivo"}
                </td>
                <td className="p-3">{u.membership_type || "—"}</td>
                <td className="p-3">{u.joined_at ? new Date(u.joined_at).toLocaleDateString() : "—"}</td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(u)} className="px-3 py-1 bg-yellow-400 rounded text-sm">Editar</button>
                    <button onClick={() => toggleActive(u)} className="px-3 py-1 bg-gray-200 rounded text-sm">
                      {u.is_active ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {users.length === 0 && !loading && <tr><td className="p-3" colSpan="5">No hay usuarios</td></tr>}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={saveEdit} />
      )}
    </div>
  );
}

/* Modal simple para editar (puedes moverlo a su propio archivo) */
function EditUserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    id: user.id,
    full_name: user.full_name || "",
    membership_type: user.membership_type || "",
    is_active: user.is_active || false,
  });

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-4">Editar usuario</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm">Nombre completo</label>
            <input name="full_name" value={form.full_name} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Tipo de membresía</label>
            <input name="membership_type" value={form.membership_type} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <input id="is_active" type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
            <label htmlFor="is_active" className="text-sm">Cuenta activa</label>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">Cancelar</button>
            <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
