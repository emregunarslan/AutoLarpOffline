// Generates the vehicle control sound effects in public/sfx with ElevenLabs.
// Run `npm run generate:sfx` (loads ELEVENLABS_API_KEY from .env).
// Existing clips are kept; pass --force to regenerate them.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'sfx');
const API_URL = 'https://api.elevenlabs.io/v1/sound-generation';
const MODEL = 'eleven_text_to_sound_v2';
const force = process.argv.includes('--force');

// [file, duration in seconds, prompt]. Each control has a different sound for
// switching on and off, and the prompts ask for dry, isolated effects with no
// music or voice so they sit under the button feedback without distraction.
const SOUNDS = [
  {
    file: 'lock-on.mp3',
    duration: 1.2,
    prompt: 'A modern luxury car locking: a short soft mechanical door-lock actuator thunk and latch click, followed by one crisp confirmation beep. Close and dry, premium. No music, no voice, no reverb.',
  },
  {
    file: 'lock-off.mp3',
    duration: 1.0,
    prompt: 'A modern luxury car unlocking: a light mechanical door-lock unlatch click, then two quick high confirmation chirps. Close and dry, premium. No music, no voice.',
  },
  {
    file: 'start-on.mp3',
    duration: 3.0,
    prompt: 'Interior sound of a premium gasoline V8 sports car starting remotely: the starter motor cranks twice, the engine catches and settles into a smooth, deep idle. Close and dry. No music, no voice, no tire squeal.',
  },
  {
    file: 'start-off.mp3',
    duration: 1.6,
    prompt: 'A premium gasoline V8 car engine shutting off: the idle drops, the engine gives a final soft shudder and stops. Close and dry. No music, no voice.',
  },
  {
    file: 'climate-on.mp3',
    duration: 1.5,
    prompt: 'A car climate control system switching on: a quiet HVAC fan smoothly spins up and settles into steady cabin airflow. Close and dry. No music, no voice, no beeps.',
  },
  {
    file: 'climate-off.mp3',
    duration: 1.2,
    prompt: 'A car climate control system switching off: the quiet cabin fan smoothly winds down and stops. Close and dry. No music, no voice.',
  },
  {
    file: 'trunk-on.mp3',
    duration: 2.2,
    prompt: 'An electric car liftgate opening: a solid electronic latch release clunk, then a quiet smooth power liftgate motor raises the lid. Close and dry. No music, no voice.',
  },
  {
    file: 'trunk-off.mp3',
    duration: 2.0,
    prompt: 'An electric car liftgate closing: a smooth power liftgate motor whirs, then a soft, solid latch thunk as it shuts. Close and dry. No music, no voice.',
  },
  {
    file: 'charge-on.mp3',
    duration: 1.0,
    prompt: 'An electric vehicle charge port door opening: a small electronic latch click and a tiny precise servo whir. Lightweight and close. No music, no voice.',
  },
  {
    file: 'charge-off.mp3',
    duration: 0.9,
    prompt: 'An electric vehicle charge port door closing: a tiny servo whir followed by a soft latch click. Close and dry. No music, no voice.',
  },
];

const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error('ELEVENLABS_API_KEY is missing. Add it to .env (see .env.example).');
  process.exit(1);
}

await fs.mkdir(OUT_DIR, { recursive: true });
let failed = 0;

for (const sound of SOUNDS) {
  const file = path.join(OUT_DIR, sound.file);
  const exists = await fs.access(file).then(() => true, () => false);
  if (exists && !force) {
    console.log(`skip  ${sound.file} (already exists)`);
    continue;
  }

  process.stdout.write(`make  ${sound.file} … `);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': key,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: sound.prompt,
        duration_seconds: sound.duration,
        prompt_influence: 0.6,
        model_id: MODEL,
      }),
      signal: AbortSignal.timeout(180000),
    });

    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 300);
      throw new Error(`${res.status} ${detail || res.statusText}`);
    }

    const type = res.headers.get('content-type') || '';
    const audio = Buffer.from(await res.arrayBuffer());
    if (!type.startsWith('audio/') || audio.length < 1000) {
      throw new Error(`unexpected response (${type || 'no content-type'}, ${audio.length} bytes)`);
    }

    await fs.writeFile(file, audio);
    console.log(`ok (${(audio.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    failed++;
    console.log(`failed: ${err.message}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 300));
}

if (failed) {
  console.error(`\n${failed} sound${failed === 1 ? '' : 's'} failed. Check ELEVENLABS_API_KEY and that your ElevenLabs plan allows sound effects.`);
  process.exitCode = 1;
} else {
  console.log('\nDone — clips are in public/sfx.');
}
