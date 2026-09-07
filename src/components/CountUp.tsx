import { useEffect, useState } from "react";

interface CountUpProps {
  target: number;
  prefix?: string;
  duration?: number;
  locale?: string;
}

export default function CountUp({ target, prefix = "₹", duration = 1100, locale = "en-IN" }: CountUpProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return <>{prefix}{value.toLocaleString(locale)}</>;
}
