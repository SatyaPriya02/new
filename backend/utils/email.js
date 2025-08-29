// utils/email.js
import nodemailer from "nodemailer";

export function makeTransport() {
  // set these in .env
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_SECURE || "false") === "true",
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export async function sendMail({ to, subject, text, html }) {
  const t = makeTransport();
  await t.sendMail({
    from: process.env.MAIL_FROM || "no-reply@example.com",
    to, subject, text, html,
  });
}
