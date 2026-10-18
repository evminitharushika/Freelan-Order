import { motion } from 'framer-motion';
import { ClipboardList, PhoneCall, UserRound } from 'lucide-react';

const STEPS = [
  { icon: UserRound, title: 'Tell us who you are', body: 'Your name and phone number. Add a shop or company name if you have one.' },
  { icon: ClipboardList, title: 'Fill the order sheet', body: 'Pick box quantities. Packets, CBM and kg are worked out live as you go.' },
  { icon: PhoneCall, title: 'We confirm & deliver', body: 'You get an order reference straight away and our team calls to confirm.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="relative z-20 overflow-hidden bg-maroon text-cream">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <p className="text-xs font-extrabold tracking-[0.3em] text-turmeric uppercase">How ordering works</p>
        <h2 id="how-heading" className="mt-3 max-w-xl font-display text-4xl leading-[1.02] font-black tracking-tight sm:text-5xl">
          Three steps. No paperwork.
        </h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-cream/10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="relative bg-maroon p-7 sm:p-9"
            >
              <span className="font-display text-7xl leading-none font-black text-turmeric/90 italic">{i + 1}</span>
              <s.icon className="absolute top-8 right-8 size-7 text-cream/40" aria-hidden="true" />
              <h3 className="mt-6 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-cream/70">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
