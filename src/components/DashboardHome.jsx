import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function DashboardHome() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [gymId, setGymId] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
 


  // 1. Obtener gym_id desde el usuario autenticado
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) throw new Error("No hay token. Inicia sesión.");

        const response = await fetch("http://127.0.0.1:8000/api/core/me/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("No se pudo obtener el usuario.");
        }

        const user = await response.json();

        if (!user.gym_id) {
          throw new Error("El usuario no tiene un gym asignado.");
        }

        setGymId(user.gym_id);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!gymId) return;

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("access");

        const response = await fetch(
          `http://127.0.0.1:8000/api/gyms/estadisticas/${gymId}/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Error al obtener estadísticas");
        }

        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchStats();
  }, [gymId]);

  // BUSCAR POR CÉDULA
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access");
      if (!token) throw new Error("No hay token. Inicia sesión.");

      const response = await fetch(
        `http://127.0.0.1:8000/api/gyms/buscar-miembro/?cedula=${search}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Usuario no encontrado");
      }

      Swal.fire({
        title: "Usuario encontrado",
        html: `
          <p><strong>Nombre:</strong> ${data.full_name}</p>
          <p><strong>Cédula:</strong> ${data.cedula}</p>
          <p><strong>Días restantes:</strong> ${data.dias_restantes ?? "N/A"}</p>
          <p><strong>Fecha fin:</strong> ${data.membership_end ?? "N/A"}</p>
          <p><strong>Estado:</strong> ${data.is_active ? "Activo" : "Inactivo"}</p>

        `,
        icon: "success",
        confirmButtonText: "Aceptar"
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Búsqueda */}
      <section className="bg-white shadow rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Buscar Usuario</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-3">
            <strong>Error: </strong> {error}
          </div>
        )}

        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ingrese cédula o huella"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>
      </section>

      {/* Estadísticas */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Estadísticas Generales</h2>

        {!stats && !error ? (
          <p className="text-gray-500 text-center">Cargando estadísticas...</p>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Usuarios Totales" value={stats.total_clientes} color="bg-blue-500" />
            <StatCard title="Usuarios Activos" value={stats.clientes_activos} color="bg-green-500" />
            <StatCard title="Usuarios Presentes" value={stats.clientes_presentes} color="bg-orange-500" />
            <StatCard title="Usuarios Inactivos" value={stats.inactivos} color="bg-red-500" />
          </div>
        ) : null}
      </section>

      <section className="bg-white shadow rounded-xl p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-700">Gráficas próximamente</h2>
        <p className="text-gray-500 mt-2">Aquí se mostrarán estadísticas visuales.</p>
      </section>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`rounded-xl shadow-lg p-6 text-white ${color}`}>
      <h3 className="text-lg font-semibold text-center">{title}</h3>
      <p className="text-3xl font-bold mt-2 text-center">{value}</p>
    </div>
  );
}
