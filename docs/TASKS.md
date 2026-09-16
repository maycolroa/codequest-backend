# ✅ TASKS.md — Tareas del Proyecto

> Tablero de tareas del backend.
> Mover tareas entre secciones cuando cambien de estado.
> Asignar con @nombre cuando trabajen en equipo.

---

## 🔴 Por hacer

### Configuración inicial del entorno (dependencias, env, Docker, main.ts)

- [ ] **Crear archivo `.env.example`**
  - Variables requeridas (ver `docs/CONTEXT.md` → sección "Variables de entorno requeridas"), con valores de ejemplo (NO reales):
    ```bash
    PORT=3000
    NODE_ENV=development

    FRONTEND_URL=http://localhost:5173

    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/codequest?sslmode=disable

    JWT_SECRET=reemplazar-con-un-string-aleatorio-largo
    JWT_EXPIRES_IN=7d

    DISCORD_CLIENT_ID=tu-discord-client-id
    DISCORD_CLIENT_SECRET=tu-discord-client-secret
    DISCORD_CALLBACK_URL=http://localhost:3000/api/v1/auth/discord/callback
    DEVTALLES_GUILD_ID=1130900724499365958

    ANTHROPIC_API_KEY=sk-ant-tu-api-key-aqui
    ```
  - ⚠️ **Advertencia:** el archivo `.env` real (con credenciales verdaderas) **nunca** debe subirse al repositorio — debe estar listado en `.gitignore`. Solo `.env.example` (con valores de ejemplo/placeholder) se versiona en git.

- [ ] **Crear `Dockerfile` multi-stage**
  - **Stage 1 (builder)**: parte de `node:20-alpine`, copia `package.json`/`package-lock.json`, corre `npm ci` (instala dependencias + devDependencies), copia el resto del código fuente y corre `npm run build` para generar la carpeta `dist/`.
  - **Stage 2 (production)**: parte de `node:20-alpine` limpio, copia `package.json`/`package-lock.json`, corre `npm ci --omit=dev` (solo dependencias de producción), y copia `dist/` (y la carpeta de `migrations` si vive fuera de `dist/`) desde el Stage 1.
  - **CMD**: debe correr las migrations antes de levantar el servidor, por ejemplo:
    ```dockerfile
    CMD ["sh", "-c", "npm run migration:run && node dist/main"]
    ```

- [ ] **Crear `docker-compose.yml`**
  - Servicios necesarios: `postgres` (imagen `postgres:17-alpine`) para desarrollo local; opcionalmente un servicio `backend` que build-ee desde el `Dockerfile` para levantar todo junto.
  - Variables de entorno del postgres local: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (deben coincidir con lo que use `DATABASE_URL` en `.env`).
  - Puerto: mapear `5432:5432`.
  - Volumen: un volumen nombrado (ej. `postgres_data`) montado en `/var/lib/postgresql/data` para persistir los datos entre reinicios.

- [ ] **Configurar `main.ts`**
  - Agregar `ValidationPipe` global (con `whitelist: true` y `transform: true`) vía `app.useGlobalPipes(...)`.
  - Agregar Swagger usando `DocumentBuilder` (título, descripción, versión) + `SwaggerModule.createDocument()` y `SwaggerModule.setup('docs', app, document)` para que quede disponible en `/docs` (ver `docs/CONTEXT.md`).
  - Agregar el prefijo global de rutas con `app.setGlobalPrefix('api/v1')`.
  - Habilitar CORS para el frontend con `app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true })`.

### Setup y configuración
- [ ] Crear repositorio en GitHub y configurar ramas (main, develop)
- [ ] Configurar GitHub Actions para CI básico (lint + build)
- [ ] Crear proyecto en DigitalOcean y base de datos PostgreSQL
- [ ] Configurar variables de entorno en DigitalOcean App Platform
- [ ] Crear aplicación en Discord Developer Portal y obtener credenciales

### Módulo Auth
- [ ] Crear `AuthModule` con imports correctos
- [ ] Implementar `DiscordStrategy` (passport-discord)
- [ ] Implementar `JwtStrategy` (passport-jwt)
- [ ] Crear `AuthService.findOrCreateUser()` con TypeORM upsert
- [ ] Crear `AuthService.generateToken()` con JWT
- [ ] Crear `AuthController` con endpoints /discord, /callback, /me
- [ ] Probar flujo completo Discord OAuth2 → JWT → /me
- [ ] Actualizar CHANGELOG

### Base de datos — Entidades y Migrations
- [ ] Crear entidad `Profile` con decoradores TypeORM
- [ ] Crear migration `CreateProfiles`
- [ ] Crear entidad `Course` con array de tags
- [ ] Crear migration `CreateCourses`
- [ ] Crear entidad `UserAssessment`
- [ ] Crear migration `CreateAssessments`
- [ ] Crear entidad `LearningPath` con JSONB coursesOrder
- [ ] Crear migration `CreateLearningPaths`
- [ ] Crear entidad `UserProgress` con UNIQUE constraint
- [ ] Crear migration `CreateUserProgress`
- [ ] Crear migration seed con 15 cursos de DevTalles
- [ ] Verificar todas las relaciones funcionan correctamente

### Módulo Courses
- [ ] Crear `CoursesModule`
- [ ] Crear `CoursesService.findAll()` con filtros dinámicos
- [ ] Crear `CoursesService.findById()`
- [ ] Crear `CoursesService.getCategories()`
- [ ] Crear `CoursesService.getCatalogSummary()` para IA
- [ ] Crear `CoursesController` con Swagger completo
- [ ] Probar endpoints con Swagger UI

### Módulo AI
- [ ] Crear `AiModule` con `AiService`
- [ ] Implementar `generateLearningPath()` con Claude API
- [ ] Diseñar y probar el system prompt
- [ ] Manejar errores de la API (rate limit, timeout)
- [ ] Parsear y validar respuesta JSON de Claude
- [ ] Probar con diferentes perfiles de usuario

### Módulo Assessments
- [ ] Crear `CreateAssessmentDto` con validaciones completas
- [ ] Crear `AssessmentsService.createAndGeneratePath()`
- [ ] Conectar con AiService para generar la ruta
- [ ] Guardar LearningPath y UserProgress en DB
- [ ] Crear `AssessmentsController`
- [ ] Probar flujo completo cuestionario → IA → DB

### Módulo Learning Paths
- [ ] Crear `LearningPathsService.findAllByUser()` con % progreso
- [ ] Crear `LearningPathsService.findOne()` con JOIN a cursos
- [ ] Crear `LearningPathsService.toggleCourseProgress()`
- [ ] Crear `LearningPathsService.remove()` con cascade
- [ ] Crear `LearningPathsController` completo
- [ ] Probar todos los endpoints

### Deploy
- [ ] Configurar `docker-compose.prod.yml`
- [ ] Verificar build de Docker en local
- [ ] Conectar repo GitHub con DigitalOcean App Platform
- [ ] Configurar variables de entorno en DO
- [ ] Ejecutar migrations en producción
- [ ] Verificar Swagger en URL de producción
- [ ] Probar flujo completo en producción

### Entrega final
- [ ] README.md con instrucciones claras de cómo correr el proyecto
- [ ] Video demo grabado (1:00 a 1:30 minutos)
- [ ] Repositorio público en GitHub
- [ ] Licencia MIT en el repo
- [ ] URL del proyecto desplegado funcionando
- [ ] **No hacer commits después del 28 sep 10:00AM GMT-6**

---

## 🟡 En progreso

<!-- Mover tareas aquí cuando alguien empiece a trabajar en ellas -->
<!-- Ejemplo: -->
<!-- - [ ] Crear entidad Profile @maycolroa (iniciado 2026-09-15) -->

---

## 🟢 Completado

<!-- Mover tareas aquí cuando estén listas y testeadas -->
<!-- Ejemplo: -->
<!-- - [x] Setup inicial del proyecto ✓ 2026-09-14 -->
<!-- - [x] Crear archivos de proyecto (CLAUDE.md, RULES.md...) ✓ 2026-09-14 -->

- [x] Inicializar proyecto NestJS ✓ 2026-09-14
- [x] Crear archivos de documentación (CLAUDE.md, RULES.md, CONTEXT.md, CHANGELOG.md, TASKS.md, DECISIONS.md) ✓ 2026-09-14
- [x] Primer commit al repositorio ✓ 2026-09-14
- [x] **Instalar dependencias del proyecto** ✓ 2026-09-16
  - Dependencias principales:
    ```bash
    npm install @nestjs/typeorm typeorm pg @nestjs/config joi @nestjs/jwt @nestjs/passport passport passport-discord passport-jwt @anthropic-ai/sdk class-validator class-transformer @nestjs/swagger helmet
    ```
  - DevDependencies:
    ```bash
    npm install -D @types/passport @types/passport-discord @types/passport-jwt
    ```
  - Qué hace cada dependencia:
    - `@nestjs/typeorm` + `typeorm` + `pg` — conectan NestJS con PostgreSQL vía TypeORM.
    - `@nestjs/config` — carga y expone las variables de entorno (`.env`).
    - `joi` — validación de variables de entorno vía `@nestjs/config` (el `validationSchema` se escribe al configurar `ConfigModule`, fuera de este alcance).
    - `@nestjs/jwt` — genera y valida tokens JWT.
    - `@nestjs/passport` — integra Passport.js con NestJS (guards/strategies).
    - `passport` — peer dependency real de `@nestjs/passport`, `passport-discord` y `passport-jwt`.
    - `passport-discord` — strategy de Passport para OAuth2 con Discord.
    - `passport-jwt` — strategy de Passport para validar Bearer tokens JWT.
    - `@anthropic-ai/sdk` — cliente oficial para llamar a la API de Claude.
    - `class-validator` — decoradores de validación para los DTOs.
    - `class-transformer` — transforma payloads planos a instancias de clase (DTOs).
    - `@nestjs/swagger` — genera la documentación OpenAPI/Swagger (trae `swagger-ui-dist` propio).
    - `helmet` — cabeceras de seguridad HTTP.
    - `@types/passport` / `@types/passport-discord` / `@types/passport-jwt` — tipos TypeScript para Passport y ambas strategies.
  - Nota: no se instala `express-session` — el proyecto es JWT stateless (DEC-004), la Discord strategy se registra con `session: false`.

---

## 🚨 Bloqueado / Problemas

<!-- Anotar aquí tareas bloqueadas y por qué -->
<!-- Ejemplo: -->
<!-- - [ ] Migrations en producción — bloqueado: falta credencial DO PostgreSQL -->

---

## 📊 Progreso general

```
Setup:        ░░░░░░░░░░  0%
Auth:         ░░░░░░░░░░  0%
Database:     ░░░░░░░░░░  0%
Courses:      ░░░░░░░░░░  0%
AI:           ░░░░░░░░░░  0%
Assessments:  ░░░░░░░░░░  0%
LearningPaths:░░░░░░░░░░  0%
Deploy:       ░░░░░░░░░░  0%
──────────────────────────
Total:        ░░░░░░░░░░  0%
```

> Actualizar los porcentajes manualmente conforme avancen.
