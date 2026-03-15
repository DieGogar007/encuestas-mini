# Encuestas UTB

Sistema minimalista de encuestas para una institución educativa.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS + Prisma ORM |
| Base de datos | PostgreSQL |
| Frontend | Next.js 14 + Tailwind CSS |
| Contenedores | Docker + Docker Compose |

## Estructura del repositorio

```
encuestas-utb/
├── backend/          # API REST con NestJS
│   ├── prisma/       # Esquema y seed de BD
│   └── src/
│       ├── auth/     # JWT login
│       ├── users/    # Perfil de usuario
│       ├── surveys/  # CRUD de encuestas y resultados
│       └── responses/# Responder encuestas
├── frontend/         # App Next.js
│   └── src/
│       ├── app/      # Páginas (App Router)
│       ├── components/
│       └── lib/      # API client y auth helpers
├── docker-compose.yml
└── README.md
```

## Roles de usuario

| Rol | Puede crear encuestas | Puede responder | Puede ver resultados |
|-----|-----------------------|-----------------|----------------------|
| ADMIN | ✅ | ✅ (según target) | ✅ cualquiera |
| TEACHER | ✅ | ✅ (según target) | ✅ las propias |
| STUDENT | ❌ | ✅ (según target) | ❌ |

## Usuarios de prueba (seed)

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@utb.edu | admin123 | ADMIN |
| profesor@utb.edu | profesor123 | TEACHER |
| estudiante1@utb.edu | estudiante123 | STUDENT |
| estudiante2@utb.edu | estudiante123 | STUDENT |

## Levantar con Docker

### Arranque desde cero (primera vez)

1. Clona o descarga este proyecto.
2. Abre una terminal en la carpeta raiz del proyecto.
3. Crea el archivo de entorno:

En Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

En Linux/macOS:

```bash
cp .env.example .env
```

4. Levanta todo con Docker:

```bash
docker compose up -d --build
```

5. Carga los usuarios de prueba (solo una vez por base de datos nueva):

```bash
docker compose exec backend npx prisma db seed
```

6. Abre la aplicacion:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

El backend sincroniza el esquema de Prisma automaticamente al iniciar.

### Si algo falla en otro computador

Ejecuta un reinicio limpio (borra contenedores y volumen de base de datos local):

```bash
docker compose down -v
docker compose up -d --build
docker compose exec backend npx prisma db seed
```

### Verificacion rapida

```bash
docker compose ps
```

Debes ver tres servicios en estado Up/Healthy: postgres, backend y frontend.

## Desarrollo local

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed
npm run start:dev
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## API Endpoints principales

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /api/auth/login | No | Iniciar sesión |
| GET | /api/users/me | JWT | Perfil actual |
| GET | /api/surveys | JWT | Encuestas disponibles |
| POST | /api/surveys | JWT + TEACHER/ADMIN | Crear encuesta |
| GET | /api/surveys/:id | JWT | Detalle de encuesta |
| POST | /api/surveys/:id/responses | JWT | Responder encuesta |
| GET | /api/surveys/:id/results | JWT + creador/ADMIN | Ver resultados |
