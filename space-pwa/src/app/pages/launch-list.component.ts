import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Launch } from '../models/launch.model';
import { LaunchService } from '../services/launch.service';
import { PushService } from '../services/push.service';

@Component({
  selector: 'app-launch-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <h2>Próximos lanzamientos</h2>

    @if (svc.isLoading()) {
      <div class="state"><div class="spinner"></div><p>Cargando lanzamientos…</p></div>
    }

    @if (svc.state() === 'error') {
      <div class="state error">
        <p>⚠️ {{ svc.error() }}</p>
        <button (click)="svc.loadUpcoming()">Reintentar</button>
      </div>
    }

    <div class="grid">
      @for (l of svc.launches(); track l.id) {
        <article class="card">
          @if (l.image) { <img [src]="l.image" [alt]="l.name" loading="lazy" /> }
          <div class="body">
            <span class="badge">{{ l.status.abbrev }}</span>
            <h3>{{ l.name }}</h3>
            <p class="muted">{{ providerOf(l) }}</p>
            <p>📅 {{ l.net | date: 'medium' }}</p>
            <div class="actions">
              <a [routerLink]="['/launch', l.id]">Ver detalle</a>
              <button (click)="push.remindLaunch(l)">🔔 Recordarme</button>
            </div>
          </div>
        </article>
      }
    </div>
  `,
})
export class LaunchListComponent implements OnInit {
  readonly svc = inject(LaunchService);
  readonly push = inject(PushService);

  ngOnInit(): void {
    this.svc.loadUpcoming();
  }

  providerOf(l: Launch): string {
    return l.lsp_name ?? l.launch_service_provider?.name ?? 'Proveedor desconocido';
  }
}
