# 03 — Galaxias 3D de cursos (`GET /api/v1/courses/galaxy`)

**Estado:** aprobado
**Depende de:** — (parte de `origin/feature/dev_backend`, no de `main`; ver "Por qué existe este spec")
**Fecha:** 2026-09-22

**Objetivo:** Clasificar los 80 cursos existentes en 7 galaxias con color, posición 3D y aristas de prerequisitos/relacionados, y exponerlos en `GET /api/v1/courses/galaxy` para que el frontend dibuje el catálogo como un mapa 3D.

---

## Por qué existe este spec

- El frontend necesita pintar el catálogo de DevTalles como un mapa 3D de "galaxias". Cada curso necesita una o varias galaxias, un color, una posición `(x, y, z)` y aristas hacia sus prerequisitos y cursos relacionados.
- La base de producción ya tiene los 80 cursos reales. No hay seed nuevo: solo `ALTER TABLE` y `UPDATE ... WHERE slug = $1`.
- **`main` está atrasado respecto a producción.** Las migraciones `1726000000003` a `1726000000007` (`AddSuperAdminRole`, `AddCourseCatalogMetadata`, `CreateUserCourseProgress`, `SeedDevTallesCourses`, `CreateCourseLessonsAndAutomaticProgress`) ya están aplicadas en prod, pero solo existen en `origin/feature/dev_backend` (commits `49ebec0` y `b340a74`). Este trabajo tiene que salir de esa rama.
- **El `.env` activo (línea 40) apunta a la base de producción de DigitalOcean.** Un `npm run migration:run` local aplica directo en prod. Toda la validación se hace contra el Postgres local de Docker.

Estado actual de `courses` (prod): `id uuid PK`, `title`, `description`, `category`, `level`, `url NULL`, `duration_hours NULL`, `tags text[] DEFAULT '{}'`, `is_active bool DEFAULT true`, `created_at`, `slug varchar NOT NULL UNIQUE`. Hay 80 cursos: 64 activos y 16 legacy inactivos. Por categoría: ai 13, architecture 5, backend 16, databases 1, devops 2, frontend 16, mobile 5, programming_languages 6, legacy 16.

---

## Alcance

**Incluye:**

- Rama `spec-03-galaxias-3d-cursos` creada desde `origin/feature/dev_backend`.
- Constante `COURSE_GALAXIES` con las 7 galaxias (clave estable, nombre visible, color y centro 3D) como única fuente de verdad.
- Migración de esquema `1726000000008-AddCourseGalaxyFields`: 7 columnas nuevas en `courses`, solo aditiva y con valores por defecto.
- Migración de datos `1726000000009-ClassifyCoursesIntoGalaxies`: clasifica los 80 cursos (activos y legacy) con galaxias, color, posición y aristas.
- Propiedades nuevas en la entidad `Course`, con nombres en inglés.
- Endpoint `GET /api/v1/courses/galaxy`, protegido por el `JwtAuthGuard` del controller. Devuelve `{ galaxies, courses }` con los 80 cursos, incluido `isActive`.
- DTOs de Swagger para la respuesta.
- Campos nuevos opcionales en `CreateCourseDto`, para que el admin pueda editarlos con `PATCH /courses/:id`.
- Registro de las 2 migraciones en `src/auth/config/data-source.ts`.
- Validación completa en Postgres local, incluido `revert` de ambas migraciones.
- Aplicación en producción como último paso, **solo con confirmación explícita del usuario en ese momento**.
- Actualizar `docs/CHANGELOG.md`, `docs/CONTEXT.md` y `docs/TASKS.md`.

**No incluye (queda para specs futuros):**

- Recalcular posiciones automáticamente cuando el admin crea o edita un curso. Un curso nuevo queda en `(0, 0, 0)` y sin galaxia hasta que alguien le asigne valores con `PATCH`.
- Una tabla `galaxies` en base de datos o endpoints CRUD de galaxias. Las galaxias viven en una constante.
- Validar en el backend que los slugs de `prerequisites`/`related` enviados por `PATCH` existan, o que no formen ciclos.
- Progreso del usuario dentro del mapa (qué nodos completó). Ya existe `GET /courses/my-progress` y el front puede cruzar los datos.
- Cambios en `auth/*`, `profiles`, estrategias o JWT.
- Reconciliar `main` con `origin/feature/dev_backend`.

---

## Datos

### Constante `src/courses/constants/course-galaxies.constant.ts` (nuevo)

```typescript
export type CourseGalaxyKey =
  | 'ai-ml' | 'frontend' | 'backend' | 'fundamentals'
  | 'mobile' | 'devops' | 'dotnet-java';

export interface CourseGalaxy {
  key: CourseGalaxyKey;
  name: string;
  color: string;                               // #RRGGBB
  center: { x: number; y: number; z: number };
}

export const COURSE_GALAXIES: readonly CourseGalaxy[] = [
  { key: 'ai-ml',        name: 'IA & Machine Learning',      color: '#8B5CF6', center: … },
  { key: 'frontend',     name: 'Frontend & UI',              color: '#3B82F6', center: … },
  { key: 'backend',      name: 'Backend & APIs',             color: '#10B981', center: … },
  { key: 'fundamentals', name: 'Fundamentos & Arquitectura', color: '#F59E0B', center: … },
  { key: 'mobile',       name: 'Mobile',                     color: '#06B6D4', center: … },
  { key: 'devops',       name: 'DevOps & Infraestructura',   color: '#EF4444', center: … },
  { key: 'dotnet-java',  name: '.NET & Java',                color: '#EC4899', center: … },
];
```

- Los 7 centros van en un anillo de radio ≈ 60 en el plano XZ (ángulo `i · 2π/7`), cada uno con un pequeño desplazamiento en Y. Se escriben como literales redondeados a 2 decimales.
- La migración de datos importa esta constante. Así los colores y los centros solo están definidos en un sitio.

### Columnas nuevas en `courses` (migración `1726000000008`)

| Columna           | Tipo SQL              | Restricción / default    | Propiedad TS                   |
| ----------------- | --------------------- | ------------------------- | ------------------------------ |
| `galaxies`      | `text[]`            | `NOT NULL DEFAULT '{}'` | `galaxies: string[]`         |
| `galaxy_color`  | `character varying` | `NULL`                  | `galaxyColor: string \| null` |
| `position_x`    | `double precision`  | `NOT NULL DEFAULT 0`    | `positionX: number`          |
| `position_y`    | `double precision`  | `NOT NULL DEFAULT 0`    | `positionY: number`          |
| `position_z`    | `double precision`  | `NOT NULL DEFAULT 0`    | `positionZ: number`          |
| `prerequisites` | `text[]`            | `NOT NULL DEFAULT '{}'` | `prerequisites: string[]`    |
| `related`       | `text[]`            | `NOT NULL DEFAULT '{}'` | `related: string[]`          |

- `galaxies` guarda claves `CourseGalaxyKey`. La primera es la galaxia principal.
- `galaxy_color` es el color de `galaxies[0]`, desnormalizado para que el front no tenga que resolverlo. Queda `NULL` hasta que el curso se clasifica.
- `prerequisites` y `related` guardan **slugs** de otros cursos (`slug` es `UNIQUE NOT NULL`).
- La entidad sigue RULES.md §4, igual que `durationHours`: camelCase en TS y `name` explícito en snake_case. `pg` devuelve `double precision` como `number`, así que no hace falta transformer.

### Respuesta de `GET /api/v1/courses/galaxy`

```typescript
// src/courses/dto/galaxy-map-response.dto.ts
class GalaxyDto {
  key: CourseGalaxyKey; name: string; color: string;
  center: { x: number; y: number; z: number };
}

// src/courses/dto/galaxy-course.dto.ts
class GalaxyCourseDto {
  id: string; slug: string; title: string;
  category: string; level: string; tags: string[]; isActive: boolean;
  galaxies: string[]; galaxyColor: string | null;
  positionX: number; positionY: number; positionZ: number;
  prerequisites: string[]; related: string[];
}

class GalaxyMapResponseDto {
  galaxies: GalaxyDto[];         // las 7, en el orden de COURSE_GALAXIES
  courses: GalaxyCourseDto[];    // los 80, activos e inactivos, ordenados por title ASC
}
```

### Validación nueva en `CreateCourseDto` (todos `@IsOptional()`)

- `galaxies`: `@IsArray() @IsIn(<claves de COURSE_GALAXIES>, { each: true })`
- `galaxyColor`: `@Matches(/^#[0-9A-F]{6}$/i)`
- `positionX`, `positionY`, `positionZ`: `@IsNumber()`
- `prerequisites`, `related`: `@IsArray() @IsString({ each: true })`

`UpdateCourseDto` ya hereda de `CreateCourseDto`. Sin estos campos, `whitelist: true` los descartaría en el `PATCH`.

---

## Reglas de clasificación (migración `1726000000009`)

La primera galaxia de cada lista es la principal.

| Categoría origen         | Galaxia principal  | Excepciones y galaxias secundarias                                                                                                                                                                          |
| ------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai`                    | `ai-ml`          | `expo-gemini` +`mobile`. `openai-react-nestjs` y `openai-angular-nestjs` +`frontend` +`backend`. `spring-ai` +`dotnet-java` +`devops`. `ia-developers-claude-rag-agentes` +`backend`. |
| `frontend`              | `frontend`       | `javascript-moderno` y `typescript-guia-completa` +`fundamentals`.                                                                                                                                    |
| `backend`               | `backend`        | `dotnet-*`, `csharp-desde-cero`, `blazor-*`, `java-spring-boot-*` y `spring-boot-mvc-hexagonal` → `dotnet-java` principal con `backend` secundaria. `laravel-13-ai-rest-jwt` +`ai-ml`.   |
| `architecture`          | `fundamentals`   | `nestjs-microservicios` +`backend`. `spring-boot-4-*` +`dotnet-java`.                                                                                                                               |
| `mobile`                | `mobile`         | —                                                                                                                                                                                                          |
| `programming_languages` | según lenguaje    | `java-*` → `dotnet-java`. `python-fundamentos`, `programacion-principiantes` y `golang-fundamentos` → `fundamentals`. `golang-backend-profesional` → `backend`.                          |
| `databases`             | `backend`        | `sql-postgresql` +`fundamentals`.                                                                                                                                                                       |
| `devops`                | `devops`         | Se enlaza como relacionado con`nestjs-microservicios` y `docker-guia-practica`.                                                                                                                         |
| `legacy` (inactivos)    | según tecnología | angular/react/vue/next/pwa/rxjs/socket →`frontend`. flutter/react-native → `mobile`. node → `backend`. git → `devops`.                                                                          |

### Posiciones 3D

- Son deterministas y se escriben como literales en la migración, redondeados a 2 decimales.
- Se calculan una sola vez con un script scratch que **no se commitea**: espiral de ángulo áureo alrededor del centro de la galaxia principal, radio 6–16, más un jitter con PRNG de semilla fija.
- El nivel fija la altura y la distancia: `beginner` cerca del núcleo, `advanced` más lejos y más alto.
- Separación mínima ≈ 3 unidades entre cualquier par de cursos.

### Aristas

Ejemplos de prerequisitos (`←`) y relacionados:

- `angular-pro` ← `angular-de-cero-a-experto`, `typescript-guia-completa`. Relacionado: `angular-sockets-bun`.
- `react-pro` ← `react-de-cero-a-experto`, `typescript-guia-completa`. `nextjs-produccion` ← `react-de-cero-a-experto`.
- `nest-backend-escalable` ← `nodejs-de-cero-a-experto`, `typescript-guia-completa`. `nest-graphql`, `nestjs-testing` y `nestjs-microservicios` ← `nest-backend-escalable`.
- `flutter-*` ← `dart-desde-cero`. `java-spring-boot-guia-definitiva` ← `java-desde-cero`. `spring-ai` ← `java-spring-boot-guia-definitiva`.
- `fastapi-apis-eficientes`, `django-aplicaciones-web` y `python-inteligencia-artificial` ← `python-fundamentos`. `blazor-*` y `dotnet-*` ← `csharp-desde-cero`.
- `n8n-mcp` ← `python-n8n`. `patrones-diseno-agentico` ← `ingenieria-de-prompts`.

Reglas del grafo:

- Un curso activo solo apunta (en `prerequisites` o `related`) a cursos activos.
- Un curso legacy no tiene `prerequisites`. Su `related` apunta a su versión actual (ej. `legacy-angular-v14` → `angular-de-cero-a-experto`). Esa relación **no** es simétrica: el curso activo no apunta al legacy.
- El grafo de `prerequisites` no tiene ciclos.
- Entre cursos activos, `related` es simétrico cuando tiene sentido.

---

## Plan de implementación

Cada paso deja el proyecto compilable (`npm run build` y `npx tsc --noEmit` sin errores). **Ningún paso antes del 9 ejecuta migraciones contra el `DATABASE_URL` de producción.**

1. **Rama.** `git fetch origin` y crear `spec-03-galaxias-3d-cursos` desde `origin/feature/dev_backend`. Verificar que existen `src/courses/migrations/1726000000004-AddCourseCatalogMetadata.ts` y `1726000000006-SeedDevTallesCourses.ts`.
2. **Constante de galaxias.** Crear `src/courses/constants/course-galaxies.constant.ts` con `CourseGalaxyKey`, `CourseGalaxy` y `COURSE_GALAXIES`, con los centros ya calculados. Verificar: `npm run build`.
3. **Migración de esquema + entidad.**
   - Crear `src/courses/migrations/1726000000008-AddCourseGalaxyFields.ts`, con el mismo estilo `ALTER TABLE` que `1726000000004`. `down()` elimina las 7 columnas.
   - Añadir las 7 propiedades a `src/courses/entities/course.entity.ts`.
   - Registrar la migración en `src/auth/config/data-source.ts` (`database.config.ts` usa glob y no cambia).
   - Verificar: `npm run build`.
4. **Posiciones.** Con un script scratch fuera del repo, calcular las 80 posiciones según las reglas de la sección de posiciones y comprobar la separación mínima. Solo el resultado (literales) pasa al paso 5.
5. **Migración de datos.**
   - Crear `src/courses/migrations/1726000000009-ClassifyCoursesIntoGalaxies.ts`, con el mismo patrón que `SeedDevTallesCourses`: un array `const` tipado y un helper `galaxy(slug, galaxies, [x, y, z], prerequisites, related)`.
   - Ejecuta un `UPDATE "courses" SET … WHERE "slug" = $1` parametrizado por curso. `galaxy_color` se toma de `COURSE_GALAXIES` según `galaxies[0]`.
   - Es idempotente. Un slug inexistente actualiza 0 filas.
   - `down()` devuelve las 7 columnas a sus defaults para esos slugs.
   - Registrarla en `data-source.ts`. Verificar: `npm run build`.
6. **Validación de migraciones en local.**
   - `docker compose up -d postgres_db_dev`.
   - Cambiar **temporalmente** el `.env` al `DATABASE_URL` local comentado en la línea 9.
   - `npm run migration:run` (corre todas, incluido el seed).
   - `npm run migration:revert` dos veces, y de nuevo `npm run migration:run`.
   - Correr las consultas SQL de los criterios de aceptación.
7. **Endpoint.**
   - Crear `src/courses/dto/galaxy-course.dto.ts` y `src/courses/dto/galaxy-map-response.dto.ts` con `@ApiProperty`.
   - `CoursesService.findGalaxy(): Promise<GalaxyMapResponseDto>` hace `find({ select: {...}, order: { title: 'ASC' } })` **sin** filtro `isActive`, siguiendo el patrón de `getCatalogSummary()`, y añade `COURSE_GALAXIES` como `galaxies`.
   - En `courses.controller.ts`, añadir `@Get('galaxy')` **antes** de `@Get(':id')`, con `@ApiOperation` y `@ApiResponse({ type: GalaxyMapResponseDto })`.
   - Verificar contra la base local con `npm run start:dev`.
8. **Validación de admin + docs.**
   - Añadir los campos opcionales a `src/courses/dto/create-course.dto.ts`.
   - Actualizar `docs/CHANGELOG.md` (1 `[FEAT]` y 2 `[MIGRATION]`), `docs/CONTEXT.md` (entidad `Course` y endpoint nuevo) y `docs/TASKS.md`.
   - Restaurar el `.env` a su estado original.
9. **Producción (requiere confirmación explícita).** Mostrar al usuario el resultado de `npm run migration:show` contra prod y **esperar su OK**. Solo entonces, correr `npm run migration:run` con el `.env` de prod y repetir las consultas SQL de verificación contra prod.

---

## Criterios de aceptación

- [ ] La rama `spec-03-galaxias-3d-cursos` tiene como ancestro a `origin/feature/dev_backend`.
- [ ] `npm run build` y `npx tsc --noEmit` terminan sin errores.
- [ ] En Postgres local, `migration:run` → `migration:revert` ×2 → `migration:run` termina sin errores.
- [ ] Después del segundo `revert`, las 7 columnas nuevas no existen en `courses`.
- [ ] `SELECT count(*) FROM courses WHERE cardinality(galaxies) = 0` devuelve `0`.
- [ ] Todas las claves en `galaxies` pertenecen a las 7 de `COURSE_GALAXIES`.
- [ ] Cada `galaxy_color` es igual al color de `galaxies[0]` en `COURSE_GALAXIES`.
- [ ] Todo slug en `prerequisites` o `related` existe en `courses` (`unnest` + `LEFT JOIN` devuelve 0 huérfanos).
- [ ] Ningún curso activo tiene en `prerequisites` o `related` un slug de un curso inactivo.
- [ ] Ningún curso inactivo tiene `prerequisites` no vacío.
- [ ] El grafo de `prerequisites` no tiene ciclos (CTE recursiva devuelve 0 filas).
- [ ] No hay dos cursos con la misma posición `(position_x, position_y, position_z)`.
- [ ] `GET /api/v1/courses/galaxy` con Bearer válido responde `200` con `galaxies.length === 7` y `courses.length === 80`.
- [ ] Cada elemento de `courses` trae todos los campos de `GalaxyCourseDto`, incluido `isActive`, y `positionX/Y/Z` son `number` en el JSON.
- [ ] `GET /api/v1/courses/galaxy` sin token responde `401`.
- [ ] `GET /api/v1/courses/<uuid>` y `GET /api/v1/auth/me` siguen respondiendo igual que antes (regresión).
- [ ] `PATCH /api/v1/courses/:id` como SuperAdmin con `{ "galaxyColor": "#123ABC", "positionX": 1.5 }` persiste ambos valores.
- [ ] `PATCH` con `galaxyColor: "rojo"` o con una clave de galaxia inexistente responde `400`.
- [ ] Swagger (`/api/docs` o la ruta configurada) muestra `GET /courses/galaxy` con el esquema `GalaxyMapResponseDto`.
- [ ] El `.env` del repo queda igual que antes de empezar.
- [ ] `docs/CHANGELOG.md`, `docs/CONTEXT.md` y `docs/TASKS.md` reflejan el cambio.
- [ ] Las migraciones solo se aplicaron en prod tras un OK explícito del usuario, y las consultas SQL de verificación pasan también en prod.

---

## Decisiones tomadas y descartadas

- **Sí: galaxias en una constante TS, no en una tabla.** Son 7 valores fijos que cambian con el diseño, no con los datos. Una tabla `galaxies` con CRUD sería sobre-diseño.
- **Sí: `galaxies[]` guarda claves estables** (`'ai-ml'`, `'dotnet-java'`…). **No: nombres visibles.** Renombrar "IA & Machine Learning" no debe obligar a migrar datos. Confirmado con el usuario. Las claves concretas se eligieron en inglés, igual que los campos.
- **Sí: campos nuevos en inglés** (`galaxies`, `galaxyColor`, `prerequisites`, `related`). **No: español** (`galaxias`, `prerequisitos`…) como proponía el plan original. Así son coherentes con `title`, `category` y `durationHours`. Confirmado con el usuario.
- **Sí: `galaxyColor` desnormalizado en la tabla**, aunque se pueda derivar de `galaxies[0]`. Así el admin puede sobreescribir el color de un curso concreto, y el front no tiene que resolverlo.
- **Sí: aristas como arrays de slugs** en la propia fila. **No: tabla puente `course_edges`.** Con 80 cursos y edición manual rara, dos `text[]` bastan y siguen el patrón de `tags`. La contrapartida es que no hay FK (ver Riesgos).
- **Sí: respuesta `{ galaxies, courses }`.** **No: array plano de cursos.** El front obtiene nombres, colores y centros sin duplicar la constante. Confirmado con el usuario.
- **Sí: el endpoint devuelve los 80 cursos con `isActive`**, a diferencia del resto de endpoints de cursos, que solo devuelven activos. El front decide cómo pinta los legacy. Confirmado con el usuario.
- **Sí: los legacy solo tienen `related` hacia su versión actual, sin simetría.** **No: prerequisitos entre legacy.** **No: nodos sueltos.** Así los legacy quedan conectados al mapa sin contaminar el grafo de aprendizaje activo. Confirmado con el usuario.
- **Sí: posiciones precalculadas como literales.** **No: calcularlas en runtime en el servicio.** Son reproducibles, revisables en el diff y editables a mano con `PATCH`. El script que las genera no se commitea porque solo se usa una vez.
- **Sí: dos migraciones separadas (esquema y datos).** Se pueden revertir de forma independiente, y la de esquema es trivialmente segura en prod.
- **Sí: migraciones escritas a mano, no `migration:generate`.** Siguen el estilo de `1726000000004`, y `generate` contra un `.env` que apunta a prod es peligroso.
- **Sí: rama `spec-03-…` desde `origin/feature/dev_backend`.** **No: desde `main`.** `main` no tiene las migraciones 0003–0007 que ya están en prod; partir de ahí duplicaría o rompería el historial de migraciones. Confirmado con el usuario.
- **Sí: aplicar en prod dentro del spec, como último paso y con confirmación explícita.** Confirmado con el usuario.

---

## Riesgos identificados

| Riesgo                                                                                                                    | Mitigación                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El`.env` activo apunta a prod, y un `migration:run` local se aplica ahí.                                             | Los pasos 1–8 usan el`DATABASE_URL` local de Docker. El paso 9 exige un OK explícito tras mostrar `migration:show`. El `.env` se restaura en el paso 8. |
| Sin FK, un`PATCH` o un borrado de curso puede dejar slugs huérfanos en `prerequisites`/`related`.                  | Se acepta en este spec. El front debe ignorar aristas hacia slugs que no vengan en`courses`. La validación de integridad queda para un spec futuro.          |
| Un curso creado después por el admin aparece en`(0, 0, 0)` y sin galaxia.                                              | Documentado en`docs/CONTEXT.md`. El admin asigna los valores con `PATCH`. El recálculo automático queda fuera de alcance.                                 |
| `main` y `feature/dev_backend` siguen divergiendo, y un merge posterior puede traer conflictos en `data-source.ts`. | Este spec solo añade 2 imports y 2 entradas en la lista. La reconciliación de ramas queda fuera de alcance.                                                   |
| Devolver inactivos en este endpoint rompe la convención del resto de endpoints de cursos.                                | Cada curso trae`isActive` explícito, y queda documentado en Swagger y en `docs/CONTEXT.md`.                                                                |

---

## Lo que **no** está en este spec

- Recalcular posiciones o clasificar automáticamente cursos nuevos.
- Tabla o CRUD de galaxias.
- Validación de existencia o de ciclos de slugs en `PATCH`.
- Progreso del usuario pintado en el mapa.
- Cambios en auth, perfiles o JWT.
- Reconciliar `main` con `origin/feature/dev_backend`.

Cada uno de estos, si se necesita, va en su propio spec.
