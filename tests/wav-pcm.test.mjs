// WAV parsing walks RIFF chunks (no fixed 44-byte header) and rejects malformed input.
import { describe, expect, it } from 'vitest';
import { parseWav, pcmDurationSec, WavFormatError, wavHeader } from '../server/tts/wav-pcm.ts';

const pcmOf = (n) => Uint8Array.from({ length: n }, (_, i) => i % 256);
const wav = (pcm, sampleRate = 24000) => Buffer.concat([wavHeader(pcm.length, sampleRate), pcm]);

/** Insert a chunk between `fmt ` and `data` (header bytes 36..). */
function withExtraChunk(file, id, payload) {
  const chunk = Buffer.alloc(8 + payload.length + (payload.length % 2));
  chunk.write(id, 0, 'latin1');
  chunk.writeUInt32LE(payload.length, 4);
  Buffer.from(payload).copy(chunk, 8);
  return Buffer.concat([file.subarray(0, 36), chunk, file.subarray(36)]);
}

describe('wavHeader + parseWav', () => {
  it('round-trips a canonical mono 16-bit file', () => {
    const pcm = pcmOf(480);
    const parsed = parseWav(wav(pcm));
    expect(parsed).toMatchObject({ sampleRate: 24000, channels: 1, bitsPerSample: 16 });
    expect(Buffer.from(parsed.pcm)).toEqual(Buffer.from(pcm));
  });

  it('skips a LIST chunk between fmt and data, including an odd-size pad byte', () => {
    const pcm = pcmOf(100);
    const parsed = parseWav(withExtraChunk(wav(pcm, 16000), 'LIST', Buffer.from('INFOabc')));
    expect(parsed.sampleRate).toBe(16000);
    expect(Buffer.from(parsed.pcm)).toEqual(Buffer.from(pcm));
  });

  it('works on a view into a larger buffer (non-zero byteOffset)', () => {
    const file = wav(pcmOf(10));
    const big = new Uint8Array(file.length + 7);
    big.set(file, 7);
    expect(parseWav(big.subarray(7)).pcm.length).toBe(10);
  });

  it('returns empty pcm for an empty data chunk', () => {
    expect(parseWav(wav(new Uint8Array(0))).pcm.length).toBe(0);
  });

  it('treats the 0xFFFFFFFF streaming placeholder as "to end of file"', () => {
    const file = wav(pcmOf(64));
    file.writeUInt32LE(0xffffffff, 40);
    expect(parseWav(file).pcm.length).toBe(64);
  });

  it('rejects a truncated data chunk', () => {
    const file = wav(pcmOf(1000));
    expect(() => parseWav(file.subarray(0, 60))).toThrow(/truncated/);
  });

  it('rejects input that is not RIFF/WAVE', () => {
    expect(() => parseWav(Buffer.from('ID3\u0003not a wav file at all'))).toThrow(WavFormatError);
    expect(() => parseWav(Buffer.from('RIFF'))).toThrow(/too short/);
  });

  it('rejects non-PCM formats and files without fmt or data', () => {
    const float = wav(pcmOf(8));
    float.writeUInt16LE(3, 20);
    expect(() => parseWav(float)).toThrow(/unsupported WAV format 3/);
    expect(() => parseWav(wav(pcmOf(8)).subarray(0, 36))).toThrow(/missing data chunk/);
    const noFmt = Buffer.concat([Buffer.from('RIFF\0\0\0\0WAVE', 'latin1'), Buffer.from('data\u0002\0\0\0ab', 'latin1')]);
    expect(() => parseWav(noFmt)).toThrow(/data chunk before fmt/);
  });
});

describe('pcmDurationSec', () => {
  it('computes seconds for 24 kHz mono 16-bit', () => {
    expect(pcmDurationSec(48000, 24000)).toBe(1);
    expect(pcmDurationSec(100, 0)).toBe(0);
  });
});
