import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileStorage } from './storage.js';

describe('FileStorage', () => {
  let tempDir: string;
  let storage: FileStorage;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'arb-wallet-test-'));
    storage = new FileStorage(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true });
  });

  it('should save and load data', () => {
    const data = { name: 'test', value: 42 };
    storage.save('collection', 'item1', data);

    const loaded = storage.load<typeof data>('collection', 'item1');
    expect(loaded).toEqual(data);
  });

  it('should return null for missing items', () => {
    const loaded = storage.load('collection', 'nonexistent');
    expect(loaded).toBeNull();
  });

  it('should list items in a collection', () => {
    storage.save('collection', 'item1', { a: 1 });
    storage.save('collection', 'item2', { b: 2 });

    const items = storage.list('collection');
    expect(items).toHaveLength(2);
    expect(items).toContain('item1');
    expect(items).toContain('item2');
  });

  it('should return empty list for missing collection', () => {
    const items = storage.list('nonexistent');
    expect(items).toEqual([]);
  });

  it('should delete items', () => {
    storage.save('collection', 'item1', { a: 1 });
    expect(storage.delete('collection', 'item1')).toBe(true);
    expect(storage.load('collection', 'item1')).toBeNull();
  });

  it('should return false when deleting nonexistent items', () => {
    expect(storage.delete('collection', 'nonexistent')).toBe(false);
  });

  it('should expose the base path', () => {
    expect(storage.basePath).toBe(tempDir);
  });
});
