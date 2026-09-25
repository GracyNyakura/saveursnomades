const api = async (url, options = {}) => {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Une erreur est survenue');
  return data;
};

document.querySelectorAll('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });

document.querySelector('[data-menu-toggle]')?.addEventListener('click', () => {
  document.querySelector('.site-nav')?.classList.toggle('is-open');
});

document.querySelector('[data-logout]')?.addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' });
  window.location.href = '/connexion.html';
});

const currentPath = window.location.pathname;
document.querySelectorAll('.site-nav a').forEach(link => {
  if (link.getAttribute('href') === currentPath || (currentPath === '/' && link.getAttribute('href') === '/')) link.classList.add('is-active');
});
