import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveProjectPath, getDataDir } from './paths';
import { listSkills, readSkillContent } from './skills';

const skillsDir = resolveProjectPath(process.env.SKILLS_DIR ?? 'skills');
const marketplacePath = path.join(getDataDir(), 'marketplace.json');

export interface MarketplaceSkill {
  name: string;
  description: string;
  source: string;
  author: string;
  version: string;
  publishedAt: string;
  downloads: number;
}

export interface ExportedSkill {
  name: string;
  description: string;
  source: string;
  content: string;
}

interface MarketplaceData {
  skills: MarketplaceSkill[];
}

async function readMarketplaceData(): Promise<MarketplaceData> {
  try {
    const raw = await fs.readFile(marketplacePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { skills: [] };
  }
}

async function writeMarketplaceData(data: MarketplaceData) {
  await fs.writeFile(marketplacePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function listInstalledSkills() {
  return listSkills();
}

export async function installSkill(source: string, name: string, content: string) {
  const dir = path.join(skillsDir, source);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'SKILL.md'), content, 'utf8');
}

export async function uninstallSkill(source: string) {
  const dir = path.join(skillsDir, source);
  await fs.rm(dir, { recursive: true, force: true });
}

export async function getSkillDetail(source: string) {
  return readSkillContent(source);
}

export async function exportSkill(source: string): Promise<ExportedSkill | null> {
  const content = await readSkillContent(source);
  if (!content) return null;
  const skills = await listSkills();
  const skill = skills.find(s => s.source === source);
  return {
    name: skill?.name ?? source,
    description: skill?.description ?? '',
    source,
    content,
  };
}

export async function importSkill(data: ExportedSkill) {
  await installSkill(data.source, data.name, data.content);
}

export async function listPublishedSkills(): Promise<MarketplaceSkill[]> {
  const data = await readMarketplaceData();
  return data.skills;
}

export async function publishSkill(source: string, author: string) {
  const content = await readSkillContent(source);
  if (!content) throw new Error('Skill not found');

  const skills = await listSkills();
  const skill = skills.find(s => s.source === source);
  if (!skill) throw new Error('Skill not found');

  const data = await readMarketplaceData();
  const existing = data.skills.findIndex(s => s.source === source);
  const entry: MarketplaceSkill = {
    name: skill.name,
    description: skill.description,
    source,
    author,
    version: '1.0.0',
    publishedAt: new Date().toISOString(),
    downloads: 0,
  };

  if (existing >= 0) {
    data.skills[existing] = { ...data.skills[existing], ...entry };
  } else {
    data.skills.push(entry);
  }

  await writeMarketplaceData(data);
}
