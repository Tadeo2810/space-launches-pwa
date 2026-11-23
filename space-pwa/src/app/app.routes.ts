import { Routes } from '@angular/router';
import { LaunchDetailComponent } from './pages/launch-detail.component';
import { LaunchListComponent } from './pages/launch-list.component';

export const routes: Routes = [
  { path: '', component: LaunchListComponent },
  { path: 'launch/:id', component: LaunchDetailComponent },
  { path: '**', redirectTo: '' },
];
