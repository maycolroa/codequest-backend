# 01 — Instalación de dependencias del proyecto

**Estado:** implementado
**Depende de:** —
**Fecha:** 2026-09-16

**Objetivo:** Instalar en `package.json` el conjunto completo y correcto de dependencias (producción y desarrollo) que necesita el backend para arrancar, ampliando la lista de `docs/TASKS.md` con los peer dependencies faltantes y las librerías adicionales recomendadas (helmet, joi), sin tocar todavía `main.ts`, Docker ni el código de los módulos.

---

## Alcance

**Incluye:**

- Definir e instalar la lista final de dependencias de producción y devDependencies.
- Corregir la lista de `docs/TASKS.md`, que estaba incompleta: le faltaban `passport` (peer dependency real de `@nestjs/passport`, `passport-discord` y `passport-jwt`) y `@types/passport`.
- Añadir dos librerías no listadas en `docs/TASKS.md` pero necesarias/recomendadas para este proyecto: `helmet` (cabeceras de seguridad HTTP) y `joi` (validación de variables de entorno vía `@nestjs/config`).
- Verificar compatibilidad de versiones contra lo ya instalado (`@nestjs/common@^12.0.1`, `@nestjs/core@^12.0.1`).
- Actualizar `docs/TASKS.md` (marcar la tarea) y `docs/CHANGELOG.md`.

**No incluye (quedan como tareas ya existentes en `docs/TASKS.md`):**

- Configurar `main.ts` (ValidationPipe, Swagger, prefijo global, CORS, `helmet()`).
- Crear `Dockerfile` y `docker-compose.yml`.
- Crear `.env.example`.
- Crear entidades, migrations, módulos (`AuthModule`, `CoursesModule`, `AiModule`, etc.).
- Configurar el `validationSchema` de Joi dentro de `ConfigModule.forRoot()` — este spec solo instala `joi`, no escribe el schema (eso ocurre cuando se configure `ConfigModule` en `AppModule`, fuera de este alcance).

**Decisión explícita:** no se instala `express-session`. El proyecto es JWT stateless (DEC-004 en `docs/DECISIONS.md`); la estrategia de Discord se registrará con `session: false`, evitando la dependencia y su configuración adicional. Esto se documenta aquí porque condiciona qué se instala, aunque la escritura de la strategy es tarea de `AuthModule`.

---

## Datos

No aplica — este spec no introduce estructuras de datos, solo dependencias de `package.json`.

---

## Plan de implementación

Cada paso deja el proyecto en estado compilable (`npm run build` y `tsc --noEmit` sin errores).

1. **Instalar dependencias de persistencia y configuración**

   ```bash
   npm install @nestjs/typeorm typeorm pg @nestjs/config joi
   ```

   Verificar: `npm run build` sigue pasando (nada las importa aún, solo deben quedar en `package.json`/`package-lock.json`).
2. **Instalar dependencias de autenticación**

   ```bash
   npm install @nestjs/jwt @nestjs/passport passport passport-discord passport-jwt
   npm install -D @types/passport @types/passport-discord @types/passport-jwt
   ```

   Verificar: `npm run build` sin errores; `npm ls passport` no muestra conflictos de versión entre `@nestjs/passport`, `passport-discord` y `passport-jwt`.
3. **Instalar dependencia de IA**

   ```bash
   npm install @anthropic-ai/sdk
   ```

   Verificar: `npm run build` sin errores.
4. **Instalar dependencias de validación, documentación y seguridad HTTP**

   ```bash
   npm install class-validator class-transformer @nestjs/swagger helmet
   ```

   Verificar: `npm run build` sin errores. `@nestjs/swagger@12` trae `swagger-ui-dist` como dependencia propia — no se instala `swagger-ui-express` por separado.
5. **Verificación final e integración**

   - `tsc --noEmit` limpio.
   - `npm run start:dev` levanta el servidor sin errores de "cannot find module" (los módulos de negocio todavía no existen ni importan estas librerías, así que solo se valida que la instalación en sí no rompe el arranque actual).
   - `npm audit` — revisar que no haya vulnerabilidades altas/críticas introducidas por `passport-discord` (paquete con mantenimiento poco frecuente).
   - Marcar la tarea "Instalar dependencias del proyecto" en `docs/TASKS.md` como completada, y corregir su lista de comandos para incluir `passport`, `@types/passport`, `helmet` y `joi`.
   - Añadir entrada en `docs/CHANGELOG.md` describiendo la instalación y la corrección de la lista original.

---

## Criterios de aceptación

- [x] `package.json` → `dependencies` incluye exactamente: `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/config`, `joi`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-discord`, `passport-jwt`, `@anthropic-ai/sdk`, `class-validator`, `class-transformer`, `@nestjs/swagger`, `helmet`.
- [x] `package.json` → `devDependencies` incluye: `@types/passport`, `@types/passport-discord`, `@types/passport-jwt`.
- [x] `npm install` termina sin errores de peer dependency no resuelto.
- [x] `npm run build` compila sin errores.
- [x] `tsc --noEmit` no reporta errores.
- [x] `npm run start:dev` levanta el servidor sin errores de módulo faltante.
- [x] `npm audit` no reporta vulnerabilidades altas/críticas sin revisar.
- [x] `docs/TASKS.md` tiene la tarea marcada como completada y la lista de comandos corregida (incluye `passport`, tipos, `helmet`, `joi`).
- [x] `docs/CHANGELOG.md` tiene una entrada nueva documentando la instalación.
- [ ] `package-lock.json` queda commiteado junto con `package.json`.

---

## Decisiones tomadas y descartadas

- **Agregar `passport` y `@types/passport` aunque no estaban en `docs/TASKS.md`.** Motivo: `@nestjs/passport` declara `passport` como peer dependency real (`^0.5.0 || ^0.6.0 || ^0.7.0`); sin instalarlo explícitamente, el proyecto queda expuesto a resoluciones inconsistentes del árbol de dependencias y a errores en runtime al extender `PassportStrategy`. Confirmado con el usuario.
- **Agregar `helmet`.** Motivo: es una API pública desplegada en DigitalOcean App Platform; cabeceras de seguridad básicas son de bajo costo de instalación (una línea en `main.ts`, fuera de este spec) y buen retorno. Confirmado con el usuario.
- **Agregar `joi`.** Motivo: el proyecto depende de ~10 variables de entorno (`DATABASE_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, credenciales de Discord, etc.). Validarlas al arrancar (`ConfigModule.forRoot({ validationSchema })`, fuera de este spec) evita fallos a mitad de un request en producción. Confirmado con el usuario.
- **Descartar `@nestjs/throttler`.** Se consideró para limitar abuso del endpoint que llama a la API de Claude, pero el usuario decidió no incluirlo en este spec — puede añadirse después como tarea independiente si el abuso de costos se vuelve un problema real durante el hackathon.
- **Descartar `express-session`.** El flujo de auth es JWT stateless (DEC-004); la Discord strategy se configurará con `session: false`, evitando la dependencia y su configuración.
- **No instalar `swagger-ui-express` por separado.** `@nestjs/swagger@12` (compatible con `@nestjs/core@^12.0.0`, ya instalado) trae `swagger-ui-dist` como dependencia propia.

---

## Riesgos identificados

- `package.json` actual declara `"typescript": "^6.0.2"`, una versión mayor inusual para la fecha de creación del proyecto. Si al instalar las nuevas dependencias esto resuelve a una versión de TypeScript incompatible con los `@types/*` de `class-validator`/`@nestjs/swagger`, el build fallará — validar en el paso 4 y, si ocurre, es un problema a resolver en un spec separado (no forma parte del alcance de este).
- `passport-discord` (última versión `0.1.4`) tiene mantenimiento poco activo; depende de `passport-oauth2`. Revisar `npm audit` en el paso 5 antes de dar por cerrado el spec.
