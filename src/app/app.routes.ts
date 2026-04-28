import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login',     loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),                       canActivate: [guestGuard] },
  { path: 'register',  loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),               canActivate: [guestGuard] },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),           canActivate: [authGuard] },
  { path: 'passwords', loadComponent: () => import('./pages/password-manager/password-manager.component').then(m => m.PasswordManagerComponent), canActivate: [authGuard] },
  { path: 'settings',  loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),               canActivate: [authGuard] },
  { path: 'feedback',  loadComponent: () => import('./pages/feedback/feedback.component').then(m => m.FeedbackComponent),               canActivate: [authGuard] },
  { path: 'faq',        loadComponent: () => import('./pages/faq/faq.component').then(m => m.FaqComponent),                                   canActivate: [authGuard] },
  { path: 'audit-logs', loadComponent: () => import('./pages/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),           canActivate: [authGuard] },
  { path: '**',        redirectTo: 'dashboard' }
];
