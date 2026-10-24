import "server-only";
import { Resend } from "resend";
import { SITE_NAME, SITE_URL } from "./config";

export type Email = { subject: string; html: string; text: string };

let resend: Resend | null = null;

/**
 * Sends an email through Resend. Without RESEND_API_KEY (e.g. on your own
 * computer) the email is printed to the terminal instead, so you can test
 * without an account. Never throws: a failed email shouldn't lose a booking.
 */
export async function sendEmail(to: string | null | undefined, email: Email, replyTo?: string): Promise<boolean> {
  if (!to) return false;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || `${SITE_NAME} <onboarding@resend.dev>`;
  if (!key) {
    console.log(`\n📧 [email not sent: no RESEND_API_KEY]\nTo: ${to}\nSubject: ${email.subject}\n\n${email.text}\n`);
    return true;
  }
  try {
    resend ??= new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo,
    });
    if (error) {
      console.error("Email failed", to, email.subject, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email failed", to, email.subject, err);
    return false;
  }
}

export function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Block = { kind: "p"; text: string } | { kind: "rows"; rows: [string, string][] } | { kind: "button"; label: string; href: string } | { kind: "small"; text: string };

export const p = (text: string): Block => ({ kind: "p", text });
export const rows = (r: [string, string | null | undefined][]): Block => ({
  kind: "rows",
  rows: r.filter(([, v]) => v).map(([k, v]) => [k, v as string]),
});
export const button = (label: string, href: string): Block => ({ kind: "button", label, href });
export const small = (text: string): Block => ({ kind: "small", text });

/** Builds a simple, mobile-friendly email with a matching plain-text version. */
export function layout(subject: string, heading: string, allBlocks: (Block | null)[]): Email {
  const blocks = allBlocks.filter((b): b is Block => b !== null);
  const htmlBlocks = blocks
    .map((b) => {
      switch (b.kind) {
        case "p":
          return `<p style="margin:0 0 16px;line-height:1.5">${esc(b.text).replace(/\n/g, "<br>")}</p>`;
        case "small":
          return `<p style="margin:0 0 16px;line-height:1.5;font-size:13px;color:#64748b">${esc(b.text)}</p>`;
        case "rows":
          return `<table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 16px">${b.rows
            .map(
              ([k, v]) =>
                `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;vertical-align:top">${esc(v).replace(/\n/g, "<br>")}</td></tr>`,
            )
            .join("")}</table>`;
        case "button":
          return `<p style="margin:8px 0 24px"><a href="${esc(b.href)}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${esc(b.label)}</a></p>`;
      }
    })
    .join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="font-weight:800;font-size:20px;color:#0f2a4a;margin-bottom:16px">${SITE_NAME}</div>
<div style="background:#fff;border-radius:12px;padding:24px">
<h1 style="font-size:20px;margin:0 0 16px">${esc(heading)}</h1>
${htmlBlocks}
</div>
<p style="font-size:12px;color:#94a3b8;margin-top:16px">${SITE_NAME} · <a href="${SITE_URL}" style="color:#94a3b8">${SITE_URL.replace(/^https?:\/\//, "")}</a></p>
</div></body></html>`;

  const text = [
    heading,
    "",
    ...blocks.map((b) => {
      switch (b.kind) {
        case "p":
        case "small":
          return b.text + "\n";
        case "rows":
          return b.rows.map(([k, v]) => `${k}: ${v}`).join("\n") + "\n";
        case "button":
          return `${b.label}: ${b.href}\n`;
      }
    }),
    `— ${SITE_NAME}`,
  ].join("\n");

  return { subject, html, text };
}
