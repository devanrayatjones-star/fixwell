import type { Metadata } from "next";

export const metadata: Metadata = { title: "Application received", robots: { index: false } };

export default function JoinThanksPage() {
  return (
    <div className="container-page max-w-xl py-16 text-center">
      <div className="text-5xl" aria-hidden>
        📬
      </div>
      <h1 className="mt-4 text-2xl font-extrabold">Thanks, application received</h1>
      <p className="mt-3 text-slate-600">
        <strong>Check your email</strong> and click the link to confirm your address. Then you can log in to your dashboard.
      </p>
      <p className="mt-3 text-slate-600">
        We&apos;ll check your accreditations and insurance, usually within a couple of working days. Your profile goes live as soon as you&apos;re approved, and we&apos;ll email you when it does.
      </p>
    </div>
  );
}
