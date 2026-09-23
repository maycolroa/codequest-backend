import { MigrationInterface, QueryRunner } from 'typeorm';

type SeedCourse = {
  title: string;
  slug: string;
  category: string;
  level: string;
  tags: string[];
  isActive: boolean;
};

const course = (
  title: string,
  slug: string,
  category: string,
  level: string,
  tags: string[],
  isActive = true,
): SeedCourse => ({ title, slug, category, level, tags, isActive });

const COURSES: SeedCourse[] = [
  course('.NET Backend: .NET Core, SQL Server y seguridad JWT', 'dotnet-backend-core-sql-server-jwt', 'backend', 'intermediate', ['dotnet', 'sql-server', 'jwt']),
  course('.NET: Pruebas completas para minimal API', 'dotnet-testing-minimal-api', 'backend', 'advanced', ['dotnet', 'testing', 'minimal-api']),
  course('Blazor: Desde cero con arquitectura limpia', 'blazor-arquitectura-limpia', 'backend', 'intermediate', ['blazor', 'dotnet', 'clean-architecture']),
  course('C#: Empieza tu camino en el lenguaje', 'csharp-desde-cero', 'backend', 'beginner', ['csharp', 'dotnet']),
  course('Django: Crea aplicaciones web robustas con Python', 'django-aplicaciones-web', 'backend', 'intermediate', ['python', 'django']),
  course('FastAPI: Crea APIs eficientes con Python', 'fastapi-apis-eficientes', 'backend', 'intermediate', ['python', 'fastapi', 'api']),
  course('Laravel 13: AI, REST, JWT, Repository Pattern', 'laravel-13-ai-rest-jwt', 'backend', 'advanced', ['php', 'laravel', 'jwt', 'ai']),
  course('Nest: Desarrollo backend escalable con Node', 'nest-backend-escalable', 'backend', 'intermediate', ['nestjs', 'node', 'typescript']),
  course('Nest + GraphQL: Evoluciona tus APIs', 'nest-graphql', 'backend', 'advanced', ['nestjs', 'graphql', 'api']),
  course('NestJs + Reportes: Genera PDFs desde Node', 'nestjs-reportes-pdf', 'backend', 'intermediate', ['nestjs', 'node', 'pdf']),
  course('NestJS + Testing: Pruebas unitarias y e2e', 'nestjs-testing', 'backend', 'advanced', ['nestjs', 'testing', 'e2e']),
  course('Node.Js: De cero a experto', 'nodejs-de-cero-a-experto', 'backend', 'beginner', ['node', 'javascript']),
  course('Node - Autenticación Rest con Clean Architecture', 'node-autenticacion-rest-clean-architecture', 'backend', 'advanced', ['node', 'authentication', 'clean-architecture']),
  course('PHP moderno: Empieza tu camino en el lenguaje', 'php-moderno', 'backend', 'beginner', ['php']),
  course('Java: Spring Boot - Guía definitiva', 'java-spring-boot-guia-definitiva', 'backend', 'intermediate', ['java', 'spring-boot']),
  course('Spring Boot: De MVC a Hexagonal', 'spring-boot-mvc-hexagonal', 'backend', 'advanced', ['java', 'spring-boot', 'hexagonal-architecture']),

  course('NestJS + Microservicios: Aplicaciones escalables y modulares', 'nestjs-microservicios', 'architecture', 'advanced', ['nestjs', 'microservices', 'architecture']),
  course('Spring Boot 4: Arquitectura de Microservicios', 'spring-boot-4-microservicios', 'architecture', 'advanced', ['java', 'spring-boot', 'microservices']),
  course('Spring Boot 4: Patrones de arquitectura', 'spring-boot-4-patrones-arquitectura', 'architecture', 'advanced', ['java', 'spring-boot', 'architecture']),
  course('Patrones de Diseño: Soluciones prácticas y eficientes', 'patrones-de-diseno', 'architecture', 'beginner', ['design-patterns', 'architecture']),
  course('Principios SOLID y Clean Code', 'solid-y-clean-code', 'architecture', 'beginner', ['solid', 'clean-code']),

  course('Angular clásico: con Módulos', 'angular-clasico-modulos', 'frontend', 'beginner', ['angular', 'typescript']),
  course('Angular Pro: Lleva tus bases al siguiente nivel', 'angular-pro', 'frontend', 'intermediate', ['angular', 'typescript']),
  course('Angular: De cero a experto', 'angular-de-cero-a-experto', 'frontend', 'beginner', ['angular', 'typescript']),
  course('Angular + Sockets: Aplicaciones en tiempo real con Bun', 'angular-sockets-bun', 'frontend', 'advanced', ['angular', 'sockets', 'bun']),
  course('React: de cero a experto', 'react-de-cero-a-experto', 'frontend', 'beginner', ['react', 'javascript']),
  course('React PRO: Lleva tus bases al siguiente nivel', 'react-pro', 'frontend', 'intermediate', ['react', 'typescript']),
  course('React+Sockets: Aplicaciones en tiempo real con Bun', 'react-sockets-bun', 'frontend', 'advanced', ['react', 'sockets', 'bun']),
  course('Next.js: El framework de React para producción', 'nextjs-produccion', 'frontend', 'intermediate', ['nextjs', 'react']),
  course('Vue.js - de Cero a Experto: Composition API', 'vuejs-composition-api', 'frontend', 'beginner', ['vue', 'javascript']),
  course('Vue.js - Intermedio: Lleva tus bases al siguiente nivel', 'vuejs-intermedio', 'frontend', 'intermediate', ['vue', 'typescript']),
  course('Nuxt: El marco de trabajo web progresivo (Nuxt 4+)', 'nuxt-4', 'frontend', 'intermediate', ['nuxt', 'vue']),
  course('Astro: El framework para sitios web orientados al contenido', 'astro-contenido', 'frontend', 'intermediate', ['astro', 'frontend']),
  course('TailwindCSS: Para desarrolladores de software', 'tailwindcss', 'frontend', 'beginner', ['tailwindcss', 'css']),
  course('Zustand: Gestor de estado para React', 'zustand-react', 'frontend', 'intermediate', ['zustand', 'react']),
  course('JavaScript Moderno: Guía para dominar el lenguaje', 'javascript-moderno', 'frontend', 'beginner', ['javascript']),
  course('TypeScript: Tu completa guía y manual de mano', 'typescript-guia-completa', 'frontend', 'beginner', ['typescript', 'javascript']),

  course('Flutter - Móvil: De cero a experto', 'flutter-movil-de-cero-a-experto', 'mobile', 'beginner', ['flutter', 'dart']),
  course('Flutter Móvil: Recursos Nativos - Nivel Intermedio', 'flutter-recursos-nativos', 'mobile', 'intermediate', ['flutter', 'dart', 'native']),
  course('Mini-Curso: Flutter BLoC', 'flutter-bloc', 'mobile', 'intermediate', ['flutter', 'bloc']),
  course('React Native Expo: Aplicaciones nativas para IOS y Android', 'react-native-expo', 'mobile', 'intermediate', ['react-native', 'expo']),
  course('Dart: De cero hasta los detalles', 'dart-desde-cero', 'mobile', 'beginner', ['dart']),

  course('Java: Explora el lenguaje desde cero', 'java-desde-cero', 'programming_languages', 'beginner', ['java']),
  course('Java avanzado: reactividad, concurrencia y patrones', 'java-avanzado', 'programming_languages', 'advanced', ['java', 'reactivity', 'concurrency']),
  course('Python: Fundamentos hasta los detalles', 'python-fundamentos', 'programming_languages', 'beginner', ['python']),
  course('GoLang: Fundamentos del lenguaje', 'golang-fundamentos', 'programming_languages', 'beginner', ['golang']),
  course('Golang: Backend Profesional', 'golang-backend-profesional', 'programming_languages', 'intermediate', ['golang', 'backend']),
  course('Programación para principiantes - Primeros pasos', 'programacion-principiantes', 'programming_languages', 'beginner', ['programming', 'logic']),

  course('SQL de cero: Tu guía práctica con PostgreSQL', 'sql-postgresql', 'databases', 'beginner', ['sql', 'postgresql']),

  course('Docker - Guía práctica de uso para desarrolladores', 'docker-guia-practica', 'devops', 'beginner', ['docker', 'devops']),
  course('GIT+GitHub: Control de versiones desde Cero', 'git-github-desde-cero', 'devops', 'beginner', ['git', 'github']),

  course('Claude Code: Guía completa para desarrolladores de software', 'claude-code', 'ai', 'beginner', ['claude', 'ai', 'developer-tools']),
  course('IA para Developers: Claude API, RAG y Agentes con Node', 'ia-developers-claude-rag-agentes', 'ai', 'intermediate', ['claude', 'rag', 'agents', 'node']),
  course('Ingeniería de prompts: Para la vida real', 'ingenieria-de-prompts', 'ai', 'beginner', ['prompt-engineering', 'ai']),
  course('Expo + Gemini: Aplicaciones con inteligencia artificial', 'expo-gemini', 'ai', 'intermediate', ['expo', 'gemini', 'ai']),
  course('Python: Inteligencia artificial aplicada', 'python-inteligencia-artificial', 'ai', 'intermediate', ['python', 'ai']),
  course('Python + n8n: Automatiza rutinas cotidianas', 'python-n8n', 'ai', 'intermediate', ['python', 'n8n', 'automation']),
  course('OpenAI: Ejercicios prácticos y asistentes con React + NestJS', 'openai-react-nestjs', 'ai', 'intermediate', ['openai', 'react', 'nestjs']),
  course('OpenAI: Ejercicios y asistentes con Angular + NestJS', 'openai-angular-nestjs', 'ai', 'intermediate', ['openai', 'angular', 'nestjs']),
  course('OpenCode: Guía completa para desarrolladores de software', 'opencode', 'ai', 'beginner', ['opencode', 'ai', 'developer-tools']),
  course('Spring AI: LLMs, Tools, RAG, Agentes y Deploy en AWS', 'spring-ai', 'ai', 'advanced', ['spring-ai', 'llm', 'rag', 'aws']),
  course('n8n + MCP: Automatización y agentes de IA inteligentes', 'n8n-mcp', 'ai', 'advanced', ['n8n', 'mcp', 'agents']),
  course('Patrones de diseño agéntico: Respuestas efectivas a desafíos', 'patrones-diseno-agentico', 'ai', 'advanced', ['agents', 'design-patterns', 'ai']),
  course('Vibe Coding: De forma responsable', 'vibe-coding-responsable', 'ai', 'beginner', ['ai', 'software-development']),

  course('Legacy - Angular (V14): De cero a experto', 'legacy-angular-v14', 'legacy', 'beginner', ['legacy', 'angular'], false),
  course('Legacy - Angular Avanzado (MEAN)', 'legacy-angular-mean', 'legacy', 'advanced', ['legacy', 'angular', 'mean'], false),
  course('Legacy - Flutter Avanzado', 'legacy-flutter-avanzado', 'legacy', 'advanced', ['legacy', 'flutter'], false),
  course('Legacy - Flutter Intermedio', 'legacy-flutter-intermedio', 'legacy', 'intermediate', ['legacy', 'flutter'], false),
  course('Legacy - Flutter Web', 'legacy-flutter-web', 'legacy', 'intermediate', ['legacy', 'flutter', 'web'], false),
  course('Legacy - GIT+GitHub', 'legacy-git-github', 'legacy', 'beginner', ['legacy', 'git', 'github'], false),
  course('Legacy - Next.js Tradicional (PagesRouter)', 'legacy-nextjs-pages-router', 'legacy', 'intermediate', ['legacy', 'nextjs'], false),
  course('Legacy - Node: De cero a experto', 'legacy-node-de-cero-a-experto', 'legacy', 'beginner', ['legacy', 'node'], false),
  course('Legacy - PWA', 'legacy-pwa', 'legacy', 'intermediate', ['legacy', 'pwa'], false),
  course('Legacy - React (v16, 17)', 'legacy-react-v16-v17', 'legacy', 'beginner', ['legacy', 'react'], false),
  course('Legacy - React con Javascript (Hooks y MERN)', 'legacy-react-javascript-mern', 'legacy', 'intermediate', ['legacy', 'react', 'mern'], false),
  course('Legacy - React Native CLI', 'legacy-react-native-cli', 'legacy', 'intermediate', ['legacy', 'react-native'], false),
  course('Legacy - React Native', 'legacy-react-native', 'legacy', 'beginner', ['legacy', 'react-native'], false),
  course('Legacy - React con Socket-io', 'legacy-react-socket-io', 'legacy', 'advanced', ['legacy', 'react', 'socket-io'], false),
  course('Legacy - ReactiveX - RxJs', 'legacy-rxjs', 'legacy', 'intermediate', ['legacy', 'rxjs'], false),
  course('Legacy - Vue.js Tradicional (Options API)', 'legacy-vue-options-api', 'legacy', 'beginner', ['legacy', 'vue'], false),
];

export class SeedDevTallesCourses1726000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const seededCourse of COURSES) {
      await queryRunner.query(
        `
          INSERT INTO "courses" (
            "title", "slug", "description", "category", "level", "url",
            "duration_hours", "tags", "is_active"
          ) VALUES ($1, $2, $3, $4, $5, NULL, NULL, $6, $7)
          ON CONFLICT ("slug") DO NOTHING
        `,
        [
          seededCourse.title,
          seededCourse.slug,
          `Curso de DevTalles: ${seededCourse.title}.`,
          seededCourse.category,
          seededCourse.level,
          seededCourse.tags,
          seededCourse.isActive,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DELETE FROM "courses" WHERE "slug" = ANY($1)',
      [COURSES.map(({ slug }) => slug)],
    );
  }
}
