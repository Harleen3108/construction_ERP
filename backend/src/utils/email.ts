import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;
let verifiedOnce = false;

/**
 * Email provider auto-detection (priority order):
 *   1. RESEND_API_KEY  → Resend (HTTPS API, works on any cloud host)
 *   2. BREVO_API_KEY   → Brevo / Sendinblue (HTTPS API, 300/day free)
 *   3. SMTP_HOST       → Generic SMTP (Gmail/Mailtrap/Brevo SMTP/etc.)
 *   4. Neither         → console log only (dev mode)
 */
type Provider = 'resend' | 'brevo' | 'smtp' | 'console';

const getProvider = (): Provider => {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.SMTP_HOST) return 'smtp';
  return 'console';
};

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    tls: { rejectUnauthorized: false },
  });

  if (!verifiedOnce) {
    verifiedOnce = true;
    transporter.verify((err) => {
      if (err) {
        console.error(`[Email] ❌ SMTP verify failed: ${err.message}`);
        console.error('[Email]    Render free tier often blocks SMTP. Use Resend or Brevo HTTPS API instead.');
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

export interface EmailResult {
  ok: boolean;
  provider?: string;
  messageId?: string;
  error?: string;
}

/** Send via Resend HTTPS API */
const sendViaResend = async (opts: EmailOptions): Promise<EmailResult> => {
  const from = process.env.RESEND_FROM || process.env.SMTP_FROM || 'Constructor ERP <onboarding@resend.dev>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    const data: any = await res.json();
    if (!res.ok) {
      console.error(`[Email/Resend] ❌ Failed to send to ${opts.to}: ${data.message || res.statusText}`);
      return { ok: false, provider: 'resend', error: data.message || `HTTP ${res.status}` };
    }
    console.log(`[Email/Resend] ✓ Sent to ${opts.to}: "${opts.subject}" (id: ${data.id})`);
    return { ok: true, provider: 'resend', messageId: data.id };
  } catch (err: any) {
    console.error(`[Email/Resend] ❌ Network error: ${err.message}`);
    return { ok: false, provider: 'resend', error: err.message };
  }
};

/** Parse "Name <email@x.com>" or plain "email@x.com" into Brevo's sender object format */
const parseSender = (raw: string): { name?: string; email: string } => {
  const m = raw.match(/^\s*"?([^<"]+?)"?\s*<\s*([^>]+)\s*>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { email: raw.trim() };
};

/** Send via Brevo (Sendinblue) HTTPS API */
const sendViaBrevo = async (opts: EmailOptions): Promise<EmailResult> => {
  const fromRaw =
    process.env.BREVO_FROM ||
    process.env.SMTP_FROM ||
    `Constructor ERP <${process.env.BREVO_FROM_EMAIL || 'noreply@example.com'}>`;
  const sender = parseSender(fromRaw);
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY!,
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: [{ email: opts.to }],
        subject: opts.subject,
        htmlContent: opts.html,
        textContent: opts.text,
      }),
    });
    const data: any = await res.json();
    if (!res.ok) {
      const msg = data.message || data.code || `HTTP ${res.status}`;
      console.error(`[Email/Brevo] ❌ Failed to send to ${opts.to}: ${msg}`);
      if (String(msg).toLowerCase().includes('sender')) {
        console.error('[Email/Brevo]    Sender email is not verified in Brevo. Add and verify it under Senders & IP → Senders.');
      }
      return { ok: false, provider: 'brevo', error: msg };
    }
    console.log(`[Email/Brevo] ✓ Sent to ${opts.to}: "${opts.subject}" (messageId: ${data.messageId})`);
    return { ok: true, provider: 'brevo', messageId: data.messageId };
  } catch (err: any) {
    console.error(`[Email/Brevo] ❌ Network error: ${err.message}`);
    return { ok: false, provider: 'brevo', error: err.message };
  }
};

/** Send via SMTP (nodemailer fallback) */
const sendViaSMTP = async (opts: EmailOptions): Promise<EmailResult> => {
  const t = getTransporter();
  if (!t) return { ok: false, provider: 'smtp', error: 'SMTP not configured' };
  const from = process.env.SMTP_FROM || '"Constructor ERP" <noreply@constructor-erp.gov.in>';
  try {
    const info = await t.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text });
    console.log(`[Email/SMTP] ✓ Sent to ${opts.to}: "${opts.subject}" (messageId: ${info.messageId})`);
    return { ok: true, provider: 'smtp', messageId: info.messageId };
  } catch (err: any) {
    console.error(`[Email/SMTP] ❌ Failed to send to ${opts.to}: ${err.message}`);
    if (err.code === 'EAUTH') console.error('[Email/SMTP]    Auth failed — verify SMTP_PASS (use Gmail App Password)');
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNECTION') {
      console.error('[Email/SMTP]    Port blocked — switch to Resend or Brevo HTTPS provider');
    }
    return { ok: false, provider: 'smtp', error: err.message };
  }
};

export const sendEmail = async (opts: EmailOptions): Promise<EmailResult> => {
  const provider = getProvider();

  if (provider === 'console') {
    console.log('\n========== EMAIL (console mode — no provider configured) ==========');
    console.log(`To:      ${opts.to}`);
    console.log(`Subject: ${opts.subject}`);
    console.log(`Preview:\n${(opts.text || opts.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 800)}`);
    console.log('====================================================\n');
    return { ok: true, provider: 'console' };
  }

  if (provider === 'resend') return sendViaResend(opts);
  if (provider === 'brevo') return sendViaBrevo(opts);
  return sendViaSMTP(opts);
};

export const getActiveProvider = () => getProvider();
