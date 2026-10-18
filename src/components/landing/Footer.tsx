import { ArrowRight, ArrowUpRight, Clock, Mail, MapPin, MessageCircle, Navigation, Phone, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { company, directionsLink, hasSocial, telLink, whatsappLink } from '../../config/company';
import { useOrderStart } from '../../hooks/useOrderStart';
import { Logo } from '../brand/Logo';
import { FacebookIcon, InstagramIcon, TiktokIcon, YoutubeIcon } from '../brand/SocialIcons';
import { MagneticButton } from './MagneticButton';

const SOCIAL = [
  { key: 'facebook', label: 'Facebook', icon: FacebookIcon },
  { key: 'instagram', label: 'Instagram', icon: InstagramIcon },
  { key: 'youtube', label: 'YouTube', icon: YoutubeIcon },
  { key: 'tiktok', label: 'TikTok', icon: TiktokIcon },
] as const;

export function Footer() {
  const { startOrder } = useOrderStart();
  const year = new Date().getFullYear();
  const hours = company.hours.length > 0;

  return (
    <footer id="contact" className="grain relative z-20 overflow-hidden bg-chilli text-cream" aria-labelledby="contact-heading">
      <div aria-hidden="true" className="absolute -top-40 -left-40 size-[520px] rounded-full bg-turmeric/25 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-10 sm:px-6 sm:pt-28 lg:px-8">
        {/* CTA */}
        <div className="flex flex-col items-start justify-between gap-8 border-b-2 border-turmeric/40 pb-14 lg:flex-row lg:items-end">
          <h2 id="contact-heading" className="max-w-3xl font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95] font-black tracking-tight">
            Ready to stock <span className="text-turmeric italic">the shelves?</span>
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <MagneticButton onClick={() => startOrder()}>
              Order now <ArrowRight className="size-5" aria-hidden="true" />
            </MagneticButton>
            <a
              href={whatsappLink(`Hi ${company.shortName}, I'd like to place an order.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#1f9d55] px-6 py-4 font-bold text-white shadow-lg transition hover:bg-[#178a49]"
            >
              <MessageCircle className="size-5" aria-hidden="true" />
              Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Details */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3">
            <Logo />
            <p className="mt-4 max-w-xs text-cream/75">{company.tagline}</p>
            {hasSocial() && (
              <div className="mt-6 flex gap-2">
                {SOCIAL.filter((s) => company.social[s.key]).map((s) => (
                  <a
                    key={s.key}
                    href={company.social[s.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="grid size-11 place-items-center rounded-full bg-cream/10 transition hover:bg-turmeric hover:text-maroon"
                  >
                    <s.icon className="size-5" aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <address className="not-italic lg:col-span-4">
            <h3 className="mb-4 text-xs font-extrabold tracking-[0.3em] text-turmeric uppercase">Visit us</h3>
            <p className="flex gap-3 text-lg leading-snug text-cream">
              <MapPin className="mt-1 size-5 shrink-0 text-turmeric" aria-hidden="true" />
              <span>
                {company.address.lines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </span>
            </p>
            <a
              href={directionsLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 ml-8 inline-flex items-center gap-2 rounded-full border-2 border-turmeric/60 px-4 py-2 text-sm font-bold text-turmeric transition hover:bg-turmeric hover:text-maroon"
            >
              <Navigation className="size-4" aria-hidden="true" /> Get directions
            </a>
          </address>

          <div className={hours ? 'lg:col-span-3' : 'sm:col-span-2 lg:col-span-5'}>
            <h3 className="mb-4 text-xs font-extrabold tracking-[0.3em] text-turmeric uppercase">Call us</h3>
            <ul className="space-y-3">
              {company.phones.map((p) => (
                <li key={p.dial}>
                  <a href={telLink(p)} className="group flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cream/10 transition group-hover:bg-turmeric group-hover:text-maroon">
                      <Phone className="size-4.5 text-turmeric group-hover:text-maroon" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-[0.65rem] font-bold tracking-[0.2em] text-cream/55 uppercase">{p.label}</span>
                      <span className="tabular block text-lg font-semibold whitespace-nowrap group-hover:text-turmeric">{p.display}</span>
                    </span>
                  </a>
                </li>
              ))}
              <li>
                <a href={telLink(company.mobile)} className="group flex items-center gap-3 rounded-2xl bg-turmeric p-2.5 pr-4 text-maroon transition hover:bg-turmeric-300 sm:inline-flex">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-maroon text-turmeric">
                    <Smartphone className="size-4.5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[0.65rem] font-extrabold tracking-[0.2em] uppercase opacity-75">{company.mobile.label}</span>
                    <span className="tabular block text-lg font-extrabold whitespace-nowrap">{company.mobile.display}</span>
                  </span>
                </a>
              </li>
              {company.email && (
                <li>
                  <a href={`mailto:${company.email}`} className="flex items-center gap-3 break-all hover:text-turmeric">
                    <Mail className="size-5 shrink-0 text-turmeric" aria-hidden="true" /> {company.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {hours && (
            <div className="lg:col-span-2">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-extrabold tracking-[0.3em] text-turmeric uppercase">
                <Clock className="size-4" aria-hidden="true" /> Hours
              </h3>
              <dl className="space-y-1.5">
                {company.hours.map((h) => (
                  <div key={h.days} className="flex justify-between gap-4 border-b border-cream/10 pb-1.5">
                    <dt className="text-cream/75">{h.days}</dt>
                    <dd className="font-semibold">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Map: embed when configured, otherwise a directions card (never placeholder text) */}
        {company.mapEmbedUrl ? (
          <div className="overflow-hidden rounded-3xl border-2 border-turmeric/30">
            <iframe title={`Map to ${company.name}`} src={company.mapEmbedUrl} className="h-64 w-full sm:h-80" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        ) : (
          <a
            href={directionsLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-3xl border-2 border-turmeric/30 bg-maroon/35 p-6 transition hover:border-turmeric sm:flex-row sm:items-center sm:p-8"
          >
            <span aria-hidden="true" className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_14px,rgba(255,195,0,0.06)_14px_28px)]" />
            <span className="relative flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-turmeric text-maroon">
                <MapPin className="size-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-display text-2xl font-bold">Find us in Matara</span>
                <span className="block text-sm text-cream/70">{company.address.oneLine}</span>
              </span>
            </span>
            <span className="relative inline-flex items-center gap-2 font-bold text-turmeric">
              Open in Google Maps <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </span>
          </a>
        )}

        <div className="mt-10 flex flex-col items-start justify-between gap-3 text-sm text-cream/60 sm:flex-row sm:items-center">
          <p>
            © {year} {company.name}. All rights reserved.
          </p>
          <Link to="/admin/login" className="hover:text-turmeric">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}
