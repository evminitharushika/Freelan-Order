/**
 * Company details: the single source of truth for every place that shows contact info
 * (navbar, footer, order success page, print views, WhatsApp buttons).
 *
 * Values marked `TODO: replace` are not filled in yet. Empty values are hidden from the UI,
 * so the live site never shows placeholder text.
 */

export interface PhoneNumber {
  label: string;
  /** Human-friendly, e.g. "+94 41 222 2237" */
  display: string;
  /** Dialable E.164, e.g. "+94412222237" (used for tel: links) */
  dial: string;
}

export interface BusinessHours {
  days: string;
  time: string;
}

const addressLines = ['No. 38, Gunawardana Mawatha', 'Navimana South', 'Matara', 'Sri Lanka'];

export const company = {
  name: 'Freelan Sri Lanka',
  shortName: 'Freelan',
  tagline: 'Pure Sri Lankan flavour, packed fresh.',

  address: {
    lines: addressLines,
    oneLine: addressLines.join(', '),
  },

  /** Landlines */
  phones: [
    { label: 'Office', display: '+94 41 222 2237', dial: '+94412222237' },
    { label: 'Office', display: '+94 41 203 0800', dial: '+94412030800' },
  ] satisfies PhoneNumber[],

  /** Mobile, also used for WhatsApp */
  mobile: { label: 'WhatsApp / Mobile', display: '+94 77 231 4205', dial: '+94772314205' } satisfies PhoneNumber,

  /** wa.me number: country code + number, digits only */
  whatsapp: '94772314205',

  // TODO: replace (left empty = hidden from the site)
  email: '',

  // TODO: replace, e.g. [{ days: 'Mon – Fri', time: '8.30 am – 5.30 pm' }] (empty = hidden)
  hours: [] as BusinessHours[],

  // TODO: replace (each empty link is hidden)
  social: {
    facebook: '',
    instagram: '',
    tiktok: '',
    youtube: '',
  },

  // Optional: Google Maps embed URL (Share → Embed a map → copy the src). Empty = a "Get directions" card is shown instead.
  mapEmbedUrl: '',

  /**
   * Trust-strip claims that cannot be derived from the product data.
   * TODO: confirm. Set `show: false` to hide one.
   */
  claims: {
    islandWide: { show: true, title: 'Island-wide delivery', body: 'Editable placeholder: confirm delivery coverage.' },
    exportQuality: { show: true, title: 'Export quality', body: 'Editable placeholder: confirm certifications.' },
  },
} as const;

export const telLink = (phone: PhoneNumber): string => `tel:${phone.dial}`;

export const whatsappLink = (message?: string): string =>
  `https://wa.me/${company.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

export const directionsLink = (): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address.oneLine)}`;

export const hasSocial = (): boolean => Object.values(company.social).some(Boolean);
