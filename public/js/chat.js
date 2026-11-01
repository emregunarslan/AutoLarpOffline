// AI assistant chat: a floating button that opens a chat sheet. The assistant can
// recommend a vehicle and run controls; control actions play out on the car page
// (or are remembered for when it's opened next).
(function () {
  const HISTORY_KEY = 'chat:history';
  const MAX_SENT = 20;

  const history = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]');
  const save = () => sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-40)));
  const currentVehicleId = () => document.body.dataset.vehicleId || null;
  let carsPromise = null;
  let busy = false;

  // ---------- Voice replies (ElevenLabs via /api/tts) ----------
  const VOICE_KEY = 'chat:voice';
  let voiceOn = localStorage.getItem(VOICE_KEY) !== 'off';
  let voiceAvailable = true; // turned off for the session if the server has no key
  let audioCtx = null;
  let playing = null;

  // Phones only allow sound that starts from a tap, so the audio context is
  // created/resumed during the tap that sends the message and reused for the reply.
  function unlockAudio() {
    if (!voiceOn || !voiceAvailable) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx ??= new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  }

  function stopVoice() {
    try { playing?.stop(); } catch { /* already stopped */ }
    playing = null;
  }

  async function speak(text) {
    if (!voiceOn || !voiceAvailable || !audioCtx || !text) return;
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ text }),
      });
      if (res.status === 503) {
        voiceAvailable = false;
        renderVoiceButton();
        bubble({ role: 'assistant', content: (await res.json().catch(() => ({}))).error || 'Voice replies aren\'t set up.', error: true });
        return;
      }
      if (!res.ok) return console.warn('Voice reply failed:', res.status);
      const audio = await audioCtx.decodeAudioData(await res.arrayBuffer());
      if (!voiceOn) return;
      stopVoice();
      playing = audioCtx.createBufferSource();
      playing.buffer = audio;
      playing.connect(audioCtx.destination);
      playing.start();
    } catch (err) {
      console.warn('Voice reply failed:', err);
    }
  }

  const fab = document.createElement('button');
  fab.className = 'chat-fab';
  fab.setAttribute('aria-label', 'Open assistant');
  fab.innerHTML = ICONS.sparkle;

  const panel = document.createElement('section');
  panel.className = 'chat-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Assistant');
  panel.innerHTML = `
    <div class="chat-head">
      <span class="chat-title">${ICONS.sparkle}<span>Concierge</span></span>
      <span class="chat-head-actions">
        <button class="chat-voice" type="button"></button>
        <button class="chat-close" aria-label="Close">${ICONS.close}</button>
      </span>
    </div>
    <div class="chat-log" aria-live="polite"></div>
    <div class="chat-suggest"></div>
    <form class="chat-form" autocomplete="off">
      <button class="chat-mic" type="button" aria-label="Speak to the assistant" hidden>${ICONS.mic}</button>
      <input class="chat-input" maxlength="500" placeholder="Ask or give a command…" aria-label="Message">
      <button class="chat-send" type="submit" aria-label="Send">${ICONS.send}</button>
    </form>`;
  const backdrop = document.createElement('div');
  backdrop.className = 'chat-backdrop';
  document.body.append(fab, backdrop, panel);

  const log = panel.querySelector('.chat-log');
  const input = panel.querySelector('.chat-input');
  const suggest = panel.querySelector('.chat-suggest');
  const voiceBtn = panel.querySelector('.chat-voice');

  function renderVoiceButton() {
    const on = voiceOn && voiceAvailable;
    voiceBtn.innerHTML = on ? ICONS.speaker : ICONS.mute;
    voiceBtn.classList.toggle('on', on);
    voiceBtn.setAttribute('aria-label', on ? 'Mute voice replies' : 'Read replies aloud');
    voiceBtn.setAttribute('aria-pressed', String(on));
  }
  renderVoiceButton();
  voiceBtn.onclick = () => {
    voiceOn = !(voiceOn && voiceAvailable);
    voiceAvailable = true; // let them retry after fixing the key
    localStorage.setItem(VOICE_KEY, voiceOn ? 'on' : 'off');
    if (voiceOn) unlockAudio(); else stopVoice();
    renderVoiceButton();
  };

  function bubble(msg) {
    const el = document.createElement('div');
    el.className = `chat-msg ${msg.role}${msg.error ? ' error' : ''}`;
    el.innerHTML = `<div class="chat-bubble">${escapeHtml(msg.content)}</div>` +
      (msg.actions?.length
        ? `<div class="chat-actions">${msg.actions.map((a) => `<span class="chat-chip">${escapeHtml(a.vehicle)} · ${escapeHtml(a.text)}</span>`).join('')}</div>`
        : '');
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function renderSuggestions() {
    const ideas = currentVehicleId()
      ? ['Lock it', 'Turn on the climate', 'Is this good for a road trip?']
      : ['Which car is best for driving fast?', 'Which car fits the most suitcases?', 'Lock all my cars'];
    suggest.innerHTML = ideas.map((t) => `<button type="button" class="chat-idea">${escapeHtml(t)}</button>`).join('');
    suggest.hidden = history.length > 0;
  }

  function open() {
    document.body.classList.add('chat-open');
    carsPromise ??= DB.getCarSummaries().catch(() => []); // start loading before the first message
    if (!log.children.length) {
      bubble({ role: 'assistant', content: 'Hi! I can run your vehicle controls or help you pick the right car for the trip. What do you need?' });
      history.forEach(bubble);
    }
    renderSuggestions();
    setTimeout(() => input.focus(), 250);
  }
  function close() {
    stopVoice();
    if (recognizer) {
      recognizer.cancelled = true; // closing the chat discards what was being said
      recognizer.abort();
    }
    document.body.classList.remove('chat-open');
  }

  // Live readings shown in the app, so the assistant can talk about range and fuel.
  async function readings() {
    carsPromise ??= DB.getCarSummaries();
    const stats = {};
    for (const car of await carsPromise) {
      const { pct, km, fuel } = vehicleStats(car);
      stats[car.id] = { pct, km, fuel };
    }
    return stats;
  }

  // Applies a control the assistant ran: remembered for the session, and played
  // on the car page if that car is open.
  function apply(action) {
    if (!action.oneShot) saveControlState(action.vehicleId, action.control, action.on);
    window.dispatchEvent(new CustomEvent('car-command', { detail: action }));
  }

  async function send(text) {
    if (busy || !text.trim()) return;
    busy = true;
    unlockAudio();
    stopVoice();
    suggest.hidden = true;
    const userMsg = { role: 'user', content: text.trim() };
    history.push(userMsg);
    save();
    bubble(userMsg);
    input.value = '';
    const typing = bubble({ role: 'assistant', content: '' });
    typing.classList.add('typing');
    typing.querySelector('.chat-bubble').innerHTML = '<i></i><i></i><i></i>';
    try {
      const data = await DB.api('POST', '/assistant', {
        messages: history.slice(-MAX_SENT).map(({ role, content }) => ({ role, content })),
        currentVehicleId: currentVehicleId(),
        stats: await readings(),
      });
      typing.remove();
      const reply = { role: 'assistant', content: data.reply, actions: data.actions };
      history.push(reply);
      save();
      bubble(reply);
      data.actions.forEach(apply);
      speak(data.reply);
    } catch (err) {
      typing.remove();
      history.pop(); // let them retry the same message
      save();
      bubble({ role: 'assistant', content: err.message, error: true });
    } finally {
      busy = false;
    }
  }

  // ---------- Talking to the assistant (browser speech recognition) ----------
  // Tap the mic, speak, and the words appear as you talk; when you stop, the
  // message is sent. Hidden in browsers without speech recognition (e.g. Firefox).
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = panel.querySelector('.chat-mic');
  const PLACEHOLDER = input.placeholder;
  let recognizer = null;

  function setListening(on) {
    micBtn.classList.toggle('listening', on);
    micBtn.setAttribute('aria-pressed', String(on));
    micBtn.setAttribute('aria-label', on ? 'Stop listening' : 'Speak to the assistant');
    input.placeholder = on ? 'Listening…' : PLACEHOLDER;
  }

  function startListening() {
    if (busy) return;
    unlockAudio(); // this tap also allows the spoken reply to play
    stopVoice();
    let heard = '';
    const rec = new Recognition();
    recognizer = rec;
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) heard += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      input.value = `${heard}${interim}`.trim();
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        bubble({ role: 'assistant', content: 'Microphone access is blocked. Allow it in your browser\'s site settings to talk to me.', error: true });
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('Speech recognition error:', e.error);
      }
    };
    rec.onend = () => {
      recognizer = null;
      setListening(false);
      const text = (heard || input.value).trim();
      if (text && !rec.cancelled) send(text);
    };
    input.value = '';
    setListening(true);
    rec.start();
  }

  if (Recognition) {
    micBtn.hidden = false;
    micBtn.onclick = () => (recognizer ? recognizer.stop() : startListening());
  }

  fab.onclick = open;
  backdrop.onclick = close;
  panel.querySelector('.chat-close').onclick = close;
  panel.querySelector('.chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    send(input.value);
  });
  suggest.addEventListener('click', (e) => {
    const idea = e.target.closest('.chat-idea');
    if (idea) send(idea.textContent);
  });
})();
