import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface EventSummary {
  id: string;
  name: string;
  slug: string;
  date: string;
  location: string;
  isFree: boolean;
  isPublished: boolean;
  priceSingle: number;
  pricePack: number;
  description: string | null;
  coverPhotoId: string | null;
}

export interface PhotoSummary {
  id: string;
  eventId: string;
  previewKey: string;
  thumbnailKey: string;
  width: number;
  height: number;
  bibs?: { bibNumber: string }[];
}

export interface UploadResult {
  created: PhotoSummary[];
  skipped: { filename: string }[];
}

export interface OrderResult {
  id: string;
  orderNumber: number;
  downloadToken: string;
  totalCents: number;
  status: string;
  downloadExpiresAt: string;
}

export interface DownloadResult {
  photos: { id: string; url: string; filename: string }[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // Public - Events
  getEvents(): Observable<EventSummary[]> {
    return this.http.get<EventSummary[]>(`${this.base}/events`);
  }

  getEvent(slug: string): Observable<EventSummary> {
    return this.http.get<EventSummary>(`${this.base}/events/${slug}`);
  }

  // Public - Photos
  getPhotos(slug: string): Observable<PhotoSummary[]> {
    return this.http.get<PhotoSummary[]>(`${this.base}/events/${slug}/photos`);
  }

  getPhotosByBib(slug: string, bib: string): Observable<PhotoSummary[]> {
    return this.http.get<PhotoSummary[]>(`${this.base}/events/${slug}/photos/bib`, {
      params: { number: bib },
    });
  }

  getPhoto(id: string): Observable<PhotoSummary> {
    return this.http.get<PhotoSummary>(`${this.base}/photos/${id}`);
  }

  // Public - Orders
  createOrder(data: {
    eventId: string; email: string; photoIds: string[]; isPack: boolean;
  }): Observable<OrderResult> {
    return this.http.post<OrderResult>(`${this.base}/orders`, data);
  }

  getDownload(orderId: string, token: string): Observable<DownloadResult> {
    return this.http.get<DownloadResult>(`${this.base}/orders/${orderId}/download`, {
      params: { token },
    });
  }

  // Admin - Auth
  login(username: string, password: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.base}/auth/login`, {
      username, password,
    });
  }

  // Admin - Events
  getAdminEvents(): Observable<EventSummary[]> {
    return this.http.get<EventSummary[]>(`${this.base}/admin/events`);
  }

  getAdminEvent(id: string): Observable<EventSummary> {
    return this.http.get<EventSummary>(`${this.base}/admin/events/${id}`);
  }

  createEvent(data: any): Observable<EventSummary> {
    return this.http.post<EventSummary>(`${this.base}/admin/events`, data);
  }

  updateEvent(id: string, data: any): Observable<EventSummary> {
    return this.http.put<EventSummary>(`${this.base}/admin/events/${id}`, data);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/events/${id}`);
  }

  // Admin - Photos
  getAdminPhotos(eventId: string): Observable<PhotoSummary[]> {
    return this.http.get<PhotoSummary[]>(`${this.base}/admin/events/${eventId}/photos`);
  }

  uploadPhotos(eventId: string, files: File[]): Observable<UploadResult> {
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    return this.http.post<UploadResult>(
      `${this.base}/admin/events/${eventId}/photos/upload`, formData,
    );
  }

  updateBibs(photoId: string, bibs: string[]): Observable<PhotoSummary> {
    return this.http.patch<PhotoSummary>(`${this.base}/admin/photos/${photoId}/bibs`, { bibs });
  }

  deletePhoto(photoId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/photos/${photoId}`);
  }

  // Admin - Orders
  getAdminOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/orders`);
  }

  getAdminOrder(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/admin/orders/${id}`);
  }

  resendOrderEmail(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/orders/${id}/resend`, {});
  }
}
