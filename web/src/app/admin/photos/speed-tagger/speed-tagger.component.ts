import { Component, inject, signal, computed, effect, HostListener, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, PhotoSummary, EventSummary } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-speed-tagger',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="tagger">
      @if (event()) {
        <div class="tagger-header">
          <a class="back" [routerLink]="['/admin/events', route.snapshot.paramMap.get('id')]" [queryParams]="{tab: 'photos'}">&larr; Retour</a>
          <h2>{{ event()!.name }}</h2>
          <span class="progress-text">
            Photo {{ currentIndex() + 1 }}/{{ photos().length }}
            — {{ taggedPercent() }}% tagguées
          </span>
          <span class="hints">Echap = retour · Enter = valider · ← → = naviguer · Vide = repeter</span>
        </div>
      }

      @if (allTaggedMessage()) {
        <div class="all-tagged">
          <p>Toutes les photos sont tagguées !</p>
          <p class="hint">Redirection...</p>
        </div>
      }

      @if (currentPhoto() && !allTaggedMessage()) {
        <div class="main-photo">
          <img [src]="getPreviewUrl(currentPhoto()!)" alt="Photo courante" />
        </div>

        <div class="bib-input-row">
          <input
            #bibInput
            type="text"
            [(ngModel)]="bibValue"
            name="bib"
            [placeholder]="lastBibs().length ? 'Derniers: ' + lastBibs().join(', ') : 'Dossard(s), séparés par des virgules'"
            class="input bib-input"
            (keydown.enter)="validateAndAdvance()"
          />
          <button class="btn btn-primary" (click)="validateAndAdvance()">Valider</button>
        </div>

        <div class="thumbnail-strip" #stripContainer>
          @for (photo of photos(); track photo.id; let i = $index) {
            <div
              class="strip-thumb"
              [class.current]="i === currentIndex()"
              [class.tagged]="isTagged(photo)"
              (click)="goTo(i)"
            >
              <img [src]="getThumbnailUrl(photo)" alt="" loading="lazy" />
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'animations' as *;

    .tagger { padding: 1rem; display: flex; flex-direction: column; height: calc(100vh - 80px); background: $color-cream; }
    .tagger-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(27, 58, 45, 0.1);
      flex-wrap: wrap;
    }
    .back { color: $color-text-muted; text-decoration: none; font-size: $font-size-small; transition: color 0.15s; }
    .back:hover { color: $color-forest-light; }
    .tagger-header h2 { margin: 0; color: $color-forest; font-family: $font-family; font-weight: $font-heading-weight; }
    .progress-text { color: $color-success; }
    .hints { color: $color-text-muted; font-size: 0.8rem; margin-left: auto; }
    .main-photo {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      min-height: 0;
      padding: 0.5rem 0;
    }
    .main-photo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: $radius-sm;
    }
    .bib-input-row {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 0;
    }
    .bib-input {
      flex: 1;
      font-size: 1.1rem;
      &:focus {
        outline: none;
        border-color: $color-forest-light;
        box-shadow: 0 0 0 2px rgba(74, 123, 90, 0.15);
      }
    }
    .bib-input-row .btn-primary {
      background: $color-forest;
      color: $color-cream;
      border: none;
    }
    .thumbnail-strip {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      padding: 0.5rem 0;
      flex-shrink: 0;
    }
    .strip-thumb {
      width: 60px;
      height: 45px;
      border-radius: $radius-sm;
      overflow: hidden;
      cursor: pointer;
      border: 2px solid transparent;
      flex-shrink: 0;
      opacity: 0.5;
      transition: opacity 0.2s, border-color 0.2s;
    }
    .strip-thumb.current { border-color: $color-sand-light; opacity: 1; }
    .strip-thumb.tagged { border-color: $color-success; opacity: 0.8; }
    .strip-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .all-tagged {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      p { font-size: 1.5rem; color: $color-success; font-weight: 600; }
      .hint { font-size: 1rem; color: $color-text-muted; font-weight: 400; }
    }
  `],
})
export class SpeedTaggerComponent implements OnInit {
  private api = inject(ApiService);
  route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('bibInput') bibInputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('stripContainer') stripContainer!: ElementRef<HTMLDivElement>;

  event = signal<EventSummary | null>(null);
  photos = signal<PhotoSummary[]>([]);
  currentIndex = signal(0);
  lastBibs = signal<string[]>([]);
  taggedIds = signal<Set<string>>(new Set());
  allTaggedMessage = signal(false);
  bibValue = '';

  currentPhoto = computed(() => this.photos()[this.currentIndex()] || null);
  taggedPercent = computed(() => {
    const total = this.photos().length;
    if (!total) return 0;
    return Math.round((this.taggedIds().size / total) * 100);
  });

  private prefillEffect = effect(() => {
    const photo = this.currentPhoto();
    if (photo?.bibs?.length) {
      this.bibValue = photo.bibs.map((b) => b.bibNumber).join(', ');
      setTimeout(() => this.bibInputEl?.nativeElement?.select(), 0);
    } else {
      this.bibValue = '';
    }
  });

  ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('id')!;
    this.api.getAdminEvents().subscribe((events) => {
      const event = events.find((e) => e.id === eventId);
      if (event) this.event.set(event);
    });
    this.api.getAdminPhotos(eventId).subscribe((photos) => {
      this.photos.set(photos);
      const tagged = new Set<string>();
      photos.forEach((p) => {
        if (p.bibs && p.bibs.length > 0) tagged.add(p.id);
      });
      this.taggedIds.set(tagged);
    });
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.router.navigate(['/admin/events', this.route.snapshot.paramMap.get('id')], { queryParams: { tab: 'photos' } });
      return;
    }
    if (e.target instanceof HTMLInputElement && e.key !== 'Enter' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); this.previous(); }
  }

  validateAndAdvance() {
    const input = this.bibValue.trim();
    const bibs = input
      ? input.split(',').map((b) => b.trim()).filter(Boolean)
      : this.lastBibs();

    if (bibs.length > 0 && this.currentPhoto()) {
      const photo = this.currentPhoto()!;
      this.api.updateBibs(photo.id, bibs).subscribe((updated) => {
        this.lastBibs.set(bibs);
        this.markCurrentAsTagged();
        // Update photo bibs in the local array so prefill works on revisit
        const photos = this.photos().map((p) => (p.id === updated.id ? updated : p));
        this.photos.set(photos);

        if (this.taggedIds().size === this.photos().length) {
          this.allTaggedMessage.set(true);
          setTimeout(() => {
            this.router.navigate(['/admin/events', this.route.snapshot.paramMap.get('id')], {
              queryParams: { tab: 'photos' },
            });
          }, 1500);
        } else {
          this.next();
        }
      });
    }
  }

  next() {
    if (this.currentIndex() < this.photos().length - 1) {
      this.currentIndex.set(this.currentIndex() + 1);
      this.focusInput();
      this.scrollStrip();
    }
  }

  previous() {
    if (this.currentIndex() > 0) {
      this.currentIndex.set(this.currentIndex() - 1);
      this.focusInput();
      this.scrollStrip();
    }
  }

  goTo(index: number) {
    this.currentIndex.set(index);
    this.focusInput();
  }

  isTagged(photo: PhotoSummary): boolean {
    return this.taggedIds().has(photo.id);
  }

  getPreviewUrl(photo: PhotoSummary): string {
    return `${environment.storageUrl}/${photo.previewKey}`;
  }

  getThumbnailUrl(photo: PhotoSummary): string {
    return `${environment.storageUrl}/${photo.thumbnailKey}`;
  }

  private markCurrentAsTagged() {
    const photo = this.currentPhoto();
    if (photo) {
      const updated = new Set(this.taggedIds());
      updated.add(photo.id);
      this.taggedIds.set(updated);
    }
  }

  private focusInput() {
    setTimeout(() => this.bibInputEl?.nativeElement?.focus(), 0);
  }

  private scrollStrip() {
    setTimeout(() => {
      const container = this.stripContainer?.nativeElement;
      if (container) {
        const thumbWidth = 64;
        const scrollPos = this.currentIndex() * thumbWidth - container.clientWidth / 2 + thumbWidth / 2;
        container.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }
    }, 0);
  }
}
