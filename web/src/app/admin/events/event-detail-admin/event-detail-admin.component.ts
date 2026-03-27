import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, EventSummary, PhotoSummary, UploadResult } from '../../../core/services/api.service';
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
            @if (photos().length === 0 && filesToUpload().length === 0 && !uploading() && !uploadDone()) {
              <!-- Empty state: large drop zone -->
              <div
                class="dropzone dropzone-large"
                [class.dragging]="dragging()"
                (dragover)="onDragOver($event)"
                (dragleave)="dragging.set(false)"
                (drop)="onDrop($event)"
                (click)="fileInputEmpty.click()"
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p>Glissez vos photos ici ou cliquez pour parcourir</p>
                <p class="hint">Fichiers JPG uniquement</p>
                <input #fileInputEmpty type="file" accept=".jpg,.jpeg" multiple hidden (change)="onFileSelect($event)" />
              </div>
            } @else {
              <!-- Upload zone (when active, replaces toolbar) -->
              @if (showUploadZone()) {
                <div class="upload-zone">
                  @if (!uploading() && !uploadDone()) {
                    <div
                      class="dropzone dropzone-inline"
                      [class.dragging]="dragging()"
                      (dragover)="onDragOver($event)"
                      (dragleave)="dragging.set(false)"
                      (drop)="onDrop($event)"
                      (click)="fileInput.click()"
                    >
                      <p>Glissez vos photos ici ou cliquez pour parcourir</p>
                      <p class="hint">Fichiers JPG uniquement</p>
                      <input #fileInput type="file" accept=".jpg,.jpeg" multiple hidden (change)="onFileSelect($event)" />
                    </div>
                    @if (filesToUpload().length > 0) {
                      <div class="upload-info">
                        <span>{{ filesToUpload().length }} fichier(s) — {{ formatSize(uploadSize()) }}</span>
                        <div class="upload-info-actions">
                          <button class="btn btn-secondary btn-sm" (click)="resetUpload()">Annuler</button>
                          <button class="btn btn-primary btn-sm" (click)="upload()">Envoyer</button>
                        </div>
                      </div>
                    } @else {
                      <div class="upload-info">
                        <span></span>
                        <button class="btn btn-secondary btn-sm" (click)="resetUpload()">Annuler</button>
                      </div>
                    }
                  }

                  @if (uploading()) {
                    <div class="upload-progress">
                      <div class="progress-bar">
                        <div class="progress-fill" [style.width.%]="uploadProgress()"></div>
                      </div>
                      <span class="progress-label">{{ uploadCurrent() }}/{{ uploadTotal() }} photos importées</span>
                    </div>
                  }

                  @if (uploadDone()) {
                    <div class="upload-summary">
                      <p class="summary-line summary-created">{{ uploadResult()!.created.length }} photo(s) importée(s)</p>
                      @if (uploadResult()!.skipped.length > 0) {
                        <p class="summary-line summary-skipped">{{ uploadResult()!.skipped.length }} ignorée(s) (doublons)</p>
                      }
                      @if (uploadErrors().length > 0) {
                        <p class="summary-line summary-error">{{ uploadErrors().length }} en erreur</p>
                        <button class="btn btn-secondary btn-sm" (click)="retryErrors()">Réessayer</button>
                      }
                    </div>
                  }
                </div>
              } @else {
                <!-- Toolbar -->
                <div class="photos-toolbar">
                  @if (selected().size > 0) {
                    <span>{{ selected().size }} sélectionnée(s)</span>
                    <button class="btn btn-danger btn-sm" (click)="deleteSelected()">Supprimer</button>
                    <button class="btn btn-secondary btn-sm" (click)="clearSelection()">Désélectionner</button>
                  } @else {
                    <button class="btn btn-secondary btn-sm" (click)="toggleUploadZone()">Ajouter des photos</button>
                    <button class="btn btn-secondary btn-sm" (click)="selectAllPhotos()">Tout sélectionner</button>
                    <a [routerLink]="['/admin/events', eventId, 'tagger']" class="btn btn-secondary btn-sm">Speed Tagger</a>
                    <input
                      type="text"
                      class="input input-filter"
                      placeholder="Filtrer par dossard..."
                      [ngModel]="bibFilter()"
                      (ngModelChange)="bibFilter.set($event)"
                    />
                  }
                </div>
              }

              <!-- Photo grid -->
              @if (filteredPhotos().length > 0) {
                @if (bibFilter()) {
                  <p class="filter-info">{{ filteredPhotos().length }} photo(s) pour le dossard "{{ bibFilter() }}"
                    <button class="btn-link" (click)="bibFilter.set('')">Effacer le filtre</button>
                  </p>
                }
                <div class="photo-grid">
                  @for (photo of filteredPhotos(); track photo.id) {
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
                      <div class="photo-meta" (click)="openEditBibs(photo); $event.stopPropagation()">
                        <div class="bibs">
                          @if (photo.bibs && photo.bibs.length > 0) {
                            @for (bib of photo.bibs; track bib.bibNumber) {
                              <span class="bib-tag">{{ bib.bibNumber }}</span>
                            }
                          } @else {
                            <span class="no-bib">+ dossard</span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else if (bibFilter()) {
                <p class="filter-info">Aucune photo pour le dossard "{{ bibFilter() }}"
                  <button class="btn-link" (click)="bibFilter.set('')">Effacer le filtre</button>
                </p>
              }
            }
          </div>
        }

        <!-- Lightbox (preview or bib edit) -->
        @if (previewPhoto() || editingPhoto()) {
          <div class="lightbox" (click)="closeLightbox()">
            <div class="lightbox-body" (click)="$event.stopPropagation()">
              <button class="lightbox-close" (click)="closeLightbox()">&times;</button>
              @if (editingPhoto()) {
                <img [src]="getPreviewUrl(editingPhoto()!)" alt="" />
                <div class="lightbox-edit">
                  <input
                    class="input lightbox-bib-input"
                    [(ngModel)]="editBibValue"
                    (keydown.enter)="saveEditBibs()"
                    (keydown.escape)="closeLightbox()"
                    placeholder="Dossards séparés par des virgules"
                    #lightboxBibInput
                  />
                  <button class="btn btn-primary btn-sm" (click)="saveEditBibs()">Valider</button>
                </div>
              } @else {
                <img [src]="getPreviewUrl(previewPhoto()!)" alt="" />
              }
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
    :host .btn.btn-sm { padding: 0.35rem 0.75rem; font-size: $font-size-small; }
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

    /* Upload */
    .dropzone {
      border: 2px dashed $color-sand;
      border-radius: $radius-lg;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
    }
    .dropzone:hover, .dropzone.dragging {
      border-color: $color-forest-light;
      background: rgba(74, 123, 90, 0.04);
    }
    .dropzone-large {
      padding: 4rem 3rem;
      svg { color: $color-sand; margin-bottom: 1rem; }
      p { margin: 0.25rem 0; }
    }
    .dropzone-inline { padding: 1.5rem; }
    .hint { color: $color-text-muted; font-size: $font-size-small; margin-top: 0.25rem; }
    .upload-zone {
      margin-bottom: 1rem;
      padding: 1rem;
      background: $color-white;
      border-radius: $radius-sm;
      border: 1px solid $color-sand-light;
    }
    .upload-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.75rem;
      font-size: $font-size-small;
      color: $color-text-muted;
    }
    .upload-info-actions { display: flex; gap: 0.5rem; }
    .upload-progress {
      padding: 0.75rem 0;
    }
    .progress-bar {
      height: 8px;
      background: rgba(74, 123, 90, 0.15);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: $color-forest-light;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    .upload-progress .progress-label {
      display: block;
      margin-top: 0.5rem;
      font-size: $font-size-small;
      color: $color-forest-light;
    }
    .upload-summary {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      padding: 0.5rem 0;
    }
    .summary-line { margin: 0; font-size: $font-size-small; font-weight: 600; }
    .summary-created { color: $color-success; }
    .summary-skipped { color: $color-warning; }
    .summary-error { color: $color-danger; }

    .input-filter {
      margin-left: auto;
      width: 160px;
      padding: 0.3rem 0.6rem;
      font-size: $font-size-small;
    }
    .filter-info {
      font-size: $font-size-small;
      color: $color-text-muted;
      margin-bottom: 0.75rem;
    }
    .btn-link {
      background: none;
      border: none;
      color: $color-forest-light;
      cursor: pointer;
      font-size: $font-size-small;
      text-decoration: underline;
      padding: 0;
    }
    .photo-meta { cursor: pointer; }
    .no-bib { color: $color-sand; font-size: $font-size-xs; }

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
    .lightbox-edit {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    .lightbox-bib-input {
      flex: 1;
      font-size: 1rem;
      padding: 0.5rem 0.75rem;
    }
  `],
})
export class EventDetailAdminComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  eventId = '';
  event = signal<EventSummary | null>(null);
  photos = signal<PhotoSummary[]>([]);
  tab = signal<'details' | 'photos'>('details');
  saving = signal(false);
  saved = signal(false);
  selected = signal<Set<string>>(new Set());
  previewPhoto = signal<PhotoSummary | null>(null);

  // Filter & bib edit
  bibFilter = signal('');
  editingPhoto = signal<PhotoSummary | null>(null);
  editBibValue = '';
  filteredPhotos = computed(() => {
    const filter = this.bibFilter().trim();
    const photos = this.photos();
    if (!filter) return photos;
    return photos.filter((p) => p.bibs?.some((b) => b.bibNumber.includes(filter)));
  });

  // Details form
  form = { name: '', date: '', location: '', description: '', isFree: false };
  priceEuros = 3;
  packEuros = 15;

  // Upload
  showUploadZone = signal(false);
  dragging = signal(false);
  filesToUpload = signal<File[]>([]);
  uploadSize = signal(0);
  uploading = signal(false);
  uploadDone = signal(false);
  uploadCurrent = signal(0);
  uploadTotal = signal(0);
  uploadProgress = computed(() => {
    const total = this.uploadTotal();
    return total ? Math.round((this.uploadCurrent() / total) * 100) : 0;
  });
  uploadResult = signal<UploadResult | null>(null);
  uploadErrors = signal<File[]>([]);

  ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id')!;
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'photos') this.tab.set('photos');
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

  // Bib edit lightbox
  openEditBibs(photo: PhotoSummary) {
    this.editingPhoto.set(photo);
    this.editBibValue = photo.bibs?.map((b) => b.bibNumber).join(', ') || '';
  }

  saveEditBibs() {
    const photo = this.editingPhoto();
    if (!photo) return;
    const bibs = this.editBibValue.split(',').map((b) => b.trim()).filter(Boolean);
    this.editingPhoto.set(null);
    this.api.updateBibs(photo.id, bibs).subscribe((updated) => {
      this.photos.set(this.photos().map((p) => (p.id === updated.id ? updated : p)));
    });
  }

  closeLightbox() {
    this.previewPhoto.set(null);
    this.editingPhoto.set(null);
  }

  // Upload
  toggleUploadZone() {
    this.showUploadZone.set(!this.showUploadZone());
    if (!this.showUploadZone()) this.resetUpload();
  }

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
    this.uploadResult.set(null);
    this.uploadErrors.set([]);
    this.showUploadZone.set(true);
  }

  upload() {
    const files = this.filesToUpload();
    this.uploading.set(true);
    this.uploadTotal.set(files.length);
    this.uploadCurrent.set(0);
    this.uploadDone.set(false);

    const BATCH_SIZE = 5;
    const allCreated: PhotoSummary[] = [];
    const allSkipped: { filename: string }[] = [];
    const errorFiles: File[] = [];

    const uploadBatch = (startIdx: number) => {
      if (startIdx >= files.length) {
        this.uploading.set(false);
        this.uploadDone.set(true);
        this.uploadResult.set({ created: allCreated, skipped: allSkipped });
        this.uploadErrors.set(errorFiles);
        this.filesToUpload.set([]);
        this.loadPhotos();
        if (errorFiles.length === 0) {
          setTimeout(() => this.resetUpload(), 2000);
        }
        return;
      }

      const batch = files.slice(startIdx, startIdx + BATCH_SIZE);
      this.api.uploadPhotos(this.eventId, batch).subscribe({
        next: (result) => {
          allCreated.push(...result.created);
          allSkipped.push(...result.skipped);
          this.uploadCurrent.set(startIdx + batch.length);
          uploadBatch(startIdx + BATCH_SIZE);
        },
        error: () => {
          errorFiles.push(...batch);
          this.uploadCurrent.set(startIdx + batch.length);
          uploadBatch(startIdx + BATCH_SIZE);
        },
      });
    };

    uploadBatch(0);
  }

  retryErrors() {
    const errors = this.uploadErrors();
    if (errors.length === 0) return;
    this.filesToUpload.set(errors);
    this.uploadSize.set(errors.reduce((s, f) => s + f.size, 0));
    this.uploadDone.set(false);
    this.uploadResult.set(null);
    this.uploadErrors.set([]);
    this.upload();
  }

  resetUpload() {
    this.filesToUpload.set([]);
    this.uploadDone.set(false);
    this.uploadResult.set(null);
    this.uploadErrors.set([]);
    this.uploading.set(false);
    this.showUploadZone.set(false);
  }

  // Urls
  getThumbnailUrl(p: PhotoSummary) { return `${environment.storageUrl}/${p.thumbnailKey}`; }
  getPreviewUrl(p: PhotoSummary) { return `${environment.storageUrl}/${p.previewKey}`; }
  formatSize(bytes: number) {
    return bytes < 1024 * 1024 ? (bytes / 1024).toFixed(0) + ' Ko' : (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }
}
