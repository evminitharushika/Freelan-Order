import { AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { Footer } from '../components/landing/Footer';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Loader } from '../components/landing/Loader';
import { Navbar } from '../components/landing/Navbar';
import { TrustStrip } from '../components/landing/TrustStrip';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { ScrollTrigger, startSmoothScroll } from '../lib/scroll';
import { draftService } from '../services/draftService';

export default function Landing() {
  const reduce = usePrefersReducedMotion();
  const [showIntro, setShowIntro] = useState(() => !draftService.hasSeenIntro() && !reduce);
  const [ready, setReady] = useState(!showIntro);

  useEffect(() => startSmoothScroll(), []);

  useEffect(() => {
    // Fonts change text metrics, so recompute pin positions once they load.
    void document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  const finishIntro = useCallback(() => {
    draftService.markIntroSeen();
    setShowIntro(false);
  }, []);

  return (
    <>
      <AnimatePresence onExitComplete={() => setReady(true)}>{showIntro && <Loader key="loader" onDone={finishIntro} />}</AnimatePresence>
      <Navbar />
      <main>
        <Hero ready={ready} />
        <TrustStrip />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
