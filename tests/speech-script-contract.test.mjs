// Strict parser of /tts-scripts.json (build -> TTS worker contract).
import { describe, expect, it } from 'vitest';
import {
  INTRO_CHAPTER_ID,
  parseSpeechScripts,
  SPEECH_EXTRACTOR_VERSION,
  speechScriptHashInput,
} from '../src/lib/speech-script-contract.ts';

const HASH = 'a'.repeat(64);

function validFile() {
  return {
    v: 1,
    extractorVersion: SPEECH_EXTRACTOR_VERSION,
    lessons: [
      {
        id: 'tai-chinh/nen-tang/ngan-sach',
        title: 'Ngân sách',
        scriptHash: HASH,
        chapters: [
          {
            id: INTRO_CHAPTER_ID,
            title: 'Mở đầu',
            paragraphs: ['Ngân sách.', 'A.'],
            marks: [{ id: 'muc-con', title: 'Mục con', paragraphIndex: 1 }],
          },
          { id: 'phan-hai', title: 'Phần hai', paragraphs: ['Phần hai.'], marks: [] },
        ],
      },
    ],
  };
}

describe('parseSpeechScripts', () => {
  it('accepts a valid file, as an object or a JSON string', () => {
    expect(parseSpeechScripts(validFile())).toEqual(validFile());
    expect(parseSpeechScripts(JSON.stringify(validFile()))).toEqual(validFile());
  });

  it('rejects invalid JSON and a wrong version with a readable message', () => {
    expect(() => parseSpeechScripts('{')).toThrow(/tts-scripts: invalid JSON/);
    expect(() => parseSpeechScripts({ ...validFile(), v: 2 })).toThrow('tts-scripts: root.v must be 1');
    expect(() => parseSpeechScripts({ ...validFile(), extractorVersion: 0 })).toThrow(/extractorVersion/);
    expect(() => parseSpeechScripts(null)).toThrow(/root must be an object/);
  });

  it('rejects a lesson id that is not domain/module/slug, and duplicate lessons', () => {
    const file = validFile();
    file.lessons[0].id = '../etc/passwd';
    expect(() => parseSpeechScripts(file)).toThrow(/lessons\[0\]\.id/);
    const dup = validFile();
    dup.lessons.push(structuredClone(dup.lessons[0]));
    expect(() => parseSpeechScripts(dup)).toThrow(/duplicate lesson id/);
  });

  it('rejects a mark whose paragraphIndex is outside its chapter', () => {
    for (const bad of [2, -1, 0.5, '1']) {
      const file = validFile();
      file.lessons[0].chapters[0].marks[0].paragraphIndex = bad;
      expect(() => parseSpeechScripts(file)).toThrow(/chapters\[0\]\.marks\[0\]\.paragraphIndex/);
    }
  });

  it('rejects empty chapters, empty paragraphs, bad hashes and duplicate anchors', () => {
    const noChapters = validFile();
    noChapters.lessons[0].chapters = [];
    expect(() => parseSpeechScripts(noChapters)).toThrow(/chapters must not be empty/);
    const emptyParagraph = validFile();
    emptyParagraph.lessons[0].chapters[1].paragraphs = [' '];
    expect(() => parseSpeechScripts(emptyParagraph)).toThrow(/paragraphs\[0\]/);
    const badHash = validFile();
    badHash.lessons[0].scriptHash = 'ABC';
    expect(() => parseSpeechScripts(badHash)).toThrow(/scriptHash/);
    const dupAnchor = validFile();
    dupAnchor.lessons[0].chapters[1].id = 'muc-con';
    expect(() => parseSpeechScripts(dupAnchor)).toThrow(/duplicate chapter\/mark id "muc-con"/);
  });
});

describe('speechScriptHashInput', () => {
  it('does not depend on object key order and carries the extractor version', () => {
    const chapters = validFile().lessons[0].chapters;
    const reordered = chapters.map((c) => ({
      marks: c.marks.map((m) => ({ paragraphIndex: m.paragraphIndex, title: m.title, id: m.id })),
      paragraphs: c.paragraphs,
      title: c.title,
      id: c.id,
    }));
    expect(speechScriptHashInput(reordered)).toBe(speechScriptHashInput(chapters));
    expect(JSON.parse(speechScriptHashInput(chapters)).v).toBe(SPEECH_EXTRACTOR_VERSION);
  });
});
