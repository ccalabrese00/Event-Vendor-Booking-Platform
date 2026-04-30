import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EmailData {
  customerName?: string;
  status?: string;
  date?: string;
  message?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const sendEmailWithRetry = async (
  to: string,
  subject: string,
  body: string,
  attempt: number = 1
): Promise<boolean> => {
  try {
    const msg = {
      to,
      from: process.env.FROM_EMAIL || 'noreply@eventvendor.com',
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    };

    await sgMail.send(msg);
    console.log(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`Email attempt ${attempt} failed:`, error);

    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY * attempt);
      return sendEmailWithRetry(to, subject, body, attempt + 1);
    }

    console.error(`Email failed after ${MAX_RETRIES} attempts`);
    return false;
  }
};

export const sendBookingEmail = async (
  to: string,
  type: 'new_booking' | 'status_update' | 'contract_sent' | 'payment_received',
  data: EmailData
): Promise<void> => {
  const templates: Record<string, (data: EmailData) => { subject: string; body: string }> = {
    new_booking: (data) => ({
      subject: `New Booking Request from ${data.customerName}`,
      body: `You have a new booking request:\n\nCustomer: ${data.customerName}\nDate: ${data.date}\nMessage: ${data.message || 'No message'}\n\nPlease log in to your dashboard to respond.`,
    }),
    status_update: (data) => ({
      subject: `Booking Status Update: ${data.status}`,
      body: `Hello ${data.customerName},\n\nYour booking status has been updated to: ${data.status}\nDate: ${data.date}\n\nThank you for using our platform!`,
    }),
    contract_sent: (data) => ({
      subject: 'Contract Ready for Signing',
      body: `Hello ${data.customerName},\n\nYour contract is ready for signing. Please log in to review and sign.\n\nDate: ${data.date}`,
    }),
    payment_received: (data) => ({
      subject: 'Payment Confirmation',
      body: `Hello ${data.customerName},\n\nWe have received your payment. Your booking is now confirmed!\n\nDate: ${data.date}`,
    }),
  };

  const template = templates[type];
  if (!template) {
    console.error(`Unknown email template: ${type}`);
    return;
  }

  const { subject, body } = template(data);
  const success = await sendEmailWithRetry(to, subject, body);

  if (!success) {
    console.error(`Failed to send ${type} email to ${to}`);
  }
};
