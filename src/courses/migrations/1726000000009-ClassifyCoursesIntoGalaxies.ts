import { MigrationInterface, QueryRunner } from 'typeorm';

import {
  COURSE_GALAXIES,
  CourseGalaxyKey,
} from '../constants/course-galaxies.constant';

type CourseGalaxyAssignment = {
  slug: string;
  galaxies: CourseGalaxyKey[];
  position: [number, number, number];
  prerequisites: string[];
  related: string[];
};

const galaxy = (
  slug: string,
  galaxies: CourseGalaxyKey[],
  position: [number, number, number],
  prerequisites: string[] = [],
  related: string[] = [],
): CourseGalaxyAssignment => ({
  slug,
  galaxies,
  position,
  prerequisites,
  related,
});

// Posiciones precalculadas (espiral de ángulo áureo alrededor del centro de galaxies[0]).
// Los cursos legacy solo tienen related hacia su versión actual.
const ASSIGNMENTS: CourseGalaxyAssignment[] = [
  galaxy('claude-code', ['ai-ml'], [66.1, -1.13, 0.11], [], ['opencode', 'vibe-coding-responsable', 'ia-developers-claude-rag-agentes']),
  galaxy('ia-developers-claude-rag-agentes', ['ai-ml', 'backend'], [68.18, 3.47, -5.67], ['nodejs-de-cero-a-experto'], ['claude-code', 'spring-ai']),
  galaxy('ingenieria-de-prompts', ['ai-ml'], [54.93, -1.11, 5.27], [], []),
  galaxy('expo-gemini', ['ai-ml', 'mobile'], [50.57, 2.71, -0.78], ['react-native-expo'], []),
  galaxy('python-inteligencia-artificial', ['ai-ml'], [70.9, 3.31, 4.05], ['python-fundamentos'], []),
  galaxy('python-n8n', ['ai-ml'], [48.94, 3.63, 6.37], ['python-fundamentos'], []),
  galaxy('openai-react-nestjs', ['ai-ml', 'frontend', 'backend'], [55.6, 2.54, -10.58], ['react-de-cero-a-experto', 'nest-backend-escalable'], ['openai-angular-nestjs']),
  galaxy('openai-angular-nestjs', ['ai-ml', 'frontend', 'backend'], [55.97, 2.89, 9.97], ['angular-de-cero-a-experto', 'nest-backend-escalable'], ['openai-react-nestjs']),
  galaxy('opencode', ['ai-ml'], [61.02, 0.43, -8.25], [], ['claude-code', 'vibe-coding-responsable']),
  galaxy('spring-ai', ['ai-ml', 'dotnet-java', 'devops'], [45.56, 4.59, -6.66], ['java-spring-boot-guia-definitiva'], ['ia-developers-claude-rag-agentes']),
  galaxy('n8n-mcp', ['ai-ml'], [65.07, 5.04, -12.05], ['python-n8n'], ['patrones-diseno-agentico']),
  galaxy('patrones-diseno-agentico', ['ai-ml'], [63.17, 4.24, 14.01], ['ingenieria-de-prompts'], ['n8n-mcp']),
  galaxy('vibe-coding-responsable', ['ai-ml'], [64.38, 0.34, 7.67], [], ['claude-code', 'opencode']),

  galaxy('angular-clasico-modulos', ['frontend'], [43.5, -4.94, 47.28], [], ['angular-de-cero-a-experto']),
  galaxy('angular-pro', ['frontend'], [42.08, -3.05, 38.99], ['angular-de-cero-a-experto', 'typescript-guia-completa'], ['angular-sockets-bun']),
  galaxy('angular-de-cero-a-experto', ['frontend'], [32.39, -4.27, 50.94], [], ['angular-clasico-modulos']),
  galaxy('angular-sockets-bun', ['frontend'], [50.25, 1.07, 49.55], ['angular-de-cero-a-experto'], ['angular-pro', 'react-sockets-bun']),
  galaxy('react-de-cero-a-experto', ['frontend'], [35.06, -5.91, 54.8], ['javascript-moderno'], []),
  galaxy('react-pro', ['frontend'], [45.3, -3.18, 37.94], ['react-de-cero-a-experto', 'typescript-guia-completa'], ['zustand-react', 'nextjs-produccion']),
  galaxy('react-sockets-bun', ['frontend'], [45.77, 0.06, 60.43], ['react-de-cero-a-experto'], ['angular-sockets-bun']),
  galaxy('nextjs-produccion', ['frontend'], [47.17, -2.99, 53.29], ['react-de-cero-a-experto'], ['react-pro']),
  galaxy('vuejs-composition-api', ['frontend'], [28.97, -4.15, 50.97], ['javascript-moderno'], []),
  galaxy('vuejs-intermedio', ['frontend'], [38.53, -3.14, 59.4], ['vuejs-composition-api'], ['nuxt-4']),
  galaxy('nuxt-4', ['frontend'], [26.27, -2.23, 48.82], ['vuejs-composition-api'], ['vuejs-intermedio']),
  galaxy('astro-contenido', ['frontend'], [40.85, -3.1, 55.71], [], ['tailwindcss']),
  galaxy('tailwindcss', ['frontend'], [33.79, -6.19, 39.2], [], ['astro-contenido']),
  galaxy('zustand-react', ['frontend'], [28.93, -3.4, 37.43], ['react-de-cero-a-experto'], ['react-pro']),
  galaxy('javascript-moderno', ['frontend', 'fundamentals'], [38.77, -5.94, 40.57], [], ['programacion-principiantes']),
  galaxy('typescript-guia-completa', ['frontend', 'fundamentals'], [45.57, -3.84, 50.05], ['javascript-moderno'], []),
  galaxy('legacy-angular-v14', ['frontend'], [41.79, -5.41, 52.39], [], ['angular-de-cero-a-experto']),
  galaxy('legacy-angular-mean', ['frontend'], [26.46, 0.23, 55.67], [], ['angular-pro']),
  galaxy('legacy-nextjs-pages-router', ['frontend'], [28.17, -2.97, 42.62], [], ['nextjs-produccion']),
  galaxy('legacy-pwa', ['frontend'], [47.22, -1.8, 44.75], [], ['javascript-moderno']),
  galaxy('legacy-react-v16-v17', ['frontend'], [30.62, -4.47, 45.13], [], ['react-de-cero-a-experto']),
  galaxy('legacy-react-javascript-mern', ['frontend'], [31.18, -1.54, 55.54], [], ['react-de-cero-a-experto']),
  galaxy('legacy-react-socket-io', ['frontend'], [39.31, 0.73, 32.17], [], ['react-sockets-bun']),
  galaxy('legacy-rxjs', ['frontend'], [34.57, -1.9, 36.29], [], ['angular-pro']),
  galaxy('legacy-vue-options-api', ['frontend'], [43.81, -4.06, 43.44], [], ['vuejs-composition-api']),

  galaxy('django-aplicaciones-web', ['backend'], [-22.76, 5.13, 57.47], ['python-fundamentos'], ['fastapi-apis-eficientes']),
  galaxy('fastapi-apis-eficientes', ['backend'], [-4.71, 4.67, 53.59], ['python-fundamentos'], ['django-aplicaciones-web']),
  galaxy('laravel-13-ai-rest-jwt', ['backend', 'ai-ml'], [-24.59, 6.79, 64.65], ['php-moderno'], []),
  galaxy('nest-backend-escalable', ['backend'], [-17.92, 5.1, 47.67], ['nodejs-de-cero-a-experto', 'typescript-guia-completa'], ['sql-postgresql']),
  galaxy('nest-graphql', ['backend'], [-8.6, 8.05, 45.16], ['nest-backend-escalable'], []),
  galaxy('nestjs-reportes-pdf', ['backend'], [-2.35, 5.52, 63.58], ['nest-backend-escalable'], []),
  galaxy('nestjs-testing', ['backend'], [-7.31, 7.1, 72.19], ['nest-backend-escalable'], []),
  galaxy('nodejs-de-cero-a-experto', ['backend'], [-18.96, 1.32, 62.57], ['javascript-moderno'], []),
  galaxy('node-autenticacion-rest-clean-architecture', ['backend'], [-27.83, 7.97, 51.92], ['nodejs-de-cero-a-experto'], ['solid-y-clean-code']),
  galaxy('php-moderno', ['backend'], [-11.73, 2.15, 50.45], [], []),
  galaxy('golang-backend-profesional', ['backend'], [-14.91, 5.17, 69.61], ['golang-fundamentos'], []),
  galaxy('sql-postgresql', ['backend', 'fundamentals'], [-8.06, 1.09, 65.64], [], ['nest-backend-escalable']),
  galaxy('legacy-node-de-cero-a-experto', ['backend'], [-7.16, 2.07, 58.57], [], ['nodejs-de-cero-a-experto']),

  galaxy('nestjs-microservicios', ['fundamentals', 'backend'], [-43.92, 1.19, 18.28], ['nest-backend-escalable'], ['docker-guia-practica', 'spring-boot-4-microservicios']),
  galaxy('spring-boot-4-microservicios', ['fundamentals', 'dotnet-java'], [-56.95, 1.62, 40.61], ['java-spring-boot-guia-definitiva'], ['nestjs-microservicios', 'docker-guia-practica']),
  galaxy('spring-boot-4-patrones-arquitectura', ['fundamentals', 'dotnet-java'], [-62.69, 0.79, 12.77], ['java-spring-boot-guia-definitiva'], ['spring-boot-mvc-hexagonal', 'patrones-de-diseno']),
  galaxy('patrones-de-diseno', ['fundamentals'], [-59.32, -4.4, 29.69], [], ['solid-y-clean-code', 'spring-boot-4-patrones-arquitectura']),
  galaxy('solid-y-clean-code', ['fundamentals'], [-62.35, -3.45, 23.44], [], ['patrones-de-diseno', 'node-autenticacion-rest-clean-architecture']),
  galaxy('python-fundamentos', ['fundamentals'], [-48.71, -4.29, 32.36], [], ['programacion-principiantes']),
  galaxy('golang-fundamentos', ['fundamentals'], [-47.96, -4.02, 26.04], [], []),
  galaxy('programacion-principiantes', ['fundamentals'], [-54, -3.69, 18.45], [], ['javascript-moderno', 'python-fundamentos']),

  galaxy('flutter-movil-de-cero-a-experto', ['mobile'], [-59.99, 1.35, -21.28], ['dart-desde-cero'], ['react-native-expo']),
  galaxy('flutter-recursos-nativos', ['mobile'], [-64.12, 3.1, -28.89], ['dart-desde-cero', 'flutter-movil-de-cero-a-experto'], ['flutter-bloc']),
  galaxy('flutter-bloc', ['mobile'], [-48.89, 3.21, -18.19], ['dart-desde-cero', 'flutter-movil-de-cero-a-experto'], ['flutter-recursos-nativos']),
  galaxy('react-native-expo', ['mobile'], [-42.11, 4.3, -21.28], ['react-de-cero-a-experto'], ['flutter-movil-de-cero-a-experto']),
  galaxy('dart-desde-cero', ['mobile'], [-47.96, 0.75, -26.17], [], []),
  galaxy('legacy-flutter-avanzado', ['mobile'], [-67.47, 5.73, -20.16], [], ['flutter-bloc']),
  galaxy('legacy-flutter-intermedio', ['mobile'], [-44.97, 3.49, -31.82], [], ['flutter-recursos-nativos']),
  galaxy('legacy-flutter-web', ['mobile'], [-58.06, 3.54, -15.15], [], ['flutter-movil-de-cero-a-experto']),
  galaxy('legacy-react-native-cli', ['mobile'], [-58.74, 3.53, -37.31], [], ['react-native-expo']),
  galaxy('legacy-react-native', ['mobile'], [-52.28, 2, -34.54], [], ['react-native-expo']),

  galaxy('docker-guia-practica', ['devops'], [-7.28, -6.05, -59.12], [], ['nestjs-microservicios', 'git-github-desde-cero', 'spring-boot-4-microservicios']),
  galaxy('git-github-desde-cero', ['devops'], [-18.37, -4.89, -52.88], [], ['docker-guia-practica']),
  galaxy('legacy-git-github', ['devops'], [-13.89, -4.84, -67.38], [], ['git-github-desde-cero']),

  galaxy('dotnet-backend-core-sql-server-jwt', ['dotnet-java', 'backend'], [43.74, 1.71, -38.11], ['csharp-desde-cero'], ['dotnet-testing-minimal-api']),
  galaxy('dotnet-testing-minimal-api', ['dotnet-java', 'backend'], [47.98, 4.94, -55.06], ['csharp-desde-cero'], ['dotnet-backend-core-sql-server-jwt']),
  galaxy('blazor-arquitectura-limpia', ['dotnet-java', 'backend'], [37.72, 1.2, -56.53], ['csharp-desde-cero'], []),
  galaxy('csharp-desde-cero', ['dotnet-java', 'backend'], [43.69, -0.08, -46.8], [], []),
  galaxy('java-spring-boot-guia-definitiva', ['dotnet-java', 'backend'], [25.01, 1.33, -50.17], ['java-desde-cero'], []),
  galaxy('spring-boot-mvc-hexagonal', ['dotnet-java', 'backend'], [28.45, 3.4, -60.04], ['java-spring-boot-guia-definitiva'], ['spring-boot-4-patrones-arquitectura']),
  galaxy('java-desde-cero', ['dotnet-java'], [30.61, -0.59, -41.15], [], []),
  galaxy('java-avanzado', ['dotnet-java'], [33.38, 4.69, -33.32], ['java-desde-cero'], []),
];

const galaxyColor = (key: CourseGalaxyKey): string => {
  const found = COURSE_GALAXIES.find((courseGalaxy) => courseGalaxy.key === key);

  if (!found) {
    throw new Error(`Galaxia desconocida: ${key}`);
  }

  return found.color;
};

export class ClassifyCoursesIntoGalaxies1726000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const assignment of ASSIGNMENTS) {
      const [x, y, z] = assignment.position;

      await queryRunner.query(
        `
          UPDATE "courses"
          SET "galaxies" = $2,
              "galaxy_color" = $3,
              "position_x" = $4,
              "position_y" = $5,
              "position_z" = $6,
              "prerequisites" = $7,
              "related" = $8
          WHERE "slug" = $1
        `,
        [
          assignment.slug,
          assignment.galaxies,
          galaxyColor(assignment.galaxies[0]),
          x,
          y,
          z,
          assignment.prerequisites,
          assignment.related,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        UPDATE "courses"
        SET "galaxies" = '{}',
            "galaxy_color" = NULL,
            "position_x" = 0,
            "position_y" = 0,
            "position_z" = 0,
            "prerequisites" = '{}',
            "related" = '{}'
        WHERE "slug" = ANY($1)
      `,
      [ASSIGNMENTS.map(({ slug }) => slug)],
    );
  }
}
