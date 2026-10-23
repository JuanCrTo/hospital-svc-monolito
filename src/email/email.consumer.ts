import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as mailgun from 'mailgun-js';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { ForgotPasswordEmailData, WelcomeEmailData } from './interfaces/email.interface';

@Injectable()
export class EmailConsumer implements OnModuleInit {
  private readonly logger = new Logger(EmailConsumer.name);
  private readonly mailgunEnabled: boolean;
  private mg: mailgun.Mailgun | null = null;

  constructor(private readonly rabbitMQService: RabbitMQService) {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;

    this.mailgunEnabled = Boolean(apiKey && domain);

    if (this.mailgunEnabled) {
      this.mg = mailgun({ apiKey, domain });
    } else {
      this.logger.warn(
        'Mailgun no configurado (MAILGUN_API_KEY / MAILGUN_DOMAIN ausentes). El consumidor de correos queda deshabilitado.'
      );
    }
  }

  async onModuleInit() {
    if (!this.mailgunEnabled) {
      this.logger.warn('EmailConsumer deshabilitado: no se consumirán colas de correo.');
      return;
    }

    await this.startConsumingForgotPassword();
    await this.startConsumingWelcome();
  }

  private async startConsumingForgotPassword() {
    console.log('Starting to consume forgot password emails...');
    
    await this.rabbitMQService.consume(RabbitMQService.QUEUES.FORGOT_PASSWORD, async (msg) => {
      if (!msg) return;

      try {
        const emailData: ForgotPasswordEmailData = JSON.parse(msg.content.toString());
        
        console.log('Processing forgot password email:', emailData);
        
        // Validación específica para forgot-password
        if (!emailData.to || !emailData.subject || !emailData.resetLink) {
          throw new Error('Missing required fields for forgot-password email');
        }

        const mailOptions = {
          from: 'HospitalYellow <hospitalyellow@gmail.com>',
          to: emailData.to,
          subject: emailData.subject,
          template: 'forgot-password',
          'h:X-Mailgun-Variables': JSON.stringify({
            resetLink: emailData.resetLink
          })
        };

        await this.mg.messages().send(mailOptions);
        this.rabbitMQService.channel.ack(msg);
        
        console.log(`Forgot password email sent to ${emailData.to}`);      } catch (error) {
        console.error('Error processing forgot password email:', error.message);
        this.rabbitMQService.channel.nack(msg, false, false); // No requeue en caso de error
      }
    });
  }

  private async startConsumingWelcome() {
    console.log('Starting to consume welcome emails...');
    
    await this.rabbitMQService.consume(RabbitMQService.QUEUES.WELCOME, async (msg) => {
      if (!msg) return;

      try {
        const emailData: WelcomeEmailData = JSON.parse(msg.content.toString());
        
        console.log('Processing welcome email:', emailData);
        
        // Validación específica para welcome
        if (!emailData.to || !emailData.subject || !emailData.firstname) {
          throw new Error('Missing required fields for welcome email');
        }

        const mailOptions = {
          from: 'HospitalYellow <hospitalyellow@gmail.com>',
          to: emailData.to,
          subject: emailData.subject,
          template: 'welcome',
          'h:X-Mailgun-Variables': JSON.stringify({
            firstname: emailData.firstname
          })
        };

        await this.mg.messages().send(mailOptions);
        this.rabbitMQService.channel.ack(msg);
        
        console.log(`Welcome email sent to ${emailData.to}`);
      } catch (error) {
        console.error('Error processing welcome email:', error.message);
        this.rabbitMQService.channel.nack(msg, false, false); // No requeue en caso de error
      }
    });
  }
}