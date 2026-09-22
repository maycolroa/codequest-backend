# 🗺️ CONTEXT.md — Contexto Técnico del Proyecto

> Referencia rápida de entidades, módulos y endpoints.
> Actualizar cuando cambien las estructuras de datos.

---

## Stack completo

```
Runtime:      Node.js 20 LTS
Framework:    NestJS 10
Lenguaje:     TypeScript 5.1
ORM:          TypeORM 0.3.x
Base de datos: PostgreSQL 17 (DigitalOcean Managed)
Auth:         Discord OAuth2 + JWT (passport)
IA:           Anthropic Claude API (claude-sonnet-4-6)
Contenedor:   Docker multi-stage (node:20-alpine)
Deploy:       DigitalOcean App Platform
Docs:         Swagger en /docs
```

---

## Módulos del proyecto

```
AppModule
  ├── ConfigModule      (global) — variables de entorno
  ├── TypeOrmModule     (global) — conexión PostgreSQL
  ├── AuthModule        — Discord OAuth2 + JWT
  ├── CoursesModule     — catálogo de cursos DevTalles
  ├── AssessmentsModule — cuestionario + genera ruta con IA
  ├── LearningPathsModule — rutas y progreso por curso
  └── AiModule          — integración Claude API
```

---

## Entidades y tablas

### `Profile` → tabla `profiles`
```typescript
id:         uuid (PK)
discordId:  string (UNIQUE)
username:   string
email:      string (nullable)
avatarUrl:  string (nullable)
createdAt:  Date
updatedAt:  Date
```

### `Course` → tabla `courses`
```typescript
id:            uuid (PK)
title:         string
description:   string
 slug:          string (UNIQUE)
 category:      string  // backend|architecture|frontend|mobile|programming_languages|databases|devops|ai|legacy
 level:         string  // 'beginner'|'intermediate'|'advanced'
 url:           string (nullable hasta confirmar la URL oficial)
 durationHours: number (nullable hasta confirmar la duración)
tags:          string[]
isActive:      boolean (default: true)
createdAt:     Date
```

### `UserAssessment` → tabla `user_assessments`
```typescript
id:                     uuid (PK)
user:                   Profile (FK)
interests:              string[]
goals:                  string
currentLevel:           string
availableHoursPerWeek:  number
preferredTechnologies:  string[]
createdAt:              Date
```

### `LearningPath` → tabla `learning_paths`
```typescript
id:             uuid (PK)
user:           Profile (FK)
assessment:     UserAssessment (FK)
title:          string
description:    string
estimatedWeeks: number
totalHours:     number
coursesOrder:   jsonb  // [{courseId, order, reason}]
tips:           string[]
userProgress:   UserProgress[] (OneToMany)
createdAt:      Date
```

### `UserCourseProgress` → tabla `user_course_progress`
```typescript
id:             uuid (PK)
profile:        Profile (FK)
course:         Course (FK)
status:         'not_started'|'in_progress'|'completed'
progressPercent:number (0-100)
startedAt:      Date (nullable)
completedAt:    Date (nullable)
createdAt:      Date
updatedAt:      Date
UNIQUE: (profile, course)
```

### `CourseLesson` → tabla `course_lessons`
```typescript
id:        uuid (PK)
course:    Course (FK)
title:     string
content:   string
videoUrl:  string (nullable)
position:  number
isPreview: boolean
```

### `UserLessonProgress` → tabla `user_lesson_progress`
```typescript
id:          uuid (PK)
profile:     Profile (FK)
lesson:      CourseLesson (FK)
completedAt: Date
UNIQUE: (profile, lesson)
```

### Diagrama de relaciones
```
Profile ──< UserAssessment
Profile ──< LearningPath
Profile ──< UserCourseProgress >── Course
Course ──< CourseLesson
Profile ──< UserLessonProgress >── CourseLesson
```

---

## Endpoints disponibles

### Auth
```
GET  /api/v1/auth/discord           → inicia OAuth2 con Discord (público)
GET  /api/v1/auth/discord/callback  → callback OAuth2, genera JWT (público)
GET  /api/v1/auth/me                → perfil del usuario (JWT)
```

### Courses
```
GET  /api/v1/courses                → lista cursos (JWT) | ?category= &level=
GET  /api/v1/courses/categories     → categorías únicas (JWT)
GET  /api/v1/courses/:id            → detalle de curso (JWT)
POST /api/v1/courses/:id/enroll     → inscribirme a un curso (JWT)
GET  /api/v1/courses/my-progress    → mis cursos inscritos (JWT)
GET  /api/v1/courses/:id/lessons    → lecciones de un curso (JWT)
POST /api/v1/courses/:id/lessons    → crear lección (superadmin)
PATCH /api/v1/courses/lessons/:lessonId → editar lección (superadmin)
DELETE /api/v1/courses/lessons/:lessonId → eliminar lección y recalcular avances (superadmin)
POST /api/v1/courses/lessons/:lessonId/complete → completar lección y recalcular avance (JWT)
```

### Assessments
```
POST /api/v1/assessments            → cuestionario → genera ruta con IA (JWT)
GET  /api/v1/assessments            → historial de cuestionarios (JWT)
```

### Learning Paths
```
GET    /api/v1/learning-paths                               → mis rutas (JWT)
GET    /api/v1/learning-paths/:id                           → detalle (JWT)
PATCH  /api/v1/learning-paths/:pathId/progress/:courseId    → toggle completado (JWT)
DELETE /api/v1/learning-paths/:id                           → eliminar (JWT)
```

---

## Variables de entorno requeridas

```bash
PORT=3000
NODE_ENV=development|production
FRONTEND_URL=http://localhost:5173

DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

JWT_SECRET=string-largo-aleatorio
JWT_EXPIRES_IN=7d

DISCORD_CLIENT_ID=snowflake-id
DISCORD_CLIENT_SECRET=secret
DISCORD_CALLBACK_URL=http://localhost:3000/api/v1/auth/discord/callback
DEVTALLES_GUILD_ID=1130900724499365958

ANTHROPIC_API_KEY=sk-ant-...
```

---

## Formato de respuesta de Claude AI

El `AiService.generateLearningPath()` espera este JSON exacto de Claude:

```json
{
  "title": "string — nombre descriptivo de la ruta",
  "description": "string — 2-3 oraciones sobre qué aprenderá",
  "estimatedWeeks": 24,
  "totalHours": 148,
  "courses": [
    {
      "courseId": "uuid-exacto-del-catalogo",
      "order": 1,
      "reason": "Por qué este curso en este punto"
    }
  ],
  "tips": ["Consejo 1", "Consejo 2", "Consejo 3"]
}
```

**Importante:** Claude solo puede usar `courseId` de los UUIDs del catálogo
real. El prompt incluye el catálogo completo para que Claude lo conozca.

---

## Flujo completo de generación de ruta

```
1. Usuario llena el cuestionario en el frontend
2. POST /api/v1/assessments con el DTO
3. AssessmentsService.createAndGeneratePath():
   a. Guarda UserAssessment en DB
   b. Llama AiService.generateLearningPath(assessment)
   c. AiService obtiene catálogo de CoursesService
   d. AiService llama a Claude API con prompt + catálogo
   e. Claude responde con JSON tipado
   f. Se crea LearningPath en DB con coursesOrder
   g. Se crean registros UserProgress por cada curso
4. Retorna { assessment, learningPath }
5. Frontend redirige a /paths/:learningPath.id
```

---

## Decisiones técnicas rápidas

| Decisión | Por qué |
|----------|---------|
| TypeORM sobre Prisma | Decoradores nativos de NestJS, mejor integración |
| synchronize: false | Evita pérdida de datos en producción |
| service_role key de Supabase eliminada | Migramos a DO PostgreSQL directo |
| JWT en vez de sesiones | API stateless, mejor para mobile/web |
| claude-sonnet-4-6 | Balance costo/calidad para el hackathon |
| Docker multi-stage | Imagen final ~150MB vs ~600MB |
| SSL rejectUnauthorized: false | Requerido por DigitalOcean managed DB |

Ver más en `DECISIONS.md`
