import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

let lenis: Lenis | null = null;

/** Starts Lenis smooth scrolling wired into GSAP's ticker. Returns a cleanup function. */
export function startSmoothScroll(): () => void {
  if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const instance = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
  lenis = instance;
  instance.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => instance.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    instance.destroy();
    lenis = null;
  };
}

/** Smooth-scrolls to an element id or absolute Y position, using Lenis when active. */
export function scrollToTarget(target: string | number, offset = 0): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof target === 'string') {
    const el = document.getElementById(target);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: reduce ? 'auto' : 'smooth' });
    return;
  }
  if (lenis) lenis.scrollTo(target, { duration: 1.2 });
  else window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
}
