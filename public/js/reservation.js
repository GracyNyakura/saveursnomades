const form = document.querySelector('#reservation-form');
const message = document.querySelector('#res-message');
const menuName = new URLSearchParams(window.location.search).get('menu');
const selectedMenu = document.querySelector('#selected-menu');
if (menuName && selectedMenu) selectedMenu.textContent = menuName;

document.querySelector('input[name="date"]').min = new Date().toISOString().split('T')[0];
document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
  const input = document.querySelector('input[name="party"]');
  input.value = Math.min(12, Math.max(1, Number(input.value) + Number(button.dataset.step)));
}));
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Envoi en cours...';
  try {
    await api('/api/reservations', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) });
    message.textContent = 'Votre demande est bien enregistrée. À très bientôt !';
    message.className = 'success'; form.reset();
  } catch (error) { message.textContent = error.message; message.className = 'error'; }
  button.disabled = false; button.innerHTML = 'Confirmer la demande <span>↗</span>';
});
