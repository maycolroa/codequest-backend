<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

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
10. [Guía rápida para levantar el proyecto](#guía-rápida-para-levantar-el-proyecto)
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

| Capa           | Tecnología                       | Versión          |
| -------------- | --------------------------------- | ----------------- |
| Runtime        | Node.js (Docker)                  | 22.22.3           |
| Gestor         | npm                               | 10.9.8 (Docker)   |
| Framework      | NestJS                            | 12                |
| Lenguaje       | TypeScript                        | 6                 |
| ORM            | TypeORM                           | 0.3.x             |
| Base de datos  | PostgreSQL (DigitalOcean Managed) | 17                |
| Autenticación | Discord OAuth2 + JWT              | —                |
| IA             | Anthropic Claude API              | claude-sonnet-4-6 |
| Contenedores   | Docker + Docker Compose           | 24+               |
| Deploy         | DigitalOcean App Platform         | —                |
| Documentación | Swagger (OpenAPI 3.0)             | —                |

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
│   │   ├── entities/                   # Skill, Question, QuestionOption, QuizAttempt, QuizAnswer
│   │   ├── scoring/                    # Cálculo puro y pruebas unitarias
│   │   ├── migrations/
│   │   └── dto/
│   │
│   ├── learning-paths/                # Rutas de aprendizaje generadas
│   │   ├── learning-paths.module.ts
│   │   ├── learning-paths.controller.ts
│   │   └── learning-paths.service.ts
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
  │     ├── POST /api/v1/assessments/users/:profileId/skills/:skillId/start
  │     ├── POST /api/v1/assessments/users/:profileId/attempts/:attemptId/answers
  │     ├── POST /api/v1/assessments/users/:profileId/attempts/:attemptId/complete
  │     └── GET  /api/v1/assessments/users/:profileId/my-skills
  │
  └── AssessmentsService
        └── guarda un snapshot inmutable de las preguntas al iniciar,
            calcula score ponderado y persiste intentos por skill
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

Generación de rutas + CRUD + sistema de progreso por curso. No existe un `AiModule` independiente: la generación de rutas vive dentro de este módulo y usa `CoursesService.getCatalogSummary()` para obtener el catálogo.

```
LearningPathsModule
  ├── LearningPathsController (requiere JWT)
  │     ├── POST   /api/v1/learning-paths/users/:profileId/generate → generar y guardar rutas
  │     ├── GET    /api/v1/learning-paths/users/:profileId → rutas del usuario autenticado
  │     ├── GET    /api/v1/learning-paths/users/:profileId/:id → detalle con cursos/lecciones
  │     ├── PATCH  /api/v1/learning-paths/users/:profileId/:pathId/courses/:courseId/lessons/:lessonId/progress
  │     └── DELETE /api/v1/learning-paths/users/:profileId/:id → eliminar ruta
  │
  └── LearningPathsService
        ├── generate(profileId, dto)  → rankea el catálogo por intereses y nivel, guarda la ruta
        ├── findAllByUser(userId)    → find con relaciones + calcular % progreso
        ├── findOne(id, userId)      → find con JOIN a courses y progress
        ├── toggleCourseProgress()   → update completed + completedAt
        └── remove(id, userId)       → delete en cascada
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
# Ejecutar todas las migrations pendientes
npm run migration:run

# Revertir la última migration
npm run migration:revert

# Ver estado de migrations
npm run migration:show
```

### Migraciones del proyecto

El proyecto tiene **16 migraciones numeradas del 0000 al 0015**, repartidas por módulo. Las de galaxias (0008 y 0009) ya están **aplicadas en producción**.

| #    | Archivo                                                   | Módulo           |
| ---- | --------------------------------------------------------- | ---------------- |
| 0000 | `1726000000000-CreateProfiles`                            | auth             |
| 0001 | `1726000000001-AddLocalAuthentication`                    | auth             |
| 0002 | `1726000000002-CreateCourses`                             | courses          |
| 0003 | `1726000000003-AddSuperAdminRole`                         | auth             |
| 0004 | `1726000000004-AddCourseCatalogMetadata`                  | courses          |
| 0005 | `1726000000005-CreateUserCourseProgress`                  | courses          |
| 0006 | `1726000000006-SeedDevTallesCourses`                      | courses          |
| 0007 | `1726000000007-CreateCourseLessonsAndAutomaticProgress`   | courses          |
| 0008 | `1726000000008-AddCourseGalaxyFields`                     | courses          |
| 0009 | `1726000000009-ClassifyCoursesIntoGalaxies`               | courses          |
| 0010 | `1726000000010-SeedInitialAssessmentQuestions`            | assessments      |
| 0011 | `1726000000011-CreateLearningPaths`                       | learning-paths   |
| 0012 | `1726000000012-UseLessonProgress`                         | learning-paths   |
| 0013 | `1726000000013-SeedCourseLessons`                         | courses          |
| 0014 | `1726000000014-AddCourseCategoryToProgress`               | courses          |
| 0015 | `1726000000015-AddLessonDurations`                        | courses          |

> ⚠️ Además, `src/assessments/migrations/` contiene `1726000000008-CreateAssessments` y `1726000000009-CreateQuizAttemptQuestionSnapshots`, que **comparten número** con 0008 y 0009. En total hay 18 archivos. Verifica el estado real con `npm run migration:show`.

### Scripts en package.json

```json
{
  "scripts": {
    "migration:run":    "typeorm-ts-node-commonjs migration:run -d src/auth/config/data-source.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/auth/config/data-source.ts",
    "migration:show":   "typeorm-ts-node-commonjs migration:show -d src/auth/config/data-source.ts"
  }
}
```

> No hay scripts `migration:generate` ni `migration:create`. Las migrations se escriben a mano y **deben registrarse explícitamente** en el array `migrations` de `src/auth/config/data-source.ts` (el CLI no usa globs).

### DataSource para CLI

`src/auth/config/data-source.ts` lee `DATABASE_URL` desde `.env` (vía `dotenv/config`) e importa cada entidad y migration de forma explícita. Usa SSL solo cuando `NODE_ENV=production`.

### Flujo de trabajo con migrations

```
Crear archivo en <módulo>/migrations → registrarlo en data-source.ts → npm run migration:run
```

En **producción** las migrations **no** corren automáticamente: el `Dockerfile` de producción solo ejecuta `node dist/main`. Hay que correrlas manualmente contra la BD de DigitalOcean:

```bash
DATABASE_URL="<connection-string-de-produccion>" NODE_ENV=production npm run migration:run
```

---

## API Reference

| Entorno                  | Base URL de la API                                        | Swagger UI                                         |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------- |
| Local (`npm run start:dev`) | `http://localhost:3000/api/v1`                          | `http://localhost:3000/docs`                       |
| Local (Docker Compose)   | `http://localhost:3001/api/v1` (o el `API_PORT` que definas) | `http://localhost:3001/docs`                    |
| Producción               | `https://codequest-backend-7ogey.ondigitalocean.app/api/v1` | `https://codequest-backend-7ogey.ondigitalocean.app/docs` |

> Swagger se monta en `/docs`, **fuera** del prefijo `/api/v1`.

### Auth

| Método | Ruta                       | Auth | Descripción                  |
| ------- | -------------------------- | ---- | ----------------------------- |
| GET     | `/auth/discord`          | —   | Iniciar login con Discord     |
| GET     | `/auth/discord/callback` | —   | Callback OAuth2 → genera JWT |
| POST    | `/auth/register`         | —   | Crear cuenta con correo y contraseña |
| POST    | `/auth/login`            | —   | Login con correo y contraseña → JWT |
| POST    | `/auth/password/change`  | JWT  | Cambiar contraseña de la cuenta local |
| GET     | `/auth/me`               | JWT  | Perfil del usuario actual     |

### Devi

| Método | Ruta         | Auth | Descripción                                   |
| ------- | ------------ | ---- | ---------------------------------------------- |
| POST    | `/devi/ask`  | JWT  | Enviar una pregunta al agente Devi (OpenAI)   |

### Courses

| Método | Ruta                    | Auth | Descripción                                             |
| ------- | ----------------------- | ---- | -------------------------------------------------------- |
| GET     | `/courses`            | JWT  | Listar cursos (`?category=backend&level=intermediate`) |
| GET     | `/courses/categories` | JWT  | Categorías disponibles                                  |
| GET     | `/courses/galaxy`     | JWT  | Cursos con posición 3D agrupados en 7 galaxias (`galaxies`, `galaxyColor`, `position_x/y/z`) |
| GET     | `/courses/:id`        | JWT  | Detalle de un curso                                      |

### Assessments

| Método | Ruta | Auth | Descripción |
| ------- | ---- | ---- | ----------- |
| POST | `/assessments/users/:profileId/skills/:skillId/start` | JWT + ID validado | Iniciar intento y recibir preguntas sin respuestas correctas |
| POST | `/assessments/users/:profileId/attempts/:attemptId/answers` | JWT + ID validado | Guardar o actualizar una respuesta |
| POST | `/assessments/users/:profileId/attempts/:attemptId/complete` | JWT + ID validado | Calcular score y nivel |
| GET | `/assessments/users/:profileId/attempts/:attemptId/result` | JWT + ID validado | Consultar resultado finalizado |
| GET | `/assessments/users/:profileId/my-skills` | JWT + ID validado | Consultar el nivel vigente de cada skill evaluada |
| POST | `/assessments/questions` | Superadmin | Crear una pregunta y sus opciones |
| GET | `/assessments/admin/skills` | Superadmin | Listar skills, incluidas las inactivas |
| POST/PATCH/DELETE | `/assessments/admin/skills[/:skillId]` | Superadmin | Administrar skills; DELETE las desactiva |
| GET | `/assessments/admin/skills/:skillId/questions` | Superadmin | Listar preguntas de una skill, con respuesta correcta |
| GET/PATCH/DELETE | `/assessments/admin/questions/:questionId` | Superadmin | Consultar, editar o desactivar una pregunta |

### Learning Paths

| Método | Ruta                                           | Auth | Descripción                      |
| ------- | ---------------------------------------------- | ---- | --------------------------------- |
| GET     | `/learning-paths/users/:profileId` | JWT + ID validado | Rutas del estudiante |
| GET     | `/learning-paths/users/:profileId/:id` | JWT + ID validado | Detalle con cursos, lecciones y progreso |
| PATCH   | `/learning-paths/users/:profileId/:pathId/courses/:courseId/lessons/:lessonId/progress` | JWT + ID validado | Marcar/desmarcar una lección |
| DELETE  | `/learning-paths/users/:profileId/:id` | JWT + ID validado | Eliminar una ruta |

---

## Variables de entorno

La plantilla está en `.env.example`. **Nunca** subas el `.env` con valores reales al repositorio.

| Variable                | Obligatoria | Descripción                                                                                           | Dónde obtenerla                                   |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `PORT`                  | No (3000)   | Puerto en el que escucha Nest.                                                                         | —                                                 |
| `API_PORT`              | No (3001)   | Puerto del host donde Docker Compose publica la API (solo Compose).                                    | —                                                 |
| `NODE_ENV`              | Sí          | `development` o `production`. En `production` el CLI de migrations usa SSL.                            | —                                                 |
| `FRONTEND_URL`          | Sí          | Origen permitido por CORS y destino del redirect tras el login con Discord.                           | URL del frontend (local: `http://localhost:5173`) |
| `DATABASE_URL`          | Sí          | Connection string de PostgreSQL `postgresql://<usuario>:<password>@<host>:<puerto>/<db>`.              | Local: la del `docker-compose.yml` · Prod: DigitalOcean → Databases → Connection String |
| `POSTGRES_USER`         | Sí (Compose) | Usuario que crea el contenedor de PostgreSQL local.                                                   | Lo eliges tú                                      |
| `POSTGRES_PASSWORD`     | Sí (Compose) | Contraseña del PostgreSQL local.                                                                      | Lo eliges tú                                      |
| `POSTGRES_DB`           | Sí (Compose) | Nombre de la base de datos local.                                                                     | Lo eliges tú                                      |
| `JWT_SECRET`            | Sí          | Clave para firmar los JWT. La app no arranca sin ella.                                                 | `openssl rand -base64 64`                         |
| `JWT_EXPIRES_IN`        | No (`7d`)   | Tiempo de expiración de los JWT.                                                                       | —                                                 |
| `DISCORD_CLIENT_ID`     | Sí          | Client ID de la app OAuth2 de Discord. La app no arranca sin ella.                                     | discord.com/developers/applications → OAuth2      |
| `DISCORD_CLIENT_SECRET` | Sí          | Client secret de la app OAuth2 de Discord.                                                             | discord.com/developers/applications → OAuth2      |
| `DISCORD_CALLBACK_URL`  | Sí          | URL de callback registrada en Discord (`<base-url-api>/auth/discord/callback`).                        | Debe coincidir exactamente con la de Discord      |
| `OPENAI_API_KEY`        | Sí          | API key usada por el módulo Devi. La app **no arranca** sin ella.                                      | platform.openai.com → API keys                    |
| `OPENAI_AGENT_ID`       | Sí          | ID del agente de OpenAI que responde en `/devi/ask`. La app **no arranca** sin ella.                   | platform.openai.com                               |
| `DEVTALLES_GUILD_ID`    | No          | ID del servidor de Discord de DevTalles. Actualmente no la lee el código.                              | Discord (modo desarrollador → copiar ID)          |
| `ANTHROPIC_API_KEY`     | No          | Reservada para generación con Claude. La generación de rutas actual no la usa.                        | console.anthropic.com → API Keys                  |

---

## ⚡ Guía rápida para levantar el proyecto

> Sigue estos pasos en orden. Cada paso depende del anterior.

---

### Requisitos previos

| Herramienta    | Versión                  | Necesaria para                                           |
| -------------- | ------------------------ | -------------------------------------------------------- |
| Node.js        | `>=22.22.3 <25`          | Correr la API fuera de Docker (`npm run start:dev`)      |
| npm            | `>=10.9.3 <12`           | Instalar dependencias y correr scripts                   |
| Docker + Compose | 24+                    | Levantar PostgreSQL (y opcionalmente la API) en local    |
| PostgreSQL     | 17                       | Lo provee Docker (`postgres:17-alpine`); solo instálalo si no usas Docker |
| Git            | cualquiera               | Clonar el repositorio                                    |

```bash
node --version           # v22.22.3 o superior
npm --version            # 10.9.3 o superior
docker --version         # Docker version 24.x.x o superior
docker compose version
```

Si algo falta:

- **Node.js:** https://nodejs.org (o `nvm install 22`)
- **Docker:** https://docs.docker.com/get-docker

> Si levantas todo con Docker Compose (opción A), Node.js corre dentro del contenedor y no es obligatorio en tu equipo.

---

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/maycolroa/codequest-backend.git
cd codequest-backend
```

### Paso 1.1 — Instalar dependencias (solo si corres la API fuera de Docker)

```bash
npm ci
```

---

### Paso 2 — Configurar variables de entorno

```bash
# Copiar la plantilla
cp .env.example .env
```

Ahora abre el archivo `.env` y rellena cada variable:

```bash
# Abrir con VS Code
code .env

# O con nano en la terminal
nano .env
```

Rellena **todas** las variables marcadas como obligatorias en la tabla de [Variables de entorno](#variables-de-entorno). Sin `JWT_SECRET`, `DISCORD_*`, `FRONTEND_URL`, `OPENAI_API_KEY` u `OPENAI_AGENT_ID` la API no arranca.

Para desarrollo local:

- `DATABASE_URL` debe apuntar a `localhost:5432` con los mismos `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` (Compose la sobrescribe dentro del contenedor de la API).
- `DISCORD_CALLBACK_URL` debe ser `http://localhost:3000/api/v1/auth/discord/callback` (o `3001` si usas la API en Docker).

---

### Paso 3 — Levantar la base de datos y la API

Elige **una** de las dos opciones.

**Opción A — Todo en Docker (API + PostgreSQL)**

```bash
docker compose up --build -d
docker ps   # Debe mostrar: codequest-api-dev y codequest-postgres-dev
```

La API corre con `npm run start:dev` (hot reload) dentro del contenedor y se publica en `http://localhost:3001`. Logs: `docker compose logs -f api`.

**Opción B — PostgreSQL en Docker, API con Node local**

```bash
docker compose up -d postgres_db_dev   # solo la base de datos, en localhost:5432
```

> 💡 La primera vez descarga la imagen de PostgreSQL. Las siguientes veces es instantáneo.

---

### Paso 4 — Ejecutar las migrations

```bash
# Opción A (dentro del contenedor)
docker compose exec api npm run migration:run

# Opción B (desde tu equipo)
npm run migration:run
```

Crea todas las tablas y carga los seeds (cursos, lecciones y preguntas). Para ver el estado: `npm run migration:show`.

---

### Paso 5 — Iniciar el servidor (solo opción B)

```bash
npm run start:dev
```

En la opción A el servidor ya está corriendo desde el Paso 3.

---

### Paso 6 — Verificar que todo funciona

Abre Swagger UI en el navegador:

```
http://localhost:3000/docs   # opción B
http://localhost:3001/docs   # opción A
```

Prueba un endpoint público:

```bash
curl -i http://localhost:3000/api/v1/auth/discord
# Respuesta: 302 con redirección a discord.com
```

---

### Paso 7 — Configurar Discord OAuth2 (para probar el login)

1. Ir a [discord.com/developers/applications](https://discord.com/developers/applications)
2. Seleccionar tu aplicación → **OAuth2** → **Redirects**
3. Agregar: `http://localhost:3000/api/v1/auth/discord/callback`
4. Guardar cambios
5. Probar en el navegador: `http://localhost:3000/api/v1/auth/discord`

---

### Comandos útiles del día a día

```bash
# Servidor
npm run start:dev          # desarrollo con hot reload
npm run start:debug        # desarrollo + inspector
npm run build              # compilar a dist/
npm run start:prod         # correr dist/main

# Migrations
npm run migration:run
npm run migration:revert
npm run migration:show

# Calidad
npm run lint
npm test
npm run test:e2e
npx tsc --noEmit

# Docker
docker compose up --build -d
docker compose logs -f api
docker compose exec api npm run migration:run
docker compose down
```

---

### Solución de problemas comunes

**❌ Error: `connect ECONNREFUSED 127.0.0.1:5432`**

```bash
# PostgreSQL no está corriendo
docker compose up -d postgres_db_dev
docker ps  # verificar que aparece codequest-postgres-dev
```

**❌ Error: `Cannot find module '@nestjs/config'`**

```bash
# Faltan dependencias
npm install
```

**❌ Error: `JWT_SECRET is not defined`**

```bash
# Falta el archivo .env
cp .env.example .env
# Luego rellenar las variables
```

**❌ Error en Discord callback: `redirect_uri_mismatch`**

```
Verificar que en Discord Developer Portal el redirect URL sea exactamente:
http://localhost:3000/api/v1/auth/discord/callback
(sin slash al final, con /api/v1)
```

**❌ Error: `OPENAI_API_KEY y OPENAI_AGENT_ID son obligatorias para Devi`**

```
Agregar ambas variables al .env (ver Variables de entorno).
```

**❌ Una migration nueva no se ejecuta**

```
Registrarla en el array `migrations` de src/auth/config/data-source.ts.
```

---

## Docker

El `Dockerfile` usa `node:22.22.3-alpine`, instala con `npm ci` y tiene etapas separadas para desarrollo y producción. Compose usa la etapa de desarrollo; los cambios en `src/` se recargan automáticamente.

La API del contenedor escucha internamente en `3000` y se publica en `http://localhost:3001` por defecto. Si necesitas otro puerto externo, configura `API_PORT` en `.env`; `PORT` queda reservado para Nest y permite ejecutar `npm run start:dev` localmente en `3000` al mismo tiempo.

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
FRONTEND_URL          → URL pública del frontend
JWT_SECRET            → cadena aleatoria segura
JWT_EXPIRES_IN        → 7d
DISCORD_CLIENT_ID     → de Discord Developer Portal
DISCORD_CLIENT_SECRET → de Discord Developer Portal
DISCORD_CALLBACK_URL  → https://<backend>.ondigitalocean.app/api/v1/auth/discord/callback
OPENAI_API_KEY        → de platform.openai.com
OPENAI_AGENT_ID       → ID del agente Devi en OpenAI
```

### CI/CD — GitHub Actions + Autodeploy

El workflow `.github/workflows/deploy.yml` se dispara con cada push a `main` y **termina en `docker push`** al Container Registry de DigitalOcean:

```
push a main
  → GitHub Actions (checkout · doctl · doctl registry login)
  → docker build  (tags :latest y :<sha>)
  → docker push   → registry.digitalocean.com/codequest/backend
```

**No hay un paso explícito de deploy en el YAML.** El redeploy en App Platform ocurre automáticamente porque **Autodeploy** está activado en la app: cada nueva imagen `:latest` en el registry dispara un despliegue.

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
[ ] Backend responde en /docs (Swagger visible)
[ ] GET /api/v1/auth/discord redirige a Discord correctamente
[ ] DISCORD_CALLBACK_URL apunta a la URL real de producción
[ ] Frontend apunta al backend de producción en VITE_API_URL
[ ] Login con Discord funciona end-to-end
[ ] Cuestionario genera ruta con IA
[ ] Progreso de cursos se guarda correctamente
[ ] Token de GitHub revocado del remote URL (git remote set-url origin https://github.com/maycolroa/codequest-backend)
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

| Servicio                 | Plan          | Precio/mes           |
| ------------------------ | ------------- | -------------------- |
| App Platform — Backend  | Basic (512MB) | $5.00                |
| App Platform — Frontend | Static Site   | $0.00                |
| Managed PostgreSQL       | Basic 1GB     | $15.00               |
| **Total**          |               | **$20.00/mes** |

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
