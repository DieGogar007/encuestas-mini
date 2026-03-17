# Encuestas UTB

Sistema web de encuestas para una institucion educativa.

## Resumen

Aplicacion full stack con:

- Backend API REST en NestJS + Prisma.
- Frontend en Next.js (App Router) + Tailwind.
- PostgreSQL como base de datos.
- Docker Compose para ejecutar todo el entorno.

Incluye gestion de usuarios por rol, creacion/edicion de encuestas, respuestas, resultados y administracion.

## Stack tecnologico

| Capa | Tecnologia |
|------|------------|
| Backend | NestJS + Prisma ORM |
| Base de datos | PostgreSQL 16 |
| Frontend | Next.js 14 + Tailwind CSS |
| Contenedores | Docker + Docker Compose |

## Estructura del repositorio

```text
encuestas/
├── backend/
│   ├── prisma/               # schema.prisma + seed.ts
│   └── src/
│       ├── auth/             # login, JWT, cambio de contrasena
│       ├── users/            # gestion de usuarios
│       ├── surveys/          # CRUD de encuestas y preguntas
│       ├── responses/        # respuestas por encuesta
│       ├── prisma/
│       └── main.ts
├── frontend/
│   └── src/
│       ├── app/              # rutas/paginas (App Router)
│       ├── api/              # cliente base para llamadas HTTP
│       ├── services/         # servicios de autenticacion
│       └── utils/            # tipos y validaciones
├── docker-compose.yml
├── .env.example
└── README.md
```

## Roles y permisos

| Rol interno | Etiqueta UI | Crear encuestas | Responder | Ver resultados |
|-------------|-------------|-----------------|-----------|----------------|
| ADMIN | Administrativo | Si | Si (segun target) | Si, todas |
| TEACHER | Docente | Si | Si (segun target) | Si, propias |
| STUDENT | Estudiante | No | Si (segun target) | No |

Nota: en base de datos se usan los valores `ADMIN`, `TEACHER`, `STUDENT`.

## Seguridad

- Autenticacion con JWT Bearer.
- CORS restringido por `FRONTEND_URL`.
- El token se guarda en Local Storage del frontend (`encuestas_token`).
- Validaciones globales con `whitelist`, `forbidNonWhitelisted` y `transform`.

## Variables de entorno

### Raiz del proyecto (`.env` para Docker Compose)

Crear desde `.env.example`:

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Variables:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT` (default: `5433`)
- `JWT_SECRET`
- `BACKEND_PORT` (default: `3001`)
- `FRONTEND_PORT` (default: `3000`)
- `FRONTEND_URL` (default: `http://localhost:3000`)
- `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001/api`)

## API principal

Prefijo global: `/api`

### Auth

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | /api/auth/login | No | Login |
| POST | /api/auth/change-password | JWT | Cambio de contrasena |

### Usuarios

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /api/users/me | JWT | Perfil actual |
| GET | /api/users | JWT + ADMIN | Listar usuarios |
| POST | /api/users | JWT + ADMIN | Crear usuario |
| PATCH | /api/users/:id | JWT + ADMIN | Actualizar usuario |
| POST | /api/users/:id/reset-password | JWT + ADMIN | Regenerar contrasena |

### Encuestas

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /api/surveys | JWT | Encuestas visibles para el usuario |
| POST | /api/surveys | JWT + ADMIN/TEACHER | Crear encuesta |
| GET | /api/surveys/:id | JWT | Detalle de encuesta |
| PUT | /api/surveys/:id | JWT + ADMIN/dueno | Editar encuesta |
| DELETE | /api/surveys/:id | JWT + ADMIN/dueno | Eliminar encuesta |
| POST | /api/surveys/:id/questions | JWT + ADMIN/dueno | Crear pregunta |
| PATCH | /api/surveys/:id/questions/:questionId | JWT + ADMIN/dueno | Editar pregunta |
| DELETE | /api/surveys/:id/questions/:questionId | JWT + ADMIN/dueno | Eliminar pregunta |
| GET | /api/surveys/:id/results | JWT + ADMIN/dueno | Ver resultados |

### Respuestas

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | /api/surveys/:id/responses | JWT | Responder encuesta |
| GET | /api/surveys/:id/responses/me | JWT | Ver si ya respondio |
| GET | /api/surveys/:id/responses | JWT + ADMIN/dueno | Listar respuestas |
| GET | /api/surveys/:id/responses/:responseId | JWT + ADMIN/dueno/respondedor | Ver una respuesta |
| PATCH | /api/surveys/:id/responses/:responseId | JWT + ADMIN/dueno/respondedor | Editar respuesta |
| DELETE | /api/surveys/:id/responses/:responseId | JWT + ADMIN/dueno/respondedor | Eliminar respuesta |

## Usuarios seed

| Email | Contrasena | Rol |
|-------|------------|-----|
| admin@utb.edu | admin123 | ADMIN |
| profesor@utb.edu | profesor123 | TEACHER |
| estudiante1@utb.edu | estudiante123 | STUDENT |
| estudiante2@utb.edu | estudiante123 | STUDENT |
```
