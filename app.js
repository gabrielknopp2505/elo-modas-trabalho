const STORAGE_KEY = 'elo-demo-donations';
const USERS_KEY = 'elo-demo-users';
const SESSION_KEY = 'elo-demo-session';

const readStorage = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove('show'), 3000);
}

function getDonations() {
  return readStorage(STORAGE_KEY, []);
}

function updateDonationViews() {
  const donations = getDonations();
  const search = document.querySelector('#search').value.trim().toLocaleLowerCase('pt-BR');
  const category = document.querySelector('#category-filter').value;
  const size = document.querySelector('#size-filter').value;
  const filtered = donations.filter((item) => {
    const searchable = `${item.category} ${item.region} ${item.description} ${item.condition}`.toLocaleLowerCase('pt-BR');
    return (!search || searchable.includes(search)) && (!category || item.category === category) && (!size || item.size === size);
  });

  const grid = document.querySelector('#catalog-grid');
  grid.innerHTML = filtered.map((item) => `
    <article class="item">
      <div class="item-art" aria-hidden="true">${item.category === 'Calçados' ? '👟' : item.category === 'Casacos' ? '🧥' : item.category === 'Calças' ? '👖' : item.category === 'Vestidos' ? '👗' : '👕'}</div>
      <h3>${escapeHTML(item.category)} · tamanho ${escapeHTML(item.size)}</h3>
      <p>${escapeHTML(item.condition)}${item.region ? ` · ${escapeHTML(item.region)}` : ''}</p>
      ${item.description ? `<p>${escapeHTML(item.description)}</p>` : ''}
      <button type="button" data-request="${escapeHTML(item.id)}">Tenho interesse ↗</button>
    </article>`).join('');
  document.querySelector('#empty-state').hidden = filtered.length !== 0;

  const totalPieces = donations.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.querySelector('#donation-count').textContent = donations.length;
  document.querySelector('#piece-count').textContent = totalPieces;
  document.querySelector('#available-count').textContent = totalPieces;

  const table = document.querySelector('#admin-table');
  table.innerHTML = donations.length ? donations.map((item) => `
    <tr><td>${escapeHTML(item.category)}${item.region ? ` — ${escapeHTML(item.region)}` : ''}</td><td>${escapeHTML(item.category)}</td><td>${escapeHTML(item.size)}</td><td>${escapeHTML(item.quantity)}</td><td>Disponível</td></tr>`).join('') : '<tr><td colspan="5" class="center">Nenhuma doação cadastrada.</td></tr>';
}

document.querySelector('#donation-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const donations = getDonations();
  donations.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    donor: form.get('donor').trim(),
    category: form.get('category'),
    size: form.get('size'),
    condition: form.get('condition'),
    quantity: Math.max(1, Number(form.get('quantity')) || 1),
    region: form.get('region').trim(),
    description: form.get('description').trim()
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(donations));
  event.currentTarget.reset();
  event.currentTarget.elements.quantity.value = 1;
  updateDonationViews();
  showToast('Doação cadastrada nesta demonstração. Obrigado!');
});

document.querySelector('#catalog-grid').addEventListener('click', (event) => {
  if (event.target.matches('[data-request]')) {
    showToast('Interesse registrado apenas nesta demonstração.');
  }
});

['#search', '#category-filter', '#size-filter'].forEach((selector) => {
  document.querySelector(selector).addEventListener('input', updateDonationViews);
  document.querySelector(selector).addEventListener('change', updateDonationViews);
});

document.querySelector('#signup-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const users = readStorage(USERS_KEY, []);
  const email = form.get('email').trim().toLowerCase();
  if (users.some((user) => user.email === email)) {
    showToast('Este e-mail já está cadastrado nesta demonstração.');
    return;
  }
  users.push({ name: form.get('name').trim(), email, password: form.get('password') });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name: form.get('name').trim(), email }));
  event.currentTarget.reset();
  renderSession();
  showToast('Conta demonstrativa criada com sucesso!');
});

document.querySelector('#login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = form.get('email').trim().toLowerCase();
  const user = readStorage(USERS_KEY, []).find((entry) => entry.email === email && entry.password === form.get('password'));
  if (!user) {
    showToast('E-mail ou senha não encontrados. Use uma conta demonstrativa.');
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
  event.currentTarget.reset();
  renderSession();
  showToast(`Bem-vindo(a), ${user.name}!`);
});

function renderSession() {
  const box = document.querySelector('#session-box');
  const user = readStorage(SESSION_KEY, null);
  if (!user) {
    box.hidden = true;
    box.replaceChildren();
    return;
  }
  box.hidden = false;
  box.innerHTML = `Olá, <strong>${escapeHTML(user.name)}</strong> — sessão demonstrativa ativa. `;
  const logout = document.createElement('button');
  logout.className = 'text-btn';
  logout.type = 'button';
  logout.textContent = 'Sair';
  logout.addEventListener('click', () => {
    localStorage.removeItem(SESSION_KEY);
    renderSession();
    showToast('Você saiu da demonstração.');
  });
  box.append(logout);
}

document.querySelector('#forgot-password').addEventListener('click', () => {
  showToast('Recuperação de senha não está habilitada nesta demonstração.');
});

document.querySelector('#menu-toggle').addEventListener('click', (event) => {
  const nav = document.querySelector('#main-nav');
  const open = nav.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
});

document.querySelector('#main-nav').addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    document.querySelector('#main-nav').classList.remove('open');
    document.querySelector('#menu-toggle').setAttribute('aria-expanded', 'false');
  }
});

updateDonationViews();
renderSession();
