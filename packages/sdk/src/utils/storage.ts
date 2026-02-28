import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { KeyManagementError } from '../types/errors.js';

const DEFAULT_DIR = join(homedir(), '.arbitrum-wallets');

export class FileStorage {
  private readonly dir: string;

  constructor(baseDir?: string) {
    this.dir = baseDir ?? DEFAULT_DIR;
    this.ensureDir();
  }

  private ensureDir(): void {
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, { recursive: true, mode: 0o700 });
    }
  }

  private ensureSubDir(subDir: string): void {
    const fullPath = join(this.dir, subDir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true, mode: 0o700 });
    }
  }

  save<T>(collection: string, id: string, data: T): void {
    this.ensureSubDir(collection);
    const filePath = join(this.dir, collection, `${id}.json`);
    try {
      writeFileSync(filePath, JSON.stringify(data, null, 2), { mode: 0o600 });
    } catch (error) {
      throw new KeyManagementError(`Failed to save ${collection}/${id}: ${String(error)}`);
    }
  }

  load<T>(collection: string, id: string): T | null {
    const filePath = join(this.dir, collection, `${id}.json`);
    if (!existsSync(filePath)) return null;
    try {
      const raw = readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (error) {
      throw new KeyManagementError(`Failed to load ${collection}/${id}: ${String(error)}`);
    }
  }

  list(collection: string): string[] {
    const collectionDir = join(this.dir, collection);
    if (!existsSync(collectionDir)) return [];
    return readdirSync(collectionDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
  }

  delete(collection: string, id: string): boolean {
    const filePath = join(this.dir, collection, `${id}.json`);
    if (!existsSync(filePath)) return false;
    try {
      unlinkSync(filePath);
      return true;
    } catch {
      return false;
    }
  }

  get basePath(): string {
    return this.dir;
  }
}
