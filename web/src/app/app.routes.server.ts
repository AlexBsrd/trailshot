import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static pages
  { path: 'about', renderMode: RenderMode.Prerender },
  // All other routes — client-side rendering
  { path: '**', renderMode: RenderMode.Client },
];
