# Admin UX Improvements Design

## Summary

Three improvements to the admin photo management experience:
1. Speed tagger shows existing bibs and redirects when all photos are tagged
2. Merge "Photos" and "Ajouter" tabs into a single "Photos" tab with integrated upload
3. Upload progress tracking with deduplication by filename

## Speed Tagger

### Show existing bibs
- When navigating to an already-tagged photo, pre-fill the input with existing bibs (comma-separated)
- Auto-select the text so typing overwrites it
- Empty field if no bibs (current behavior)

### Redirect when complete
- After each validation, check if `taggedIds.size === photos.length`
- If all tagged: show "Toutes les photos sont tagguées !" + auto-redirect to `/admin/events/:id` (photos tab) after 1.5s

## Merged Photos Tab

### Remove "Ajouter" tab
- Only two tabs remain: `Détails` and `Photos (N)`

### Empty state (no photos)
- Large centered drag-and-drop zone
- Icon + text "Glissez vos photos ici ou cliquez pour parcourir"
- JPG format indication

### State with photos
- Toolbar: "Ajouter des photos" button (+ icon) next to "Tout sélectionner" and "Speed Tagger"
- Click opens inline drag-and-drop zone above the grid (collapsible)
- Existing photo grid below

### Upload progress
- Global progress bar in the import zone
- Counter: "3/12 photos importées"
- Per-file states: pending → uploading → done / error
- Files in error marked red with short message
- End summary: "X importées, Y ignorées (doublons), Z en erreur"
- "Réessayer les erreurs" button if any

### Deduplication
- By original filename (not hash)
- Backend checks if `originalFilename` already exists for the event before processing
- Skipped files returned in response, displayed as "ignored" (not errors)

## Backend Changes

### Photo entity
- Add `originalFilename: string` (nullable for existing photos)

### Upload endpoint
- New response format: `{ created: Photo[], skipped: { filename: string }[] }`
- Before processing each file: query `WHERE eventId = :eventId AND originalFilename = :filename`
- If found → skip (no image processing, no S3 upload)
