import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";
  return (
    <div className="container-page max-w-md py-12">
      <h1 className="text-2xl font-extrabold">Tradesperson login</h1>
      <p className="mt-1 text-slate-600">Manage your bookings, availability and profile.</p>
      {sp.confirmed === "1" && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Email confirmed. Please log in.</p>}
      {sp.error === "link" && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">That link has expired or was already used. Please try again.</p>}
      <div className="card mt-6 p-5 sm:p-6">
        <LoginForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">
        Not on Fixwell yet?{" "}
        <Link href="/join" className="font-semibold text-accent-600 hover:underline">
          Join as a tradesperson
        </Link>
      </p>
    </div>
  );
}
