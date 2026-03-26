import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="upload-page">
      <h1>Upload de photos</h1>

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
        <input
          #fileInput
          type="file"
          accept=".jpg,.jpeg"
          multiple
          hidden
          (change)="onFileSelect($event)"
        />
      </div>

      @if (selectedFiles().length > 0 && !uploading()) {
        <div class="file-info">
          <p>{{ selectedFiles().length }} fichier(s) sélectionné(s) ({{ formatSize(totalSize()) }})</p>
          <button class="btn btn-primary" (click)="upload()">Envoyer</button>
        </div>
      }

      @if (uploading()) {
        <div class="progress">
          <p>Upload en cours...</p>
        </div>
      }

      @if (uploadComplete()) {
        <div class="success">
          <p>{{ uploadedCount() }} photo(s) uploadée(s) avec succes !</p>
          <div class="actions">
            <a [routerLink]="['/admin/events', eventId, 'tagger']" class="btn btn-primary">
              Tagger les photos
            </a>
            <button class="btn btn-secondary" (click)="reset()">Uploader d'autres photos</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .upload-page { padding: 2rem; }
    .dropzone {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 3rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
    }
    .dropzone:hover, .dropzone.dragging {
      border-color: #2563eb;
      background: rgba(37, 99, 235, 0.05);
    }
    .hint { color: #9ca3af; font-size: 0.875rem; margin-top: 0.5rem; }
    .file-info {
      margin-top: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .progress { margin-top: 1rem; color: #2563eb; }
    .success { margin-top: 1rem; }
    .success p { color: #22c55e; margin-bottom: 1rem; }
    .actions { display: flex; gap: 0.75rem; }
  `],
})
export class PhotoUploadComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  eventId = this.route.snapshot.paramMap.get('id')!;
  selectedFiles = signal<File[]>([]);
  totalSize = signal(0);
  dragging = signal(false);
  uploading = signal(false);
  uploadComplete = signal(false);
  uploadedCount = signal(0);

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(true);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    const files = Array.from(e.dataTransfer?.files || []).filter(
      (f) => f.type === 'image/jpeg',
    );
    this.setFiles(files);
  }

  onFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.setFiles(files);
  }

  private setFiles(files: File[]) {
    this.selectedFiles.set(files);
    this.totalSize.set(files.reduce((sum, f) => sum + f.size, 0));
    this.uploadComplete.set(false);
  }

  upload() {
    this.uploading.set(true);
    this.api.uploadPhotos(this.eventId, this.selectedFiles()).subscribe({
      next: (photos) => {
        this.uploadedCount.set(photos.length);
        this.uploading.set(false);
        this.uploadComplete.set(true);
      },
      error: () => this.uploading.set(false),
    });
  }

  reset() {
    this.selectedFiles.set([]);
    this.uploadComplete.set(false);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }
}
