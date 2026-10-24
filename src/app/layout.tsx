import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: book trusted local tradespeople`,
    template: `%s | ${SITE_NAME}`,
  },
  description: "Book vetted local mechanics, plumbers, electricians, gas engineers, carpenters, locksmiths and roofers. Clear prices, instant booking requests.",
};

export const viewport: Viewport = {
  themeColor: "#0f2a4a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white">
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-accent-600 text-base">
        🛠
      </span>
      {SITE_NAME}
    </Link>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 bg-brand-900 text-white shadow">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
          <Link href="/search" className="hover:text-accent-100">
            Find a tradesperson
          </Link>
          <Link href="/join" className="hover:text-accent-100">
            Join Fixwell
          </Link>
          <Link href="/login" className="rounded-lg border border-white/30 px-3 py-1.5 hover:bg-white/10">
            Tradesperson login
          </Link>
        </nav>
        <details className="relative sm:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg hover:bg-white/10" aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </summary>
          <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl bg-white py-2 text-slate-800 shadow-lg">
            <Link href="/search" className="block px-4 py-3 hover:bg-slate-50">
              Find a tradesperson
            </Link>
            <Link href="/join" className="block px-4 py-3 hover:bg-slate-50">
              Join Fixwell
            </Link>
            <Link href="/login" className="block px-4 py-3 hover:bg-slate-50">
              Tradesperson login
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 bg-brand-900 text-sm text-brand-100">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <div className="mb-2 text-lg font-bold text-white">{SITE_NAME}</div>
          <p className="max-w-xs text-brand-100/80">Book vetted local tradespeople with clear prices up front.</p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-white">Customers</span>
          <Link href="/search" className="hover:text-white">
            Find a tradesperson
          </Link>
          <Link href="/terms" className="hover:text-white">
            Booking terms
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy policy
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-white">Tradespeople</span>
          <Link href="/join" className="hover:text-white">
            Join Fixwell
          </Link>
          <Link href="/login" className="hover:text-white">
            Log in
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page py-4 text-xs text-brand-100/70">
          © {new Date().getFullYear()} {SITE_NAME}. Prices shown are estimates; parts are quoted on the day.
        </div>
      </div>
    </footer>
  );
}
