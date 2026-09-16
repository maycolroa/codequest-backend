# 📝 CHANGELOG.md — Historial de Cambios

> Registro cronológico de todo lo que se hace en el proyecto.
> **Actualizar después de cada sesión de trabajo.**
> Formato: [TIPO] Descripción — Fecha — Autor

---

## Cómo actualizar este archivo

Agrega una entrada así después de cada bloque de trabajo:

```markdown
### YYYY-MM-DD — Nombre del dev

**[FEAT]** Descripción de lo que se agregó
**[FIX]**  Descripción de lo que se arregló
**[REFACTOR]** Descripción de lo que se mejoró
**[DOCS]** Descripción de documentación actualizada
**[MIGRATION]** Nombre de la migration creada
**[CHORE]** Configuración o dependencias
```

---

## 📅 Historial

---

### 2026-09-14 — Setup inicial del proyecto

**[CHORE]** Inicializado proyecto NestJS con CLI
```bash
nest new codequest-backend
```

**[CHORE]** Configuradas dependencias principales:
- `@nestjs/typeorm` + `typeorm` + `pg` — ORM y driver PostgreSQL
- `@nestjs/config` — variables de entorno
- `@nestjs/jwt` + `@nestjs/passport` — autenticación
- `passport-discord` + `passport-jwt` — strategies OAuth2
- `@anthropic-ai/sdk` — integración Claude AI
- `class-validator` + `class-transformer` — validación DTOs
- `@nestjs/swagger` — documentación OpenAPI

**[CHORE]** Configurado `tsconfig.json` con decoradores habilitados:
```json
{
  "emitDecoratorMetadata": true,
  "experimentalDecorators": true
}
```

**[DOCS]** Creados archivos de proyecto:
- `CLAUDE.md` — instrucciones para Claude Code
- `RULES.md` — reglas de código del equipo
- `CONTEXT.md` — contexto técnico y entidades
- `CHANGELOG.md` — este archivo
- `TASKS.md` — tareas del proyecto
- `DECISIONS.md` — decisiones técnicas

**[CHORE]** Creado `.env.example` con todas las variables requeridas

**[CHORE]** Configurado `Dockerfile` multi-stage:
- Stage 1: `node:20-alpine` builder con devDependencies
- Stage 2: producción solo con dist/ y dependencies

**[CHORE]** Configurado `docker-compose.yml` con PostgreSQL local

---

### 2026-09-16 — Setup inicial del proyecto

**[CHORE]** Instalación del CLI de NestJS (`@nestjs/cli`)

**[CHORE]** Inicialización del proyecto base con `nest new codequest-backend`

**[DOCS]** Creación de los archivos de documentación del proyecto:
- `CLAUDE.md`, `RULES.md`, `CONTEXT.md`, `CHANGELOG.md`, `TASKS.md`, `DECISIONS.md`

**[CHORE]** Primer commit y push al repositorio

---

### 2026-09-16 — Instalación de dependencias del proyecto (spec 01)

**[CHORE]** Instaladas las dependencias de producción y desarrollo definidas en `specs/01-instalacion-dependencias.md`:
- `@nestjs/typeorm`, `typeorm`, `pg` — ORM y driver PostgreSQL
- `@nestjs/config`, `joi` — variables de entorno y su validación (el `validationSchema` se escribe al configurar `ConfigModule`, fuera de este spec)
- `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-discord`, `passport-jwt` — autenticación JWT + OAuth2 Discord
- `@anthropic-ai/sdk` — integración Claude AI
- `class-validator`, `class-transformer` — validación de DTOs
- `@nestjs/swagger` — documentación OpenAPI (trae `swagger-ui-dist` propio, no se instaló `swagger-ui-express` aparte)
- `helmet` — cabeceras de seguridad HTTP
- DevDependencies: `@types/passport`, `@types/passport-discord`, `@types/passport-jwt`

**[FIX]** Corregida la lista de comandos de la tarea "Instalar dependencias del proyecto" en `TASKS.md`, que estaba incompleta: le faltaban `passport` (peer dependency real de `@nestjs/passport`, `passport-discord` y `passport-jwt`) y `@types/passport`.

**[CHORE]** Decisión explícita: no se instala `express-session` — el proyecto es JWT stateless (DEC-004 en `DECISIONS.md`), la Discord strategy se registrará con `session: false`.

**[CHORE]** Verificado con `npm audit`: 5 vulnerabilidades preexistentes (2 low, 1 moderate, 2 high), todas originadas en `@nestjs/mau` (devDependency ya presente antes de este spec) — ninguna introducida por las dependencias instaladas aquí.

---

### PRÓXIMAS ENTRADAS — Agregar aquí

<!--
Ejemplo de entrada futura:

### 2026-09-15 — [Tu nombre]

**[FEAT]** Creado módulo Auth con Discord OAuth2
- Implementado `DiscordStrategy` con scope identify, email, guilds
- Implementado `JwtStrategy` para validar Bearer tokens
- Creado `AuthController` con endpoints /discord, /callback, /me
- Creado `AuthService.findOrCreateUser()` con upsert TypeORM

**[MIGRATION]** `1726400000000-CreateProfiles` — tabla profiles con discord_id UNIQUE

**[FEAT]** Creado módulo Courses con catálogo DevTalles
- `CoursesService.findAll()` con filtros dinámicos por category y level
- `CoursesService.getCatalogSummary()` para el prompt de IA
- Seed data: 15 cursos de DevTalles insertados

**[MIGRATION]** `1726400000001-CreateCourses` — tabla courses con array de tags
**[MIGRATION]** `1726400000002-SeedCourses` — 15 cursos de DevTalles

**[DOCS]** Actualizado TASKS.md — marcadas como completadas:
- [x] Crear módulo Auth
- [x] Crear módulo Courses
-->
