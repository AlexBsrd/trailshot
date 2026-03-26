import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <section class="about-hero">
      <div class="about-hero-overlay">
        <h1>À propos</h1>
      </div>
    </section>
    <div class="about-content">
      <p>
        Photographe passionné de trail et de montagne, je capture vos plus beaux moments de course.
      </p>
      <p>
        TrailShot vous permet de retrouver facilement vos photos grâce à votre numéro de dossard
        et de les télécharger en haute qualité.
      </p>
      <h2>Contact</h2>
      <p>Pour toute question, n'hésitez pas à me contacter.</p>
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
      align-items: center;
      justify-content: center;
      padding-top: 64px;
    }
    .about-hero-overlay h1 {
      font-family: $font-family;
      font-weight: $font-heading-weight;
      color: $color-cream;
      font-size: $font-size-hero;
    }
    .about-content {
      max-width: 700px;
      margin: 0 auto;
      padding: 2rem;
      background: $color-cream;
    }
    .about-content h2 {
      margin-top: 2rem;
      margin-bottom: 0.5rem;
      color: $color-forest;
      font-weight: $font-subheading-weight;
    }
    .about-content p {
      color: $color-text;
      line-height: 1.7;
      margin-bottom: 0.75rem;
    }
  `],
})
export class AboutComponent {}
