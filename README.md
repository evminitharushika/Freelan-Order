# Freelan Sri Lanka — Orders

Frontend-only ordering site for Freelan Sri Lanka (spices & food products): an animated landing page, a box-based order sheet built from the company's Excel order form, and a small admin area. There is no backend; a mock data layer in `src/services/` stores everything in the browser's localStorage and can be swapped for a real API later.

**Stack:** React 19 · Vite · TypeScript (strict) · Tailwind CSS v4 · React Router · Framer Motion · GSAP ScrollTrigger + Lenis · lucide-react · react-hook-form + zod.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run typecheck  # tsc --noEmit
```

## Demo admin login

| Email | Password |
|---|---|
| `admin@freelan.lk` | `Admin@123` |

The login page shows this hint in development only. Changes made on **My Profile** (email or password) are saved by `authService` and are required for the next login. To reset, clear the site's localStorage (keys start with `freelan:`).

## Routes

| Path | Page |
|---|---|
| `/` | Landing page (hero, scroll-driven product showcase, trust strip, footer) |
| `/order` | Order sheet (asks for customer name/phone first) |
| `/order/success/:ref` | Confirmation, print/PDF and WhatsApp |
| `/admin/login` | Admin login |
| `/admin`, `/admin/orders` | Dashboard / orders list (protected) |
| `/admin/orders/:id` | Order detail: approve / reject, timeline, print |
| `/admin/profile` | My Profile: change email and password |

## Product data: regenerate from a new Excel file

`src/data/products.json` is generated from `order-form.xlsx` (sheet **"OIF 09.17 Update"**):

```bash
npm run convert                        # reads ./order-form.xlsx, then re-matches images
node scripts/convert-xlsx.mjs other.xlsx   # a different workbook (then run npm run match-images)
```

The converter prints the item count per category and warns about rows with missing pack sizes, CBM or kg. Category header rows set the category for the rows below them. Exactly one of the pack-type columns (D–I) holds packets per box. Column J (CBM per box) formulas are evaluated, and column N is kg per packet. Columns K, L, M and O are ignored because the app recomputes them:

- Packets = boxes × packets per box
- CBM = boxes × CBM per box
- Kg = packets × kg per packet

## Product images

Put photos in **`public/products/items/`** (any of `.png .jpg .jpeg .webp .avif`), then run:

```bash
npm run match-images
```

`scripts/match-images.mjs` matches files to products **by product name**, so one image covers every size of that product. It normalizes names (case, spaces/underscores/dots, weights like `250g`, suffixes like `-Bottle`/`-Canisters`, and known typos), then tries an exact slug, then the slug without the weight, then a fuzzy match (≥ 0.85). Matches are written to `products.json` as an `image` field. A report is printed and saved to `scripts/image-report.txt`, listing matches, items without images, unused files and anything that needs a manual match.

Good file names: `turmeric-powder.jpg`, `Chilli Powder.png`, `cinnamon_stick_c4.webp`.

**Manual fixes:** add entries to `src/data/image-overrides.json`, then re-run `npm run match-images`. Overrides win over automatic matching:

```json
{ "Pepper Powder -Canisters": "black-pepper-canister.jpg" }
```

Recommended image size: about 900 px on the long side, under 300 KB (WebP preferred), product centred on a transparent or white background.

## Contact details

All contact information lives in **`src/config/company.ts`**: address, landlines, mobile/WhatsApp, email, hours, social links and the optional map embed. The navbar, footer, success page, print views and WhatsApp buttons all read from this one file. Phone numbers are stored as `display` and `dial` (E.164) and rendered as `tel:` links.

Fields marked `TODO: replace` (email, business hours, social links) are **hidden from the site while empty**, so no placeholder text is ever shown. Fill them in and they appear automatically.

## Project structure

```
scripts/        convert-xlsx.mjs, match-images.mjs, screenshot.mjs (Playwright visual check)
src/config/     company.ts: contact details (single source of truth)
src/data/       products.json (generated), catalog.ts (categories, grouping), image-overrides.json
src/services/   authService, orderService, draftService, storage (only module touching localStorage)
src/hooks/      useAuth, useOrderStart, useOrderDraft, useMediaQuery
src/lib/        types, calc (order maths), format, scroll (GSAP + Lenis)
src/components/ landing/, order/, admin/, product/, ui/, brand/
src/pages/      Landing, OrderPage, OrderSuccess, NotFound, admin/*
```

### Swapping in a real backend

Components only talk to the `AuthService` and `OrderService` interfaces in `src/services/`. Re-implement those two objects with `fetch` calls (same method signatures, all async apart from `currentSession()`), and the UI needs no changes.

## Notes

- Animations respect `prefers-reduced-motion`: there is no intro loader, no smooth scroll, no pinned showcase (stacked panels instead) and no confetti.
- The intro loader only plays on the first visit (`freelan:intro-seen`).
- An in-progress order sheet is saved on the device, so a refresh doesn't lose it.
- Visual check: `npm run dev`, then `node scripts/screenshot.mjs` writes desktop and mobile screenshots to `./screenshots/`.
