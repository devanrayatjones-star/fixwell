import type { Metadata } from "next";
import { CANCELLATION_CUTOFF_HOURS, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "Booking terms" };

/** Yellow-highlighted text you need to replace before launch. */
function Fill({ children }: { children: React.ReactNode }) {
  return <span className="fill-in">[{children}]</span>;
}

export default function TermsPage() {
  return (
    <article className="container-page prose-legal max-w-3xl py-10">
      <h1 className="text-3xl font-extrabold">Booking terms</h1>
      <p className="text-sm text-slate-500">
        Last updated: <Fill>DATE</Fill>
      </p>
      <div className="my-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
        <strong>Template: fill in the highlighted parts and have a solicitor check them before launch.</strong> This is a starting point, not legal advice.
      </div>

      <h2>1. About us</h2>
      <p>
        {SITE_NAME} is operated by <Fill>YOUR NAME OR COMPANY NAME</Fill> (<Fill>COMPANY NUMBER, if a company</Fill>), <Fill>ADDRESS</Fill>. Email: <Fill>CONTACT EMAIL</Fill>.
      </p>

      <h2>2. What we do</h2>
      <p>
        {SITE_NAME} is a booking platform. We introduce you to independent local tradespeople and handle the booking. <strong>The contract for the work is between you and the tradesperson</strong>, who is responsible for carrying it out with
        reasonable care and skill. We check each tradesperson&apos;s stated accreditations and public liability insurance before listing them, but we don&apos;t carry out or supervise the work.
      </p>

      <h2>3. Making a booking</h2>
      <ul>
        <li>When you submit a booking it is a <strong>request</strong>. The time slot is held for you while the tradesperson reviews it.</li>
        <li>Your booking is <strong>confirmed</strong> when the tradesperson accepts it and we email you. If they decline, or don&apos;t respond before the appointment time, the request closes and you owe nothing.</li>
        <li>Please give accurate details. The tradesperson relies on your description of the problem.</li>
      </ul>

      <h2>4. Prices</h2>
      <ul>
        <li>
          The price shown is an <strong>estimate</strong>: the tradesperson&apos;s call-out fee plus the estimated hours multiplied by their hourly rate.
        </li>
        <li>
          <strong>Parts and materials are not included</strong> and are quoted on the day.
        </li>
        <li>If the job turns out to be bigger than described, the tradesperson must explain and agree any extra cost with you before doing the extra work.</li>
        <li>
          You pay the tradesperson directly. {SITE_NAME} does not take payment from customers. <Fill>UPDATE IF YOU START TAKING PAYMENTS OR DEPOSITS</Fill>
        </li>
      </ul>

      <h2>5. Cancelling: your rights</h2>
      <h3>Cancelling online</h3>
      <p>
        You can cancel free of charge using the link in your confirmation email up to <strong>{CANCELLATION_CUTOFF_HOURS} hours</strong> before the appointment. After that, please phone the tradesperson as soon as possible.
      </p>
      <h3>Your 14-day right to cancel</h3>
      <p>
        Under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013 you have the right to cancel a booking made online <strong>within 14 days</strong> of making it, without giving a reason.
      </p>
      <ul>
        <li>
          If your appointment is within those 14 days, we&apos;ll ask you to <strong>expressly request</strong> that the work starts early when you book.
        </li>
        <li>If you then cancel after work has started, you may have to pay for the work done up to the point you told the tradesperson you were cancelling.</li>
        <li>
          Once the work has been <strong>fully completed</strong> at your request, you lose the right to cancel.
        </li>
        <li>
          To cancel, use the link in your email, or tell us or the tradesperson clearly (for example by email to <Fill>CONTACT EMAIL</Fill>). You can use the model cancellation form below, but you don&apos;t have to.
        </li>
      </ul>
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <p className="font-semibold">Model cancellation form</p>
        <p>
          To <Fill>YOUR NAME/COMPANY, ADDRESS, EMAIL</Fill>: I hereby give notice that I cancel my contract for the supply of the following service: [booking reference], booked on [date]. Name: [your name]. Address: [your address]. Date: [date].
        </p>
      </div>

      <h2>6. If the tradesperson cancels</h2>
      <p>Tradespeople may occasionally need to cancel, for example through illness. If they do, we&apos;ll email you straight away and you won&apos;t owe anything for that booking.</p>

      <h2>7. Problems with the work</h2>
      <p>
        If you&apos;re unhappy with the work, contact the tradesperson first: they&apos;re responsible for it, and you have rights under the Consumer Rights Act 2015. If you can&apos;t resolve it, email us at <Fill>CONTACT EMAIL</Fill> and we&apos;ll try to help.
      </p>

      <h2>8. Reviews</h2>
      <p>
        Only customers whose job has been marked complete can leave a review, and each booking can be reviewed once. We publish reviews whether positive or negative, showing your first name only. We may remove reviews that are abusive, unlawful or clearly not about the job. We never write or pay for reviews.
      </p>

      <h2>9. Our liability</h2>
      <p>
        Nothing in these terms limits liability that cannot legally be limited, such as for death or personal injury caused by negligence, or fraud. As we don&apos;t carry out the work, we&apos;re not responsible for the tradesperson&apos;s work, but we are responsible for running the booking service with reasonable care and skill. <Fill>SOLICITOR TO REVIEW</Fill>
      </p>

      <h2>10. Law</h2>
      <p>
        These terms are governed by the law of England and Wales. If you live in Scotland or Northern Ireland, you can also bring proceedings in your local courts. <Fill>CONFIRM</Fill>
      </p>
    </article>
  );
}
