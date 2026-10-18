import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="grain relative grid min-h-[100svh] place-items-center overflow-hidden bg-chilli px-6 text-center text-cream">
      <div className="relative">
        <p className="font-display text-[clamp(6rem,24vw,14rem)] leading-none font-black text-turmeric">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold">This shelf is empty.</h1>
        <p className="mt-2 text-cream/75">The page you were looking for isn’t here.</p>
        <Link to="/" className="mt-8 inline-block rounded-full bg-turmeric px-7 py-3.5 font-extrabold tracking-wider text-maroon uppercase hover:bg-turmeric-300">
          Back to home
        </Link>
      </div>
    </main>
  );
}
