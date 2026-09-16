# 🚀 Code Quest 2026 — Backend

> API REST modular construida con **NestJS + TypeScript + Supabase + Docker**  
> Generador de Rutas de Aprendizaje con IA · DevTalles · CQ03-2026

---

## 📋 Tabla de contenidos

1. [Visión general](#visión-general)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Módulos](#módulos)
5. [Base de datos](#base-de-datos)
6. [API Reference](#api-reference)
7. [Variables de entorno](#variables-de-entorno)
8. [Correr en local](#correr-en-local)
9. [Docker](#docker)
10. [Deploy en DigitalOcean](#deploy-en-digitalocean)
11. [Ramas de Git](#ramas-de-git)

---

## Visión general

El backend expone una API REST que permite:

- Autenticar usuarios con **Discord OAuth2**
- Guardar y consultar el catálogo de **cursos de DevTalles**
- Recibir el **cuestionario** del usuario y enviarlo a **Claude AI** para generar una ruta personalizada
- Persistir las **rutas de aprendizaje** generadas y el **progreso** por curso
- Servir todo desde contenedores **Docker** desplegados en **DigitalOcean**

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | 20 LTS |
| Framework | NestJS | 10 |
| Lenguaje | TypeScript | 5.1 |
| Base de datos | Supabase (PostgreSQL) | 2.x |
| Autenticación | Discord OAuth2 + JWT | — |
| IA | Anthropic Claude API | claude-sonnet-4-6 |
| Contenedores | Docker + Docker Compose | 24+ |
| Deploy | DigitalOcean App Platform / Droplet | — |
| Documentación | Swagger (OpenAPI 3.0) | — |

---

## Estructura del proyecto

```
codequest-backend/
│
├── src/
│   ├── main.ts                     # Entrada: Swagger, CORS, ValidationPipe, prefijo /api/v1
│   ├── app.module.ts               # Módulo raíz — importa todos los módulos
│   │
│   ├── supabase/                   # Módulo global de base de datos
│   │   ├── supabase.module.ts      # @Global() — disponible en toda la app
│   │   └── supabase.service.ts     # Cliente Supabase con service_role key
│   │
│   ├── auth/                       # Autenticación Discord + JWT
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts      # GET /auth/discord, /auth/discord/callback, /auth/me
│   │   ├── auth.service.ts         # findOrCreateUser, generateToken, getProfile
│   │   └── strategies/
│   │       ├── discord.strategy.ts # Passport strategy OAuth2
│   │       └── jwt.strategy.ts     # Passport strategy JWT Bearer
│   │
│   ├── courses/                    # Catálogo de cursos DevTalles
│   │   ├── courses.module.ts
│   │   ├── courses.controller.ts   # GET /courses, /courses/:id, /courses/categories
│   │   └── courses.service.ts      # findAll (con filtros), findById, getCatalogSummary
│   │
│   ├── assessments/                # Cuestionario de habilidades
│   │   ├── assessments.module.ts
│   │   ├── assessments.controller.ts  # POST /assessments, GET /assessments
│   │   ├── assessments.service.ts     # createAndGeneratePath (orquesta IA + DB)
│   │   └── dto/
│   │       └── create-assessment.dto.ts
│   │
│   ├── learning-paths/             # Rutas de aprendizaje generadas
│   │   ├── learning-paths.module.ts
│   │   ├── learning-paths.controller.ts  # GET /learning-paths, /:id, PATCH /:id/progress/:courseId, DELETE /:id
│   │   └── learning-paths.service.ts     # findAllByUser, findOne, toggleCourseProgress, remove
│   │
│   ├── ai/                         # Integración Claude API
│   │   ├── ai.module.ts
│   │   └── ai.service.ts           # generateLearningPath — prompt engineering + parse JSON
│   │
│   └── common/                     # Utilidades compartidas
│       ├── guards/
│       │   └── jwt-auth.guard.ts   # Guard reutilizable para rutas protegidas
│       └── decorators/
│           └── get-user.decorator.ts  # @GetUser() — extrae el usuario del request
│
├── supabase/
│   └── schema.sql                  # DDL completo: tablas, índices, RLS, datos semilla
│
├── docs/
│   └── deploy-digitalocean.md      # Guía paso a paso de deploy
│
├── Dockerfile                      # Multi-stage: builder + production (Node Alpine)
├── docker-compose.yml              # Servicio backend con variables de entorno
├── .env.example                    # Plantilla de variables (sin secretos)
├── nest-cli.json
├── tsconfig.json
├── package.json
└── README.md
```

---

## Módulos

### `SupabaseModule` — Global

Módulo marcado con `@Global()`. Provee el cliente de Supabase con `service_role` key para todas las operaciones server-side. No requiere importarse en cada módulo.

```
SupabaseModule
  └── SupabaseService
        └── createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
```

---

### `AuthModule`

Maneja todo el flujo de autenticación.

```
AuthModule
  ├── AuthController
  │     ├── GET  /api/v1/auth/discord            → redirige a Discord
  │     ├── GET  /api/v1/auth/discord/callback   → captura código, crea JWT, redirige al frontend
  │     └── GET  /api/v1/auth/me                 → perfil del usuario autenticado
  │
  ├── AuthService
  │     ├── findOrCreateUser(profile)   → upsert en tabla profiles
  │     ├── generateToken(user)         → firma JWT con payload {sub, discord_id, username}
  │     └── getProfile(userId)          → consulta profiles por id
  │
  └── Strategies
        ├── DiscordStrategy  → scope: identify, email, guilds
        └── JwtStrategy      → extrae token del header Authorization: Bearer
```

**Flujo completo:**
```
Usuario → GET /auth/discord
  → Passport redirige a discord.com/oauth2
  → Discord redirige a /auth/discord/callback con code
  → DiscordStrategy valida y llama a findOrCreateUser
  → Se genera JWT
  → Redirect a frontend/?token=<jwt>
  → Frontend guarda token en localStorage
  → Todas las peticiones llevan Authorization: Bearer <token>
```

---

### `CoursesModule`

Catálogo de cursos de DevTalles. Solo lectura para usuarios finales.

```
CoursesModule
  ├── CoursesController (requiere JWT)
  │     ├── GET /api/v1/courses                  → lista con filtros ?category= &level=
  │     ├── GET /api/v1/courses/categories       → categorías únicas disponibles
  │     └── GET /api/v1/courses/:id              → detalle de un curso
  │
  └── CoursesService
        ├── findAll(filters?)       → query con filtros dinámicos
        ├── findById(id)            → single course
        ├── getCategories()         → distinct categories
        └── getCatalogSummary()     → campos mínimos para el prompt de IA
```

---

### `AssessmentsModule`

Recibe el cuestionario del usuario, lo pasa a la IA y guarda la ruta generada.

```
AssessmentsModule
  ├── AssessmentsController (requiere JWT)
  │     ├── POST /api/v1/assessments   → enviar cuestionario → genera ruta con IA
  │     └── GET  /api/v1/assessments   → historial de cuestionarios del usuario
  │
  └── AssessmentsService
        └── createAndGeneratePath(userId, dto)
              1. Guarda assessment en user_assessments
              2. Llama a AiService.generateLearningPath()
              3. Guarda LearningPath en learning_paths
              4. Crea registros de progreso en user_progress
              5. Retorna { assessment, learningPath }
```

**DTO del cuestionario:**
```typescript
{
  interests: string[]              // ['frontend', 'backend', 'devops']
  goals: string                    // meta profesional en texto libre
  currentLevel: 'beginner'         // | 'intermediate' | 'advanced'
       | 'intermediate'
       | 'advanced'
  availableHoursPerWeek: number    // 1-40
  preferredTechnologies?: string[] // ['Vue', 'NestJS', 'Docker']
}
```

---

### `LearningPathsModule`

CRUD de rutas de aprendizaje y sistema de progreso.

```
LearningPathsModule
  ├── LearningPathsController (requiere JWT)
  │     ├── GET    /api/v1/learning-paths                          → mis rutas con % progreso
  │     ├── GET    /api/v1/learning-paths/:id                      → detalle con cursos y progreso
  │     ├── PATCH  /api/v1/learning-paths/:pathId/progress/:courseId → marcar/desmarcar completado
  │     └── DELETE /api/v1/learning-paths/:id                      → eliminar ruta
  │
  └── LearningPathsService
        ├── findAllByUser(userId)                    → rutas + progressPercentage calculado
        ├── findOne(id, userId)                      → ruta con JOIN a cursos y progreso
        ├── toggleCourseProgress(pathId, courseId,   → update completed + completed_at
        │     userId, completed)
        └── remove(id, userId)                       → elimina ruta y su progreso
```

---

### `AiModule`

Integración con la API de Anthropic (Claude).

```
AiModule
  └── AiService
        └── generateLearningPath(assessment)
              1. Obtiene catálogo completo de cursos (getCatalogSummary)
              2. Construye system prompt con reglas estrictas
              3. Construye user message con perfil + catálogo
              4. Llama a claude-sonnet-4-6 con max_tokens: 2000
              5. Parsea respuesta JSON
              6. Retorna GeneratedPath { title, description,
                 estimatedWeeks, totalHours, courses[], tips[] }
```

**Formato de respuesta de la IA:**
```json
{
  "title": "Tu ruta hacia Fullstack JavaScript",
  "description": "Ruta de 3 frases explicando el recorrido",
  "estimatedWeeks": 24,
  "totalHours": 148,
  "courses": [
    { "courseId": "uuid-del-curso", "order": 1, "reason": "Por qué este curso primero" }
  ],
  "tips": ["Consejo 1", "Consejo 2", "Consejo 3"]
}
```

---

## Base de datos

Supabase (PostgreSQL hosted). Schema completo en `supabase/schema.sql`.

### Tablas

```
profiles
  id              uuid PK
  discord_id      text UNIQUE
  username        text
  email           text
  avatar_url      text
  created_at      timestamptz
  updated_at      timestamptz

courses
  id              uuid PK
  title           text
  description     text
  category        text        -- 'frontend' | 'backend' | 'fullstack' | 'devops' | 'mobile' | 'databases'
  level           text        -- 'beginner' | 'intermediate' | 'advanced'
  url             text
  duration_hours  int
  tags            text[]
  is_active       boolean
  created_at      timestamptz

user_assessments
  id                        uuid PK
  user_id                   uuid FK → profiles
  interests                 text[]
  goals                     text
  current_level             text
  available_hours_per_week  int
  preferred_technologies    text[]
  created_at                timestamptz

learning_paths
  id              uuid PK
  user_id         uuid FK → profiles
  assessment_id   uuid FK → user_assessments
  title           text
  description     text
  estimated_weeks int
  total_hours     int
  courses_order   jsonb       -- [{courseId, order, reason}]
  tips            text[]
  created_at      timestamptz

user_progress
  id               uuid PK
  user_id          uuid FK → profiles
  learning_path_id uuid FK → learning_paths
  course_id        uuid FK → courses
  order            int
  completed        boolean
  completed_at     timestamptz
  created_at       timestamptz
  UNIQUE(learning_path_id, course_id)
```

### Relaciones

```
profiles ──< user_assessments ──< learning_paths ──< user_progress >── courses
```

### Índices

```sql
idx_learning_paths_user_id   ON learning_paths(user_id)
idx_user_progress_path_id    ON user_progress(learning_path_id)
idx_user_progress_user_id    ON user_progress(user_id)
idx_courses_category         ON courses(category)
idx_courses_level            ON courses(level)
```

---

## API Reference

Base URL: `https://tu-backend.ondigitalocean.app/api/v1`
Documentación interactiva: `/docs` (Swagger UI)

### Auth

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/auth/discord` | — | Iniciar login con Discord |
| GET | `/auth/discord/callback` | — | Callback OAuth2 |
| GET | `/auth/me` | JWT | Perfil del usuario actual |

### Courses

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/courses` | JWT | Listar cursos (`?category=backend&level=intermediate`) |
| GET | `/courses/categories` | JWT | Categorías disponibles |
| GET | `/courses/:id` | JWT | Detalle de un curso |

### Assessments

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/assessments` | JWT | Enviar cuestionario → genera ruta con IA |
| GET | `/assessments` | JWT | Historial de cuestionarios |

### Learning Paths

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/learning-paths` | JWT | Mis rutas con porcentaje de progreso |
| GET | `/learning-paths/:id` | JWT | Detalle de ruta con cursos y progreso |
| PATCH | `/learning-paths/:pathId/progress/:courseId` | JWT | Marcar/desmarcar curso completado |
| DELETE | `/learning-paths/:id` | JWT | Eliminar una ruta |

---

## Variables de entorno

```bash
# App
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://tu-frontend.com

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...          # service_role key (nunca la anon key aquí)
SUPABASE_ANON_KEY=eyJ...

# JWT
JWT_SECRET=cadena-aleatoria-larga    # openssl rand -base64 64
JWT_EXPIRES_IN=7d

# Discord OAuth2
DISCORD_CLIENT_ID=1234567890
DISCORD_CLIENT_SECRET=abc123...
DISCORD_CALLBACK_URL=https://tu-backend.com/api/v1/auth/discord/callback
DEVTALLES_GUILD_ID=1130900724499365958

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Correr en local

### Requisitos

- Node.js 20+
- npm
- Cuenta en Supabase (gratuita)
- App en Discord Developer Portal
- API Key de Anthropic

### Pasos

```bash
# 1. Clonar el repo
git clone https://github.com/tu-equipo/codequest-backend.git
cd codequest-backend

# 2. Instalar dependencias
npm install

# 3. Configurar entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Correr el schema en Supabase
# Ir a Supabase → SQL Editor → pegar supabase/schema.sql → Run

# 5. Correr en modo desarrollo
npm run start:dev

# API disponible en:  http://localhost:3000/api/v1
# Swagger docs en:    http://localhost:3000/docs
```

---

## Docker

### Desarrollo local con Docker

```bash
# Construir imagen
docker build -t codequest-backend .

# Correr con variables de entorno
docker run -p 3000:3000 --env-file .env codequest-backend
```

### Docker Compose

```bash
# Levantar
docker compose up -d

# Ver logs
docker compose logs -f backend

# Detener
docker compose down
```

### Estructura del Dockerfile (multi-stage)

```dockerfile
# Stage 1: Build — instala devDependencies y compila TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build          # genera /app/dist/

# Stage 2: Production — solo runtime, imagen mínima (~150MB)
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

---

## Deploy en DigitalOcean

### Opción A — App Platform (recomendada para el hackathon)

```
1. cloud.digitalocean.com/apps → Create App
2. Conectar GitHub → seleccionar codequest-backend
3. Configurar:
   - Build Command: npm run build
   - Run Command:   node dist/main
   - Port:          3000
4. Agregar todas las variables de entorno del .env
5. Deploy → obtener URL pública
6. Actualizar DISCORD_CALLBACK_URL con la URL real
7. Actualizar FRONTEND_URL con la URL del frontend
```

### Opción B — Droplet con Docker

```bash
# En el servidor (Ubuntu 24.04)
curl -fsSL https://get.docker.com | sh
git clone https://github.com/tu-equipo/codequest-backend.git
cd codequest-backend
cp .env.example .env && nano .env    # rellenar credenciales
docker compose up -d --build
```

### Checklist de deploy

```
[ ] Backend responde en /api/v1/docs (Swagger)
[ ] GET /api/v1/auth/discord redirige a Discord correctamente
[ ] DISCORD_CALLBACK_URL apunta a la URL de producción
[ ] Variables de entorno configuradas (sin valores de ejemplo)
[ ] Supabase schema ejecutado y cursos semilla cargados
[ ] Frontend apunta al backend de producción
[ ] No hay commits después del 28 sep 10:00AM GMT-6
```

---

## Ramas de Git

```
main              ← rama principal, código en producción
develop           ← integración de features
├── feature/auth          ← módulo de autenticación Discord
├── feature/courses       ← catálogo de cursos
├── feature/assessments   ← cuestionario + integración IA
├── feature/learning-paths ← rutas y progreso
└── feature/docker        ← configuración Docker y deploy
```

**Flujo de trabajo:**
```
feature/* → PR → develop → PR → main
```

Cada PR debe tener:
- Descripción del cambio
- Al menos 1 reviewer
- Tests pasando (si aplica)

---

## Licencia

MIT — ver `LICENSE`

---

*Code Quest 2026 · DevTalles · Equipo [nombre del equipo]*