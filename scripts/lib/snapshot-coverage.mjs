/**
 * Checks that a set of on-disk snapshot files and a set of lessons'
 * `source.snapshot` references are in exact 1:1 correspondence. Catches:
 *  - a lesson deleted while its content-sources snapshot silently remains
 *    (no lesson references it anymore)
 *  - a lesson pointing at a snapshot that doesn't exist on disk
 *  - two lessons pointing at the same snapshot (each snapshot is one
 *    lesson's original source, never shared)
 */
export function checkSnapshotCoverage(snapshotFiles, referencedSnapshots) {
  const errors = [];
  const bySnapshot = new Map();
  for (const ref of referencedSnapshots) {
    const list = bySnapshot.get(ref.snapshot) ?? [];
    list.push(ref.source);
    bySnapshot.set(ref.snapshot, list);
  }
  const snapshotSet = new Set(snapshotFiles);

  for (const snap of snapshotFiles) {
    if (!bySnapshot.has(snap)) {
      errors.push(`Orphaned snapshot (no lesson references it — was the lesson deleted?): ${snap}`);
    }
  }
  for (const [snap, sources] of bySnapshot) {
    if (!snapshotSet.has(snap)) {
      errors.push(`Lesson(s) [${sources.join(', ')}] reference a snapshot that does not exist on disk: ${snap}`);
    } else if (sources.length > 1) {
      errors.push(`Snapshot referenced by more than one lesson: ${snap} <- [${sources.join(', ')}]`);
    }
  }
  return errors;
}
