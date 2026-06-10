import "server-only";
import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export interface ContactEmailPayload {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}

export async function sendContactEmail(payload: ContactEmailPayload) {
  const transporter = createTransporter();
  const to = process.env.SMTP_USER!;

  await transporter.sendMail({
    from: `"${payload.senderName}" <${process.env.SMTP_USER}>`,
    replyTo: payload.senderEmail,
    to,
    subject: `[Contact Form] ${payload.subject || "New Message"}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#005d59">New Contact Form Submission</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:bold;width:120px">Name:</td><td style="padding:8px">${escHtml(payload.senderName)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Email:</td><td style="padding:8px"><a href="mailto:${escHtml(payload.senderEmail)}">${escHtml(payload.senderEmail)}</a></td></tr>
          <tr><td style="padding:8px;font-weight:bold">Subject:</td><td style="padding:8px">${escHtml(payload.subject)}</td></tr>
        </table>
        <h3 style="color:#005d59;margin-top:24px">Message:</h3>
        <div style="background:#f9f9f9;padding:16px;border-left:4px solid #005d59;white-space:pre-wrap">${escHtml(payload.message)}</div>
      </div>
    `,
  });
}

export interface GunasEmailPayload {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  complaintType: string;
  message: string;
}

export async function sendGunasEmail(payload: GunasEmailPayload) {
  const transporter = createTransporter();
  const to = process.env.SMTP_USER!;

  await transporter.sendMail({
    from: `"${payload.senderName}" <${process.env.SMTP_USER}>`,
    replyTo: payload.senderEmail,
    to,
    subject: `[Gunaso / Complaint] ${payload.complaintType || "New Complaint"}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#005d59">New Gunaso (Complaint) Submission</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:bold;width:140px">Name:</td><td style="padding:8px">${escHtml(payload.senderName)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Email:</td><td style="padding:8px"><a href="mailto:${escHtml(payload.senderEmail)}">${escHtml(payload.senderEmail)}</a></td></tr>
          <tr><td style="padding:8px;font-weight:bold">Phone:</td><td style="padding:8px">${escHtml(payload.senderPhone)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Complaint Type:</td><td style="padding:8px">${escHtml(payload.complaintType)}</td></tr>
        </table>
        <h3 style="color:#005d59;margin-top:24px">Complaint Details:</h3>
        <div style="background:#f9f9f9;padding:16px;border-left:4px solid #e05c00;white-space:pre-wrap">${escHtml(payload.message)}</div>
      </div>
    `,
  });
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
