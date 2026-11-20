/**
 * Creates the initial admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
 *   npm run seed:admin
 * Safe to run repeatedly: an existing account is never duplicated or overwritten.
 */
import "./loadEnv";
import mongoose from "mongoose";
import { User } from "../src/server/models/User";
import { PlatformSettings } from "../src/server/models/PlatformSettings";
import { hashPassword } from "../src/server/auth/password";

const ok = (m: string) => console.log(`\x1b[32m✔\x1b[0m ${m}`);
const info = (m: string) => console.log(`\x1b[36mℹ\x1b[0m ${m}`);
const fail = (m: string) => {
  console.error(`\x1b[31m✖\x1b[0m ${m}`);
  process.exit(1);
};

async function main() {
  const uri = process.env.MONGODB_URI;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!uri) fail("MONGODB_URI is not set. Add it to .env.local (see .env.example).");
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) fail("ADMIN_EMAIL is missing or not a valid email address.");
  if (!password || password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password)) {
    fail("ADMIN_PASSWORD must be at least 8 characters and include a letter and a number.");
  }

  info("Connecting to MongoDB…");
  await mongoose.connect(uri!, { serverSelectionTimeoutMS: 15000 });
  ok("Connected");
  await User.syncIndexes();

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    if (existing.role === "admin") {
      info(`An admin account for ${email} already exists. Nothing to do.`);
    } else {
      fail(`${email} already exists as a ${existing.role}. Promote it from the admin dashboard or choose a different ADMIN_EMAIL.`);
    }
  } else {
    await User.create({
      name: "Administrator",
      email,
      passwordHash: await hashPassword(password!),
      role: "admin",
      emailVerified: true,
      isActive: true,
    });
    ok(`Admin account created for ${email}`);
  }

  await PlatformSettings.updateOne({ key: "global" }, { $setOnInsert: { key: "global" } }, { upsert: true });
  ok("Platform settings initialised");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(`\x1b[31m✖\x1b[0m Seeding failed: ${err instanceof Error ? err.message : err}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
