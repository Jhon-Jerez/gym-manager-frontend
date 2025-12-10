import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function Calendar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'; // <--- ¡AÑADE ESTO!

  // Refs para controlar el tooltip
  const calendarRef = useRef(null);
  const tooltipRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);
  const isTooltipVisibleRef = useRef(false);
  const currentTooltipContentRef = useRef("");
  const tooltipPositionRef = useRef({ x: 0, y: 0 });

  // Función para obtener la fecha en formato YYYY-MM-DD sin problemas de timezone
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para parsear fecha desde string sin problemas de timezone
  const parseDateWithoutTimezone = (dateStr) => {
    if (!dateStr) return null;
    
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Evento al hacer click en un día
  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setSelectedEvent(null);
    setEventTitle("");
    setEventDescription("");
    setIsModalOpen(true);
  };

  // Evento al hacer click en un evento existente
  const handleEventClick = async (info) => {
    info.jsEvent.preventDefault();
    const event = info.event;
    
    const eventDate = parseDateWithoutTimezone(event.startStr);
    const dateOnly = getLocalDateString(eventDate);
    
    setSelectedEvent({
      id: event.id,
      title: event.title,
      description: event.extendedProps?.description || "",
      start: event.startStr,
      date: dateOnly
    });
    
    setSelectedDate(dateOnly);
    setEventTitle(event.title);
    setEventDescription(event.extendedProps?.description || "");
    setIsModalOpen(true);
  };

  // SOLUCIÓN: Manejar tooltip con DOM directo para evitar re-renders de React
  const showTooltip = (content, x, y) => {
    // Limpiar timeout anterior
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }

    // Si ya está visible y es el mismo contenido, solo actualizar posición
    if (isTooltipVisibleRef.current && currentTooltipContentRef.current === content) {
      updateTooltipPosition(x, y);
      return;
    }

    // Esconder tooltip anterior si existe
    hideTooltip();

    // Crear o reutilizar tooltip
    let tooltipElement = tooltipRef.current;
    if (!tooltipElement) {
      tooltipElement = document.createElement('div');
      tooltipElement.className = 'calendar-tooltip fixed z-[99999] bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 max-w-xs pointer-events-none border border-gray-700';
      tooltipElement.style.opacity = '0';
      tooltipElement.style.transition = 'opacity 0.15s ease-in-out';
      document.body.appendChild(tooltipElement);
      tooltipRef.current = tooltipElement;
    }

    // Actualizar contenido y posición
    tooltipElement.innerHTML = `
      <div class="font-medium mb-1 text-white">Descripción:</div>
      <div class="text-gray-200 whitespace-pre-wrap">${content}</div>
      <div class="absolute bottom-0 left-3 w-3 h-3 bg-gray-900 transform rotate-45 translate-y-1/2 border-r border-b border-gray-700"></div>
    `;

    // Posicionar
    tooltipElement.style.left = `${x + 15}px`;
    tooltipElement.style.top = `${y + 15}px`;
    tooltipElement.style.transform = 'translate(0, -100%)';

    // Mostrar con delay suave
    setTimeout(() => {
      tooltipElement.style.opacity = '1';
    }, 10);

    // Guardar estado
    isTooltipVisibleRef.current = true;
    currentTooltipContentRef.current = content;
    tooltipPositionRef.current = { x: x + 15, y: y + 15 };
  };

  const updateTooltipPosition = (x, y) => {
    const tooltipElement = tooltipRef.current;
    if (tooltipElement) {
      const newX = x + 15;
      const newY = y + 15;
      
      // Solo actualizar si la posición cambió significativamente
      if (Math.abs(tooltipPositionRef.current.x - newX) > 5 || 
          Math.abs(tooltipPositionRef.current.y - newY) > 5) {
        tooltipElement.style.left = `${newX}px`;
        tooltipElement.style.top = `${newY}px`;
        tooltipPositionRef.current = { x: newX, y: newY };
      }
    }
  };

  const hideTooltip = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    const tooltipElement = tooltipRef.current;
    if (tooltipElement && isTooltipVisibleRef.current) {
      // Ocultar con transición
      tooltipElement.style.opacity = '0';
      
      // Remover después de la transición
      tooltipTimeoutRef.current = setTimeout(() => {
        if (tooltipElement && tooltipElement.parentNode) {
          tooltipElement.parentNode.removeChild(tooltipElement);
          tooltipRef.current = null;
        }
        isTooltipVisibleRef.current = false;
        currentTooltipContentRef.current = "";
      }, 150); // Match con la duración de la transición
    }
  };

  // Manejar mouse enter en evento - DEBOUNDED
  const handleEventMouseEnter = (info) => {
    const event = info.event;
    const description = event.extendedProps?.description;
    
    if (description && description.trim() !== "") {
      // Limpiar timeout de ocultar si existe
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }

      const x = info.jsEvent.clientX;
      const y = info.jsEvent.clientY;
      
      // Usar un pequeño delay para estabilizar
      tooltipTimeoutRef.current = setTimeout(() => {
        showTooltip(description, x, y);
      }, 100); // Delay corto para evitar parpadeo rápido
    }
  };

  // Manejar mouse leave - con delay para evitar parpadeo
  const handleEventMouseLeave = () => {
    // Limpiar timeout de mostrar si existe
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }

    // Ocultar con pequeño delay para evitar parpadeo al mover entre elementos
    tooltipTimeoutRef.current = setTimeout(() => {
      hideTooltip();
    }, 150);
  };

  // Manejar mouse move dentro del evento - para mover tooltip con cursor
  const handleEventMouseMove = (info) => {
    if (isTooltipVisibleRef.current) {
      const x = info.jsEvent.clientX;
      const y = info.jsEvent.clientY;
      updateTooltipPosition(x, y);
    }
  };

  // Obtener token de autenticación
  const getAuthToken = () => {
    return localStorage.getItem("access");
  };

  // Refetch eventos
  const refetchEvents = () => {
    if (calendarRef.current && calendarRef.current.getApi) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.refetchEvents();
    }
  };

  // Formatear fecha para el backend
  const formatDateForBackend = (dateStr) => {
    const date = parseDateWithoutTimezone(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00Z`;
  };

  // Formatear fecha desde el backend para FullCalendar
  const formatDateFromBackend = (dateStr) => {
    if (!dateStr) return null;
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Crear evento en el backend
  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) {
      alert("El título del evento es requerido");
      return;
    }

    const token = getAuthToken();
    const formattedStartDate = formatDateForBackend(selectedDate);

    try {
      const response = await fetch(`${API_BASE_URL}/api/calendario/events/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          start: formattedStartDate,
          end: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al crear evento");
      }

      closeModal();
      refetchEvents();
      
    } catch (error) {
      console.error("Error al crear evento:", error);
      alert("Error al crear el evento. Intenta nuevamente.");
    }
  };

  // Actualizar evento en el backend
  const handleUpdateEvent = async () => {
    if (!eventTitle.trim() || !selectedEvent) {
      alert("El título del evento es requerido");
      return;
    }

    const token = getAuthToken();
    const formattedStartDate = formatDateForBackend(selectedDate);

    try {
      const response = await fetch(`${API_BASE_URL}/api/calendario/events/`, {
      headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          start: formattedStartDate,
          end: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar evento");
      }

      closeModal();
      refetchEvents();
      
    } catch (error) {
      console.error("Error al actualizar evento:", error);
      alert("Error al actualizar el evento. Intenta nuevamente.");
    }
  };

  // Eliminar evento del backend
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    if (!window.confirm("¿Estás seguro de que deseas eliminar este evento?")) {
      return;
    }

    const token = getAuthToken();

    try {
      const response = await fetch(`${API_BASE_URL}/api/calendario/events/${selectedEvent.id}/`, { 
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar evento");
      }

      closeModal();
      refetchEvents();
      
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      alert("Error al eliminar el evento. Intenta nuevamente.");
    }
  };

  // Función para manejar guardar (crear o actualizar)
  const handleSaveEvent = () => {
    if (selectedEvent) {
      handleUpdateEvent();
    } else {
      handleCreateEvent();
    }
  };

  // Función para cerrar el modal y limpiar estados
  const closeModal = () => {
    setEventTitle("");
    setEventDescription("");
    setSelectedEvent(null);
    setIsModalOpen(false);
  };

  // Limpiar tooltip al desmontar
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      hideTooltip();
    };
  }, []);

  // Agregar estilos CSS para el tooltip
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .calendar-tooltip {
        max-width: 300px;
        word-wrap: break-word;
        pointer-events: none;
        user-select: none;
      }
      
      .calendar-tooltip * {
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Calendario de Actividades</h2>

      <div className="bg-white rounded-xl shadow-lg p-6 border">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="es"
          height="auto"
          timeZone="UTC"
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventMouseEnter={handleEventMouseEnter}
          eventMouseLeave={handleEventMouseLeave}
          eventMouseMove={handleEventMouseMove} // Para mover tooltip con cursor
          events={async (fetchInfo, successCallback, failureCallback) => {
            try {
              const token = getAuthToken();

              const res = await fetch(
                `${API_BASE_URL}/api/calendario/events/`,
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!res.ok) {
                throw new Error("Error al cargar eventos");
              }

              const data = await res.json();

              const formatted = data.map((ev) => {
                const startDate = formatDateFromBackend(ev.start);
                
                return {
                  id: ev.id,
                  title: ev.title,
                  start: startDate,
                  extendedProps: {
                    description: ev.description || ""
                  },
                  allDay: true,
                  backgroundColor: '#3b82f6',
                  borderColor: '#2563eb',
                  textColor: '#ffffff'
                };
              });

              successCallback(formatted);
            } catch (error) {
              console.error("Error cargando eventos:", error);
              failureCallback(error);
            }
          }}
          displayEventTime={false}
          allDayText="Todo el día"
          editable={false}
          droppable={false}
          // Mejorar interacción con eventos
          eventDisplay="block"
          eventInteractive={true}
          eventCursor="pointer"
        />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", zIndex: 9999 }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl p-6" 
            style={{ width: "380px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">
              {selectedEvent ? "✏️ Editar Evento" : "➕ Nuevo Evento"}
            </h3>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Fecha seleccionada:</p>
              <p className="text-lg font-semibold text-blue-700">
                {selectedDate} 
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título del evento *
                </label>
                <input
                  type="text"
                  placeholder="Ingresa el título del evento"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  placeholder="Agrega una descripción (opcional)"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div>
                {selectedEvent && (
                  <button
                    onClick={handleDeleteEvent}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    🗑️ Eliminar
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleSaveEvent}
                  disabled={!eventTitle.trim()}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    eventTitle.trim()
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {selectedEvent ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}