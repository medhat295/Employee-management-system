import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (target === 0) { setCount(0); return; }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setCount(Math.round((1 - (1 - p) ** 3) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return count;
}
