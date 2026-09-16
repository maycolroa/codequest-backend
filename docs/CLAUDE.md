# 🤖 CLAUDE.md — Instrucciones para Claude Code

> Este archivo es leído automáticamente por Claude Code cada vez que
> abres el proyecto. Define cómo debe comportarse la IA al ayudarte.

---

## 🎯 Contexto del proyecto

Eres el asistente de desarrollo de **Code Quest 2026**, un hackathon
organizado por DevTalles. El objetivo es construir un **Generador de
Rutas de Aprendizaje** con IA para la comunidad de DevTalles.

- **Deadline:** 28 de septiembre 2026 a las 10:00AM GMT-6
- **Repositorio backend:** `codequest-backend`
- **Stack:** NestJS + TypeScript + TypeORM + PostgreSQL + Docker
- **IA integrada:** Anthropic Claude API (claude-sonnet-4-6)

---

## 📁 Archivos importantes del proyecto

| Archivo | Propósito |
|---------|-----------|
| `CLAUDE.md` | Este archivo — instrucciones para la IA |
| `RULES.md` | Reglas de código que SIEMPRE debes seguir |
| `CONTEXT.md` | Contexto técnico: entidades, módulos, endpoints |
| `CHANGELOG.md` | Historial de todos los cambios realizados |
| `TASKS.md` | Tareas pendientes, en progreso y completadas |
| `DECISIONS.md` | Decisiones técnicas y por qué se tomaron |

---

## 🧠 Cómo debes ayudarme

### SIEMPRE debes:
- Leer `RULES.md` antes de escribir cualquier código
- Registrar los cambios importantes en `CHANGELOG.md`
- Marcar tareas en `TASKS.md` cuando las completes
- Escribir código en **español para comentarios**, inglés para código
- Usar los patrones ya establecidos en el proyecto (ver `CONTEXT.md`)
- Preguntar si no entiendes algo antes de asumir

### NUNCA debes:
- Usar `synchronize: true` en TypeORM en producción
- Hardcodear credenciales o secrets en el código
- Eliminar migrations existentes
- Cambiar nombres de columnas sin crear una migration
- Usar `any` en TypeScript sin justificación
- Hacer `console.log` en producción (usar Logger de NestJS)

---

## 🗣️ Cómo comunicarme contigo

Cuando me pidas algo, usa estos prefijos para que entienda el contexto:

```
FEAT: crear el módulo de cursos con su CRUD completo
FIX:  el endpoint /auth/me devuelve 401 aunque el token es válido
REFACTOR: el servicio de assessments tiene lógica duplicada
DOCS: actualiza el CHANGELOG con los cambios de hoy
TEST: crea los tests del AuthService
TASK: marca como completada la tarea de crear entidades
```

---

## 📋 Checklist antes de cada PR

Cuando termines una feature, verifica:

- [ ] El código compila sin errores (`npm run build`)
- [ ] Los tipos TypeScript están correctos (`tsc --noEmit`)
- [ ] Se creó la migration si hubo cambios en entidades
- [ ] Se actualizó `CHANGELOG.md`
- [ ] Se marcó la tarea en `TASKS.md`
- [ ] Los endpoints nuevos están documentados en Swagger
- [ ] No hay secrets en el código

---

## 🚀 Comandos más usados

```bash
# Desarrollo
npm run start:dev          # servidor con hot-reload

# TypeScript
tsc --noEmit               # verificar tipos sin compilar

# Migrations
npm run migration:generate -- src/migrations/NombreCambio
npm run migration:run
npm run migration:revert

# Docker
docker compose up -d       # levantar postgres local
docker compose logs -f     # ver logs

# Build
npm run build              # compilar para producción
```
