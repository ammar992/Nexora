import * as yup from "yup";

const email = yup.string().trim().lowercase().email("Enter a valid email address").max(160).required("Email is required");

export const passwordRule = yup
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use 128 characters or fewer")
  .matches(/[a-z]/i, "Include at least one letter")
  .matches(/\d/, "Include at least one number")
  .required("Password is required");

export const registerSchema = yup.object({
  name: yup.string().trim().min(2, "Name is too short").max(80).required("Your name is required"),
  email,
  password: passwordRule,
  accountType: yup.string().oneOf(["customer", "vendor"]).default("customer"),
});

export const registerFormSchema = registerSchema.shape({
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords don't match")
    .required("Confirm your password"),
  terms: yup.boolean().oneOf([true], "Please accept the terms to continue"),
});

export const loginSchema = yup.object({
  email,
  password: yup.string().max(128).required("Password is required"),
});

export const forgotPasswordSchema = yup.object({ email });

export const resetPasswordSchema = yup.object({
  token: yup.string().min(20).max(200).required("This reset link is invalid"),
  password: passwordRule,
});

export const resetPasswordFormSchema = resetPasswordSchema.shape({
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords don't match")
    .required("Confirm your new password"),
});

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().max(128).required("Enter your current password"),
  newPassword: passwordRule.notOneOf([yup.ref("currentPassword")], "Choose a password you haven't used here"),
});

export const changePasswordFormSchema = changePasswordSchema.shape({
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords don't match")
    .required("Confirm your new password"),
});

export const newsletterSchema = yup.object({ email });
