import "server-only";
import type { Types } from "mongoose";
import { Notification, type NotificationType } from "@/server/models/Notification";
import { User } from "@/server/models/User";
import { sendEmail } from "@/server/email/mailer";

type NotifyInput = {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  /** Optional email to send alongside the in-app notification (respects user preferences). */
  email?: { subject: string; html: string; text: string; replyTo?: string; force?: boolean };
};

export async function notify(userId: Types.ObjectId | string, input: NotifyInput) {
  try {
    await Notification.create({ user: userId, type: input.type, title: input.title, body: input.body ?? "", link: input.link ?? "" });
    if (input.email) {
      const user = await User.findById(userId).select("email preferences isActive").lean();
      if (user?.isActive && (input.email.force || user.preferences?.emailNotifications !== false)) {
        await sendEmail({ to: user.email, ...input.email });
      }
    }
  } catch (err) {
    console.error("[notify] failed", err);
  }
}

export async function notifyAdmins(input: Omit<NotifyInput, "email">) {
  const admins = await User.find({ role: "admin", isActive: true }).select("_id").lean();
  await Promise.all(admins.map((a) => notify(a._id, input)));
}
