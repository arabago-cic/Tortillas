# 🫓 Calendario de Tortillas

Aplicación web para gestionar la rotación de quién trae tortillas cada día en el departamento.

## Funcionalidades

- **Calendario visual** con las asignaciones de cada día laborable
- **Panel de administración** para gestionar miembros y asignar turnos
- **Notificaciones por email** automáticas a las 8:00 AM los días con asignación
- **Notificaciones push** en el navegador (opcional)
- Interfaz en español con tema cálido ámbar/naranja

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL + Drizzle ORM |
| Email | Nodemailer (SMTP) |
| Push | Web Push API |

## Requisitos

- Node.js 20.19+ o 22+
- PostgreSQL

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/arabago-cic/Tortillas.git
cd Tortillas
```

### 2. Configurar el backend

```bash
cd server
npm install
cp .env.example .env
```

Edita `server/.env` con tus valores:

```
DATABASE_URL=postgresql://usuario:password@host:5432/tortillas
ADMIN_PASSWORD=tu-contraseña-admin
JWT_SECRET=tu-secreto-jwt
SMTP_HOST=smtp.tu-servidor.com
SMTP_PORT=587
SMTP_USER=tu-usuario
SMTP_PASS=tu-contraseña
SMTP_FROM=remitente@ejemplo.com
```

### 3. Crear las tablas

```bash
npm run db:generate
npm run db:migrate
```

### 4. Configurar el frontend

```bash
cd ../client
npm install
```

### 5. Arrancar la aplicación

```bash
# Terminal 1 - Backend (puerto 3001)
cd server
npm run dev

# Terminal 2 - Frontend (puerto 5173)
cd client
npm run dev
```

Abre http://localhost:5173

## Uso

1. Haz clic en **Admin** (arriba a la derecha) e introduce la contraseña
2. Añade los miembros del departamento con su nombre y email
3. Haz clic en cualquier día laborable del calendario para asignar quién trae tortillas
4. Los días con asignación, a las 8:00 AM se envía un email a todos los miembros

## Licencia

MIT
