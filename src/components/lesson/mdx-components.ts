// Shared MDX -> Astro component map. Imported by the temporary render route
// (src/pages/hoc/[domain]/[module]/[slug].astro) in Phase 3 and reused as-is
// by Phase 4's real reader layout — keep this the single source of truth so
// the two never drift apart.
import RealLife from './real-life.astro';
import Figure from './figure.astro';
import Note from './note.astro';
import TranslatorNote from './translator-note.astro';
import Disclaimer from './disclaimer.astro';

export const lessonMdxComponents = {
  RealLife,
  Figure,
  Note,
  TranslatorNote,
  Disclaimer,
};
