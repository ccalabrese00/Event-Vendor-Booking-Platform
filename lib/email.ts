import sgMail from '@sendgrid/mail';
import { logger } from './logger';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static maxRetries = 3;
  private static retryDelay = 1000;

  static async send(email: EmailTemplate, attempt = 1): Promise<boolean> {
    try {
      await sgMail.send({
        to: email.to,
        from: process.env.FROM_EMAIL || 'noreply@eventvendor.com',
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      logger.info(`Email sent successfully to ${email.to}`, {
        subject: email.subject,
        attempt,
      });

      return true;
    } catch (error) {
      logger.error(`Email send failed (attempt ${attempt})`, { error, to: email.to });

      if (attempt < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.send(email, attempt + 1);
      }

      return false;
    }
  }

  // Booking confirmation email
  static async sendBookingConfirmation(
    to: string,
    customerName: string,
    vendorName: string,
    date: string,
    bookingId: string
  ): Promise<boolean> {
    const subject = `Booking Confirmed with ${vendorName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Booking Confirmed! 🎉</h2>
        <p>Hi ${customerName},</p>
        <p>Your booking with <strong>${vendorName}</strong> has been confirmed for <strong>${date}</strong>.</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Booking ID:</strong> ${bookingId}</p>
          <p style="margin: 10px 0 0 0;"><strong>Date:</strong> ${date}</p>
        </div>
        <p>You can view your booking details and communicate with your vendor through your dashboard.</p>
        <a href="${process.env.NEXT_PUBLIC_URL}/my-bookings" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View My Bookings
        </a>
        <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
          Need help? Contact us at support@eventvendor.com
        </p>
      </div>
    `;

    return this.send({ to, subject, html });
  }

  // New booking request notification for vendor
  static async sendNewBookingRequest(
    to: string,
    vendorName: string,
    customerName: string,
    date: string,
    message?: string
  ): Promise<boolean> {
    const subject = `New Booking Request from ${customerName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">New Booking Request! 📅</h2>
        <p>Hi ${vendorName},</p>
        <p>You have a new booking request from <strong>${customerName}</strong> for <strong>${date}</strong>.</p>
        ${message ? `<p style="background: #F3F4F6; padding: 15px; border-radius: 8px; font-style: italic;">"${message}"</p>` : ''}
        <a href="${process.env.NEXT_PUBLIC_URL}/vendor/bookings" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Review Request
        </a>
      </div>
    `;

    return this.send({ to, subject, html });
  }

  // Payment reminder
  static async sendPaymentReminder(
    to: string,
    customerName: string,
    vendorName: string,
    amount: string,
    dueDate: string,
    isDeposit: boolean
  ): Promise<boolean> {
    const subject = `Payment Reminder: ${isDeposit ? 'Deposit' : 'Final Payment'} Due`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F59E0B;">Payment Reminder 💳</h2>
        <p>Hi ${customerName},</p>
        <p>This is a friendly reminder that your ${isDeposit ? 'deposit' : 'final payment'} for <strong>${vendorName}</strong> is due.</p>
        <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Amount Due:</strong> ${amount}</p>
          <p style="margin: 10px 0 0 0;"><strong>Due Date:</strong> ${dueDate}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_URL}/my-bookings" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Make Payment
        </a>
      </div>
    `;

    return this.send({ to, subject, html });
  }

  // Welcome email
  static async sendWelcomeEmail(to: string, name: string, role: string): Promise<boolean> {
    const subject = 'Welcome to Event Vendor Booking Platform! 🎉';
    const isVendor = role === 'VENDOR';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome, ${name}! 🎊</h2>
        <p>Thank you for joining Event Vendor Booking Platform!</p>
        
        ${isVendor ? `
          <p>As a vendor, you can:</p>
          <ul>
            <li>Create your professional profile</li>
            <li>Set your availability calendar</li>
            <li>Receive and manage booking requests</li>
            <li>Get paid through our secure platform</li>
          </ul>
        ` : `
          <p>As a customer, you can:</p>
          <ul>
            <li>Browse top-rated event vendors</li>
            <li>Send booking requests</li>
            <li>Track your bookings in one place</li>
            <li>Leave reviews for vendors</li>
          </ul>
        `}
        
        <a href="${process.env.NEXT_PUBLIC_URL}${isVendor ? '/vendor/dashboard' : '/search'}" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Get Started
        </a>
      </div>
    `;

    return this.send({ to, subject, html });
  }

  // AI recommendation email
  static async sendAIRecommendation(
    to: string,
    name: string,
    recommendation: string,
    vendors: { name: string; category: string; rating: number }[]
  ): Promise<boolean> {
    const subject = 'Personalized Vendor Recommendations Just for You ✨';
    
    const vendorsHtml = vendors.map(v => `
      <div style="border: 1px solid #E5E7EB; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <p style="margin: 0; font-weight: bold;">${v.name}</p>
        <p style="margin: 5px 0; color: #6B7280;">${v.category} ⭐ ${v.rating}</p>
      </div>
    `).join('');
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">AI-Powered Recommendations ✨</h2>
        <p>Hi ${name},</p>
        <p>Based on your preferences, our AI has found these perfect matches:</p>
        <p style="background: #EEF2FF; padding: 15px; border-radius: 8px; font-style: italic; color: #4F46E5;">
          "${recommendation}"
        </p>
        <h3 style="margin-top: 20px;">Recommended Vendors:</h3>
        ${vendorsHtml}
        <a href="${process.env.NEXT_PUBLIC_URL}/search" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View All Vendors
        </a>
      </div>
    `;

    return this.send({ to, subject, html });
  }
}
