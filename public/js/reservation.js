const form = document.querySelector('#reservation-form');
const message = document.querySelector('#res-message');
const menuName = new URLSearchParams(window.location.search).get('menu');
const selectedMenu = document.querySelector('#selected-menu');
if (menuName && selectedMenu) selectedMenu.textContent = menuName;

function createReservationPdf(data, reservation) {
  if (!window.jspdf?.jsPDF) throw new Error('Le module PDF est indisponible');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const forest = [31, 64, 52];
  const clay = [198, 92, 60];
  const ink = [31, 43, 37];
  const light = [246, 241, 232];
  const ref = `SN-${String(reservation?.id || Date.now()).padStart(5, '0')}`;
  pdf.setFillColor(...forest); pdf.rect(0, 0, 210, 297, 'F');
  pdf.setFillColor(...light); pdf.rect(15, 15, 180, 267, 'F');
  pdf.setFillColor(...forest); pdf.rect(15, 15, 180, 48, 'F');
  pdf.setFillColor(233, 163, 126);
  for (let y = 22; y <= 54; y += 8) pdf.circle(183, y, 1.2, 'F');
  pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(19); pdf.text('SAVEURS', 27, 35);
  pdf.setFont('helvetica', 'italic'); pdf.setFontSize(18); pdf.text('NOMADES', 27, 46);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text('CUISINE EN MOUVEMENT', 157, 34, { align: 'right' }); pdf.text('MONTPELLIER · FRANCE', 157, 44, { align: 'right' });
  pdf.setTextColor(...ink); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(23); pdf.text('Confirmation', 27, 86); pdf.setTextColor(...clay); pdf.setFont('helvetica', 'italic'); pdf.text('de réservation', 27, 97);
  pdf.setTextColor(100, 108, 101); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.text('Votre escale gourmande est bien enregistrée.', 27, 110);
  pdf.setDrawColor(...clay); pdf.setLineWidth(.6); pdf.line(27, 119, 183, 119);
  const details = [['RÉFÉRENCE', ref], ['CLIENT', data.name], ['EMAIL', data.email], ['CONVIVES', `${data.party} personne${Number(data.party) > 1 ? 's' : ''}`], ['DATE', data.date], ['HEURE', data.time], ['EXPÉRIENCE', selectedMenu?.textContent || 'Saveurs Nomades']];
  let y = 135;
  details.forEach(([label, value]) => { pdf.setTextColor(...clay); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.text(label, 27, y); pdf.setTextColor(...ink); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11); pdf.text(String(value || 'Non précisé'), 86, y); y += 16; });
  pdf.setFillColor(233, 163, 126); pdf.rect(27, 247, 156, 0.5, 'F');
  pdf.setTextColor(...forest); pdf.setFont('helvetica', 'italic'); pdf.setFontSize(12); pdf.text('« Chaque assiette est une carte. Il suffit de la suivre. »', 105, 263, { align: 'center' });
  pdf.setTextColor(110, 117, 110); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text('Merci pour votre confiance · bonjour@saveurs-nomades.fr · saveursnomades.fr', 105, 274, { align: 'center' });
  pdf.save(`reservation-${ref}.pdf`);
}

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
    const data = Object.fromEntries(new FormData(form).entries());
    const response = await api('/api/reservations', { method: 'POST', body: JSON.stringify(data) });
    createReservationPdf(data, response.reservation);
    message.textContent = 'Réservation confirmée. Votre facture PDF a été téléchargée.';
    message.className = 'success'; form.reset();
  } catch (error) { message.textContent = error.message; message.className = 'error'; }
  button.disabled = false; button.innerHTML = 'Confirmer la demande <span>↗</span>';
});
