import { describe, expect, it } from 'vitest';
import { storageStatusCopy } from '../src/lib/storage-status-copy.ts';

describe('storageStatusCopy', () => {
  it('warns about blocked storage first, whatever the device', () => {
    expect(storageStatusCopy({ persistent: false, ios: true, standalone: true }).title).toBe('Lưu trữ tạm thời');
  });

  it('only calls storage durable for the installed app', () => {
    expect(storageStatusCopy({ persistent: true, ios: true, standalone: true }).title).toBe('Lưu trữ bền');
  });

  it('warns iOS Safari users about the 7-day eviction and suggests installing', () => {
    const copy = storageStatusCopy({ persistent: true, ios: true, standalone: false });
    expect(copy.title).toBe('Lưu trữ trên Safari');
    expect(copy.detail).toMatch(/7 ngày/);
    expect(copy.detail).toMatch(/màn hình chính/);
  });

  it('describes other browsers without the iOS warning', () => {
    const copy = storageStatusCopy({ persistent: true, ios: false, standalone: false });
    expect(copy.title).toBe('Lưu trữ trên trình duyệt');
    expect(copy.detail).not.toMatch(/7 ngày/);
  });
});
