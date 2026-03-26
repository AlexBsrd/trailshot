import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, EventSummary, PhotoSummary } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-event-detail-admin',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      @if (event()) {
        <!-- Header -->
        <div class="page-header">
          <div>
            <a routerLink="/admin/events" class="back">&larr; Courses</a>
            <h1>{{ event()!.name }}</h1>
            <p class="meta">{{ event()!.date }} · {{ event()!.location }} · {{ photos().length }} photo(s)</p>
          </div>
          <div class="header-actions">
            <button
              class="btn"
              [class.btn-publish]="!event()!.isPublished"
              [class.btn-unpublish]="event()!.isPublished"
              (click)="togglePublish()"
            >
              {{ event()!.isPublished ? 'Dépublier' : 'Publier' }}
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button [class.active]="tab() === 'details'" (click)="tab.set('details')">Détails</button>
          <button [class.active]="tab() === 'photos'" (click)="tab.set('photos')">Photos ({{ photos().length }})</button>
          <button [class.active]="tab() === 'upload'" (click)="tab.set('upload')">Ajouter</button>
        </div>

        <!-- Tab: Details -->
        @if (tab() === 'details') {
          <div class="tab-content">
            <form (ngSubmit)="saveDetails()" class="detail-form">
              <div class="form-grid">
                <div class="form-group">
                  <label>Nom</label>
                  <input type="text" [(ngModel)]="form.name" name="name" class="input" required />
                </div>
                <div class="form-group">
                  <label>Date</label>
                  <input type="date" [(ngModel)]="form.date" name="date" class="input" required />
                </div>
                <div class="form-group">
                  <label>Lieu</label>
                  <input type="text" [(ngModel)]="form.location" name="location" class="input" required />
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="form.isFree" name="isFree" />
                    Événement gratuit
                  </label>
                </div>
              </div>

              @if (!form.isFree) {
                <div class="form-grid">
                  <div class="form-group">
                    <label>Prix unitaire (€)</label>
                    <input type="number" [(ngModel)]="priceEuros" name="priceSingle" class="input" step="0.01" min="0" />
                  </div>
                  <div class="form-group">
                    <label>Prix pack (€)</label>
                    <input type="number" [(ngModel)]="packEuros" name="pricePack" class="input" step="0.01" min="0" />
                  </div>
                </div>
              }

              <div class="form-group full">
                <label>Description</label>
                <textarea [(ngModel)]="form.description" name="description" class="input" rows="3"></textarea>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary" [disabled]="saving()">
                  {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
                @if (saved()) {
                  <span class="saved-msg">✓ Enregistré</span>
                }
              </div>
            </form>
          </div>
        }

        <!-- Tab: Photos -->
        @if (tab() === 'photos') {
          <div class="tab-content">
            @if (photos().length === 0) {
              <div class="empty">
                <p>Aucune photo.</p>
                <button class="btn btn-primary" (click)="tab.set('upload')">Ajouter des photos</button>
              </div>
            } @else {
              <div class="photos-toolbar">
                @if (selected().size > 0) {
                  <span>{{ selected().size }} sélectionnée(s)</span>
                  <button class="btn btn-danger btn-sm" (click)="deleteSelected()">Supprimer</button>
                  <button class="btn btn-secondary btn-sm" (click)="clearSelection()">Désélectionner</button>
                } @else {
                  <button class="btn btn-secondary btn-sm" (click)="selectAllPhotos()">Tout sélectionner</button>
                  <a [routerLink]="['/admin/events', eventId, 'tagger']" class="btn btn-secondary btn-sm">Speed Tagger</a>
                }
              </div>

              <div class="photo-grid">
                @for (photo of photos(); track photo.id) {
                  <div class="photo-card" [class.selected]="selected().has(photo.id)">
                    <div class="photo-img" (click)="toggleSelectPhoto(photo.id)">
                      <img [src]="getThumbnailUrl(photo)" alt="" loading="lazy" />
                      <div class="check" [class.visible]="selected().has(photo.id)">✓</div>
                      @if (event()!.coverPhotoId === photo.id) {
                        <div class="cover-badge">Couverture</div>
                      }
                      <div class="photo-overlay" (click)="$event.stopPropagation()">
                        <button class="overlay-btn" (click)="setCoverPhoto(photo.id)" [class.active]="event()!.coverPhotoId === photo.id" title="Définir comme couverture">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                        </button>
                        <button class="overlay-btn" (click)="previewPhoto.set(photo)" title="Voir en grand">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        </button>
                        <button class="overlay-btn overlay-btn--danger" (click)="deleteOne(photo)" title="Supprimer">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                    <div class="photo-meta">
                      <div class="bibs">
                        @if (photo.bibs && photo.bibs.length > 0) {
                          @for (bib of photo.bibs; track bib.bibNumber) {
                            <span class="bib-tag">{{ bib.bibNumber }}</span>
                          }
                        } @else {
                          <span class="no-bib">—</span>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Tab: Upload -->
        @if (tab() === 'upload') {
          <div class="tab-content">
            <div
              class="dropzone"
              [class.dragging]="dragging()"
              (dragover)="onDragOver($event)"
              (dragleave)="dragging.set(false)"
              (drop)="onDrop($event)"
              (click)="fileInput.click()"
            >
              <p>Glissez vos photos ici ou cliquez pour sélectionner</p>
              <p class="hint">Fichiers JPG uniquement</p>
              <input #fileInput type="file" accept=".jpg,.jpeg" multiple hidden (change)="onFileSelect($event)" />
            </div>

            @if (filesToUpload().length > 0 && !uploading()) {
              <div class="upload-info">
                <span>{{ filesToUpload().length }} fichier(s) — {{ formatSize(uploadSize()) }}</span>
                <button class="btn btn-primary" (click)="upload()">Envoyer</button>
              </div>
            }
            @if (uploading()) {
              <p class="uploading">Upload en cours...</p>
            }
            @if (uploadDone()) {
              <div class="upload-success">
                <p>✓ {{ uploadedCount() }} photo(s) ajoutée(s)</p>
                <div class="upload-actions">
                  <button class="btn btn-primary" (click)="tab.set('photos')">Voir les photos</button>
                  <a [routerLink]="['/admin/events', eventId, 'tagger']" class="btn btn-secondary">Speed Tagger</a>
                </div>
              </div>
            }
          </div>
        }

        <!-- Preview lightbox -->
        @if (previewPhoto()) {
          <div class="lightbox" (click)="previewPhoto.set(null)">
            <div class="lightbox-body" (click)="$event.stopPropagation()">
              <button class="lightbox-close" (click)="previewPhoto.set(null)">&times;</button>
              <img [src]="getPreviewUrl(previewPhoto()!)" alt="" />
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'animations' as *;

    .page { padding: 2rem; max-width: 1100px; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }
    .back {
      color: $color-text-muted;
      text-decoration: none;
      font-size: $font-size-small;
      transition: color 0.15s;
    }
    .back:hover { color: $color-forest-light; }
    .page-header h1 {
      margin: 0.25rem 0 0.15rem;
      font-family: $font-family;
      font-weight: $font-heading-weight;
      color: $color-forest;
    }
    .meta { color: $color-text-muted; font-size: $font-size-body; }

    .header-actions .btn-publish {
      background: $color-success;
      color: $color-white;
    }
    .header-actions .btn-unpublish {
      background: $color-warning;
      color: $color-white;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 0;
      border-bottom: 2px solid #d1d5db;
      margin-bottom: 1.5rem;
    }
    .tabs button {
      background: none;
      border: none;
      padding: 0.6rem 1.25rem;
      font-size: $font-size-body;
      color: $color-text-muted;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: color 0.15s, border-color 0.15s;
    }
    .tabs button:hover { color: $color-text; }
    .tabs button.active {
      color: $color-forest;
      border-bottom-color: $color-forest-light;
      font-weight: 600;
    }

    .tab-content { animation: fadeIn 0.15s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Details form */
    .detail-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .form-group.full { grid-column: 1 / -1; }
    .form-group label { color: $color-text; font-size: $font-size-small; }
    .checkbox-label { flex-direction: row !important; align-items: center; gap: 0.5rem; cursor: pointer; }
    .form-actions { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; }
    .saved-msg { color: $color-success; font-size: $font-size-body; }

    :host .btn-primary {
      background: $color-forest;
      color: $color-cream;
    }

    /* Photos tab */
    .photos-toolbar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding: 0.5rem 0.75rem;
      background: $color-white;
      border-radius: $radius-sm;
      border: 1px solid $color-sand-light;
    }
    .photos-toolbar a {
      color: $color-forest-light;
      transition: color 0.15s;
    }
    .photos-toolbar a:hover { color: $color-forest; }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: $font-size-small; }
    .btn-danger { background: $color-danger; color: $color-white; }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.5rem;
    }
    .photo-card {
      background: $color-white;
      border-radius: $radius-sm;
      overflow: hidden;
      border: 2px solid transparent;
      transition: border-color 0.15s;
    }
    .photo-card.selected { border-color: $color-forest-light; }
    .photo-img { position: relative; cursor: pointer; }
    .photo-img img { width: 100%; display: block; aspect-ratio: 4/3; object-fit: cover; }
    .check {
      position: absolute;
      top: 4px; left: 4px;
      width: 22px; height: 22px;
      border-radius: 50%;
      background: $color-white;
      border: 2px solid #d1d5db;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      color: transparent;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .check.visible {
      background: $color-forest-light;
      border-color: $color-forest-light;
      color: $color-white;
    }
    .photo-meta { padding: 0.35rem 0.5rem; }
    .bibs { display: flex; gap: 3px; flex-wrap: wrap; }
    .bib-tag {
      background: rgba(74, 123, 90, 0.1);
      color: $color-forest-light;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 0.7rem;
      font-weight: 600;
    }
    .no-bib { color: $color-sand-light; font-size: $font-size-xs; }
    .cover-badge {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(166, 139, 91, 0.85);
      color: $color-white;
      text-align: center;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 2px 0;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    /* Action overlay on hover */
    .photo-overlay {
      position: absolute;
      top: 4px;
      right: 4px;
      display: flex;
      gap: 3px;
      opacity: 0;
      transition: opacity 0.15s;
    }
    .photo-card:hover .photo-overlay { opacity: 1; }
    .overlay-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: $radius-sm;
      border: none;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.9);
      color: $color-forest;
      backdrop-filter: blur(4px);
      transition: background 0.15s, color 0.15s;
    }
    .overlay-btn:hover { background: $color-white; }
    .overlay-btn.active { background: $color-forest-light; color: $color-white; }
    .overlay-btn--danger:hover { background: $color-danger; color: $color-white; }

    /* Upload tab */
    .dropzone {
      border: 2px dashed $color-sand;
      border-radius: $radius-lg;
      padding: 3rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
    }
    .dropzone:hover, .dropzone.dragging {
      border-color: $color-forest-light;
      background: rgba(74, 123, 90, 0.04);
    }
    .hint { color: $color-text-muted; font-size: $font-size-small; margin-top: 0.25rem; }
    .upload-info { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
    .uploading { color: $color-forest-light; margin-top: 1rem; }
    .upload-success { margin-top: 1rem; }
    .upload-success p { color: $color-success; margin-bottom: 0.75rem; }
    .upload-actions { display: flex; gap: 0.5rem; }

    .empty { text-align: center; padding: 3rem; color: $color-text-muted; }
    .empty .btn { margin-top: 0.75rem; }

    /* Lightbox */
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
    .lightbox-body { position: relative; max-width: 90vw; max-height: 90vh; }
    .lightbox-body img { max-width: 100%; max-height: 85vh; border-radius: $radius-sm; display: block; }
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
      box-shadow: $shadow-card;
      transition: box-shadow 0.15s;
    }
    .lightbox-close:hover { box-shadow: $shadow-elevated; }
  `],
})
export class EventDetailAdminComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  eventId = '';
  event = signal<EventSummary | null>(null);
  photos = signal<PhotoSummary[]>([]);
  tab = signal<'details' | 'photos' | 'upload'>('details');
  saving = signal(false);
  saved = signal(false);
  selected = signal<Set<string>>(new Set());
  previewPhoto = signal<PhotoSummary | null>(null);

  // Details form
  form = { name: '', date: '', location: '', description: '', isFree: false };
  priceEuros = 3;
  packEuros = 15;

  // Upload
  dragging = signal(false);
  filesToUpload = signal<File[]>([]);
  uploadSize = signal(0);
  uploading = signal(false);
  uploadDone = signal(false);
  uploadedCount = signal(0);

  ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id')!;
    this.loadEvent();
    this.loadPhotos();
  }

  loadEvent() {
    this.api.getAdminEvent(this.eventId).subscribe((ev) => {
      this.event.set(ev);
      this.form.name = ev.name;
      this.form.date = ev.date;
      this.form.location = ev.location;
      this.form.description = ev.description || '';
      this.form.isFree = ev.isFree;
      this.priceEuros = ev.priceSingle / 100;
      this.packEuros = ev.pricePack / 100;
    });
  }

  loadPhotos() {
    this.api.getAdminPhotos(this.eventId).subscribe((p) => {
      this.photos.set(p);
      this.selected.set(new Set());
    });
  }

  // Details
  saveDetails() {
    this.saving.set(true);
    this.saved.set(false);
    const data = {
      ...this.form,
      priceSingle: Math.round(this.priceEuros * 100),
      pricePack: Math.round(this.packEuros * 100),
    };
    this.api.updateEvent(this.eventId, data).subscribe({
      next: (ev) => {
        this.event.set(ev);
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2000);
      },
      error: () => this.saving.set(false),
    });
  }

  togglePublish() {
    const ev = this.event()!;
    this.api.updateEvent(this.eventId, { isPublished: !ev.isPublished }).subscribe((updated) => {
      this.event.set(updated);
    });
  }

  setCoverPhoto(photoId: string) {
    this.api.updateEvent(this.eventId, { coverPhotoId: photoId }).subscribe((updated) => {
      this.event.set(updated);
    });
  }

  // Photos
  toggleSelectPhoto(id: string) {
    const s = new Set(this.selected());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selected.set(s);
  }

  selectAllPhotos() {
    this.selected.set(new Set(this.photos().map((p) => p.id)));
  }

  clearSelection() {
    this.selected.set(new Set());
  }

  deleteOne(photo: PhotoSummary) {
    if (confirm('Supprimer cette photo ?')) {
      this.api.deletePhoto(photo.id).subscribe(() => this.loadPhotos());
    }
  }

  deleteSelected() {
    const ids = Array.from(this.selected());
    if (confirm(`Supprimer ${ids.length} photo(s) ?`)) {
      let done = 0;
      ids.forEach((id) => {
        this.api.deletePhoto(id).subscribe(() => { if (++done === ids.length) this.loadPhotos(); });
      });
    }
  }

  // Upload
  onDragOver(e: DragEvent) { e.preventDefault(); this.dragging.set(true); }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    this.setFiles(Array.from(e.dataTransfer?.files || []).filter((f) => f.type === 'image/jpeg'));
  }
  onFileSelect(e: Event) {
    this.setFiles(Array.from((e.target as HTMLInputElement).files || []));
  }
  private setFiles(files: File[]) {
    this.filesToUpload.set(files);
    this.uploadSize.set(files.reduce((s, f) => s + f.size, 0));
    this.uploadDone.set(false);
  }
  upload() {
    this.uploading.set(true);
    this.api.uploadPhotos(this.eventId, this.filesToUpload()).subscribe({
      next: (photos) => {
        this.uploadedCount.set(photos.length);
        this.uploading.set(false);
        this.uploadDone.set(true);
        this.filesToUpload.set([]);
        this.loadPhotos();
      },
      error: () => this.uploading.set(false),
    });
  }

  // Urls
  getThumbnailUrl(p: PhotoSummary) { return `${environment.storageUrl}/${p.thumbnailKey}`; }
  getPreviewUrl(p: PhotoSummary) { return `${environment.storageUrl}/${p.previewKey}`; }
  formatSize(bytes: number) {
    return bytes < 1024 * 1024 ? (bytes / 1024).toFixed(0) + ' Ko' : (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }
}
