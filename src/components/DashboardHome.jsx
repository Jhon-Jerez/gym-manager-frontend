import { useState, useEffect } from "react";

export default function DashboardHome() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const gymId = 1;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("access");
        
        // Verificar si existe el token
        if (!token) {
          throw new Error("No hay token de autenticación. Por favor, inicia sesión.");
        }

        console.log("Token enviado:", token);

        const response = await fetch(
          `http://127.0.0.1:8000/api/gym/estadisticas/${gymId}/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          // Token inválido o expirado
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.");
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Error al obtener estadísticas");
        }

        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error("Error completo:", err);
        setError(err.message);
      }
    };

    fetchStats();
  }, [gymId]);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      alert(`Buscando usuario con cédula o huella: ${search}`);
    }, 1500);
  };

  return (
    <div className="space-y-10">
      {/* Barra de búsqueda */}
      <section className="bg-white shadow rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Buscar Usuario</h2>
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ingrese cédula o huella dactilar"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>
      </section>

      {/* Tarjetas de estadísticas */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Estadísticas Generales</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {!stats && !error ? (
          <p className="text-gray-500 text-center">Cargando estadísticas...</p>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Usuarios Totales" value={stats.total_clientes} color="bg-blue-500" />
            <StatCard title="Usuarios Activos" value={stats.clientes_activos} color="bg-green-500" />
            <StatCard title="Usuarios Presentes" value={stats.clientes_presentes} color="bg-yellow-500" />
            <StatCard
              title="Usuarios Inactivos"
              value={stats.total_clientes - stats.clientes_activos}
              color="bg-red-500"
            />
          </div>
        ) : null}
      </section>

      {/* Espacio para futuras gráficas */}
      <section className="bg-white shadow rounded-xl p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-700">Gráficas próximamente</h2>
        <p className="text-gray-500 mt-2">
          Aquí se mostrarán estadísticas visuales cuando se conecte el backend completamente.
        </p>
      </section>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`rounded-xl shadow-lg p-6 text-white ${color}`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}