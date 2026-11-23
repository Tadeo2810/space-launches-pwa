# 🚀 Space Launches PWA — Actividad SHD "Mi PWA en Angular"

Tema: monitoreo de próximos lanzamientos espaciales.
API pública: Launch Library 2 (https://ll.thespacedevs.com/2.2.0), sin API key.

## Estructura
- `space-pwa/`    → App Angular 19 (standalone, rutas, @angular/pwa, SwPush)
- `push-server/`  → Servidor Node/Express con web-push (VAPID)

## 1) Servidor push (desplegar PRIMERO) — Render.com
1. Sube la carpeta `push-server` a un repo de GitHub (o todo el proyecto).
2. En Render: New → Web Service → conecta el repo → Root Directory: `push-server`
   - Build: `npm install`  |  Start: `npm start`
3. En Environment agrega las variables de `push-server/.env.example`
   (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT).
4. Verifica: abre `https://TU-SERVICIO.onrender.com/` → debe responder JSON con `ok: true`.
   (Render gratis duerme tras 15 min: la primera petición tarda ~30 s. Ábrelo antes de la demo.)

### Endpoints
| Método | Ruta | Uso |
|---|---|---|
| GET  | `/vapidPublicKey` | Clave pública VAPID |
| POST | `/subscribe` | Registra la suscripción del cliente |
| POST | `/unsubscribe` | Elimina suscripción |
| POST | `/notify` | Alerta personalizada `{title, body, url}` |
| POST | `/notify/launch` | Recordatorio de lanzamiento `{id, name, net, provider}` |

## 2) Conectar la app al servidor
Edita `space-pwa/src/app/config.ts` y cambia `PUSH_SERVER_URL` por tu URL de Render (con https, sin `/` final).

## 3) Compilar y desplegar la app — Vercel
```bash
cd space-pwa
npm install
npm run build          # genera dist/space-pwa/browser
npx vercel --prod      # o conecta el repo en vercel.com (ya incluye vercel.json)
```
Netlify: publish dir `dist/space-pwa/browser`, y regla `/* /index.html 200`.

## 4) Probar localmente (antes de entregar)
```bash
npm run build
npx http-server -p 8080 -c-1 dist/space-pwa/browser
```
- Offline: DevTools → Application → Service Workers → marca **Offline** → recarga: la lista carga desde caché.
- Caché: Application → Cache Storage → `ngsw:/:db:data...`
- Push: pulsa "Activar notificaciones" → "Enviar prueba" / "🔔 Recordarme".
- Importante: el SW solo se activa en la build de producción, no con `ng serve`.
- Para ver datos offline, primero navega en línea al menos una vez (para llenar el caché).

## Entrega
Enlace de la app en Vercel + enlace del servidor push en Render, por b-learning.

> Nota: la API gratuita permite ~15 peticiones/hora por IP. El Service Worker (estrategia freshness) reduce llamadas y sirve la última respuesta si falla.
