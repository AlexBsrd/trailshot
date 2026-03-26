import { Component, inject, signal, computed, HostListener, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, PhotoSummary, EventSummary } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-speed-tagger',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="tagger">
      @if (event()) {
        <div class="tagger-header">
          <h2>{{ event()!.name }}</h2>
          <span class="progress-text">
            Photo {{ currentIndex() + 1 }}/{{ photos().length }}
            — {{ taggedPercent() }}% taggees
          </span>
          <span class="hints">Enter = valider · ← → = naviguer · Vide = repeter</span>
        </div>
      }

      @if (currentPhoto()) {
        <div class="main-photo">
          <img [src]="getPreviewUrl(currentPhoto()!)" alt="Photo courante" />
        </div>

        <div class="bib-input-row">
          <input
            #bibInput
            type="text"
            [(ngModel)]="bibValue"
            name="bib"
            [placeholder]="lastBibs().length ? 'Derniers: ' + lastBibs().join(', ') : 'Dossard(s), separes par des virgules'"
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
    .tagger { padding: 1rem; display: flex; flex-direction: column; height: calc(100vh - 80px); }
    .tagger-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #222;
      flex-wrap: wrap;
    }
    .tagger-header h2 { margin: 0; }
    .progress-text { color: #4a9eff; }
    .hints { color: #666; font-size: 0.8rem; margin-left: auto; }
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
      border-radius: 4px;
    }
    .bib-input-row {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 0;
    }
    .bib-input { flex: 1; font-size: 1.1rem; }
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
      border-radius: 4px;
      overflow: hidden;
      cursor: pointer;
      border: 2px solid transparent;
      flex-shrink: 0;
      opacity: 0.5;
      transition: opacity 0.2s, border-color 0.2s;
    }
    .strip-thumb.current { border-color: #4a9eff; opacity: 1; }
    .strip-thumb.tagged { border-color: #22c55e; opacity: 0.8; }
    .strip-thumb img { width: 100%; height: 100%; object-fit: cover; }
  `],
})
export class SpeedTaggerComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  @ViewChild('bibInput') bibInputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('stripContainer') stripContainer!: ElementRef<HTMLDivElement>;

  event = signal<EventSummary | null>(null);
  photos = signal<PhotoSummary[]>([]);
  currentIndex = signal(0);
  lastBibs = signal<string[]>([]);
  taggedIds = signal<Set<string>>(new Set());
  bibValue = '';

  currentPhoto = computed(() => this.photos()[this.currentIndex()] || null);
  taggedPercent = computed(() => {
    const total = this.photos().length;
    if (!total) return 0;
    return Math.round((this.taggedIds().size / total) * 100);
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
      this.api.updateBibs(this.currentPhoto()!.id, bibs).subscribe(() => {
        this.lastBibs.set(bibs);
        this.markCurrentAsTagged();
        this.bibValue = '';
        this.next();
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
    return `${environment.apiUrl.replace('/api', '')}:9000/trailshot/${photo.previewKey}`;
  }

  getThumbnailUrl(photo: PhotoSummary): string {
    return `${environment.apiUrl.replace('/api', '')}:9000/trailshot/${photo.thumbnailKey}`;
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
