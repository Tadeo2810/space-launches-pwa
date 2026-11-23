export interface LaunchStatus {
  id: number;
  name: string;
  abbrev: string;
}

export interface Launch {
  id: string;
  name: string;
  status: LaunchStatus;
  net: string;
  image?: string | null;
  lsp_name?: string | null;
  mission?: string | { name?: string; description?: string } | null;
  pad?: { name?: string; location?: { name?: string } } | null;
  launch_service_provider?: { name?: string } | null;
  rocket?: { configuration?: { full_name?: string } } | null;
}

export interface LaunchListResponse {
  count: number;
  results: Launch[];
}

export type LoadState = 'idle' | 'loading' | 'success' | 'error';
