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

  async sendMail(email: string, html: string): Promise<void> {
    const mailOptions = {
      from: `"Programming Hero 🏥" <${this.configService.get('EMAIL_SENDER')}>`, // sender address
      to: email, // list of receivers
      subject: 'Reset Password Link 🔗', // Subject line
      text: 'Click on the link to reset your password. Link expires in 10 minutes.', // plain text body
      html, // html body
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
