import { MigrationInterface, QueryRunner } from 'typeorm';

type SeedQuestion = {
  skillSlug: string;
  text: string;
  difficulty: 1 | 2 | 3;
  options: readonly string[];
  correctPosition: 1 | 2 | 3 | 4;
};

const question = (
  skillSlug: string,
  text: string,
  difficulty: 1 | 2 | 3,
  options: readonly string[],
  correctPosition: 1 | 2 | 3 | 4,
): SeedQuestion => ({ skillSlug, text, difficulty, options, correctPosition });

/** Initial bank aligned with technologies already present in the DevTalles catalog. */
const QUESTIONS: readonly SeedQuestion[] = [
  question('javascript', '¿Cuál es el alcance de una variable declarada con const?', 1,
    ['De bloque', 'Solo de función', 'Global siempre', 'No tiene alcance'], 1),
  question('javascript', '¿Qué ocurre con Promise.all si una de sus promesas es rechazada?', 2,
    ['Resuelve con los resultados disponibles', 'Se rechaza con ese error', 'Ignora la promesa rechazada', 'Espera y devuelve null'], 2),
  question('javascript', '¿Qué se ejecuta primero después de finalizar el código síncrono?', 3,
    ['Un callback de setTimeout(..., 0)', 'Una tarea de renderizado', 'Un callback en la cola de microtareas, como Promise.then', 'Un evento de I/O siempre'], 3),

  question('typescript', '¿Cuál es el objetivo principal de TypeScript?', 1,
    ['Agregar tipado estático sobre JavaScript', 'Reemplazar el navegador', 'Ejecutar consultas SQL', 'Compilar CSS'], 1),
  question('typescript', '¿Qué debes hacer antes de usar un valor de tipo unknown como string?', 2,
    ['Convertirlo implícitamente', 'Comprobar o acotar su tipo', 'Declararlo como any', 'Pasarlo a JSON.stringify'], 2),
  question('typescript', '¿Qué representa keyof User si User tiene name y email?', 3,
    ['El tipo string', 'La unión "name" | "email"', 'Un objeto User vacío', 'Los valores de name y email'], 2),

  question('react', '¿Cuál es la forma recomendada de actualizar estado basado en el estado anterior?', 1,
    ['Modificar directamente el objeto de estado', 'Usar el setter con una función prev => nuevoEstado', 'Asignar el estado a una variable global', 'Recargar la página'], 2),
  question('react', '¿Cuándo se ejecuta la función de limpieza retornada por useEffect?', 2,
    ['Solo al montar el componente', 'Antes del siguiente efecto y al desmontar', 'Después de cada render sin excepción', 'Nunca; React la ignora'], 2),
  question('react', '¿Para qué sirven las keys estables al renderizar una lista?', 3,
    ['Para aplicar estilos CSS', 'Para que React identifique cada elemento entre renders', 'Para cifrar las propiedades', 'Para ordenar automáticamente la lista'], 2),

  question('node', '¿Qué archivo suele declarar scripts y dependencias de un proyecto Node.js?', 1,
    ['package.json', 'node.config', 'server.env', 'main.sql'], 1),
  question('node', '¿Qué ventaja ofrece usar streams para archivos grandes?', 2,
    ['Carga todo el archivo antes de procesarlo', 'Procesa datos por partes y reduce el uso de memoria', 'Deshabilita operaciones asíncronas', 'Convierte automáticamente a JSON'], 2),
  question('node', 'Si writable.write(chunk) devuelve false, ¿qué debe esperar el productor?', 3,
    ['El evento close', 'El evento drain antes de seguir escribiendo', 'Un nuevo proceso de Node', 'Que el GC elimine el stream'], 2),

  question('nestjs', '¿Qué decorador permite que una clase sea resuelta por el contenedor de inyección de NestJS?', 1,
    ['@Injectable()', '@Entity()', '@ModuleRef()', '@Controller()'], 1),
  question('nestjs', '¿Qué se debe habilitar globalmente para validar DTOs con class-validator?', 2,
    ['ValidationPipe', 'SwaggerModule', 'HttpModule', 'CacheInterceptor'], 1),
  question('nestjs', '¿Cuál es la forma habitual de resolver una dependencia circular entre módulos?', 3,
    ['Eliminar todos los providers', 'Usar forwardRef(() => OtroModulo)', 'Cambiar los módulos por controladores', 'Usar una variable global'], 2),

  question('sql', '¿Qué garantiza una clave primaria en una tabla?', 1,
    ['Valores únicos e identificadores no nulos', 'Que todas las columnas sean texto', 'Que no existan relaciones', 'Que cada consulta use un índice'], 1),
  question('sql', '¿Qué devuelve un INNER JOIN?', 2,
    ['Todas las filas de la tabla izquierda', 'Solo filas con coincidencia entre ambas tablas', 'Solo filas sin coincidencia', 'Una unión de columnas sin filas'], 2),
  question('sql', '¿Cuál es un costo habitual de añadir índices?', 3,
    ['Las lecturas siempre son más lentas', 'Inserciones y actualizaciones pueden ser más costosas', 'Las claves primarias dejan de funcionar', 'No se puede usar WHERE'], 2),

  question('postgresql', '¿Qué propiedad busca garantizar una transacción?', 1,
    ['Que todas sus operaciones se confirmen o se reviertan juntas', 'Que las tablas no tengan columnas', 'Que los índices se creen automáticamente', 'Que las consultas sean públicas'], 1),
  question('postgresql', '¿Qué tipo es apropiado para almacenar un documento JSON consultable en PostgreSQL?', 2,
    ['jsonb', 'uuid', 'bytea', 'inet'], 1),
  question('postgresql', '¿Qué tipo de índice suele usarse para acelerar búsquedas de contención sobre jsonb?', 3,
    ['GIN', 'BRIN obligatorio', 'HASH de clave primaria', 'No es posible indexar jsonb'], 1),
];

export class SeedInitialAssessmentQuestions1726000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const entry of QUESTIONS) {
      const positions = entry.options.map((_, index) => index + 1);
      const correctOptions = positions.map((position) => position === entry.correctPosition);
      await queryRunner.query(`
        WITH inserted_question AS (
          INSERT INTO "questions" ("skill_id", "text", "type", "difficulty", "is_active")
          SELECT "id", $2, 'single_choice', $3, true
          FROM "skills"
          WHERE "slug" = $1
          RETURNING "id"
        )
        INSERT INTO "question_options" ("question_id", "text", "is_correct", "position")
        SELECT inserted_question.id, option_text, is_correct, position
        FROM inserted_question
        CROSS JOIN UNNEST($4::text[], $5::boolean[], $6::smallint[]) AS option_values(option_text, is_correct, position)
      `, [entry.skillSlug, entry.text, entry.difficulty, entry.options, correctOptions, positions]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM "questions" WHERE "text" = ANY($1)', [QUESTIONS.map((entry) => entry.text)]);
  }
}
