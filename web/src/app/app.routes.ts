import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Public
  { path: '', loadComponent: () => import('./public/home/home.component').then(m => m.HomeComponent) },
  { path: 'events', loadComponent: () => import('./public/events/events.component').then(m => m.EventsComponent) },
  { path: 'events/:slug', loadComponent: () => import('./public/event-detail/event-detail.component').then(m => m.EventDetailComponent) },
  { path: 'events/:slug/photos/:id', loadComponent: () => import('./public/photo-detail/photo-detail.component').then(m => m.PhotoDetailComponent) },
  { path: 'order', loadComponent: () => import('./public/order/order.component').then(m => m.OrderComponent) },
  { path: 'about', loadComponent: () => import('./public/about/about.component').then(m => m.AboutComponent) },

  // Admin
  { path: 'admin/login', loadComponent: () => import('./admin/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: 'events', loadComponent: () => import('./admin/events/event-list/event-list.component').then(m => m.EventListComponent) },
      { path: 'events/new', loadComponent: () => import('./admin/events/event-form/event-form.component').then(m => m.EventFormComponent) },
      { path: 'events/:id', loadComponent: () => import('./admin/events/event-detail-admin/event-detail-admin.component').then(m => m.EventDetailAdminComponent) },
      { path: 'events/:id/tagger', loadComponent: () => import('./admin/photos/speed-tagger/speed-tagger.component').then(m => m.SpeedTaggerComponent) },
      { path: 'orders', loadComponent: () => import('./admin/orders/order-list/order-list.component').then(m => m.OrderListComponent) },
      { path: '', redirectTo: 'events', pathMatch: 'full' },
    ],
  },
];
