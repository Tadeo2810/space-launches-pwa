// Servidor de notificaciones Push con VAPID — Space Launches PWA
const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:tadeo@example.com';
const DB_FILE = path.join(__dirname, 'subscriptions.json');

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error('Faltan VAPID_PUBLIC_KEY y/o VAPID_PRIVATE_KEY (variables de entorno).');
  process.exit(1);
}
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

// ---- Persistencia simple de suscripciones (archivo JSON) ----
let subscriptions = [];
try { subscriptions = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { subscriptions = []; }
const save = () => fs.writeFile(DB_FILE, JSON.stringify(subscriptions, null, 2), () => {});

const app = express();
app.use(cors()); // permite peticiones desde el dominio de la PWA
app.use(express.json());

app.get('/', (_req, res) =>
  res.json({ ok: true, servicio: 'Space Launches Push Server', suscriptores: subscriptions.length })
);

// Clave pública VAPID para que el cliente se suscriba
app.get('/vapidPublicKey', (_req, res) => res.json({ publicKey: VAPID_PUBLIC }));

// Registrar suscripción de un cliente
app.post('/subscribe', (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint || !sub.keys) {
    return res.status(400).json({ ok: false, error: 'Suscripción inválida' });
  }
  if (!subscriptions.some((s) => s.endpoint === sub.endpoint)) {
    subscriptions.push(sub);
    save();
  }
  res.status(201).json({ ok: true, total: subscriptions.length });
});

// Cancelar suscripción
app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body || {};
  subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);
  save();
  res.json({ ok: true, total: subscriptions.length });
});

// Envía una notificación a todos los suscriptores (formato nativo de ngsw de Angular)
async function broadcast({ title, body, url = '/', icon = '/icons/icon-192x192.png' }) {
  const payload = JSON.stringify({
    notification: {
      title,
      body,
      icon,
      badge: '/icons/icon-72x72.png',
      vibrate: [120, 60, 120],
      data: { onActionClick: { default: { operation: 'navigateLastFocusedOrOpen', url } } },
    },
  });
  const results = await Promise.allSettled(
    subscriptions.map((s) => webpush.sendNotification(s, payload))
  );
  // Limpia suscripciones expiradas (410 Gone / 404)
  const expired = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected' && [404, 410].includes(r.reason?.statusCode)) expired.push(subscriptions[i].endpoint);
  });
  if (expired.length) {
    subscriptions = subscriptions.filter((s) => !expired.includes(s.endpoint));
    save();
  }
  return { enviadas: results.filter((r) => r.status === 'fulfilled').length, fallidas: results.length - results.filter((r) => r.status === 'fulfilled').length };
}

// Alerta personalizada (endpoint genérico)
app.post('/notify', async (req, res) => {
  const { title, body, url } = req.body || {};
  if (!title || !body) return res.status(400).json({ ok: false, error: 'title y body son obligatorios' });
  res.json({ ok: true, ...(await broadcast({ title, body, url })) });
});

// Caso de negocio: recordatorio de lanzamiento próximo
app.post('/notify/launch', async (req, res) => {
  const { id, name, net, provider } = req.body || {};
  if (!name) return res.status(400).json({ ok: false, error: 'name es obligatorio' });
  const fecha = net ? new Date(net).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : 'fecha por confirmar';
  const result = await broadcast({
    title: '🚀 Recordatorio de lanzamiento',
    body: `${name}${provider ? ' (' + provider + ')' : ''} — ${fecha}`,
    url: id ? `/launch/${id}` : '/',
  });
  res.json({ ok: true, ...result });
});

app.listen(PORT, () => console.log(`Push server escuchando en puerto ${PORT}`));
