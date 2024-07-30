import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MapComponent } from './map/map.component';

export const routes: Routes = [
  { path: '', component: MapComponent },
  { path: 'dashboard', component: DashboardComponent },
];
