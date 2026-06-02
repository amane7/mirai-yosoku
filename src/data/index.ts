import type { Project } from '../lib/types';
import { genaiOrgProject } from './genai-org';
import { mobilityProject } from './mobility';
import { sinicSocietyProject } from './sinic-society';
import { roadmapProject } from './roadmap';

export const PROJECTS: Project[] = [
  genaiOrgProject,
  mobilityProject,
  sinicSocietyProject,
  roadmapProject,
];

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
