(async function () {
  const $ = (id) => document.getElementById(id);
  $('mark').innerHTML = ICONS.car;

  // Already signed in? Go straight to the garage.
  if (await fetch('/api/me', { credentials: 'same-origin' }).then((r) => r.ok).catch(() => false)) {
    location.replace('./');
    return;
  }

  let mode = 'login';
  const COPY = {
    login: { heading: 'Welcome back', sub: 'Sign in to access your vehicles', button: 'Sign In', pw: 'current-password' },
    signup: { heading: 'Create account', sub: 'Choose a username and password', button: 'Create Account', pw: 'new-password' },
  };

  function setMode(next) {
    mode = next;
    const c = COPY[mode];
    $('heading').textContent = c.heading;
    $('sub').textContent = c.sub;
    $('submit').textContent = c.button;
    $('password').autocomplete = c.pw;
    $('confirmWrap').hidden = mode !== 'signup';
    $('error').textContent = '';
    $('tabs').querySelectorAll('[data-v]').forEach((b) => b.classList.toggle('sel', b.dataset.v === mode));
  }

  $('tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-v]');
    if (tab) setMode(tab.dataset.v);
  });

  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = $('username').value.trim();
    const password = $('password').value;
    if (mode === 'signup' && password !== $('confirm').value) {
      $('error').textContent = 'Passwords do not match';
      return;
    }
    $('submit').disabled = true;
    try {
      await DB.api('POST', mode === 'signup' ? '/signup' : '/login', { username, password });
      sessionStorage.clear();
      location.replace('./');
    } catch (err) {
      $('error').textContent = err.message;
      $('submit').disabled = false;
    }
  });
})();
