// Shared MDX -> Astro component map, passed to <Content components={...}/>
// by the reader page (src/pages/hoc/[domain]/[module]/[slug].astro) — the
// single source of truth for which JSX tags lesson MDX bodies may use.
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
