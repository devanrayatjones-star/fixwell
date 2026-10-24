import type { Metadata } from "next";
import { ForgotPasswordForm } from "../login/login-form";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="container-page max-w-md py-12">
      <h1 className="text-2xl font-extrabold">Reset your password</h1>
      <p className="mt-1 text-slate-600">We&apos;ll email you a link to choose a new one.</p>
      <div className="card mt-6 p-5 sm:p-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
