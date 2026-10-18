const intFmt = new Intl.NumberFormat('en-LK');

export const fmtInt = (n: number): string => intFmt.format(Math.round(n));
export const fmtCbm = (n: number): string => n.toFixed(3);
export const fmtKg = (n: number): string => n.toFixed(2);

export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export const fmtDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const cn = (...parts: Array<string | false | null | undefined>): string => parts.filter(Boolean).join(' ');
