# 🚀 Code Quest 2026 — Backend

> API REST modular construida con **NestJS + TypeScript + TypeORM + PostgreSQL + Docker**
> Generador de Rutas de Aprendizaje con IA · DevTalles · CQ03-2026

---

## 📋 Tabla de contenidos

1. [Visión general](#visión-general)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Módulos](#módulos)
5. [Base de datos con TypeORM](#base-de-datos-con-typeorm)
6. [Entidades](#entidades)
7. [Migrations](#migrations)
8. [API Reference](#api-reference)
9. [Variables de entorno](#variables-de-entorno)
10. [Correr en local](#correr-en-local)
11. [Docker](#docker)
12. [Deploy en DigitalOcean](#deploy-en-digitalocean)
13. [Ramas de Git](#ramas-de-git)
14. [Costos](#costos)

---

## Visión general

El backend expone una API REST que permite:

- Autenticar usuarios con **Discord OAuth2** y tokens **JWT**
- Consultar el catálogo de **cursos de DevTalles**
- Recibir el **cuestionario** del usuario y enviarlo a **Claude AI** para generar una ruta personalizada
- Persistir las **rutas de aprendizaje** y el **progreso** por curso en **PostgreSQL**
- Servir todo desde contenedores **Docker** desplegados en **DigitalOcean**

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | 20 LTS |
| Framework | NestJS | 10 |
| Lenguaje | TypeScript | 5.1 |
| ORM | TypeORM | 0.3.x |
| Base de datos | PostgreSQL (DigitalOcean Managed) | 17 |
| Autenticación | Discord OAuth2 + JWT | — |
| IA | Anthropic Claude API | claude-sonnet-4-6 |
| Contenedores | Docker + Docker Compose | 24+ |
| Deploy | DigitalOcean App Platform | — |
| Documentación | Swagger (OpenAPI 3.0) | — |

---

## Estructura del proyecto

```
codequest-backend/
│
├── src/
│   ├── main.ts                        # Entrada: Swagger, CORS, ValidationPipe, prefijo /api/v1
│   ├── app.module.ts                  # Módulo raíz — TypeOrmModule + todos los módulos
│   │
│   ├── config/
│   │   └── database.config.ts         # Configuración TypeORM desde variables de entorno
│   │
│   ├── entities/                      # Entidades TypeORM (mapean las tablas de PostgreSQL)
│   │   ├── profile.entity.ts          # Tabla: profiles
│   │   ├── course.entity.ts           # Tabla: courses
│   │   ├── user-assessment.entity.ts  # Tabla: user_assessments
│   │   ├── learning-path.entity.ts    # Tabla: learning_paths
│   │   └── user-progress.entity.ts    # Tabla: user_progress
│   │
│   ├── migrations/                    # Migrations de TypeORM (control de versiones del schema)
│   │   ├── 1726000000000-CreateProfiles.ts
│   │   ├── 1726000000001-CreateCourses.ts
│   │   ├── 1726000000002-CreateAssessments.ts
│   │   ├── 1726000000003-CreateLearningPaths.ts
│   │   ├── 1726000000004-CreateUserProgress.ts
│   │   └── 1726000000005-SeedCourses.ts
│   │
│   ├── auth/                          # Autenticación Discord + JWT
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── strategies/
│   │       ├── discord.strategy.ts
│   │       └── jwt.strategy.ts
│   │
│   ├── courses/                       # Catálogo de cursos DevTalles
│   │   ├── courses.module.ts
│   │   ├── courses.controller.ts
│   │   └── courses.service.ts
│   │
│   ├── assessments/                   # Cuestionario de habilidades
│   │   ├── assessments.module.ts
│   │   ├── assessments.controller.ts
│   │   ├── assessments.service.ts
│   │   └── dto/
│   │       └── create-assessment.dto.ts
│   │
│   ├── learning-paths/                # Rutas de aprendizaje generadas
│   │   ├── learning-paths.module.ts
│   │   ├── learning-paths.controller.ts
│   │   └── learning-paths.service.ts
│   │
│   ├── ai/                            # Integración Claude API
│   │   ├── ai.module.ts
│   │   └── ai.service.ts
│   │
│   └── common/                        # Utilidades compartidas
│       ├── guards/
│       │   └── jwt-auth.guard.ts
│       └── decorators/
│           └── get-user.decorator.ts
│
├── Dockerfile                         # Multi-stage: builder + production
├── docker-compose.yml                 # Backend + PostgreSQL local
├── docker-compose.prod.yml            # Solo backend (BD en DigitalOcean)
├── .env.example                       # Plantilla de variables
├── nest-cli.json
├── tsconfig.json
├── package.json
└── README.md
```

---

## Módulos

### `AppModule` — Raíz

Configura TypeORM de forma global con la conexión a PostgreSQL.

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false,   // NUNCA true en producción
        ssl: { rejectUnauthorized: false }, // requerido en DigitalOcean
      }),
    }),
    AuthModule,
    CoursesModule,
    AssessmentsModule,
    LearningPathsModule,
    AiModule,
  ],
})
export class AppModule {}
```

---

### `AuthModule`

Maneja Discord OAuth2 y JWT. Usa el repositorio de `Profile` para upsert de usuarios.

```
AuthModule
  ├── AuthController
  │     ├── GET  /api/v1/auth/discord            → redirige a Discord
  │     ├── GET  /api/v1/auth/discord/callback   → crea/actualiza perfil, genera JWT
  │     └── GET  /api/v1/auth/me                 → perfil del usuario autenticado
  │
  ├── AuthService
  │     ├── findOrCreateUser(profile)   → upsert con TypeORM Repository<Profile>
  │     ├── generateToken(user)         → firma JWT {sub, discordId, username}
  │     └── getProfile(userId)          → findOne por id
  │
  └── Strategies
        ├── DiscordStrategy  → scope: identify, email, guilds
        └── JwtStrategy      → extrae Bearer token del header
```

**Flujo de autenticación:**
```
1. GET /auth/discord         → Passport redirige a discord.com/oauth2
2. Discord devuelve code     → Callback en /auth/discord/callback
3. DiscordStrategy valida    → llama AuthService.findOrCreateUser()
4. TypeORM hace upsert       → en tabla profiles
5. JWT firmado               → redirect frontend?token=<jwt>
6. Frontend guarda token     → localStorage
7. Requests siguientes       → Authorization: Bearer <token>
```

---

### `CoursesModule`

Catálogo de cursos DevTalles. Usa `Repository<Course>` con TypeORM.

```
CoursesModule
  ├── CoursesController (requiere JWT)
  │     ├── GET /api/v1/courses                  → lista con filtros ?category= &level=
  │     ├── GET /api/v1/courses/categories       → categorías únicas
  │     └── GET /api/v1/courses/:id              → detalle de un curso
  │
  └── CoursesService
        ├── findAll(filters?)      → QueryBuilder con WHERE dinámico
        ├── findById(id)           → findOneOrFail
        ├── getCategories()        → SELECT DISTINCT category
        └── getCatalogSummary()    → select mínimo para el prompt de IA
```

**Ejemplo con TypeORM QueryBuilder:**
```typescript
findAll(filters?: { category?: string; level?: string }) {
  const qb = this.coursesRepo.createQueryBuilder('course')
  if (filters?.category) qb.andWhere('course.category = :cat', { cat: filters.category })
  if (filters?.level)    qb.andWhere('course.level = :lvl',    { lvl: filters.level })
  return qb.orderBy('course.title').getMany()
}
```

---

### `AssessmentsModule`

Orquesta el cuestionario → IA → guardado de ruta.

```
AssessmentsModule
  ├── AssessmentsController (requiere JWT)
  │     ├── POST /api/v1/assessments   → cuestionario → genera ruta con IA
  │     └── GET  /api/v1/assessments   → historial del usuario
  │
  └── AssessmentsService
        └── createAndGeneratePath(userId, dto)
              1. Crea UserAssessment (TypeORM save)
              2. Llama AiService.generateLearningPath()
              3. Crea LearningPath con courses_order JSON
              4. Crea registros UserProgress (insert bulk)
              5. Retorna { assessment, learningPath }
```

**DTO:**
```typescript
class CreateAssessmentDto {
  @IsArray()
  interests: string[]           // ['frontend', 'backend', 'devops']

  @IsString()
  goals: string                 // meta profesional en texto libre

  @IsEnum(['beginner','intermediate','advanced'])
  currentLevel: string

  @IsNumber() @Min(1) @Max(40)
  availableHoursPerWeek: number

  @IsOptional() @IsArray()
  preferredTechnologies?: string[]
}
```

---

### `LearningPathsModule`

CRUD de rutas + sistema de progreso por curso.

```
LearningPathsModule
  ├── LearningPathsController (requiere JWT)
  │     ├── GET    /api/v1/learning-paths                           → mis rutas + % progreso
  │     ├── GET    /api/v1/learning-paths/:id                       → detalle con cursos
  │     ├── PATCH  /api/v1/learning-paths/:pathId/progress/:courseId → toggle completado
  │     └── DELETE /api/v1/learning-paths/:id                       → eliminar ruta
  │
  └── LearningPathsService
        ├── findAllByUser(userId)    → find con relaciones + calcular % progreso
        ├── findOne(id, userId)      → find con JOIN a courses y progress
        ├── toggleCourseProgress()   → update completed + completedAt
        └── remove(id, userId)       → delete en cascada
```

---

### `AiModule`

Integración con Anthropic Claude API.

```
AiModule
  └── AiService
        └── generateLearningPath(assessment)
              1. Obtiene catálogo: CoursesService.getCatalogSummary()
              2. Construye system prompt (reglas + formato JSON estricto)
              3. Construye user message (perfil + catálogo completo)
              4. POST a claude-sonnet-4-6 (max_tokens: 2000)
              5. Parsea respuesta JSON
              6. Retorna GeneratedPath tipado
```

**Respuesta esperada de Claude:**
```json
{
  "title": "Tu ruta hacia Fullstack JavaScript",
  "description": "Descripción de 2-3 oraciones del recorrido",
  "estimatedWeeks": 24,
  "totalHours": 148,
  "courses": [
    {
      "courseId": "uuid-exacto-del-catalogo",
      "order": 1,
      "reason": "Por qué este curso en este momento"
    }
  ],
  "tips": ["Consejo 1", "Consejo 2", "Consejo 3"]
}
```

---

## Base de datos con TypeORM

### Conexión a DigitalOcean PostgreSQL

DigitalOcean provee una **Connection String** en formato:

```
postgresql://usuario:password@host:puerto/nombre_db?sslmode=require
```

Se pone en `DATABASE_URL` y TypeORM la usa directamente. El SSL es **obligatorio** en DigitalOcean.

```typescript
// config/database.config.ts
export const databaseConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: config.get<string>('DATABASE_URL'),
  entities: [Profile, Course, UserAssessment, LearningPath, UserProgress],
  migrations: ['dist/migrations/*{.ts,.js}'],
  synchronize: false,      // usar migrations en producción
  logging: config.get('NODE_ENV') === 'development',
  ssl: {
    rejectUnauthorized: false,  // requerido para DigitalOcean managed DB
  },
})
```

---

## Entidades

### `Profile` — tabla `profiles`

```typescript
@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  discordId: string

  @Column()
  username: string

  @Column({ nullable: true })
  email: string

  @Column({ nullable: true })
  avatarUrl: string

  @OneToMany(() => LearningPath, path => path.user)
  learningPaths: LearningPath[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

---

### `Course` — tabla `courses`

```typescript
@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column()
  category: string    // 'frontend' | 'backend' | 'fullstack' | 'devops' | 'mobile' | 'databases'

  @Column()
  level: string       // 'beginner' | 'intermediate' | 'advanced'

  @Column({ nullable: true })
  url: string

  @Column({ nullable: true })
  durationHours: number

  @Column('text', { array: true, default: [] })
  tags: string[]

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date
}
```

---

### `UserAssessment` — tabla `user_assessments`

```typescript
@Entity('user_assessments')
export class UserAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Profile

  @Column('text', { array: true })
  interests: string[]

  @Column('text')
  goals: string

  @Column()
  currentLevel: string

  @Column()
  availableHoursPerWeek: number

  @Column('text', { array: true, default: [] })
  preferredTechnologies: string[]

  @CreateDateColumn()
  createdAt: Date
}
```

---

### `LearningPath` — tabla `learning_paths`

```typescript
@Entity('learning_paths')
export class LearningPath {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Profile

  @ManyToOne(() => UserAssessment)
  @JoinColumn({ name: 'assessment_id' })
  assessment: UserAssessment

  @Column()
  title: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ nullable: true })
  estimatedWeeks: number

  @Column({ nullable: true })
  totalHours: number

  @Column({ type: 'jsonb', default: [] })
  coursesOrder: { courseId: string; order: number; reason: string }[]

  @Column('text', { array: true, default: [] })
  tips: string[]

  @OneToMany(() => UserProgress, progress => progress.learningPath, { cascade: true })
  userProgress: UserProgress[]

  @CreateDateColumn()
  createdAt: Date
}
```

---

### `UserProgress` — tabla `user_progress`

```typescript
@Entity('user_progress')
@Unique(['learningPath', 'course'])
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Profile

  @ManyToOne(() => LearningPath, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'learning_path_id' })
  learningPath: LearningPath

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course

  @Column({ default: 1 })
  order: number

  @Column({ default: false })
  completed: boolean

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date

  @CreateDateColumn()
  createdAt: Date
}
```

---

### Diagrama de relaciones

```
Profile ──< UserAssessment
Profile ──< LearningPath ──< UserProgress >── Course
LearningPath ──< UserProgress
```

---

## Migrations

Las migrations controlan los cambios al schema sin perder datos.

### Comandos

```bash
# Generar migration automática desde cambios en entidades
npm run migration:generate -- src/migrations/NombreCambio

# Crear migration vacía (para datos/seeds)
npm run migration:create -- src/migrations/SeedCourses

# Ejecutar todas las migrations pendientes
npm run migration:run

# Revertir la última migration
npm run migration:revert

# Ver estado de migrations
npm run migration:show
```

### Scripts en package.json

```json
{
  "scripts": {
    "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/config/data-source.ts",
    "migration:create":   "typeorm-ts-node-commonjs migration:create",
    "migration:run":      "typeorm-ts-node-commonjs migration:run -d src/config/data-source.ts",
    "migration:revert":   "typeorm-ts-node-commonjs migration:revert -d src/config/data-source.ts",
    "migration:show":     "typeorm-ts-node-commonjs migration:show -d src/config/data-source.ts"
  }
}
```

### DataSource para CLI

```typescript
// src/config/data-source.ts
import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'
dotenv.config()

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  ssl: { rejectUnauthorized: false },
})
```

### Flujo de trabajo con migrations

```
Cambiar entidad → npm run migration:generate → revisar migration → npm run migration:run
```

En **producción** (DigitalOcean), las migrations corren automáticamente al iniciar el contenedor:

```dockerfile
CMD ["sh", "-c", "node dist/node_modules/typeorm/cli.js migration:run -d dist/config/data-source.js && node dist/main"]
```

---

## API Reference

Base URL: `https://tu-backend.ondigitalocean.app/api/v1`
Documentación interactiva: `/docs` (Swagger UI)

### Auth

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/auth/discord` | — | Iniciar login con Discord |
| GET | `/auth/discord/callback` | — | Callback OAuth2 → genera JWT |
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
| GET | `/learning-paths` | JWT | Mis rutas con % de progreso |
| GET | `/learning-paths/:id` | JWT | Detalle con cursos y progreso |
| PATCH | `/learning-paths/:pathId/progress/:courseId` | JWT | Marcar/desmarcar curso completado |
| DELETE | `/learning-paths/:id` | JWT | Eliminar una ruta |

---

## Variables de entorno

```bash
# ── App ──────────────────────────────────────────────
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://tu-frontend.ondigitalocean.app

# ── Base de datos (DigitalOcean PostgreSQL) ──────────
# Obtener en: DigitalOcean → Databases → tu cluster → Connection String
DATABASE_URL=postgresql://usuario:password@host:25060/defaultdb?sslmode=require

# ── JWT ──────────────────────────────────────────────
JWT_SECRET=cadena-super-secreta-minimo-64-caracteres
# Generar con: openssl rand -base64 64
JWT_EXPIRES_IN=7d

# ── Discord OAuth2 ───────────────────────────────────
# Crear en: https://discord.com/developers/applications
DISCORD_CLIENT_ID=1234567890123456789
DISCORD_CLIENT_SECRET=AbCdEfGhIjKlMnOpQrSt
DISCORD_CALLBACK_URL=https://tu-backend.ondigitalocean.app/api/v1/auth/discord/callback
DEVTALLES_GUILD_ID=1130900724499365958

# ── Anthropic Claude API ─────────────────────────────
# Obtener en: https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

## Correr en local

### Requisitos

- Node.js 20+
- Docker y Docker Compose (para PostgreSQL local)
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

# 4. Levantar PostgreSQL local con Docker
docker compose up -d postgres

# 5. Ejecutar migrations (crea las tablas)
npm run migration:run

# 6. Correr en modo desarrollo
npm run start:dev
```

```
API disponible en:  http://localhost:3000/api/v1
Swagger docs en:    http://localhost:3000/docs
```

### docker-compose.yml (desarrollo local)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:17-alpine
    container_name: codequest-db
    ports:
      - '5432:5432'
    environment:
      POSTGRES_DB: codequest
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    container_name: codequest-backend
    ports:
      - '3000:3000'
    env_file: .env
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Con esto, la `DATABASE_URL` local sería:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/codequest
```

---

## Docker

### Dockerfile (multi-stage)

```dockerfile
# ── Stage 1: Build ───────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: Production ──────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist
EXPOSE 3000
# Corre migrations y luego levanta el servidor
CMD ["sh", "-c", "node dist/node_modules/.bin/typeorm migration:run -d dist/config/data-source.js && node dist/main"]
```

**Por qué multi-stage:** la imagen final solo tiene el código compilado y dependencias de producción. Resultado: imagen ~150MB en vez de ~600MB.

---

## Deploy en DigitalOcean

### Paso 1 — Crear la base de datos PostgreSQL

```
DigitalOcean → Databases → Create Database
  Engine:   PostgreSQL 17
  Plan:     Basic · 1GB RAM · $15/mes
  Region:   New York (o el más cercano)
  Nombre:   codequest-db
```

Una vez creada, copiar la **Connection String** que aparece en el panel.

### Paso 2 — Deploy del backend en App Platform

```
DigitalOcean → App Platform → Create App
  Fuente:         GitHub → codequest-backend
  Branch:         main
  Build Command:  npm run build
  Run Command:    node dist/main
  Port:           3000
  Plan:           Basic · $5/mes
```

Agregar variables de entorno en App Platform:

```
DATABASE_URL          → connection string de tu PostgreSQL DO
PORT                  → 3000
NODE_ENV              → production
FRONTEND_URL          → URL del frontend desplegado
JWT_SECRET            → cadena aleatoria segura
JWT_EXPIRES_IN        → 7d
DISCORD_CLIENT_ID     → de Discord Developer Portal
DISCORD_CLIENT_SECRET → de Discord Developer Portal
DISCORD_CALLBACK_URL  → https://tu-backend.ondigitalocean.app/api/v1/auth/discord/callback
DEVTALLES_GUILD_ID    → 1130900724499365958
ANTHROPIC_API_KEY     → de console.anthropic.com
```

### Paso 3 — Actualizar Discord OAuth2

```
discord.com/developers/applications
  → Tu app → OAuth2 → Redirects
  → Agregar: https://tu-backend.ondigitalocean.app/api/v1/auth/discord/callback
```

### Checklist pre-entrega

```
[ ] PostgreSQL creado en DigitalOcean
[ ] Migrations ejecutadas correctamente
[ ] Backend responde en /api/v1/docs (Swagger visible)
[ ] GET /api/v1/auth/discord redirige a Discord correctamente
[ ] DISCORD_CALLBACK_URL apunta a la URL real de producción
[ ] Frontend apunta al backend de producción en VITE_API_URL
[ ] Login con Discord funciona end-to-end
[ ] Cuestionario genera ruta con IA
[ ] Progreso de cursos se guarda correctamente
[ ] No hay commits después del 28 sep 10:00AM GMT-6
```

---

## Ramas de Git

```
main                    ← producción (protegida)
develop                 ← integración
├── feature/auth        ← Discord OAuth2 + JWT
├── feature/courses     ← catálogo y filtros
├── feature/assessments ← cuestionario + IA
├── feature/paths       ← rutas y progreso
├── feature/migrations  ← schema y seeds TypeORM
└── feature/docker      ← Dockerfile y deploy
```

**Flujo:**
```
feature/* → PR a develop → revisión → merge → PR a main → deploy automático
```

Cada PR debe incluir:
- Descripción clara del cambio
- Migrations si hay cambios en el schema
- Al menos 1 reviewer del equipo

---

## Costos

### Stack completo en DigitalOcean

| Servicio | Plan | Precio/mes |
|---|---|---|
| App Platform — Backend | Basic (512MB) | $5.00 |
| App Platform — Frontend | Static Site | $0.00 |
| Managed PostgreSQL | Basic 1GB | $15.00 |
| **Total** | | **$20.00/mes** |

### Para el hackathon (14 días)

DigitalOcean otorga **$200 en créditos gratuitos** a cuentas nuevas válidos por 60 días.

```
Costo real del hackathon = $0.00 💚
(los $200 de crédito cubren ampliamente los 14 días)
```

---

## Dependencias principales

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@anthropic-ai/sdk": "^0.24.0",
    "typeorm": "^0.3.20",
    "pg": "^8.11.0",
    "passport": "^0.7.0",
    "passport-discord": "^0.1.4",
    "passport-jwt": "^4.0.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "typeorm-ts-node-commonjs": "^0.3.20",
    "typescript": "^5.1.3"
  }
}
```

---

## Licencia

MIT — ver `LICENSE`

---

*Code Quest 2026 · DevTalles · Equipo [nombre del equipo]*
