import type { Metadata } from "next";
import { CANCELLATION_CUTOFF_HOURS, RETENTION_MONTHS, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy policy" };

/** Yellow-highlighted text you need to replace before launch. */
function Fill({ children }: { children: React.ReactNode }) {
  return <span className="fill-in">[{children}]</span>;
}

export default function PrivacyPage() {
  return (
    <article className="container-page prose-legal max-w-3xl py-10">
      <h1 className="text-3xl font-extrabold">Privacy policy</h1>
      <p className="text-sm text-slate-500">
        Last updated: <Fill>DATE</Fill>
      </p>
      <div className="my-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
        <strong>Template: fill in the highlighted parts and have it checked before launch.</strong> This is a starting point, not legal advice. The ICO&apos;s guidance for small businesses is at ico.org.uk.
      </div>

      <h2>Who we are</h2>
      <p>
        {SITE_NAME} is run by <Fill>YOUR NAME OR COMPANY NAME</Fill>, <Fill>ADDRESS</Fill>. We are the &quot;controller&quot; of the personal data described here. ICO registration number: <Fill>ICO NUMBER</Fill>. Contact us about privacy at{" "}
        <Fill>PRIVACY EMAIL</Fill>.
      </p>

      <h2>What we collect from customers</h2>
      <p>When you book, we collect only what the tradesperson needs to do the job:</p>
      <ul>
        <li>your name, phone number and email address, so you and the tradesperson can contact each other;</li>
        <li>the job address and postcode, so they can find you and check they cover your area;</li>
        <li>your vehicle registration (mechanic bookings only), so the mechanic can check parts;</li>
        <li>your description of the problem;</li>
        <li>the booking details (job, date, time, price estimate, status), and any review you choose to leave.</li>
      </ul>
      <p>You don&apos;t need an account to book. We don&apos;t take card details.</p>

      <h2>What we collect from tradespeople</h2>
      <p>
        Business and contact details, trade, areas covered, prices, working hours, accreditation numbers (such as Gas Safe, NICEIC/NAPIT, IMI), your public liability insurance certificate, photos you upload, and your login email. We use these to check you before listing you and to run your listing.
      </p>

      <h2>Why we use it (lawful basis)</h2>
      <ul>
        <li>
          <strong>To arrange and manage your booking</strong>: necessary for the contract you&apos;re entering into.
        </li>
        <li>
          <strong>Sending booking emails</strong> (confirmations, changes, review requests): necessary for the contract, and our legitimate interest in running a reliable service.
        </li>
        <li>
          <strong>Checking tradespeople&apos;s accreditations and insurance</strong>: our legitimate interest in keeping customers safe.
        </li>
        <li>
          <strong>Keeping records</strong> where the law requires it (for example tax or disputes): legal obligation.
        </li>
      </ul>
      <p>We don&apos;t sell your data or use it for advertising.</p>

      <h2>Who we share it with</h2>
      <ul>
        <li>
          <strong>The tradesperson you book</strong> receives your booking details. They are responsible for how they use them to do the job.
        </li>
        <li>
          Our service providers, who process data only on our instructions: Supabase (database and file storage, hosted in <Fill>REGION, e.g. London (eu-west-2)</Fill>), Vercel (website hosting), Resend (sending emails), and postcodes.io (which receives only the postcode, to check it exists).
        </li>
      </ul>
      <p>
        Some providers may process data outside the UK. Where they do, they use approved safeguards such as the UK International Data Transfer Agreement or Addendum. <Fill>CHECK EACH PROVIDER&apos;S TERMS</Fill>
      </p>

      <h2>How long we keep it</h2>
      <p>
        Customer contact details, address, vehicle registration and problem description are <strong>automatically deleted {RETENTION_MONTHS} months after the booking</strong>. We keep an anonymous record (job, date, price and postcode district) for our accounts. Reviews stay published with your first name only unless you ask us to remove them.
      </p>
      <p>
        Tradesperson details are kept while you&apos;re listed and for <Fill>e.g. 2 years</Fill> afterwards, then deleted. Insurance certificates are deleted when replaced.
      </p>

      <h2>Cookies</h2>
      <p>
        We only use cookies that are strictly necessary: a login cookie for tradespeople and admins. Customers browsing and booking don&apos;t get any cookies from us. We don&apos;t use analytics or advertising cookies. <Fill>UPDATE IF YOU ADD ANALYTICS</Fill>
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see the data we hold about you, correct it, delete it, restrict or object to how we use it, or get a copy to take elsewhere. Email <Fill>PRIVACY EMAIL</Fill>. We&apos;ll reply within one month. If you&apos;re unhappy, you can complain to the Information Commissioner&apos;s Office (ico.org.uk, 0303 123 1113).
      </p>
      <p className="text-sm text-slate-500">
        Customers can cancel a booking online up to {CANCELLATION_CUTOFF_HOURS} hours before. See our booking terms.
      </p>
    </article>
  );
}
