import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/admin/')) {
    const token = typeof localStorage !== 'undefined'
      ? localStorage.getItem('trailshot_token')
      : null;
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }
  }
  return next(req);
};
