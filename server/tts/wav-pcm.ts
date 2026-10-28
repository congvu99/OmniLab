/**
 * Minimal RIFF/WAVE reader and writer for linear PCM. Walks chunks instead of
 * assuming a 44-byte header, so extra chunks such as `LIST` are skipped.
 */

export interface WavPcm {
  /** Raw sample bytes of the `data` chunk (a view, not a copy). */
  pcm: Uint8Array;
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
}

export class WavFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WavFormatError';
  }
}

const RIFF_HEADER_BYTES = 12;
const CHUNK_HEADER_BYTES = 8;
const FMT_MIN_BYTES = 16;
const WAVE_FORMAT_PCM = 1;
// Streaming encoders write this placeholder when the final size is unknown.
const UNKNOWN_SIZE = 0xffffffff;

function fourCc(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

interface FmtChunk {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
}

function readFmt(view: DataView, offset: number, size: number): FmtChunk {
  if (size < FMT_MIN_BYTES) throw new WavFormatError('fmt chunk too short');
  const format = view.getUint16(offset, true);
  if (format !== WAVE_FORMAT_PCM) throw new WavFormatError(`unsupported WAV format ${format} (want PCM)`);
  return {
    channels: view.getUint16(offset + 2, true),
    sampleRate: view.getUint32(offset + 4, true),
    bitsPerSample: view.getUint16(offset + 14, true),
  };
}

/** Parse a PCM WAV file; throws `WavFormatError` on anything malformed or truncated. */
export function parseWav(bytes: Uint8Array): WavPcm {
  if (bytes.length < RIFF_HEADER_BYTES) throw new WavFormatError('too short for a RIFF header');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (fourCc(view, 0) !== 'RIFF' || fourCc(view, 8) !== 'WAVE') throw new WavFormatError('not a RIFF/WAVE file');

  let fmt: FmtChunk | undefined;
  let offset = RIFF_HEADER_BYTES;
  while (offset + CHUNK_HEADER_BYTES <= bytes.length) {
    const id = fourCc(view, offset);
    const declared = view.getUint32(offset + 4, true);
    const start = offset + CHUNK_HEADER_BYTES;
    const remaining = bytes.length - start;
    if (id === 'data') {
      if (!fmt) throw new WavFormatError('data chunk before fmt chunk');
      const size = declared === UNKNOWN_SIZE ? remaining : declared;
      if (size > remaining) throw new WavFormatError('data chunk truncated');
      return { pcm: bytes.subarray(start, start + size), ...fmt };
    }
    if (declared > remaining) throw new WavFormatError(`${id.trim() || 'unnamed'} chunk truncated`);
    if (id === 'fmt ') fmt = readFmt(view, start, declared);
    // Chunks are word-aligned: odd sizes carry one pad byte.
    offset = start + declared + (declared % 2);
  }
  throw new WavFormatError(fmt ? 'missing data chunk' : 'missing fmt chunk');
}

/** 44-byte canonical WAV header for `pcmBytes` of little-endian PCM. */
export function wavHeader(pcmBytes: number, sampleRate: number, channels = 1, bitsPerSample = 16): Uint8Array {
  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  const blockAlign = (channels * bitsPerSample) / 8;
  write(0, 'RIFF');
  view.setUint32(4, 36 + pcmBytes, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, FMT_MIN_BYTES, true);
  view.setUint16(20, WAVE_FORMAT_PCM, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  write(36, 'data');
  view.setUint32(40, pcmBytes, true);
  return header;
}

/** Playback length in seconds of `pcmBytes` raw PCM. */
export function pcmDurationSec(pcmBytes: number, sampleRate: number, channels = 1, bitsPerSample = 16): number {
  const bytesPerSecond = (sampleRate * channels * bitsPerSample) / 8;
  return bytesPerSecond > 0 ? pcmBytes / bytesPerSecond : 0;
}
