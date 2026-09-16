# ✅ TASKS.md — Tareas del Proyecto

> Tablero de tareas del backend.
> Mover tareas entre secciones cuando cambien de estado.
> Asignar con @nombre cuando trabajen en equipo.

---

## 🔴 Por hacer

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
