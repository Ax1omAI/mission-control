/**
 * File Preview API
 * Serves local files for browser preview from allowed workspace/project roots.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, realpathSync, statSync } from 'fs';
import path from 'path';

const DEFAULT_WORKSPACE_BASE = '~/Documents/Shared';
const DEFAULT_PROJECTS_BASE = '~/Documents/Shared/projects';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function expandHome(p: string): string {
  return p.replace(/^~/, process.env.HOME || '');
}

function getAllowedRoots(): string[] {
  const workspaceBase = process.env.WORKSPACE_BASE_PATH || DEFAULT_WORKSPACE_BASE;
  const projectsBase = process.env.PROJECTS_PATH || DEFAULT_PROJECTS_BASE;

  return [workspaceBase, projectsBase]
    .map(expandHome)
    .map((p) => path.normalize(p));
}

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'path is required' }, { status: 400 });
  }

  // Expand tilde and normalize first
  const expandedPath = expandHome(filePath);
  const normalizedPath = path.normalize(expandedPath);

  if (!existsSync(normalizedPath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  let resolvedPath: string;
  try {
    resolvedPath = realpathSync(normalizedPath);
  } catch {
    return NextResponse.json({ error: 'Failed to resolve file path' }, { status: 400 });
  }

  // Security: realpath-based root check (protects against symlink escapes)
  const allowedRoots = getAllowedRoots();
  const resolvedRoots = allowedRoots
    .filter((root) => existsSync(root))
    .map((root) => realpathSync(root));

  const isAllowed = resolvedRoots.some((root) =>
    resolvedPath === root || resolvedPath.startsWith(root + path.sep)
  );

  if (!isAllowed) {
    return NextResponse.json(
      {
        error: 'Path not allowed',
        details: 'Set WORKSPACE_BASE_PATH and PROJECTS_PATH correctly if your files live elsewhere.',
      },
      { status: 403 }
    );
  }

  const stats = statSync(resolvedPath);
  if (stats.isDirectory()) {
    return NextResponse.json({ error: 'Path is a directory, not a file' }, { status: 400 });
  }

  try {
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isText = contentType.startsWith('text/') || contentType.includes('json') || contentType.includes('markdown');
    const content = readFileSync(resolvedPath, isText ? 'utf-8' : undefined);

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' data: blob:; img-src 'self' data: blob:;",
      },
    });
  } catch (error) {
    console.error('[FILE PREVIEW] Error reading file:', error);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}
