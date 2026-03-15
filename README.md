# Encuestas UTB

Sistema web de encuestas para una institucion educativa.

## Resumen

Aplicacion full stack con:

- Backend API REST en NestJS + Prisma.
- Frontend en Next.js (App Router) + Tailwind.
- PostgreSQL como base de datos.
- Docker Compose para ejecutar todo el entorno.

Incluye gestion de usuarios por rol, creacion/edicion de encuestas, respuesta de encuestas, resultados y administracion.

## Stack tecnologico

| Capa | Tecnologia |
|------|------------|
| Backend | NestJS + Prisma ORM |
| Base de datos | PostgreSQL |
| Frontend | Next.js 14 + Tailwind CSS |
| Contenedores | Docker + Docker Compose |

## Arquitectura del repositorio

```
encuestas-utb/
├── backend/
│   ├── prisma/         # schema.prisma + seed.ts
│   └── src/
│       ├── auth/       # login, JWT, cambio de contrasena
│       ├── users/      # gestion de usuarios (ADMIN)
│       ├── surveys/    # CRUD de encuestas, preguntas y resultados
│       └── responses/  # respuestas de encuestas
├── frontend/
│   └── src/
│       ├── app/        # rutas/paginas (App Router)
│       └── lib/        # cliente API, auth, tipos, validaciones
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

Nota: en base de datos se mantienen valores `ADMIN`, `TEACHER`, `STUDENT`.

## Seguridad y sesion

- Autenticacion con JWT Bearer.
- El token se guarda en Local Storage del frontend (`encuestas_token`).
- El backend valida JWT desde header `Authorization: Bearer <token>`.
- Los secretos se toman desde variables de entorno (sin fallback inseguro).
- Validaciones globales con `whitelist` y `forbidNonWhitelisted`.

## Variables de entorno

Crear `.env` en la raiz desde `.env.example`.

Variables principales:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT` (por defecto 5433)
- `JWT_SECRET`
- `BACKEND_PORT` (por defecto 3001)
- `FRONTEND_PORT` (por defecto 3000)
- `FRONTEND_URL`
- `NEXT_PUBLIC_API_URL` (normalmente `http://localhost:3001/api`)

## Arranque con Docker (desde cero)

1. Clona o descarga el proyecto.
2. Abre terminal en la raiz.
3. Crea `.env`:

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

4. Levanta servicios:

```bash
docker compose up -d --build
```

5. Carga datos seed (solo para base nueva):

```bash
docker compose exec backend npx prisma db seed
```

6. Abre la app:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

## Usuarios seed

| Email | Contrasena | Rol interno |
|-------|------------|-------------|
| admin@utb.edu | admin123 | ADMIN |
| profesor@utb.edu | profesor123 | TEACHER |
| estudiante1@utb.edu | estudiante123 | STUDENT |
| estudiante2@utb.edu | estudiante123 | STUDENT |

## Comandos utiles

Ver estado de contenedores:

```bash
docker compose ps
```

Reinicio limpio (elimina volumen y datos):

```bash
docker compose down -v
docker compose up -d --build
docker compose exec backend npx prisma db seed
```

## Desarrollo local sin Docker

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

## API principal

Base URL: `/api`

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
| POST | /api/users/:id/reset-password | JWT + ADMIN | Regenerar contrasena temporal |

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
| GET | /api/surveys/:id/results | JWT + ADMIN/dueno | Resultados |

### Respuestas

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | /api/surveys/:id/responses | JWT | Responder encuesta |
| GET | /api/surveys/:id/responses/me | JWT | Saber si ya respondio |
| GET | /api/surveys/:id/responses | JWT + ADMIN/dueno | Listar respuestas |
| GET | /api/surveys/:id/responses/:responseId | JWT + ADMIN/dueno/respondedor | Ver una respuesta |
| PATCH | /api/surveys/:id/responses/:responseId | JWT + ADMIN/dueno/respondedor | Editar respuesta |
| DELETE | /api/surveys/:id/responses/:responseId | JWT + ADMIN/dueno/respondedor | Eliminar respuesta |

## Reglas funcionales relevantes

- No se permiten encuestas vacias: titulo, descripcion y al menos una pregunta.
- Las preguntas de opcion multiple deben tener opciones validas.
- Un usuario solo puede enviar una respuesta por encuesta (`userId + surveyId` unico).
- La UI bloquea segundo envio si el usuario ya respondio.
- Cambios sensibles (eliminar encuesta/pregunta/respuesta) usan confirmacion modal.

## Troubleshooting rapido

Si la URL del API no responde:

1. Verifica `NEXT_PUBLIC_API_URL` en `.env`.
2. Verifica que backend este arriba en puerto esperado:

```bash
docker compose ps
```

3. Si cambiaste `.env`, reconstruye frontend para tomar variables nuevas:

```bash
docker compose up -d --build frontend backend
```
