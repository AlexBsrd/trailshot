import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, PhotoSummary, EventSummary } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-photo-manager',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="photo-manager">
      <div class="header">
        <div>
          <h1>Photos{{ event() ? ' — ' + event()!.name : '' }}</h1>
          <p class="subtitle">{{ photos().length }} photo(s) · {{ taggedCount() }} tagguée(s)</p>
        </div>
        <div class="header-actions">
          <a [routerLink]="['/admin/events', eventId, 'upload']" class="btn btn-primary">Ajouter des photos</a>
          <a [routerLink]="['/admin/events', eventId, 'tagger']" class="btn btn-secondary">Speed Tagger</a>
        </div>
      </div>

      @if (photos().length === 0) {
        <div class="empty-state">
          <p>Aucune photo pour cet événement.</p>
          <a [routerLink]="['/admin/events', eventId, 'upload']" class="btn btn-primary">Uploader des photos</a>
        </div>
      } @else {
        <div class="toolbar">
          @if (selected().size > 0) {
            <span>{{ selected().size }} sélectionnée(s)</span>
            <button class="btn btn-danger" (click)="deleteSelected()">Supprimer la sélection</button>
            <button class="btn btn-secondary" (click)="clearSelection()">Désélectionner</button>
          } @else {
            <button class="btn btn-secondary" (click)="selectAll()">Tout sélectionner</button>
          }
        </div>

        <div class="photo-grid">
          @for (photo of photos(); track photo.id) {
            <div class="photo-card" [class.selected]="selected().has(photo.id)">
              <div class="photo-img" (click)="toggleSelect(photo.id)">
                <img [src]="getThumbnailUrl(photo)" alt="" loading="lazy" />
                <div class="select-check" [class.visible]="selected().has(photo.id)">✓</div>
              </div>
              <div class="photo-info">
                <div class="bibs">
                  @if (photo.bibs && photo.bibs.length > 0) {
                    @for (bib of photo.bibs; track bib.bibNumber) {
                      <span class="bib-tag">{{ bib.bibNumber }}</span>
                    }
                  } @else {
                    <span class="no-bib">Non tagguée</span>
                  }
                </div>
                <div class="photo-actions">
                  <button class="action-btn" title="Prévisualiser" (click)="openPreview(photo)">🔍</button>
                  <button class="action-btn danger" title="Supprimer" (click)="deleteOne(photo)">🗑</button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (previewPhoto()) {
        <div class="lightbox" (click)="closePreview()">
          <div class="lightbox-content" (click)="$event.stopPropagation()">
            <button class="lightbox-close" (click)="closePreview()">&times;</button>
            <img [src]="getPreviewUrl(previewPhoto()!)" alt="Prévisualisation" />
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'animations' as *;

    .photo-manager { padding: 2rem; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .header h1 {
      margin-bottom: 0.25rem;
      font-family: $font-family;
      font-weight: $font-heading-weight;
      color: $color-forest;
    }
    .subtitle { color: $color-text-muted; font-size: 0.9rem; }
    .header-actions { display: flex; gap: 0.5rem; }
    .header-actions a { color: $color-forest-light; }
    .empty-state { text-align: center; padding: 4rem 2rem; color: $color-text-muted; }
    .empty-state .btn { margin-top: 1rem; }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      background: $color-white;
      border-radius: $radius-md;
      border: 1px solid rgba(27, 58, 45, 0.1);
      color: $color-text;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.75rem;
    }
    .photo-card {
      background: $color-white;
      border-radius: $radius-md;
      overflow: hidden;
      border: 2px solid transparent;
      transition: border-color 0.15s;
    }
    .photo-card.selected { border-color: $color-forest-light; }
    .photo-img { position: relative; cursor: pointer; }
    .photo-img img { width: 100%; display: block; aspect-ratio: 4/3; object-fit: cover; }
    .select-check {
      position: absolute;
      top: 6px;
      left: 6px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: $color-white;
      border: 2px solid $color-sand-light;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: $font-size-xs;
      color: transparent;
      transition: all 0.15s;
    }
    .select-check.visible {
      background: $color-forest-light;
      border-color: $color-forest-light;
      color: $color-white;
    }
    .photo-info { padding: 0.5rem; display: flex; justify-content: space-between; align-items: center; }
    .bibs { display: flex; gap: 4px; flex-wrap: wrap; }
    .bib-tag {
      background: $color-sand-light;
      color: $color-forest;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: $font-size-xs;
      font-weight: 600;
    }
    .no-bib { color: $color-text-muted; font-size: $font-size-xs; font-style: italic; }
    .photo-actions { display: flex; gap: 2px; }
    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: $radius-sm;
      font-size: 0.9rem;
      transition: background 0.15s;
    }
    .action-btn:hover { background: rgba(74, 123, 90, 0.06); }
    .action-btn.danger { color: $color-danger; }
    .action-btn.danger:hover { background: rgba(184, 64, 64, 0.08); }
    .btn-danger { background: $color-danger; color: $color-white; }
    .lightbox {
      position: fixed;
      inset: 0;
      background: rgba(27, 58, 45, 0.85);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      animation: fadeIn 0.15s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .lightbox-content { position: relative; max-width: 90vw; max-height: 90vh; }
    .lightbox-content img { max-width: 100%; max-height: 85vh; border-radius: $radius-md; display: block; }
    .lightbox-close {
      position: absolute;
      top: -12px;
      right: -12px;
      background: $color-white;
      color: $color-forest;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 1.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: $shadow-elevated;
    }
  `],
})
export class PhotoManagerComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  eventId = this.route.snapshot.paramMap.get('id')!;
  event = signal<EventSummary | null>(null);
  photos = signal<PhotoSummary[]>([]);
  selected = signal<Set<string>>(new Set());
  previewPhoto = signal<PhotoSummary | null>(null);

  taggedCount = signal(0);

  ngOnInit() {
    this.loadPhotos();
    this.api.getAdminEvents().subscribe((events) => {
      const ev = events.find((e) => e.id === this.eventId);
      if (ev) this.event.set(ev);
    });
  }

  loadPhotos() {
    this.api.getAdminPhotos(this.eventId).subscribe((photos) => {
      this.photos.set(photos);
      this.taggedCount.set(photos.filter((p) => p.bibs && p.bibs.length > 0).length);
      this.selected.set(new Set());
    });
  }

  toggleSelect(id: string) {
    const s = new Set(this.selected());
    if (s.has(id)) s.delete(id);
    else s.add(id);
    this.selected.set(s);
  }

  selectAll() {
    this.selected.set(new Set(this.photos().map((p) => p.id)));
  }

  clearSelection() {
    this.selected.set(new Set());
  }

  deleteOne(photo: PhotoSummary) {
    if (confirm(`Supprimer cette photo ?`)) {
      this.api.deletePhoto(photo.id).subscribe(() => this.loadPhotos());
    }
  }

  deleteSelected() {
    const count = this.selected().size;
    if (confirm(`Supprimer ${count} photo(s) ?`)) {
      const ids = Array.from(this.selected());
      let done = 0;
      ids.forEach((id) => {
        this.api.deletePhoto(id).subscribe(() => {
          done++;
          if (done === ids.length) this.loadPhotos();
        });
      });
    }
  }

  openPreview(photo: PhotoSummary) {
    this.previewPhoto.set(photo);
  }

  closePreview() {
    this.previewPhoto.set(null);
  }

  getThumbnailUrl(photo: PhotoSummary): string {
    return `${environment.storageUrl}/${photo.thumbnailKey}`;
  }

  getPreviewUrl(photo: PhotoSummary): string {
    return `${environment.storageUrl}/${photo.previewKey}`;
  }
}
