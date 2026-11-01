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
      <button class="chat-close" aria-label="Close">${ICONS.close}</button>
    </div>
    <div class="chat-log" aria-live="polite"></div>
    <div class="chat-suggest"></div>
    <form class="chat-form" autocomplete="off">
      <input class="chat-input" maxlength="500" placeholder="Ask or give a command…" aria-label="Message">
      <button class="chat-send" type="submit" aria-label="Send">${ICONS.send}</button>
    </form>`;
  const backdrop = document.createElement('div');
  backdrop.className = 'chat-backdrop';
  document.body.append(fab, backdrop, panel);

  const log = panel.querySelector('.chat-log');
  const input = panel.querySelector('.chat-input');
  const suggest = panel.querySelector('.chat-suggest');

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
  const close = () => document.body.classList.remove('chat-open');

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
    } catch (err) {
      typing.remove();
      history.pop(); // let them retry the same message
      save();
      bubble({ role: 'assistant', content: err.message, error: true });
    } finally {
      busy = false;
    }
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
