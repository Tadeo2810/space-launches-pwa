import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { API_URL } from '../config';
import { Launch, LaunchListResponse, LoadState } from '../models/launch.model';

@Injectable({ providedIn: 'root' })
export class LaunchService {
  private readonly http = inject(HttpClient);

  readonly launches = signal<Launch[]>([]);
  readonly state = signal<LoadState>('idle');
  readonly error = signal<string | null>(null);
  readonly isLoading = computed(() => this.state() === 'loading');

  loadUpcoming(): void {
    this.state.set('loading');
    this.error.set(null);
    this.http
      .get<LaunchListResponse>(`${API_URL}/launch/upcoming/?limit=12&mode=list`)
      .subscribe({
        next: (res) => {
          this.launches.set(res.results);
          this.state.set('success');
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(this.toMessage(err));
          this.state.set('error');
        },
      });
  }

  getById(id: string) {
    return this.http.get<Launch>(`${API_URL}/launch/${id}/`);
  }

  toMessage(err: HttpErrorResponse): string {
    if (err.status === 0) return 'Sin conexión con el servidor. Revisa tu internet.';
    if (err.status === 429) return 'Límite de peticiones de la API alcanzado. Intenta en unos minutos.';
    if (err.status === 404) return 'Recurso no encontrado.';
    return `Error ${err.status}: no se pudieron cargar los datos.`;
  }
}
