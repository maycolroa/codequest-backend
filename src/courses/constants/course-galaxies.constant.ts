export type CourseGalaxyKey =
  | 'ai-ml'
  | 'frontend'
  | 'backend'
  | 'fundamentals'
  | 'mobile'
  | 'devops'
  | 'dotnet-java';

export interface CourseGalaxy {
  key: CourseGalaxyKey;
  name: string;
  color: string; // #RRGGBB
  center: { x: number; y: number; z: number };
}

// Centros en un anillo de radio 60 sobre el plano XZ (ángulo i · 2π/7),
// con un pequeño desplazamiento en Y. Literales redondeados a 2 decimales.
export const COURSE_GALAXIES: readonly CourseGalaxy[] = [
  {
    key: 'ai-ml',
    name: 'IA & Machine Learning',
    color: '#8B5CF6',
    center: { x: 60, y: 2, z: 0 },
  },
  {
    key: 'frontend',
    name: 'Frontend & UI',
    color: '#3B82F6',
    center: { x: 37.41, y: -3, z: 46.91 },
  },
  {
    key: 'backend',
    name: 'Backend & APIs',
    color: '#10B981',
    center: { x: -13.35, y: 4, z: 58.5 },
  },
  {
    key: 'fundamentals',
    name: 'Fundamentos & Arquitectura',
    color: '#F59E0B',
    center: { x: -54.06, y: -2, z: 26.03 },
  },
  {
    key: 'mobile',
    name: 'Mobile',
    color: '#06B6D4',
    center: { x: -54.06, y: 3, z: -26.03 },
  },
  {
    key: 'devops',
    name: 'DevOps & Infraestructura',
    color: '#EF4444',
    center: { x: -13.35, y: -4, z: -58.5 },
  },
  {
    key: 'dotnet-java',
    name: '.NET & Java',
    color: '#EC4899',
    center: { x: 37.41, y: 1, z: -46.91 },
  },
];
