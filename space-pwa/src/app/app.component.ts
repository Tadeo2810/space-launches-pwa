import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NetworkService } from './services/network.service';
import { PushService } from './services/push.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <header>
      <h1>🚀 Space Launches</h1>
      <span class="net" [class.off]="!net.online()">{{ net.online() ? '● En línea' : '● Sin conexión (datos en caché)' }}</span>
    </header>

    <section class="push">
      @if (!push.subscribed()) {
        <button (click)="push.subscribe()">🔔 Activar notificaciones</button>
      } @else {
        <button (click)="push.sendTest()">📨 Enviar prueba</button>
        <button class="ghost" (click)="push.unsubscribe()">Desactivar</button>
      }
      @if (push.message()) { <small>{{ push.message() }}</small> }
    </section>

    <main><router-outlet /></main>
    <footer>Datos: The Space Devs · Launch Library 2</footer>
  `,
})
export class AppComponent {
  readonly net = inject(NetworkService);
  readonly push = inject(PushService);
}
