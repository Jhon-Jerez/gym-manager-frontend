import { useState } from "react";
import UsersPanel from "./UsersPanel"; 
import DashboardHome from "./DashboardHome";



export default function Dashboard({ onLogout, user }) {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">Bienvenido, {user}</span>
          <div className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center font-semibold">
            {user?.substring(0, 2).toUpperCase() || "HA"}
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition text-sm font-medium"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 text-white min-h-screen" style={{ backgroundColor: "rgb(28, 40, 60)" }}>
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveSection("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeSection === "overview" ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">🏠</span>
              <span>Principal</span>
            </button>

            <button
              onClick={() => setActiveSection("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeSection === "users" ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">👥</span>
              <span>Usuarios</span>
            </button>

            <button
              onClick={() => setActiveSection("trainers")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeSection === "trainers" ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">👤</span>
              <span>Entrenadores</span>
            </button>

            <button
              onClick={() => setActiveSection("classes")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeSection === "classes" ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">📅</span>
              <span>Clases</span>
            </button>

            <button
              onClick={() => setActiveSection("payments")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeSection === "payments" ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">💰</span>
              <span>Pagos</span>
            </button>

            <button
              onClick={() => setActiveSection("reports")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeSection === "reports" ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">📊</span>
              <span>Reportes</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeSection === "overview" && <DashboardHome />}
          {activeSection === "users" && <UsersPanel />}
          {activeSection === "trainers" && <Placeholder title="Entrenadores" />}
          {activeSection === "classes" && <Placeholder title="Clases" />}
          {activeSection === "payments" && <Placeholder title="Pagos" />}
          {activeSection === "reports" && <Placeholder title="Reportes" />}
        </main>
      </div>
    </div>
  );
}



function Placeholder({ title }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <p>Contenido de {title} (aquí puedes conectar la lógica más adelante).</p>
    </div>
  );
}
