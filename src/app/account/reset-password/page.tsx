import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { NewPasswordForm } from "../../login/login-form";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage() {
  // The emailed link logs the person in first (via /auth/confirm), then lands here.
  if (!(await currentUser())) redirect("/login?error=link");
  return (
    <div className="container-page max-w-md py-12">
      <h1 className="text-2xl font-extrabold">Choose a new password</h1>
      <div className="card mt-6 p-5 sm:p-6">
        <NewPasswordForm />
      </div>
    </div>
  );
}
