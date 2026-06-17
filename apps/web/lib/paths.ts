import path from 'node:path';

export function getProjectRoot() {
  const cwd = process.cwd();
  if (cwd.endsWith('apps/web')) return path.resolve(cwd, '../..');
  return cwd;
}

export function resolveProjectPath(...parts: string[]) {
  return path.join(getProjectRoot(), ...parts);
}

export function getDataDir() {
  if (process.env.DATA_DIR) return path.resolve(process.env.DATA_DIR);
  if (process.env.VERCEL) return '/tmp/data';
  return path.join(getProjectRoot(), 'data');
}
