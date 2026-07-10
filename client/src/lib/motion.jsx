import { motion, useReducedMotion } from 'framer-motion';

/**
 * Lightweight, reusable motion helpers.
 * Everything animates only `transform` + `opacity` (GPU-friendly), keeps
 * durations short, and collapses to instant when the user (or a low-end
 * device profile) prefers reduced motion.
 */

const EASE = [0.22, 1, 0.36, 1];

export function FadeIn({ children, delay = 0, y = 14, className, as = 'div', ...rest }) {
  const reduce = useReducedMotion();
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/** Reveals children when scrolled into view (once). Cheap on scroll. */
export function Reveal({ children, delay = 0, y = 20, className, ...rest }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.55, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Parent that staggers its <Stagger.Item> children into view. */
export function Stagger({ children, className, gap = 0.07, ...rest }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, margin: '-6% 0px' }}
      variants={{ show: { transition: { staggerChildren: gap } } }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 18, ...rest }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Page wrapper: a quick fade so route changes feel intentional, not janky. */
export function Page({ children, className }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export { motion };
