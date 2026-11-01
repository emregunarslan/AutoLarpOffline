// Text-to-speech for the assistant's replies, via ElevenLabs. The browser sends the
// reply text here; the server adds the secret API key and returns MP3 audio.
const API_URL = `${process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io'}/v1/text-to-speech`;
// "George", one of ElevenLabs' default voices (usable on the free plan); override with ELEVENLABS_VOICE_ID.
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
// Flash is the fastest model and uses half the credits of the multilingual ones.
const MODEL_ID = process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5';
const MAX_CHARS = 500; // replies are 1–3 sentences; this caps credit use per request

// Per-user brake on credit use: 30 replies per 10 minutes.
const usage = new Map();
function overLimit(userId) {
  const now = Date.now();
  const recent = (usage.get(userId) || []).filter((t) => now - t < 10 * 60e3);
  if (recent.length >= 30) return true;
  recent.push(now);
  usage.set(userId, recent);
  return false;
}

export function ttsRoutes(app, { requireUser }) {
  app.post('/api/tts', requireUser, async (req, res, next) => {
    try {
      const text = typeof req.body.text === 'string' ? req.body.text.trim().slice(0, MAX_CHARS) : '';
      if (!text) return res.status(400).json({ error: 'Nothing to read' });
      if (!process.env.ELEVENLABS_API_KEY) {
        return res.status(503).json({ error: 'Voice replies aren\'t set up (no ELEVENLABS_API_KEY on the server).' });
      }
      if (overLimit(String(req.user._id))) return res.status(429).json({ error: 'Voice limit reached — try again soon.' });

      const upstream = await fetch(`${API_URL}/${encodeURIComponent(VOICE_ID)}?output_format=mp3_44100_64`, {
        method: 'POST',
        headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({ text, model_id: MODEL_ID }),
        signal: AbortSignal.timeout(20000),
      });

      if (!upstream.ok) {
        const detail = (await upstream.text().catch(() => '')).slice(0, 300);
        console.error('ElevenLabs error:', upstream.status, detail);
        if (upstream.status === 401 || upstream.status === 403) {
          return res.status(503).json({ error: 'Voice replies couldn\'t connect — check ELEVENLABS_API_KEY (and that your plan allows API use).' });
        }
        if (upstream.status === 429) return res.status(429).json({ error: 'Voice is busy or out of credits.' });
        return res.status(502).json({ error: 'Voice reply failed.' });
      }

      res.set({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' });
      res.send(Buffer.from(await upstream.arrayBuffer()));
    } catch (err) {
      if (err.name === 'TimeoutError') return res.status(504).json({ error: 'Voice reply timed out.' });
      next(err);
    }
  });
}
