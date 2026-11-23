import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { PUSH_SERVER_URL, VAPID_PUBLIC_KEY } from '../config';
import { Launch } from '../models/launch.model';

@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly swPush = inject(SwPush);
  private readonly http = inject(HttpClient);

  readonly enabled = this.swPush.isEnabled;
  readonly subscribed = signal(false);
  readonly message = signal<string>('');
  readonly permission = signal<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  constructor() {
    this.swPush.subscription.subscribe((s) => this.subscribed.set(!!s));
  }

  async subscribe(): Promise<void> {
    if (!this.swPush.isEnabled) {
      this.message.set('Las notificaciones requieren la versión de producción (Service Worker activo).');
      return;
    }
    try {
      // requestSubscription solicita el permiso de notificaciones al usuario
      const sub = await this.swPush.requestSubscription({ serverPublicKey: VAPID_PUBLIC_KEY });
      this.permission.set(Notification.permission);
      this.http.post(`${PUSH_SERVER_URL}/subscribe`, sub.toJSON()).subscribe({
        next: () => this.message.set('✅ Notificaciones activadas'),
        error: () => this.message.set('❌ No se pudo registrar en el servidor push'),
      });
    } catch {
      this.permission.set(Notification.permission);
      this.message.set('Permiso denegado o suscripción fallida.');
    }
  }

  async unsubscribe(): Promise<void> {
    const sub = await firstValueFrom(this.swPush.subscription);
    if (!sub) return;
    this.http.post(`${PUSH_SERVER_URL}/unsubscribe`, { endpoint: sub.endpoint }).subscribe();
    await this.swPush.unsubscribe();
    this.message.set('Notificaciones desactivadas');
  }

  sendTest(): void {
    this.http
      .post(`${PUSH_SERVER_URL}/notify`, {
        title: '🛰️ Space Launches',
        body: 'Notificación de prueba desde tu servidor push.',
        url: '/',
      })
      .subscribe({
        next: () => this.message.set('Notificación de prueba enviada'),
        error: () => this.message.set('❌ No se pudo contactar al servidor push'),
      });
  }

  remindLaunch(l: Launch): void {
    this.http
      .post(`${PUSH_SERVER_URL}/notify/launch`, {
        id: l.id,
        name: l.name,
        net: l.net,
        provider: l.lsp_name ?? l.launch_service_provider?.name ?? '',
      })
      .subscribe({
        next: () => this.message.set(`Recordatorio enviado: ${l.name}`),
        error: () => this.message.set('❌ No se pudo enviar el recordatorio'),
      });
  }
}
