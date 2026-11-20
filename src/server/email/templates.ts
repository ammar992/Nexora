import "server-only";
import { appUrl } from "@/server/env";
import { formatMoney, formatDate, formatTime } from "@/resources/utils/format";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Built = { subject: string; html: string; text: string };

function layout(opts: { siteName: string; heading: string; paragraphs: string[]; cta?: { label: string; url: string }; rows?: [string, string][]; footnote?: string }): Built & { subject: "" } {
  const rows = opts.rows?.length
    ? `<table role="presentation" width="100%" style="border-collapse:collapse;margin:20px 0;font-size:14px">${opts.rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:10px 0;border-bottom:1px solid #ece6dc;color:#6b6358">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid #ece6dc;text-align:right;color:#1c1916;font-weight:600">${esc(v)}</td></tr>`
        )
        .join("")}</table>`
    : "";
  const cta = opts.cta
    ? `<p style="margin:28px 0"><a href="${opts.cta.url}" style="background:#d9542b;color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:600;display:inline-block">${esc(opts.cta.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f4f0ea;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1c1916">
<table role="presentation" width="100%" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#fffdf9;border-radius:18px;padding:36px;border:1px solid #ece6dc">
<tr><td>
<p style="font-family:Georgia,serif;font-size:22px;margin:0 0 28px;letter-spacing:-0.02em">${esc(opts.siteName)}</p>
<h1 style="font-family:Georgia,serif;font-weight:500;font-size:28px;line-height:1.2;margin:0 0 16px;letter-spacing:-0.02em">${esc(opts.heading)}</h1>
${opts.paragraphs.map((p) => `<p style="font-size:15px;line-height:1.6;color:#3d3832;margin:0 0 14px">${esc(p)}</p>`).join("")}
${rows}${cta}
${opts.cta ? `<p style="font-size:12px;color:#8a8176;word-break:break-all">If the button doesn't work, paste this link into your browser:<br>${opts.cta.url}</p>` : ""}
${opts.footnote ? `<p style="font-size:12px;color:#8a8176;margin-top:24px">${esc(opts.footnote)}</p>` : ""}
</td></tr></table>
<p style="font-size:12px;color:#8a8176;margin-top:18px">You're receiving this because you have an account on ${esc(opts.siteName)}.</p>
</td></tr></table></body></html>`;
  const text = [
    opts.heading,
    "",
    ...opts.paragraphs,
    ...(opts.rows ?? []).map(([k, v]) => `${k}: ${v}`),
    opts.cta ? `\n${opts.cta.label}: ${opts.cta.url}` : "",
    opts.footnote ?? "",
  ].join("\n");
  return { subject: "", html, text };
}

export const emails = {
  verifyEmail(siteName: string, name: string, token: string): Built {
    const url = `${appUrl()}/verify-email?token=${token}`;
    return {
      ...layout({
        siteName,
        heading: `Welcome, ${name.split(" ")[0]}`,
        paragraphs: ["Confirm your email address to finish setting up your account. The link is valid for 24 hours."],
        cta: { label: "Verify email", url },
        footnote: "Didn't create an account? You can ignore this email.",
      }),
      subject: `Verify your email for ${siteName}`,
    };
  },
  resetPassword(siteName: string, name: string, token: string): Built {
    const url = `${appUrl()}/reset-password?token=${token}`;
    return {
      ...layout({
        siteName,
        heading: "Reset your password",
        paragraphs: [`Hi ${name.split(" ")[0]}, we received a request to reset your password. This link expires in 30 minutes.`],
        cta: { label: "Choose a new password", url },
        footnote: "If you didn't ask for this, no action is needed and your password stays the same.",
      }),
      subject: `Reset your ${siteName} password`,
    };
  },
  orderConfirmation(siteName: string, name: string, o: { reference: string; total: number; currency: string; items: { title: string; quantity: number }[]; paid: boolean }): Built {
    return {
      ...layout({
        siteName,
        heading: "Your order is in",
        paragraphs: [
          `Thanks, ${name.split(" ")[0]}. We've sent your order to the vendor.`,
          o.paid ? "Payment received." : "Payment is due on delivery. The vendor will confirm before shipping.",
        ],
        rows: [["Order", o.reference], ...o.items.map((i) => [i.title, `× ${i.quantity}`] as [string, string]), ["Total", formatMoney(o.total, o.currency)]],
        cta: { label: "Track your order", url: `${appUrl()}/account/orders` },
      }),
      subject: `Order ${o.reference} confirmed`,
    };
  },
  bookingConfirmation(siteName: string, name: string, b: { reference: string; title: string; date: string; timeSlot: string; total: number; currency: string; status: string }): Built {
    return {
      ...layout({
        siteName,
        heading: b.status === "confirmed" ? "You're booked" : "Booking request received",
        paragraphs: [
          `Hi ${name.split(" ")[0]}, here are the details for ${b.title}.`,
          b.status === "confirmed" ? "Your vendor is expecting you." : "The vendor will confirm your slot shortly. We'll email you when they do.",
        ],
        rows: [
          ["Reference", b.reference],
          ["Date", formatDate(b.date, { weekday: "long" })],
          ["Time", formatTime(b.timeSlot)],
          ["Total", formatMoney(b.total, b.currency)],
        ],
        cta: { label: "View booking", url: `${appUrl()}/account/bookings` },
      }),
      subject: `Booking ${b.reference}: ${b.title}`,
    };
  },
  statusChange(siteName: string, name: string, x: { kind: "order" | "booking"; reference: string; statusLabel: string; note?: string }): Built {
    return {
      ...layout({
        siteName,
        heading: `Your ${x.kind} is now ${x.statusLabel.toLowerCase()}`,
        paragraphs: [`Hi ${name.split(" ")[0]}, ${x.kind} ${x.reference} was updated to “${x.statusLabel}”.`, ...(x.note ? [x.note] : [])],
        cta: { label: `View ${x.kind}`, url: `${appUrl()}/account/${x.kind}s` },
      }),
      subject: `${x.kind === "order" ? "Order" : "Booking"} ${x.reference}: ${x.statusLabel}`,
    };
  },
  vendorApplication(siteName: string, name: string, status: "pending" | "approved" | "rejected", reason?: string): Built {
    const copy = {
      pending: { h: "Application received", p: "Thanks for applying to sell on our marketplace. Our team reviews every application, usually within two business days." },
      approved: { h: "You're approved to sell", p: "Your storefront is live. Add your first listing from the vendor dashboard." },
      rejected: { h: "About your vendor application", p: "We weren't able to approve your application this time." },
    }[status];
    return {
      ...layout({
        siteName,
        heading: copy.h,
        paragraphs: [`Hi ${name.split(" ")[0]}, ${copy.p}`, ...(reason ? [`Reviewer note: ${reason}`] : [])],
        cta: status === "approved" ? { label: "Open vendor dashboard", url: `${appUrl()}/vendor` } : undefined,
      }),
      subject: `${siteName}: ${copy.h}`,
    };
  },
  vendorNewSale(siteName: string, x: { kind: "order" | "booking"; reference: string; summary: string; total: number; currency: string }): Built {
    return {
      ...layout({
        siteName,
        heading: x.kind === "order" ? "You have a new order" : "You have a new booking",
        paragraphs: [x.summary],
        rows: [["Reference", x.reference], ["Value", formatMoney(x.total, x.currency)]],
        cta: { label: "Open in dashboard", url: `${appUrl()}/vendor/${x.kind}s` },
      }),
      subject: `New ${x.kind} ${x.reference}`,
    };
  },
  vendorInquiry(siteName: string, x: { fromName: string; fromEmail: string; listingTitle: string; message: string }): Built {
    return {
      ...layout({
        siteName,
        heading: `Question about ${x.listingTitle}`,
        paragraphs: [`${x.fromName} (${x.fromEmail}) sent you a message:`, x.message],
        footnote: "Reply to this email to answer them directly.",
      }),
      subject: `Question about ${x.listingTitle}`,
    };
  },
  test(siteName: string): Built {
    return {
      ...layout({ siteName, heading: "Email is working", paragraphs: ["This is a test message from your admin settings. Your SMTP configuration can send mail."] }),
      subject: `${siteName} test email`,
    };
  },
};
