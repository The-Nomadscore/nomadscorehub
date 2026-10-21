import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// All landing page motion lives here. Sections only carry markers:
//   data-hero-item     rises in once on load
//   data-parallax="N"  drifts N px over its section while scrolling (desktop only)
//   data-hero-fade     fades slightly as the hero scrolls away
//   data-reveal        rises in when scrolled into view
//   data-reveal-late   same, for elements that appear after data loads
// Nothing here runs when the visitor prefers reduced motion.

const MOTION_OK = '(prefers-reduced-motion: no-preference)';
const MOTION_OK_DESKTOP = `${MOTION_OK} and (min-width: 768px)`;

function revealOnScroll(items) {
  if (items.length === 0) return;
  gsap.set(items, { opacity: 0, y: 32 });
  ScrollTrigger.batch(items, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.1,
        overwrite: true,
      }),
  });
}

export default function useLandingMotion(scopeRef, { ready }) {
  // Content that exists from the first render.
  useLayoutEffect(() => {
    const root = scopeRef.current;
    if (!root) return undefined;
    const find = (selector) => gsap.utils.toArray(selector, root);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        gsap.from(find('[data-hero-item]'), {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: 'power2.out',
          stagger: 0.08,
        });
        revealOnScroll(find('[data-reveal]'));
      });

      mm.add(MOTION_OK_DESKTOP, () => {
        find('[data-parallax]').forEach((el) => {
          gsap.to(el, {
            y: Number(el.dataset.parallax),
            ease: 'none',
            scrollTrigger: {
              trigger: el.closest('section'),
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });
        });
        find('[data-hero-fade]').forEach((el) => {
          gsap.to(el, {
            opacity: 0.15,
            ease: 'none',
            scrollTrigger: {
              trigger: el.closest('section'),
              start: 'center top',
              end: 'bottom top',
              scrub: true,
            },
          });
        });
      });
    }, root);

    return () => ctx.revert();
  }, [scopeRef]);

  // Content that appears once the cities have loaded.
  useLayoutEffect(() => {
    const root = scopeRef.current;
    if (!ready || !root) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        revealOnScroll(gsap.utils.toArray('[data-reveal-late]', root));
        ScrollTrigger.refresh();
      });
    }, root);

    return () => ctx.revert();
  }, [scopeRef, ready]);
}