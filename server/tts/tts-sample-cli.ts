/**
 * `pnpm tts:sample`: synthesize one sample text with several voices so the
 * owner can pick a voice and measure chars-per-second against a real key.
 * Prints one JSON line per voice. The API key is never printed or written.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { createGeminiTtsClient } from './gemini-tts-client.ts';
import type { GeminiTtsClient, SynthesisResult } from './gemini-tts-client.ts';
import { wavHeader } from './wav-pcm.ts';
import { TTS_CANDIDATE_VOICES, TTS_MODEL, TTS_STYLE, TTS_VOICE_LIST_QUERY, TTS_VOICE_NAME_PATTERN } from './tts-defaults.ts';

export const SAMPLE_TEXT =
  'Khi lượng truy cập tăng nhanh, hệ thống thường đặt một load balancer phía trước để chia đều yêu cầu cho nhiều máy chủ. ' +
  'Dữ liệu hay được đọc lại sẽ nằm trong cache, nhờ vậy cơ sở dữ liệu đỡ phải làm việc. ' +
  'Nếu một máy chủ gặp sự cố, các máy còn lại vẫn phục vụ người dùng, và độ trễ trung bình giữ ở mức vài chục mili giây.';

const USAGE = `Usage: pnpm tts:sample [options]

Reads GEMINI_API_KEY from the environment or .env.local.

  --voices a,b        voices to try (default: ${TTS_CANDIDATE_VOICES.join(',')})
  --text-file <path>  UTF-8 text to read instead of the built-in sample
  --model <id>        model (default: ${TTS_MODEL})
  --style <text>      delivery style (default: "${TTS_STYLE}")
  --out <dir>         output directory (default: .tts-samples)
  --list-voices       list Extended Voice Library entries (vi-VN, male, low) and exit
  -h, --help          show this help`;

const EXIT_OK = 0;
const EXIT_FAILED = 1;
const EXIT_USAGE = 2;
// Một lần chờ quota phút, có trần để lệnh không treo lâu khi retryDelay bất thường.
const MAX_MINUTE_WAIT_MS = 90_000;

export interface SampleCliDeps {
  env: NodeJS.ProcessEnv;
  createClient?: (apiKey: string) => GeminiTtsClient;
  out?: (line: string) => void;
  err?: (line: string) => void;
  sleep?: (ms: number) => Promise<void>;
  now?: () => Date;
}

interface SampleOptions {
  voices: string[];
  text: string;
  model: string;
  style: string;
  outDir: string;
}

function parseCliArgs(argv: string[]) {
  return parseArgs({
    args: argv,
    allowPositionals: false,
    options: {
      voices: { type: 'string' },
      'text-file': { type: 'string' },
      model: { type: 'string', default: TTS_MODEL },
      style: { type: 'string', default: TTS_STYLE },
      out: { type: 'string', default: '.tts-samples' },
      'list-voices': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  }).values;
}

function parseVoices(raw: string | undefined): string[] {
  const voices = raw === undefined ? [...TTS_CANDIDATE_VOICES] : raw.split(',').map((v) => v.trim()).filter(Boolean);
  if (voices.length === 0) throw new Error('--voices is empty');
  // Tên giọng thành tên file <voice>.wav nên chặn ký tự đường dẫn.
  const bad = voices.find((v) => !TTS_VOICE_NAME_PATTERN.test(v));
  if (bad !== undefined) throw new Error(`invalid voice name: ${JSON.stringify(bad)}`);
  return voices;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

async function listVoices(client: GeminiTtsClient, out: (line: string) => void): Promise<number> {
  const result = await client.listVoices(TTS_VOICE_LIST_QUERY);
  // Thư viện giọng có thể không mở cho key free: in lỗi để ghi nhận, không coi là hỏng lệnh.
  out(JSON.stringify(result.kind === 'ok' ? result.data : { listVoices: 'failed', ...result }, null, 2));
  return EXIT_OK;
}

async function synthesizeVoice(
  client: GeminiTtsClient,
  options: SampleOptions,
  voice: string,
  sleep: (ms: number) => Promise<void>,
): Promise<SynthesisResult> {
  const request = { text: options.text, model: options.model, voice, style: options.style };
  const first = await client.synthesize(request);
  if (first.kind !== 'quota' || first.scope !== 'minute') return first;
  await sleep(Math.min(first.retryAfterMs ?? MAX_MINUTE_WAIT_MS, MAX_MINUTE_WAIT_MS));
  return client.synthesize(request);
}

async function runSamples(client: GeminiTtsClient, options: SampleOptions, deps: Required<SampleCliDeps>): Promise<number> {
  await mkdir(options.outDir, { recursive: true });
  const chars = [...options.text].length;
  let exitCode = EXIT_OK;
  for (const voice of options.voices) {
    const result = await synthesizeVoice(client, options, voice, deps.sleep);
    if (result.kind === 'ok') {
      await writeFile(join(options.outDir, `${voice}.wav`), Buffer.concat([wavHeader(result.pcm.length, result.sampleRate), result.pcm]));
      const durationSec = round2(result.durationSec);
      const charsPerSec = round2(result.durationSec > 0 ? chars / result.durationSec : 0);
      deps.out(JSON.stringify({ voice, chars, bytes: result.pcm.length, sampleRate: result.sampleRate, durationSec, charsPerSec, latencyMs: result.latencyMs }));
      continue;
    }
    exitCode = EXIT_FAILED;
    if (result.kind === 'quota') {
      const file = join(options.outDir, `429-${deps.now().toISOString().replace(/[:.]/g, '-')}.json`);
      await writeFile(file, result.body);
      const { kind, scope, retryAfterMs, zeroQuota, quotaIds } = result;
      deps.out(JSON.stringify({ voice, kind, scope, retryAfterMs, zeroQuota, quotaIds, savedBody: file }));
      return exitCode; // quota still exhausted: further voices would only fail too
    }
    deps.out(JSON.stringify({ voice, ...result }));
    if (result.kind === 'auth') return exitCode;
  }
  return exitCode;
}

/** CLI entry; returns the process exit code. */
export async function runSampleCli(argv: string[], deps: SampleCliDeps): Promise<number> {
  const full: Required<SampleCliDeps> = {
    createClient: (apiKey) => createGeminiTtsClient({ apiKey }),
    out: (line) => console.log(line),
    err: (line) => console.error(line),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now: () => new Date(),
    ...deps,
  };
  let args;
  let voices: string[];
  try {
    args = parseCliArgs(argv);
    voices = parseVoices(args.voices);
  } catch (err) {
    full.err(`${err instanceof Error ? err.message : String(err)}\n\n${USAGE}`);
    return EXIT_USAGE;
  }
  if (args.help) {
    full.out(USAGE);
    return EXIT_OK;
  }
  const apiKey = full.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    full.err('GEMINI_API_KEY is not set. Add a line "GEMINI_API_KEY=<your key>" to .env.local (git-ignored) or export it, then rerun.');
    return EXIT_USAGE;
  }
  const client = full.createClient(apiKey);
  if (args['list-voices']) return listVoices(client, full.out);

  let text = SAMPLE_TEXT;
  if (args['text-file'] !== undefined) {
    try {
      text = (await readFile(args['text-file'], 'utf8')).trim();
    } catch (err) {
      full.err(`cannot read --text-file: ${err instanceof Error ? err.message : String(err)}`);
      return EXIT_USAGE;
    }
    if (!text) {
      full.err('--text-file is empty');
      return EXIT_USAGE;
    }
  }
  return runSamples(client, { voices, text, model: args.model, style: args.style, outDir: args.out }, full);
}

if (import.meta.main) {
  try {
    process.exitCode = await runSampleCli(process.argv.slice(2), { env: process.env });
  } catch (err) {
    console.error(`tts:sample failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = EXIT_FAILED;
  }
}
