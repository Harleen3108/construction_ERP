import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;
let verifiedOnce = false;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) {
    console.log('[Email] SMTP_HOST not configured — emails will be logged to console only');
    return null;
  }

  // Force port 465 + secure: true if user has SMTP_PORT=465 or SMTP_SECURE=true.
  // Port 587 is blocked on many hosting providers (Render free, etc.) — port 465 (SSL) works almost universally.
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Helpful on hosts behind strict firewalls
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    // Allow self-signed in some cloud envs (rare, but useful)
    tls: { rejectUnauthorized: false },
  });

  if (!verifiedOnce) {
    verifiedOnce = true;
    transporter.verify((err) => {
      if (err) {
        console.error(`[Email] ❌ SMTP verify failed: ${err.message}`);
        console.error('[Email]    Common fixes:');
        console.error('[Email]    1) For Gmail: SMTP_PORT=465 and SMTP_SECURE=true (port 587 is often blocked on cloud hosts)');
        console.error('[Email]    2) Use a 16-character Gmail App Password (not your regular password)');
        console.error('[Email]    3) Enable 2FA on the Gmail account first');
      } else {
        console.log(`[Email] ✓ SMTP ready (${process.env.SMTP_HOST}:${port} secure=${secure})`);
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

export const sendEmail = async (opts: EmailOptions): Promise<{ ok: boolean; messageId?: string; error?: string }> => {
  const t = getTransporter();
  const from = process.env.SMTP_FROM || '"Constructor ERP" <noreply@constructor-erp.gov.in>';

  if (!t) {
    console.log('\n========== EMAIL (console mode — no SMTP) ==========');
    console.log(`To:      ${opts.to}`);
    console.log(`Subject: ${opts.subject}`);
    console.log(`Preview:\n${(opts.text || opts.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 800)}`);
    console.log('====================================================\n');
    return { ok: true };
  }

  try {
    const info = await t.sendMail({
      from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text,
    });
    console.log(`[Email] ✓ Sent to ${opts.to}: "${opts.subject}" (messageId: ${info.messageId})`);
    return { ok: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[Email] ❌ Failed to send to ${opts.to}: ${err.message}`);
    if (err.code === 'EAUTH') {
      console.error('[Email]    Auth failed — for Gmail, enable 2FA and use App Password');
    }
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNECTION') {
      console.error('[Email]    Connection failed — port likely blocked. Switch to port 465 with SMTP_SECURE=true');
    }
    return { ok: false, error: err.message };
  }
};
