import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveProjectPath } from './paths';

const skillsDir = resolveProjectPath(process.env.SKILLS_DIR ?? 'skills');

export interface SkillMetadata {
  name: string;
  description: string;
  source: string;
}

export async function listSkills() {
  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const skills: SkillMetadata[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(skillsDir, entry.name);
    const skillFile = path.join(skillPath, 'SKILL.md');
    try {
      const raw = await fs.readFile(skillFile, 'utf8');
      const match = raw.match(/^---\n([\s\S]*?)\n---/);
      const frontmatter = match?.[1] ?? '';
      const name = frontmatter.match(/name:\s*(.+)/)?.[1]?.trim() ?? entry.name;
      const description = frontmatter.match(/description:\s*(.+)/)?.[1]?.trim() ?? '';
      skills.push({ name, description, source: entry.name });
    } catch {
      skills.push({ name: entry.name, description: 'No SKILL.md found.', source: entry.name });
    }
  }

  return skills;
}

export async function readSkillContent(source: string): Promise<string | null> {
  const skillPath = path.join(skillsDir, source);
  const skillFile = path.join(skillPath, 'SKILL.md');
  try {
    return await fs.readFile(skillFile, 'utf8');
  } catch {
    return null;
  }
}
