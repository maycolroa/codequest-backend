# 🧠 DECISIONS.md — Decisiones Técnicas

> Registro de decisiones importantes y por qué se tomaron.
> Útil para que el equipo y Claude Code entiendan el "por qué".

---

## Formato de entrada

```markdown
## DEC-001 — Título de la decisión
**Fecha:** YYYY-MM-DD
**Autor:** Nombre
**Estado:** Activa | Superada | En revisión

**Contexto:** Por qué surgió esta decisión
**Opciones consideradas:**
1. Opción A — pros/contras
2. Opción B — pros/contras
**Decisión:** Qué se eligió y por qué
**Consecuencias:** Qué implica esta decisión
```

---

## DEC-001 — TypeORM sobre Prisma
**Fecha:** 2026-09-14
**Estado:** Activa

**Contexto:** Necesitábamos un ORM para NestJS + PostgreSQL.

**Opciones consideradas:**
1. **TypeORM** — ORM oficial de NestJS, decoradores nativos, bien documentado en los cursos de DevTalles
2. **Prisma** — más moderno, schema-first, mejor DX pero requiere aprender nueva sintaxis
3. **pg directo** — máximo control pero mucho boilerplate, sin migrations automáticas

**Decisión:** TypeORM porque el equipo ya lo conoce de los cursos de DevTalles y la integración con NestJS es nativa con `@nestjs/typeorm`.

**Consecuencias:** Necesitamos gestionar migrations manualmente con el CLI de TypeORM.

---

## DEC-002 — PostgreSQL en DigitalOcean sobre Supabase
**Fecha:** 2026-09-14
**Estado:** Activa

**Contexto:** Inicialmente el proyecto usaba Supabase como base de datos. Al querer manejar todo en DigitalOcean, evaluamos opciones.

**Opciones consideradas:**
1. **Supabase** — gratis, fácil de configurar, pero mezcla providers (DO + Supabase)
2. **DigitalOcean Managed PostgreSQL** — $15/mes, todo en un solo provider, SSL incluido
3. **PostgreSQL en Droplet** — más barato pero requiere mantenimiento manual

**Decisión:** DigitalOcean Managed PostgreSQL porque:
- Todo el stack en un solo provider (menos complejidad)
- Backups automáticos incluidos
- Los $200 de créditos cubren el hackathon
- SSL y seguridad gestionados por DO

**Consecuencias:** Requiere `ssl: { rejectUnauthorized: false }` en TypeORM. La `DATABASE_URL` viene del panel de DO.

---

## DEC-003 — synchronize: false en TypeORM
**Fecha:** 2026-09-14
**Estado:** Activa

**Contexto:** TypeORM tiene `synchronize: true` que auto-sincroniza el schema con las entidades.

**Decisión:** Siempre `synchronize: false` y usar migrations explícitas.

**Consecuencias:**
- ✅ Cambios en DB son explícitos, reversibles y versionados
- ✅ No hay pérdida accidental de datos en producción
- ❌ Hay que crear una migration por cada cambio en entidades
- El Dockerfile corre migrations automáticamente al iniciar: `migration:run && node dist/main`

---

## DEC-004 — JWT stateless sobre sesiones
**Fecha:** 2026-09-14
**Estado:** Activa

**Contexto:** Necesitábamos autenticación para la API REST.

**Opciones consideradas:**
1. **JWT** — stateless, funciona para web y mobile, fácil de implementar con passport-jwt
2. **Sesiones con Redis** — más seguro (revocación inmediata), pero requiere Redis adicional
3. **Supabase Auth** — eliminado al migrar a DO PostgreSQL

**Decisión:** JWT con expiración de 7 días porque:
- API stateless (sin estado en servidor)
- Compatible con el frontend Vue/React
- Suficiente para el hackathon de 14 días
- Sin infraestructura extra (no necesitamos Redis)

**Consecuencias:** Los tokens no se pueden revocar antes de expirar. Aceptable para el hackathon.

---

## DEC-005 — claude-sonnet-4-6 para generación de rutas
**Fecha:** 2026-09-14
**Estado:** Activa

**Contexto:** Necesitábamos elegir el modelo de Claude para generar rutas de aprendizaje.

**Opciones consideradas:**
1. **claude-opus-5** — más potente pero más caro y lento (~$15/MTok)
2. **claude-sonnet-4-6** — balance calidad/costo, rápido (~$3/MTok)
3. **claude-haiku-4-5** — muy rápido y barato pero calidad inferior para razonamiento complejo

**Decisión:** `claude-sonnet-4-6` porque:
- Calidad suficiente para analizar perfiles y seleccionar cursos
- Costo accesible para el hackathon
- Velocidad aceptable (< 10 segundos por respuesta)
- Está disponible en la API actual

**Consecuencias:** Costo aproximado de $0.01-0.05 por generación de ruta. Necesitamos `max_tokens: 2000` y pedir respuesta en JSON estricto.

---

## DEC-006 — Docker multi-stage para el backend
**Fecha:** 2026-09-14
**Estado:** Activa

**Contexto:** Necesitábamos containerizar el backend para deploy.

**Decisión:** Dockerfile multi-stage con `node:20-alpine`:
- Stage 1 (builder): instala todas las dependencias y compila TypeScript
- Stage 2 (production): solo copia `dist/` y `node_modules` de producción

**Consecuencias:**
- ✅ Imagen final ~150MB vs ~600MB con imagen completa
- ✅ No hay código fuente TypeScript en producción
- ✅ No hay devDependencies en producción
- El CMD corre migrations antes de iniciar: `migration:run && node dist/main`

---

## Agregar nuevas decisiones aquí

<!-- Copiar el formato de arriba para cada nueva decisión -->
