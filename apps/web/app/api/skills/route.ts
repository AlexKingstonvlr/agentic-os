import { NextRequest, NextResponse } from 'next/server';
import { listSkills, readSkillContent } from '@/lib/skills';

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name');
  if (name) {
    const content = await readSkillContent(name);
    if (!content) return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    return new NextResponse(content, { headers: { 'Content-Type': 'text/markdown' } });
  }
  return NextResponse.json(await listSkills());
}
