import logger from '../logger';
import { config } from '../config';

export interface MagicLinkEmailData {
  to: string;
  magicLink: string;
}

export interface ApprovalEmailData {
  to: string;
  approvalLink: string;
  displayName: string;
  colboNumber: string;
}

export class EmailService {
  async sendMagicLink(data: MagicLinkEmailData): Promise<void> {
    // For now, just log the magic link
    // In production, this would send via SMTP/Postmark
    logger.info(
      {
        to: data.to,
        magicLink: data.magicLink,
      },
      'Magic link email (would be sent in production)'
    );

    // Simulate email sending delay
    await new Promise((resolve) => global.setTimeout(resolve, 100));

    if (config.isDevelopment) {
      console.log('\n🔗 MAGIC LINK EMAIL');
      console.log(`To: ${data.to}`);
      console.log(`Link: ${data.magicLink}`);
      console.log('──────────────────────────────────\n');
    }
  }

  async sendApprovalNotification(data: ApprovalEmailData): Promise<void> {
    // For now, just log the approval notification
    logger.info(
      {
        to: data.to,
        displayName: data.displayName,
        colboNumber: data.colboNumber,
      },
      'Approval notification email (would be sent in production)'
    );

    if (config.isDevelopment) {
      console.log('\n📧 APPROVAL NOTIFICATION');
      console.log(`To: ${data.to}`);
      console.log(`User: ${data.displayName} (${data.colboNumber})`);
      console.log(`Approval Link: ${data.approvalLink}`);
      console.log('──────────────────────────────────\n');
    }
  }

  async sendApprovalConfirmation(
    to: string,
    displayName: string
  ): Promise<void> {
    logger.info(
      {
        to,
        displayName,
      },
      'Approval confirmation email (would be sent in production)'
    );

    if (config.isDevelopment) {
      console.log('\n✅ APPROVAL CONFIRMATION');
      console.log(`To: ${to}`);
      console.log(`Welcome ${displayName}! Your account has been approved.`);
      console.log('──────────────────────────────────\n');
    }
  }
}

export const emailService = new EmailService();
