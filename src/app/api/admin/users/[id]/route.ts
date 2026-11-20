import { route, parseBody, ok, ApiError, assertObjectId } from "@/server/http";
import { adminUserUpdateSchema } from "@/formik/schema/admin";
import { requireUser } from "@/server/auth/session";
import { User } from "@/server/models/User";
import { VendorProfile } from "@/server/models/VendorProfile";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const admin = await requireUser(["admin"]);
  const { id } = await params;
  assertObjectId(id, "user");
  const body = await parseBody(req, adminUserUpdateSchema);
  if (id === admin.id && (body.isActive === false || (body.role && body.role !== "admin"))) {
    throw new ApiError(400, "You can't deactivate or demote your own admin account.");
  }
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found.");
  if (body.role === "vendor" && !(await VendorProfile.exists({ user: id, status: "approved" }))) {
    throw new ApiError(409, "Approve this user's vendor application before giving them the vendor role.");
  }
  if (user.role === "admin" && body.role && body.role !== "admin") {
    const admins = await User.countDocuments({ role: "admin", isActive: true });
    if (admins <= 1) throw new ApiError(409, "There must be at least one active admin.");
  }
  const revoke = (body.isActive === false && user.isActive) || (body.role && body.role !== user.role);
  if (body.name !== undefined) user.name = body.name;
  if (body.role !== undefined) user.role = body.role as typeof user.role;
  if (body.isActive !== undefined) user.isActive = body.isActive;
  if (body.emailVerified !== undefined) user.emailVerified = body.emailVerified;
  // Changing role or deactivating signs the user out everywhere.
  if (revoke) user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();
  return ok({ id: user._id.toString(), role: user.role, isActive: user.isActive, emailVerified: user.emailVerified });
});
