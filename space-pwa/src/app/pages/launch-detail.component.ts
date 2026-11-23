import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Launch, LoadState } from '../models/launch.model';
import { LaunchService } from '../services/launch.service';
import { PushService } from '../services/push.service';

@Component({
  selector: 'app-launch-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <a routerLink="/" class="back">← Volver</a>

    @if (state() === 'loading') {
      <div class="state"><div class="spinner"></div><p>Cargando detalle…</p></div>
    }
    @if (state() === 'error') {
      <div class="state error"><p>⚠️ {{ error() }}</p></div>
    }
    @if (launch(); as l) {
      <article class="detail">
        @if (l.image) { <img [src]="l.image" [alt]="l.name" /> }
        <span class="badge">{{ l.status.name }}</span>
        <h2>{{ l.name }}</h2>
        <p>📅 {{ l.net | date: 'full' }}</p>
        <p>🚀 {{ l.rocket?.configuration?.full_name ?? 'Cohete por confirmar' }}</p>
        <p>📍 {{ l.pad?.name ?? 'Plataforma por confirmar' }}{{ l.pad?.location?.name ? ' — ' + l.pad?.location?.name : '' }}</p>
        <p class="muted">{{ missionText(l) }}</p>
        <button (click)="push.remindLaunch(l)">🔔 Recordarme este lanzamiento</button>
      </article>
    }
  `,
})
export class LaunchDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(LaunchService);
  readonly push = inject(PushService);

  readonly launch = signal<Launch | null>(null);
  readonly state = signal<LoadState>('idle');
  readonly error = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.state.set('loading');
    this.svc.getById(id).subscribe({
      next: (l) => { this.launch.set(l); this.state.set('success'); },
      error: (e: HttpErrorResponse) => {
        this.error.set(this.svc.toMessage(e) + ' (este detalle no estaba en caché)');
        this.state.set('error');
      },
    });
  }

  missionText(l: Launch): string {
    if (!l.mission) return 'Sin descripción de la misión.';
    return typeof l.mission === 'string' ? l.mission : (l.mission.description ?? l.mission.name ?? '');
  }
}
