# 02 — Login local (email/password) + recuperación de contraseña + login con Google

**Estado:** aprobado
**Depende de:** SPEC 01
**Fecha:** 2026-09-17

**Objetivo:** Permitir crear cuenta y autenticarse con email/password (con recuperación de contraseña vía correo real por Mailtrap) además de con Discord ya existente, y añadir login con Google OAuth2 siguiendo el mismo patrón que Discord.

---

## Alcance

**Incluye:**

- Registro local: `POST /auth/register` (email, username, password) → crea `Profile`, devuelve `{ profile, token }` (login automático, igual que hace hoy el callback de Discord).
- Login local: `POST /auth/login` (email, password) → valida contra el hash bcrypt guardado, devuelve `{ token }`.
- Recuperación de contraseña con envío real de correo vía **Mailtrap** (SMTP) usando `nodemailer`:
  - `POST /auth/forgot-password` (email) → genera token, lo guarda hasheado con expiración de 30 minutos, envía correo con el link de reseteo. Responde siempre con el mismo mensaje genérico exista o no el email (evita enumeración de usuarios).
  - `POST /auth/reset-password` (token, newPassword) → valida token y expiración, actualiza el password, invalida el token.
- Login con Google OAuth2: `GET /auth/google` y `GET /auth/google/callback`, mismo patrón que `DiscordStrategy`/`AuthController.discordCallback` (redirige al frontend con `?token=<jwt>`).
- Fusión de cuentas **solo en sentido OAuth → perfil existente**: si Discord o Google devuelven un email que ya pertenece a un `Profile` (creado por cualquier método), se vincula el `discordId`/`googleId` a ese perfil existente en lugar de crear uno duplicado.
- Bloqueo de registro duplicado: `POST /auth/register` con un email que ya existe en cualquier `Profile` (local, Discord o Google) devuelve `409 Conflict`.
- Cambios de esquema en `Profile`: `discordId` pasa a nullable, se añaden `googleId`, `password`, `resetPasswordToken`, `resetPasswordExpires`, y `email` pasa a `UNIQUE`.
- `JwtPayload` deja de depender de `discordId` (pasa a `{ sub, username }`), porque ahora no todo `Profile` tiene uno.
- Nuevo `MailModule`/`MailService` reutilizable, con `sendPasswordResetEmail(email, resetUrl)`.
- Nuevas dependencias: `bcrypt`, `@types/bcrypt`, `passport-google-oauth20`, `@types/passport-google-oauth20`, `nodemailer`, `@types/nodemailer`.
- Nuevas variables de entorno en `.env.example`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `MAILTRAP_HOST`, `MAILTRAP_PORT`, `MAILTRAP_USER`, `MAILTRAP_PASS`, `MAIL_FROM`.
- Actualizar `docs/CONTEXT.md`, `docs/TASKS.md` y `docs/CHANGELOG.md`.

**No incluye (queda para specs futuros):**

- Verificación de email al registrarse localmente (confirmar que el email es real antes de poder loguearse).
- Añadir una contraseña local a una cuenta que ya existe por Google/Discord (endpoint autenticado "set password"). Hoy esa combinación no está soportada: si el email ya existe, el registro se rechaza.
- Revocar/invalidar JWT antes de su expiración (sigue siendo stateless, DEC-004 en `docs/DECISIONS.md`).
- Proveedor de correo de producción — este spec solo configura el sandbox de Mailtrap para desarrollo/demo del hackathon.
- Rate limiting en `/auth/login` o `/auth/forgot-password` (ya descartado `@nestjs/throttler` en el spec 01; puede añadirse después si el abuso se vuelve un problema real).
- Login con otros proveedores (GitHub, etc.).

---

## Datos

### `Profile` (modificación de `src/auth/entities/profile.entity.ts`)

```typescript
id:                    uuid (PK)
discordId:             string | null   // UNIQUE — antes obligatorio, ahora nullable
googleId:              string | null   // UNIQUE — nuevo
email:                 string | null   // UNIQUE — antes no era único
username:              string
password:              string | null   // nuevo — hash bcrypt, null si el perfil nunca tuvo login local
avatarUrl:             string | null
resetPasswordToken:    string | null   // nuevo — hash sha256 del token, nunca el token en texto plano
resetPasswordExpires:  Date | null     // nuevo — timestamptz
createdAt:             Date
updatedAt:             Date
```

Postgres permite múltiples `NULL` en una columna `UNIQUE`, así que un `Profile` de Discord sin Google (o viceversa) no rompe la restricción.

### DTOs nuevos (`src/auth/dto/`)

```typescript
// register.dto.ts
class RegisterDto {
  @IsEmail() email: string
  @IsString() @MinLength(3) username: string
  @IsString() @MinLength(8) password: string
}

// login.dto.ts
class LoginDto {
  @IsEmail() email: string
  @IsString() password: string
}

// forgot-password.dto.ts
class ForgotPasswordDto {
  @IsEmail() email: string
}

// reset-password.dto.ts
class ResetPasswordDto {
  @IsString() token: string
  @IsString() @MinLength(8) newPassword: string
}
```

### `JwtPayload` (modificación de `src/auth/interfaces/jwt-payload.interface.ts`)

```typescript
interface JwtPayload {
  sub: string
  username: string
}
```

### `AuthenticatedGoogleUser` (nuevo, `src/auth/interfaces/authenticated-google-user.interface.ts`)

```typescript
interface AuthenticatedGoogleUser {
  googleId: string
  username: string
  email: string | null
  avatarUrl: string | null
}
```

---

## Plan de implementación

Cada paso deja el proyecto compilable (`npm run build` y `tsc --noEmit` sin errores).

1. **Instalar dependencias nuevas**

   ```bash
   npm install bcrypt passport-google-oauth20 nodemailer
   npm install -D @types/bcrypt @types/passport-google-oauth20 @types/nodemailer
   ```

   Verificar: `npm run build` sigue pasando (nada las importa aún).
2. **Modificar la entidad `Profile` y generar la migration**

   - `discordId`: quitar `unique: true` obligatorio implícito por `NOT NULL`, dejar `@Column({ name: 'discord_id', unique: true, nullable: true })`.
   - Añadir `googleId`, `password`, `resetPasswordToken`, `resetPasswordExpires` como columnas nullable.
   - `email`: añadir `unique: true`.
   - Generar y correr la migration:
     ```bash
     npm run migration:generate -- src/auth/migrations/AddLocalAuthAndGoogleOAuth
     npm run migration:run
     ```
   - Verificar: `tsc --noEmit` limpio, `npm run migration:show` refleja la nueva migration aplicada.
3. **Actualizar `JwtPayload` y todo lo que dependía de `discordId` en el JWT**

   - Cambiar `JwtPayload` a `{ sub, username }`.
   - Ajustar `AuthService.generateToken()` para no leer `discordId`.
   - `JwtStrategy.validate()` no cambia su forma (sigue buscando por `payload.sub`).
   - Verificar: el flujo actual de Discord (`/auth/discord` → `/auth/discord/callback` → `/auth/me`) sigue funcionando igual (prueba de regresión manual).
4. **Crear `MailModule` y `MailService`**

   - `src/mail/mail.module.ts`, `src/mail/mail.service.ts`.
   - `MailService` crea un transport de `nodemailer` con `MAILTRAP_HOST`/`MAILTRAP_PORT`/`MAILTRAP_USER`/`MAILTRAP_PASS`, y expone `sendPasswordResetEmail(email: string, resetUrl: string): Promise<void>`.
   - Añadir las variables `MAILTRAP_HOST`, `MAILTRAP_PORT`, `MAILTRAP_USER`, `MAILTRAP_PASS`, `MAIL_FROM` a `.env.example`.
   - Verificar manualmente: llamar el método desde un test rápido o script y confirmar que el correo aparece en el inbox de Mailtrap.
5. **Crear los DTOs de auth**

   - `src/auth/dto/register.dto.ts`, `login.dto.ts`, `forgot-password.dto.ts`, `reset-password.dto.ts` con las validaciones de la sección de Datos.
   - Verificar: `npm run build` sin errores (DTOs sin usar todavía).
6. **Implementar registro y login local en `AuthService`**

   - `registerLocal(dto: RegisterDto)`: busca `Profile` por email; si existe, lanza `ConflictException`; si no, hashea el password con `bcrypt.hash(password, 10)`, crea el `Profile` (sin `discordId`/`googleId`) y devuelve `{ profile, token: generateToken(profile) }`.
   - `validateLocalLogin(email: string, password: string)`: busca por email; si no existe o `password` es `null` (perfil sin login local) o `bcrypt.compare` falla, lanza `UnauthorizedException`; si es válido, devuelve el `Profile`.
   - Refactor de `findOrCreateUser` (usado hoy solo por Discord) a `findOrCreateOAuthUser(provider: 'discord' | 'google', providerId: string, data: { username, email, avatarUrl })`: busca primero por el id del proveedor; si no encuentra, busca por `email`; si encuentra por email, actualiza esa fila con el `providerId` (fusión); si no encuentra nada, crea un `Profile` nuevo.
   - Verificar: `tsc --noEmit` limpio.
7. **Exponer `register` y `login` en `AuthController`**

   - `POST /auth/register` → `AuthService.registerLocal()`.
   - `POST /auth/login` → `AuthService.validateLocalLogin()` + `generateToken()`.
   - Documentar ambos con Swagger (`@ApiOperation`, `@ApiResponse` para 200/201, 401, 409).
   - Verificar con Swagger UI o `curl`: registro exitoso, registro duplicado devuelve 409, login correcto devuelve JWT, login con password incorrecto devuelve 401.
8. **Implementar recuperación de contraseña**

   - `AuthService.forgotPassword(email)`: si existe el `Profile`, genera un token aleatorio (`crypto.randomBytes(32).toString('hex')`), guarda su hash SHA-256 y `resetPasswordExpires = now + 30min`, llama `MailService.sendPasswordResetEmail()` con `${FRONTEND_URL}/reset-password?token=<token-en-texto-plano>`. Responde siempre el mismo mensaje genérico, exista o no el email.
   - `AuthService.resetPassword(token, newPassword)`: hashea el token recibido, busca `Profile` por `resetPasswordToken` con `resetPasswordExpires > now`; si no hay match, lanza error; si hay match, actualiza `password` (hasheado) y limpia `resetPasswordToken`/`resetPasswordExpires`.
   - `POST /auth/forgot-password` y `POST /auth/reset-password` en el controller, documentados en Swagger.
   - Verificar manualmente el flujo completo contra el inbox de Mailtrap: pedir reset, copiar el token del correo, resetear, loguearse con la password nueva.
9. **Crear `GoogleStrategy` y los endpoints de Google**

   - `src/auth/strategies/google.strategy.ts` con `passport-google-oauth20`, scope `['profile', 'email']`, usando `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_CALLBACK_URL`.
   - `GET /auth/google` (`AuthGuard('google')`) y `GET /auth/google/callback` en `AuthController`, llamando `findOrCreateOAuthUser('google', ...)` y redirigiendo a `FRONTEND_URL?token=<jwt>`, igual que hace hoy `discordCallback`.
   - Registrar `GoogleStrategy` en `AuthModule.providers`.
   - Añadir `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` a `.env.example`.
   - Verificar con una app real de Google Cloud Console (credenciales de prueba): el flujo completo `/auth/google` → consentimiento → callback → JWT → `/auth/me`.
10. **Actualizar documentación del proyecto**

    - `docs/CONTEXT.md`: nuevos endpoints de Auth, nuevas variables de entorno, estructura actualizada de `Profile`.
    - `docs/TASKS.md`: marcar las tareas nuevas de este spec como completadas.
    - `docs/CHANGELOG.md`: entrada nueva describiendo login local, recuperación de contraseña y login con Google.
    - `.env.example`: verificar que están las 8 variables nuevas con valores de ejemplo (no reales).

---

## Criterios de aceptación

- [ ] `POST /auth/register` con un email nuevo crea un `Profile` con `password` hasheado (bcrypt) y devuelve `{ profile, token }`.
- [ ] `POST /auth/register` con un email que ya existe (local, Discord o Google) devuelve `409 Conflict`.
- [ ] `POST /auth/login` con credenciales correctas devuelve un JWT válido.
- [ ] `POST /auth/login` con password incorrecto, o contra un `Profile` sin `password` local (creado solo por OAuth), devuelve `401 Unauthorized`.
- [ ] `POST /auth/forgot-password` responde siempre `200` con el mismo mensaje genérico, exista o no el email.
- [ ] Cuando el email existe, `POST /auth/forgot-password` envía un correo real visible en el inbox de Mailtrap con un link de reseteo.
- [ ] `POST /auth/reset-password` con un token expirado (>30 min) o inexistente devuelve error y no cambia el password.
- [ ] `POST /auth/reset-password` con token válido actualiza el password (hasheado) y ese mismo token ya no puede reutilizarse.
- [ ] `GET /auth/google` redirige al consentimiento de Google; `GET /auth/google/callback` crea o vincula el `Profile` y redirige al frontend con `?token=<jwt>`.
- [ ] Si un email ya registrado localmente inicia sesión con Google usando ese mismo email, se vincula `googleId` al `Profile` existente en vez de crear uno duplicado (mismo comportamiento esperado para Discord).
- [ ] `GET /auth/me` sigue devolviendo el perfil correcto sin importar si el `Profile` fue creado por registro local, Google o Discord.
- [ ] `npm run build`, `tsc --noEmit` y `npm run migration:run` no reportan errores.
- [ ] No quedan credenciales de Google/Mailtrap hardcodeadas; todas están documentadas como variables de entorno en `.env.example` y `docs/CONTEXT.md`.
- [ ] `docs/TASKS.md` y `docs/CHANGELOG.md` reflejan el trabajo de este spec.

---

## Decisiones tomadas y descartadas

- **Un solo spec para local + recuperación + Google**, en vez de dividirlo en dos. Se le ofreció al usuario separar Google en un spec propio (más simple, sigue el patrón de Discord) del local+recuperación (más grande, con más decisiones), pero decidió explícitamente mantenerlo junto.
- **bcrypt** sobre `argon2` para hashear passwords. Motivo: estándar de facto en el ecosistema NestJS/DevTalles, sin problemas de compilación nativa en la imagen `node:alpine` usada por el `Dockerfile`. Confirmado con el usuario.
- **Mailtrap + `nodemailer`** para enviar correos reales de recuperación, en vez de solo devolver el token en la respuesta HTTP. Motivo: el usuario pidió explícitamente envío real de correo. Implica una dependencia nueva y un `MailModule` nuevo, y que Mailtrap es solo un sandbox de pruebas (ver Riesgos).
- **Fusión de cuentas solo en sentido OAuth → perfil existente.** Si Discord o Google traen un email ya registrado (por cualquier método), se vincula el `providerId` a ese `Profile` porque el proveedor OAuth ya verificó el email. El registro local, en cambio, **nunca** fusiona: si el email ya existe, se rechaza con `409`. Motivo: permitir que el registro local fusione automáticamente sería un hueco de seguridad — cualquiera podría registrar una contraseña sobre el email de otra persona sin probar que es su dueño. Confirmado con el usuario tras explicar el riesgo.
- **`Profile.discordId` pasa a nullable + único** (antes obligatorio) y se añade `googleId` con el mismo patrón; Postgres permite múltiples `NULL` en una columna `UNIQUE`, así que no hay conflicto entre perfiles que solo tienen uno de los dos. Confirmado con el usuario.
- **`JwtPayload` pierde `discordId`**, queda `{ sub, username }`. Motivo: ya no todo `Profile` tiene un `discordId`; mantenerlo habría obligado a inventar un valor falso para logins locales/Google.
- **Password: mínimo 8 caracteres, sin reglas de complejidad adicionales** (mayúscula/número/símbolo). Motivo: decisión explícita del usuario, priorizando velocidad de pruebas durante el hackathon; `bcrypt` ya mitiga el riesgo de fuerza bruta.
- **Token de recuperación expira en 30 minutos** y se guarda **hasheado** (SHA-256) en `Profile.resetPasswordToken`, no en texto plano. Motivo: si la base de datos se filtra, un token en texto plano permitiría resetear cualquier password activo; hashearlo es una protección de bajo costo.
- **No se crea una tabla separada para tokens de recuperación.** Se guardan como dos columnas nullable en `Profile` porque solo se necesita un token activo a la vez por usuario — una tabla aparte sería sobre-diseño para este caso.
- **Se descarta `passport-local`.** `AuthService.validateLocalLogin()` se llama directo desde el controller sin una Strategy de Passport adicional: no aporta valor sobre la llamada directa y evita una dependencia más para un caso tan simple.
- **`username` es obligatorio en `RegisterDto`**, no se deriva del email. Motivo: consistente con cómo ya se llena hoy desde el username de Discord; decisión explícita del usuario.
- **`MailModule` vive en `src/mail/`** (no dentro de `src/auth/`) porque es una utilidad que podría reutilizarse en el futuro fuera de auth (por ejemplo, notificaciones), aunque hoy solo lo use `AuthModule`.

---

## Riesgos identificados

| Riesgo                                                                                                                                    | Mitigación                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mailtrap es un sandbox: los correos no llegan a bandejas reales, solo al inbox de pruebas de Mailtrap.                                    | Aceptado para el hackathon; si el demo final necesita un correo real, migrar a un proveedor de producción queda para otro spec.                                           |
| Hacer`email` `UNIQUE` en `Profile` puede fallar la migration si ya existen filas con emails duplicados.                             | Postgres permite múltiples`NULL`, así que solo es riesgo si hay duplicados reales no nulos; revisar los datos existentes en cada entorno antes de correr la migration. |
| `passport-google-oauth20` y sus tipos tienen mantenimiento poco frecuente (similar a `passport-discord`, ya señalado en el spec 01). | Revisar`npm audit` en el paso 1 antes de cerrar el spec, igual que se hizo con `passport-discord`.                                                                     |
| El link de reseteo apunta a`FRONTEND_URL/reset-password?token=...`, una ruta que debe existir en el frontend.                           | Si el frontend no la implementa a tiempo, el backend queda completo pero sin UI que lo consuma — coordinar con el equipo de frontend antes de la demo.                    |

---

## Lo que **no** está en este spec

- Verificación de email al registrarse localmente.
- Endpoint para añadir password local a una cuenta creada por Google/Discord.
- Revocación de JWT antes de su expiración.
- Proveedor de correo de producción (solo Mailtrap sandbox).
- Rate limiting en `/auth/login` o `/auth/forgot-password`.
- Login con otros proveedores distintos a Discord y Google.

Cada uno de estos, si se necesita, va en su propio spec.
