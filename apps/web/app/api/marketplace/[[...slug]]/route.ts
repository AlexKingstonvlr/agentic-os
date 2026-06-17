import { NextRequest, NextResponse } from 'next/server';
import {
  listInstalledSkills,
  installSkill,
  uninstallSkill,
  listPublishedSkills,
  publishSkill,
  exportSkill as exportSkillService,
  importSkill,
} from '@/lib/marketplace';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const slug = (await params).slug;
  const action = slug?.[0];

  if (action === 'export') {
    const source = request.nextUrl.searchParams.get('source');
    if (!source) {
      return NextResponse.json({ error: 'Missing source parameter' }, { status: 400 });
    }
    const result = await exportSkillService(source);
    if (!result) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  }

  const installed = request.nextUrl.searchParams.get('installed');
  if (installed === 'true') {
    return NextResponse.json(await listInstalledSkills());
  }

  const [published, installedSkills] = await Promise.all([
    listPublishedSkills(),
    listInstalledSkills(),
  ]);

  const installedSources = new Set(installedSkills.map(s => s.source));
  const merged = published.map(s => ({
    ...s,
    installed: installedSources.has(s.source),
  }));

  return NextResponse.json(merged);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const slug = (await params).slug;
  const action = slug?.[0];

  try {
    const body = await request.json();

    if (action === 'install') {
      const { source, name, content } = body;
      if (!source || !name || !content) {
        return NextResponse.json({ error: 'Missing required fields: source, name, content' }, { status: 400 });
      }
      await installSkill(source, name, content);
      return NextResponse.json({ success: true });
    }

    if (action === 'uninstall') {
      const { source } = body;
      if (!source) {
        return NextResponse.json({ error: 'Missing required field: source' }, { status: 400 });
      }
      await uninstallSkill(source);
      return NextResponse.json({ success: true });
    }

    if (action === 'publish') {
      const { source, author } = body;
      if (!source || !author) {
        return NextResponse.json({ error: 'Missing required fields: source, author' }, { status: 400 });
      }
      await publishSkill(source, author);
      return NextResponse.json({ success: true });
    }

    if (action === 'import') {
      const { skill } = body;
      if (!skill || !skill.source || !skill.content) {
        return NextResponse.json({ error: 'Invalid skill data' }, { status: 400 });
      }
      await importSkill(skill);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
