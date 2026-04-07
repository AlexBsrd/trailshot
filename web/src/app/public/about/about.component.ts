import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <section class="about-hero">
      <div class="about-hero-overlay">
        <h1>À propos</h1>
        <p class="about-subtitle">La passion du trail, l'art de l'image</p>
      </div>
    </section>
    <div class="about-content">
      <div class="about-section">
        <div class="about-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </div>
        <p>
          Photographe passionné de trail et de montagne, je capture vos plus beaux moments de course.
        </p>
      </div>
      <div class="about-section">
        <div class="about-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <p>
          TrailShot vous permet de retrouver facilement vos photos grâce à votre numéro de dossard
          et de les télécharger en haute qualité.
        </p>
      </div>
      <div class="about-contact">
        <h2>Contact</h2>
        <p>Pour toute question, n'hésitez pas à me contacter.</p>
      </div>
    </div>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'animations' as *;

    .about-hero {
      height: 30vh;
      min-height: 200px;
      background: url('/images/hero-default.jpg') center / cover no-repeat;
      position: relative;
    }
    .about-hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(27, 58, 45, 0.3), rgba(27, 58, 45, 0.7));
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-top: 64px;
    }
    .about-hero-overlay h1 {
      font-family: $font-display;
      font-weight: $font-heading-weight;
      color: $color-cream;
      font-size: $font-size-hero;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .about-subtitle {
      font-weight: 400;
      opacity: 0.8;
      font-size: $font-size-body;
      color: $color-cream;
    }
    .about-content {
      max-width: 700px;
      margin: 0 auto;
      padding: 3rem 2rem;
    }
    .about-section {
      display: flex;
      gap: 1.5rem;
      align-items: start;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgba(27, 58, 45, 0.08);
    }
    .about-icon {
      flex-shrink: 0;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(196, 90, 48, 0.08);
      color: $color-accent;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .about-contact h2 {
      font-family: $font-display;
      color: $color-forest;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.5rem;
    }
    .about-content p {
      line-height: 1.8;
      color: $color-text;
    }
  `],
})
export class AboutComponent {}
