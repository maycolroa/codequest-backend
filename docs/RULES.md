# 📏 RULES.md — Reglas de Código

> Estas reglas son **obligatorias** para todo el equipo y para Claude Code.
> Si una regla entra en conflicto con algo, la regla gana.

---

## 1. TypeScript

### ✅ Correcto
```typescript
// Siempre tipar los parámetros y retornos
async findById(id: string): Promise<Course> {
  const course = await this.coursesRepo.findOneOrFail({ where: { id } })
  return course
}

// Usar interfaces o tipos para objetos complejos
interface GeneratedPath {
  title:          string
  description:    string
  estimatedWeeks: number
  totalHours:     number
  courses:        CourseOrder[]
  tips:           string[]
}
```

### ❌ Incorrecto
```typescript
// Nunca usar 'any' sin justificación con comentario
async findById(id: any): Promise<any> { ... }

// Nunca ignorar errores de TypeScript
// @ts-ignore  ← prohibido sin comentario explicativo
```

**Regla:** Si necesitas `any`, escribe un comentario explicando por qué.

---

## 2. NestJS — Estructura de módulos

### Cada módulo DEBE tener esta estructura:
```
modulo-nombre/
  ├── modulo-nombre.module.ts      # importa dependencias
  ├── modulo-nombre.controller.ts  # solo recibe requests, delega al service
  ├── modulo-nombre.service.ts     # toda la lógica de negocio aquí
  └── dto/
      ├── create-modulo.dto.ts     # validación de entrada POST
      └── update-modulo.dto.ts     # validación de entrada PATCH
```

### El controller NO debe tener lógica de negocio:
```typescript
// ✅ Correcto — controller delega todo al service
@Get(':id')
findOne(@Param('id') id: string, @GetUser('id') userId: string) {
  return this.learningPathsService.findOne(id, userId)
}

// ❌ Incorrecto — lógica en el controller
@Get(':id')
async findOne(@Param('id') id: string) {
  const path = await this.repo.find({ where: { id } }) // no hacer esto
  if (!path) throw new NotFoundException()              // no hacer esto
  return path
}
```

---

## 3. Manejo de errores

### Usar excepciones de NestJS, no throw genérico:
```typescript
// ✅ Correcto
import { NotFoundException, ForbiddenException } from '@nestjs/common'

if (!course) throw new NotFoundException(`Curso ${id} no encontrado`)
if (path.userId !== userId) throw new ForbiddenException('No tienes acceso')

// ❌ Incorrecto
throw new Error('not found')
```

### Nunca usar console.log — usar Logger de NestJS:
```typescript
// ✅ Correcto
import { Logger } from '@nestjs/common'
private readonly logger = new Logger(AiService.name)

this.logger.log(`Ruta generada: "${path.title}"`)
this.logger.error('Error en Claude API:', error.message)
this.logger.warn('Token próximo a expirar')

// ❌ Incorrecto
console.log('ruta generada')
console.error('error')
```

---

## 4. TypeORM — Entidades y repositorios

### Entidades:
```typescript
// ✅ Correcto — camelCase en TypeScript, snake_case en DB
@Entity('user_assessments')
export class UserAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })          // columna explícita en DB
  userId: string

  @Column({ type: 'text', array: true, default: [] })
  interests: string[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}

// ❌ Incorrecto — synchronize:true en producción
TypeOrmModule.forRoot({ synchronize: true }) // JAMÁS en producción
```

### Repositorios — siempre usar Repository<T>:
```typescript
// ✅ Correcto
constructor(
  @InjectRepository(Course)
  private readonly coursesRepo: Repository<Course>,
) {}

// Usar findOneOrFail cuando el registro debe existir
const course = await this.coursesRepo.findOneOrFail({ where: { id } })

// ❌ Incorrecto — no validar si existe
const course = await this.coursesRepo.findOne({ where: { id } })
return course  // puede ser null!
```

---

## 5. DTOs y validación

### Todo DTO debe tener decoradores de class-validator:
```typescript
// ✅ Correcto
import { IsString, IsArray, IsEnum, IsNumber, Min, Max } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateAssessmentDto {
  @ApiProperty({ example: ['frontend', 'backend'] })
  @IsArray()
  @IsString({ each: true })
  interests: string[]

  @ApiProperty({ enum: ['beginner', 'intermediate', 'advanced'] })
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  currentLevel: string

  @ApiProperty({ example: 10, minimum: 1, maximum: 40 })
  @IsNumber()
  @Min(1)
  @Max(40)
  availableHoursPerWeek: number
}

// ❌ Incorrecto — sin validación
export class CreateAssessmentDto {
  interests: any
  currentLevel: string
}
```

---

## 6. Seguridad

### NUNCA en el código fuente:
```typescript
// ❌ PROHIBIDO ABSOLUTAMENTE
const API_KEY = 'sk-ant-api03-...'        // hardcoded secret
const DB_URL  = 'postgresql://user:pass@host/db'  // hardcoded URL
```

### SIEMPRE usar ConfigService:
```typescript
// ✅ Correcto
constructor(private config: ConfigService) {}

const apiKey = this.config.get<string>('ANTHROPIC_API_KEY')
const dbUrl  = this.config.get<string>('DATABASE_URL')
```

### Endpoints protegidos SIEMPRE con JWT guard:
```typescript
// ✅ Correcto — guard en el controller completo
@UseGuards(JwtAuthGuard)
@Controller('learning-paths')
export class LearningPathsController { ... }

// O en un endpoint específico
@UseGuards(JwtAuthGuard)
@Get('me')
getProfile() { ... }
```

---

## 7. Swagger / Documentación

### Todo endpoint DEBE tener decoradores de Swagger:
```typescript
@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {

  @Get()
  @ApiOperation({ summary: 'Listar cursos con filtros opcionales' })
  @ApiQuery({ name: 'category', required: false, example: 'backend' })
  @ApiQuery({ name: 'level', required: false, example: 'intermediate' })
  @ApiResponse({ status: 200, description: 'Lista de cursos', type: [Course] })
  findAll() { ... }
}
```

---

## 8. Nombres y convenciones

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos | kebab-case | `learning-paths.service.ts` |
| Clases | PascalCase | `LearningPathsService` |
| Métodos | camelCase | `findAllByUser()` |
| Variables | camelCase | `learningPath` |
| Constantes | UPPER_SNAKE | `JWT_EXPIRES_IN` |
| Tablas DB | snake_case | `user_progress` |
| Columnas DB | snake_case | `created_at` |
| Ramas Git | kebab-case | `feature/auth-discord` |
| Commits | Conventional Commits | `feat(auth): agregar discord OAuth2` |

---

## 9. Commits — Conventional Commits

```bash
# Formato: tipo(scope): descripción en español
feat(auth):      agregar login con Discord OAuth2
fix(paths):      corregir cálculo de porcentaje de progreso
refactor(ai):    extraer prompt a constante separada
docs(readme):    actualizar instrucciones de deploy
test(courses):   agregar tests del CoursesService
chore(docker):   actualizar imagen base a node:20-alpine
migration(db):   agregar tabla user_progress
```

---

## 10. Tests (si da tiempo)

```typescript
// Estructura de test para servicios
describe('CoursesService', () => {
  let service: CoursesService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: mockRepository },
      ],
    }).compile()
    service = module.get<CoursesService>(CoursesService)
  })

  it('debe retornar lista de cursos', async () => {
    mockRepository.find.mockResolvedValue([mockCourse])
    const result = await service.findAll()
    expect(result).toHaveLength(1)
  })
})
```
