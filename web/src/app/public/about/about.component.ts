import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <div class="about-page">
      <h1>À propos</h1>
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
    .about-page { padding: 2rem; max-width: 700px; margin: 0 auto; }
    .about-page h1 { margin-bottom: 1rem; }
    .about-page h2 { margin-top: 2rem; margin-bottom: 0.5rem; }
    .about-page p { color: #4b5563; line-height: 1.7; margin-bottom: 0.75rem; }
  `],
})
export class AboutComponent {}
