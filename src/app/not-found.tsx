import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page max-w-xl py-20 text-center">
      <h1 className="text-3xl font-extrabold">Page not found</h1>
      <p className="mt-3 text-slate-600">That page doesn&apos;t exist, or the tradesperson is no longer listed.</p>
      <Link href="/search" className="btn-primary mt-6">
        Find a tradesperson
      </Link>
    </div>
  );
}
