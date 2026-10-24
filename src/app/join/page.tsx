import type { Metadata } from "next";
import Link from "next/link";
import { JoinForm } from "./join-form";

export const metadata: Metadata = {
  title: "Join Fixwell",
  description: "Get bookings from local customers. Set your own prices, hours and areas.",
};

export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const sp = await searchParams;
  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-3xl font-extrabold">Join Fixwell</h1>
      <p className="mt-2 text-lg text-slate-600">Get booked by local customers. You set your prices, hours and the areas you cover.</p>
      {sp.no_profile === "1" && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Your login doesn&apos;t have a tradesperson profile yet. Fill in the form below to apply.</p>
      )}
      <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
        {["Free to join while we launch", "We check accreditations and insurance", "You accept or decline every booking"].map((t) => (
          <li key={t} className="card flex items-center gap-2 p-3">
            <span className="text-emerald-600">✓</span> {t}
          </li>
        ))}
      </ul>
      <JoinForm />
      <p className="mt-6 text-center text-sm text-slate-600">
        Already applied?{" "}
        <Link href="/login" className="font-semibold text-accent-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
