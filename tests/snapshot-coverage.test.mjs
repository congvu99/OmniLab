// Tests for scripts/lib/snapshot-coverage.mjs — the "was a lesson silently
// deleted (leaving its source snapshot orphaned)?" guard.
import { describe, expect, it } from 'vitest';
import { checkSnapshotCoverage } from '../scripts/lib/snapshot-coverage.mjs';

describe('checkSnapshotCoverage', () => {
  it('is clean for an exact 1:1 mapping', () => {
    const errors = checkSnapshotCoverage(
      ['a.md', 'b.md'],
      [
        { snapshot: 'a.md', source: 'lessons/a.mdx' },
        { snapshot: 'b.md', source: 'lessons/b.mdx' },
      ],
    );
    expect(errors).toEqual([]);
  });

  it('flags a snapshot file with no lesson referencing it (deleted lesson)', () => {
    const errors = checkSnapshotCoverage(['a.md', 'b.md'], [{ snapshot: 'a.md', source: 'lessons/a.mdx' }]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Orphaned snapshot/);
    expect(errors[0]).toContain('b.md');
  });

  it('flags a lesson referencing a snapshot that does not exist on disk', () => {
    const errors = checkSnapshotCoverage(['a.md'], [{ snapshot: 'a.md', source: 'lessons/a.mdx' }, { snapshot: 'missing.md', source: 'lessons/x.mdx' }]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/does not exist on disk/);
    expect(errors[0]).toContain('missing.md');
  });

  it('flags two lessons referencing the same snapshot', () => {
    const errors = checkSnapshotCoverage(
      ['a.md'],
      [
        { snapshot: 'a.md', source: 'lessons/a.mdx' },
        { snapshot: 'a.md', source: 'lessons/a-copy.mdx' },
      ],
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/more than one lesson/);
    expect(errors[0]).toContain('lessons/a.mdx');
    expect(errors[0]).toContain('lessons/a-copy.mdx');
  });

  it('is a no-op for empty inputs', () => {
    expect(checkSnapshotCoverage([], [])).toEqual([]);
  });
});
