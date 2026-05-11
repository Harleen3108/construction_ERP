import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;
let verifiedOnce = false;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) {
    console.log('[Email] SMTP_HOST not configured — emails will be logged to console only');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify SMTP credentials once at first use
  if (!verifiedOnce) {
    verifiedOnce = true;
    transporter.verify((err) => {
      if (err) {
        console.error(`[Email] ❌ SMTP verify failed: ${err.message}`);
        console.error('[Email]    Check SMTP_USER and SMTP_PASS in .env');
        console.error('[Email]    For Gmail: use App Password (not your regular password)');
      } else {
        console.log(`[Email] ✓ SMTP ready (${process.env.SMTP_HOST}:${process.env.SMTP_PORT})`);
      }
    });
  }
  return transporter;
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends an email; if SMTP is not configured, logs to console (dev mode).
 */
export const sendEmail = async (opts: EmailOptions): Promise<boolean> => {
  const t = getTransporter();
  const from = process.env.SMTP_FROM || '"Constructor ERP" <noreply@constructor-erp.gov.in>';

  if (!t) {
    console.log('\n========== EMAIL (console mode — no SMTP) ==========');
    console.log(`To:      ${opts.to}`);
    console.log(`Subject: ${opts.subject}`);
    console.log(`Preview:\n${(opts.text || opts.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 800)}`);
    console.log('====================================================\n');
    return true;
  }

  try {
    const info = await t.sendMail({
      from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text,
    });
    console.log(`[Email] ✓ Sent to ${opts.to}: "${opts.subject}" (messageId: ${info.messageId})`);
    return true;
  } catch (err: any) {
    console.error(`[Email] ❌ Failed to send to ${opts.to}: ${err.message}`);
    if (err.code === 'EAUTH') {
      console.error('[Email]    Auth failed — for Gmail, enable 2FA and use App Password');
    }
    return false;
  }
};
