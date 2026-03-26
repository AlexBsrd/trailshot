import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('mail.host');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('mail.port', 587),
        secure: this.config.get<boolean>('mail.secure', false),
        auth: {
          user: this.config.get<string>('mail.user'),
          pass: this.config.get<string>('mail.pass'),
        },
      });
      this.logger.log(`Mail transport configured (${host})`);
    } else {
      this.logger.warn('No MAIL_HOST configured — emails will be logged to console');
    }
  }

  async sendDownloadLink(to: string, orderNumber: string, downloadUrl: string, eventName: string): Promise<void> {
    const subject = `Trailshot — Vos photos sont prêtes (${orderNumber})`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; color: #2d3e36;">
        <h2 style="color: #1b3a2d;">Vos photos sont prêtes !</h2>
        <p>Commande <strong>${orderNumber}</strong> — ${eventName}</p>
        <p>Cliquez sur le bouton ci-dessous pour télécharger vos photos :</p>
        <a href="${downloadUrl}" style="display: inline-block; background: #1b3a2d; color: #faf8f4; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Télécharger mes photos
        </a>
        <p style="margin-top: 24px; font-size: 13px; color: #8c8272;">
          Ce lien est valide pendant 30 jours. Conservez cet email pour y accéder ultérieurement.
        </p>
        <hr style="border: none; border-top: 1px solid #e8e4dc; margin: 24px 0;" />
        <p style="font-size: 12px; color: #8c8272;">Trailshot — Photos de course</p>
      </div>
    `;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.config.get<string>('mail.from', 'noreply@trailshot.fr'),
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to} for order ${orderNumber}`);
    } else {
      this.logger.log(`[DEV] Email to ${to}:\n  Subject: ${subject}\n  Download: ${downloadUrl}`);
    }
  }
}
