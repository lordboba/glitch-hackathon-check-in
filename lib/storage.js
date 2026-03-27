import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { get, list, put } from '@vercel/blob';
import { sanitizeStoragePath } from './utils.js';

const LOCAL_ROOT = path.join(process.cwd(), '.local-data');

export function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function getStorageMode() {
  return hasBlobStorage() ? 'blob' : 'local';
}

export function getStorageWarning() {
  if (hasBlobStorage()) {
    return null;
  }

  if (process.env.NODE_ENV === 'production') {
    return 'BLOB_READ_WRITE_TOKEN is required in production so signed waivers persist in private file storage.';
  }

  return 'Using local development storage in .local-data/. Configure BLOB_READ_WRITE_TOKEN for Vercel deployment.';
}

export function ensurePersistentStorageReady() {
  if (process.env.NODE_ENV === 'production' && !hasBlobStorage()) {
    throw new Error(
      'Persistent storage is not configured. Set BLOB_READ_WRITE_TOKEN in production.',
    );
  }
}

function resolveLocalPath(pathname) {
  return path.join(LOCAL_ROOT, sanitizeStoragePath(pathname));
}

function guessContentType(pathname) {
  if (pathname.endsWith('.pdf')) {
    return 'application/pdf';
  }

  if (pathname.endsWith('.json')) {
    return 'application/json';
  }

  if (pathname.endsWith('.png')) {
    return 'image/png';
  }

  return 'application/octet-stream';
}

async function walkLocalDirectory(directory) {
  const results = [];

  let entries = [];
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...(await walkLocalDirectory(fullPath)));
      continue;
    }

    if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}

export async function savePrivateFile(pathname, body, contentType, options = {}) {
  const safePath = sanitizeStoragePath(pathname);
  ensurePersistentStorageReady();
  const { allowOverwrite = false } = options;

  if (hasBlobStorage()) {
    const payload = typeof body === 'string' ? body : new Blob([body]);
    const blob = await put(safePath, payload, {
      access: 'private',
      allowOverwrite,
      contentType,
    });

    return {
      pathname: safePath,
      size: blob.size,
      uploadedAt: blob.uploadedAt || new Date().toISOString(),
      contentType,
    };
  }

  const destination = resolveLocalPath(safePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const buffer = typeof body === 'string' ? Buffer.from(body, 'utf8') : Buffer.from(body);
  await fs.writeFile(destination, buffer);

  return {
    pathname: safePath,
    size: buffer.length,
    uploadedAt: new Date().toISOString(),
    contentType,
  };
}

export async function readPrivateFile(pathname) {
  const safePath = sanitizeStoragePath(pathname);

  if (hasBlobStorage()) {
    const result = await get(safePath, { access: 'private' });

    if (!result || result.statusCode !== 200) {
      return null;
    }

    const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
    return {
      pathname: safePath,
      buffer,
      contentType: result.blob.contentType || guessContentType(safePath),
      etag: result.blob.etag || null,
    };
  }

  try {
    const fullPath = resolveLocalPath(safePath);
    const buffer = await fs.readFile(fullPath);
    return {
      pathname: safePath,
      buffer,
      contentType: guessContentType(safePath),
      etag: null,
    };
  } catch {
    return null;
  }
}

export async function listPrivateFiles(prefix = '') {
  const safePrefix = prefix ? sanitizeStoragePath(prefix) : '';

  if (hasBlobStorage()) {
    const files = [];
    let cursor = undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await list({ prefix: safePrefix || undefined, cursor });
      files.push(
        ...response.blobs.map((blob) => ({
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt || blob.uploaded_at || null,
          contentType: guessContentType(blob.pathname),
        })),
      );
      hasMore = Boolean(response.hasMore);
      cursor = response.cursor;
    }

    return files;
  }

  const files = await walkLocalDirectory(LOCAL_ROOT);
  return Promise.all(
    files
      .map((fullPath) => {
        const relativePath = path
          .relative(LOCAL_ROOT, fullPath)
          .split(path.sep)
          .join('/');
        return relativePath;
      })
      .filter((pathname) => (!safePrefix ? true : pathname.startsWith(safePrefix)))
      .map(async (pathname) => {
        const stats = await fs.stat(resolveLocalPath(pathname));
        return {
          pathname,
          size: stats.size,
          uploadedAt: stats.mtime.toISOString(),
          contentType: guessContentType(pathname),
        };
      }),
  );
}
