import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      this.logger.warn('SendGrid API key not configured. Email functionality will be disabled.');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, firstName: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    const msg = {
      to: email,
      from: {
        email: this.configService.get<string>('SENDGRID_FROM_EMAIL', 'noreply@yourdomain.com'),
        name: this.configService.get<string>('SENDGRID_FROM_NAME', 'Blog API'),
      },
      subject: 'Password Reset Request - Blog',
      html: this.getPasswordResetTemplate(firstName, resetUrl, resetToken),
      text: `
        Hi ${firstName},
        
        You requested a password reset for your Blog account.
        
        Click the link below to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        Blog Team
      `,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const msg = {
      to: email,
      from: {
        email: this.configService.get<string>('SENDGRID_FROM_EMAIL', 'noreply@yourdomain.com'),
        name: this.configService.get<string>('SENDGRID_FROM_NAME', 'Blog API'),
      },
      subject: 'Welcome to Blog!',
      html: this.getWelcomeTemplate(firstName),
      text: `
        Hi ${firstName},
        
        Welcome to Blog! Your account has been created successfully.
        
        You can now log in and start using our platform.
        
        Best regards,
        Blog Team
      `,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      // Don't throw error for welcome email to avoid blocking registration
    }
  }

  private getPasswordResetTemplate(firstName: string, resetUrl: string, token: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Blog</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f8fafc; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .token { background: #e5e7eb; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Blog</h1>
            <p>Password Reset Request</p>
          </div>
          
          <div class="content">
            <h2>Hi ${firstName},</h2>
            
            <p>You requested a password reset for your Blog account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link in your browser:</p>
            <div class="token">${resetUrl}</div>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <p>For security reasons, this reset token can only be used once.</p>
          </div>
          
          <div class="footer">
            <p>Best regards,<br>Blog Team</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeTemplate(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Blog!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f0fdf4; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Blog!</h1>
          </div>
          
          <div class="content">
            <h2>Hi ${firstName},</h2>
            
            <p>Welcome to Blog! Your account has been created successfully.</p>
            
            <p>You can now:</p>
            <ul>
              <li>Create and publish blog posts</li>
              <li>Manage categories</li>
              <li>Collaborate with team members</li>
              <li>Use our powerful API</li>
            </ul>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Happy blogging!</p>
          </div>
          
          <div class="footer">
            <p>Best regards,<br>Blog Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
} 