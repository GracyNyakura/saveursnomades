document.querySelector('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  const message = document.querySelector('#login-message');
  try {
    await api('/api/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) });
    window.location.href = '/dashboard.html';
  } catch (error) { message.textContent = error.message; message.className = 'error'; }
});
