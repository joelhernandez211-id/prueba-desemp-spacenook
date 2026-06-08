# SpaceBook — Workspace Reservation System

## Description
A Single Page Application (SPA) for managing workspace reservations within a company. Employees can reserve private offices, meeting rooms, coworking spaces, and auditoriums. Administrators can manage all reservations and spaces.

## Technologies Used
- **Vite** — build tool and dev server
- **Vanilla JavaScript (ES Modules)** — no frameworks
- **json-server** — simulated REST API
- **CSS Custom Properties** — theming and responsive design

## Installation
```bash
npm install
```

## Running the Project
You need two terminals:

**Terminal 1 — JSON Server (API):**
```bash
npm run server
# Runs on http://localhost:3001
```

**Terminal 2 — Vite Dev Server:**
```bash
npm run dev
# Runs on http://localhost:5173
```

## Test Users

| Name         | Email                 | Password  | Role  |
|--------------|-----------------------|-----------|-------|
| Admin User   | admin@company.com     | admin123  | admin |
| Ana García   | ana@company.com       | user123   | user  |
| Carlos López | carlos@company.com    | user123   | user  |

## Project Structure
```
space-booking/
├── index.html
├── db.json                     # json-server database
├── package.json
└── src/
    ├── main.js                 # entry point
    ├── styles.css              # global styles
    ├── router/
    │   └── router.js           # SPA hash-based router + route guards
    ├── services/
    │   ├── auth.service.js     # login, logout, session management
    │   └── reservations.service.js  # CRUD for reservations and spaces
    ├── components/
    │   ├── navbar.js           # dynamic navigation bar
    │   └── toast.js            # toast notification system
    └── views/
        ├── login.js            # login page
        ├── dashboard.js        # home/stats page
        ├── reservations.js     # reservations CRUD view
        ├── spaces.js           # spaces management (admin only)
        └── denied.js           # 403 access denied page
```

## Role Permissions

### Admin
- View, create, edit, delete ALL reservations
- Approve or reject reservations
- Manage all spaces (create, edit, delete)
- Access all application modules

### User
- Create reservations
- View ONLY their own reservations
- Edit their own PENDING reservations
- Cancel their own reservations (pending or approved)
- No access to admin modules

## Technical Decisions

### Hash-based Routing
Used `window.location.hash` and the `hashchange` event for SPA navigation. This works without any server configuration, making it ideal for static deployments.

### Route Guards
Implemented directly in the router before rendering each view:
1. **Auth guard**: redirects unauthenticated users to `/login`
2. **Role guard**: redirects users without admin role to `/denied`
3. **Login redirect**: already-authenticated users are sent to `/dashboard`

### Session Persistence
User session stored in `localStorage` as a JSON string. This maintains the session across page reloads and browser restarts. `sessionStorage` would limit the session to the current tab.

### DOM Rendering Pattern
Each view returns an HTML string. Event listeners are attached after the HTML is injected into the DOM via `window.__initView` — a callback pattern that avoids the common mistake of querying DOM elements before they exist.

### Event Delegation
Table action buttons use a single event listener on the parent `<tbody>` instead of one listener per button. This is more performant and works with dynamically-rendered content.

### Conflict Detection
Before creating/editing a reservation, `checkConflict()` queries json-server for reservations in the same space and date, then checks for time overlaps using `startTime < r.endTime && endTime > r.startTime`.
