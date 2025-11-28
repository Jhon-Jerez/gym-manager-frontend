## Propósito rápido

Este repo es un frontend ligero en React + Vite para un administrador de gimnasio. Usa Tailwind para estilos y llamadas REST a una API backend en `http://127.0.0.1:8000/api/`.

## Entradas y scripts importantes

- Entrada de la app: `src/main.jsx` → `src/App.jsx` (React Router v7).
- Scripts (package.json):
  - `npm run dev` — desarrollo (Vite HMR)
  - `npm run build` — build de producción
  - `npm run preview` — preview del build
  - `npm run lint` — lint con ESLint

## Arquitectura y patrones clave

- Rutas y gating simple: `App.jsx` guarda `user` en `localStorage` y usa esa presencia para permitir/denegar acceso a `/dashboard` (ver bloque de Routes en `src/App.jsx`).
- Autenticación: `src/components/LoginForm.jsx` hace POST a `/api/token/` y almacena `access` y `refresh` en `localStorage`.
- Llamadas a la API: componentes usan fetch directo con URLs absolutas (ej. `http://127.0.0.1:8000/api/core/users/` en `UsersPanel.jsx`).
  - Authorization: muchos componentes leen un token de `localStorage` (ver `localStorage.getItem("token")` en `UsersPanel.jsx`). Nota: hay una inconsistencia — el formulario de login guarda `access` mientras `UsersPanel` busca `token`. Si vas a automatizar cambios, ten esto presente.

- UI: construcción de vistas con componentes pequeños en `src/components/` y páginas en `src/pages/`. Ejemplos: `Dashboard.jsx` contiene el sidebar y muestra `UsersPanel` o `DashboardHome` según estado local.
- Estilo: Tailwind (config en `tailwind.config.js`) — las clases utilitarias están ampliamente usadas inline.

## Convenciones y prácticas detectadas

- Persistencia mínima del estado: se utiliza `localStorage` para user/tokens (no Redux ni Context global). Pequeñas funciones de login/logout en `App.jsx` controlan esto.
- Modales y subcomponentes a veces están definidos inline (por ejemplo `EditUserModal` dentro de `UsersPanel.jsx`). Si un agente refactoriza, extraer ese modal a `src/components/` es seguro y sencillo.
- Lint/format: hay script de `eslint` configurado; respeta reglas existentes.

## Integraciones y puntos de atención para un agente

- API base: `http://127.0.0.1:8000/api/` está hardcodeada en múltiples componentes — centralizar en un `src/lib/api.js` o variable de entorno (`import.meta.env`) es una mejora de bajo riesgo.
- Token key mismatch: LoginForm guarda `access`/`refresh`. Otros componentes esperan `token`. Antes de cambiar masivamente, confirma la convención deseada (recomiendo: usar `access` o renombrar a `token` consistentemente).
- Autorización: algunos fetch usan `Authorization: Bearer ${token}`; valida que el valor exista y maneja 401 con redirect a login.

## Ejemplos rápidos (referencias concretas)

- Protecciones de ruta: revisa `src/App.jsx` (uso de `<Navigate to="/dashboard" />` y condicionamiento por `user`).
- Login / tokens: `src/components/LoginForm.jsx` (POST a `/api/token/` y set en `localStorage`).
- Gestión usuarios: `src/components/UsersPanel.jsx` (GET `/api/core/users/`, PATCH y PUT para actualizar usuarios). También muestra el modal `EditUserModal` inline.

## Qué puede pedir un agente (prioridad alta)

- Centralizar la URL base y la gestión de tokens (añadir helper `apiFetch` que inyecte headers).
- Normalizar el nombre del token en `localStorage` (e.g., usar `access` o `token` en todo el código).
- Extraer modales grandes a componentes separados para mejorar pruebas y reutilización.

## Comandos útiles para desarrolladores

- Instalar dependencias: `npm install`
- Arrancar dev server: `npm run dev`
- Lint: `npm run lint`

## Nota final
Evita hacer suposiciones sobre el backend (formatos de fecha, campos retornados). En este repo, `UsersPanel` asume que el endpoint devuelve un array de usuarios con `id`, `is_active`, `full_name`, `membership_type`, `joined_at`. Confirma cambios en la API antes de refactorizar lógicas que dependen de esos campos.

---
Si quieres, actualizo la inconsistencia del token (mostrar qué archivos tocar) o extraigo el modal `EditUserModal` a `src/components/EditUserModal.jsx` en un siguiente paso.
