/**
 * Branded HTML email templates for Constructor ERP.
 * Government tricolor + clean institutional design.
 */

const baseLayout = (title: string, body: string) => `
<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1e293b;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <!-- Tricolor strip -->
    <div style="height:6px;background:linear-gradient(to right,#FF9933 0%,#FF9933 33.33%,#FFFFFF 33.33%,#FFFFFF 66.66%,#138808 66.66%,#138808 100%);"></div>
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#072452 0%,#0B3D91 100%);padding:24px;color:#fff;">
      <div style="font-size:11px;letter-spacing:1px;opacity:0.8;text-transform:uppercase;">Government of India</div>
      <div style="font-size:20px;font-weight:bold;margin-top:4px;">Constructor ERP</div>
      <div style="font-size:12px;opacity:0.85;">Internal eTender + Construction ERP Platform</div>
    </div>
    <!-- Body -->
    <div style="padding:32px 28px;">
      ${body}
    </div>
    <!-- Footer -->
    <div style="border-top:1px solid #e2e8f0;padding:16px 28px;background:#f8fafc;font-size:11px;color:#64748b;text-align:center;">
      © ${new Date().getFullYear()} Government of India · Public Works Department<br>
      This is an automated message from Constructor ERP. Do not reply to this email.
    </div>
  </div>
</body></html>`;

export const registrationConfirmationEmail = (orgName: string, adminName: string) =>
  baseLayout('Registration Received', `
    <h2 style="color:#0B3D91;margin:0 0 16px;font-size:20px;">Registration Received</h2>
    <p>Dear ${adminName},</p>
    <p>Thank you for registering <strong>${orgName}</strong> on Constructor ERP — the Government's unified Construction ERP and Internal eTender platform.</p>
    <div style="background:#fef3c7;border-left:3px solid #f59e0b;padding:12px 16px;margin:20px 0;border-radius:4px;">
      <strong style="color:#92400e;">Status: Awaiting Approval</strong><br>
      <span style="font-size:13px;color:#78350f;">Our Super Admin team will review your application within 1–2 business days.</span>
    </div>
    <p style="font-size:13px;color:#475569;">You'll receive another email once your organization is approved with instructions to set your password and access your dashboard.</p>
  `);

export const approvalEmail = (orgName: string, adminName: string, deptCode: string, setPasswordLink: string, plan: string) =>
  baseLayout('Organization Approved', `
    <h2 style="color:#138808;margin:0 0 16px;font-size:20px;">✓ Organization Approved</h2>
    <p>Dear ${adminName},</p>
    <p>Congratulations! <strong>${orgName}</strong> has been approved on Constructor ERP.</p>
    <div style="background:#dcfce7;border-left:3px solid #138808;padding:12px 16px;margin:20px 0;border-radius:4px;">
      <strong style="color:#166534;">Account Details</strong><br>
      <table style="font-size:13px;color:#14532d;margin-top:6px;">
        <tr><td style="padding:2px 12px 2px 0;">Department Code:</td><td><strong>${deptCode}</strong></td></tr>
        <tr><td style="padding:2px 12px 2px 0;">Plan:</td><td><strong>${plan}</strong></td></tr>
        <tr><td style="padding:2px 12px 2px 0;">Role:</td><td><strong>Department Admin</strong></td></tr>
      </table>
    </div>
    <p>To activate your account and access your dashboard, please set your password by clicking the button below:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${setPasswordLink}" style="display:inline-block;background:#0B3D91;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">Set Password & Activate</a>
    </div>
    <p style="font-size:12px;color:#64748b;">This link will expire in 48 hours. If you didn't request this, please ignore this email.</p>
    <p style="font-size:12px;color:#64748b;word-break:break-all;">If the button doesn't work, copy this URL: ${setPasswordLink}</p>
  `);

export const rejectionEmail = (orgName: string, adminName: string, reason?: string) =>
  baseLayout('Registration Update', `
    <h2 style="color:#C8102E;margin:0 0 16px;font-size:20px;">Registration Status Update</h2>
    <p>Dear ${adminName},</p>
    <p>Thank you for your interest in Constructor ERP. After careful review, we are unable to approve the registration for <strong>${orgName}</strong> at this time.</p>
    ${reason ? `
      <div style="background:#fee2e2;border-left:3px solid #C8102E;padding:12px 16px;margin:20px 0;border-radius:4px;">
        <strong style="color:#991b1b;">Reason for rejection:</strong><br>
        <span style="font-size:13px;color:#7f1d1d;">${reason}</span>
      </div>
    ` : ''}
    <p>If you believe this is an error or wish to provide additional information, you may reach our support team at <a href="mailto:support@constructor-erp.gov.in" style="color:#0B3D91;">support@constructor-erp.gov.in</a>.</p>
  `);

export const passwordResetEmail = (name: string, resetLink: string) =>
  baseLayout('Reset Your Password', `
    <h2 style="color:#0B3D91;margin:0 0 16px;font-size:20px;">Password Reset Request</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetLink}" style="display:inline-block;background:#0B3D91;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">Reset Password</a>
    </div>
    <p style="font-size:12px;color:#64748b;">This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.</p>
  `);
