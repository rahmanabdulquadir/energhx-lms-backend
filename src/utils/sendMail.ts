import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: this.configService.get('EMAIL_SENDER'),
        pass: this.configService.get('EMAIL_SENDER_APP_PASS'),
      },
      tls: {
        rejectUnauthorized: false as boolean, // explicitly type as boolean
      },
    });
  }

  async sendMail(
    email: string,
    html: string,
    subject: string,
    text: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"Enrghx ⚙️" <${this.configService.get('EMAIL_SENDER')}>`,
      to: email,
      subject,
      text,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email', error);
      throw error;
    }
  }
}
