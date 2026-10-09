import { useRef, useEffect, useState } from 'react';

export default function useAutoFit(deps = []) {
  const ref = useRef(null);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    function measure() {
      const el = ref.current;
      if (!el) return;

      // Reset any previous scaling
      el.style.transform = 'none';
      el.style.width = '100%';
      el.style.height = '100%';

      const available = el.clientHeight;

      // Measure the content height while keeping the element at its real,
      // fixed height. scrollHeight reports the full content height even when
      // it overflows a shorter box with overflow:hidden. We must NOT switch to
      // height:auto here: percentage-sized children (e.g. mermaid images with
      // max-height:75%) resolve against the element height, so an auto height
      // collapses them and the content is measured as far too short — which
      // let tall diagram+text slides overflow without ever being scaled down.
      const prevOverflow = el.style.overflow;
      el.style.overflow = 'hidden';
      void el.offsetHeight; // force reflow

      const needed = el.scrollHeight;

      el.style.overflow = prevOverflow;

      if (needed > available + 5 && available > 0) {
        const ratio = Math.max((available / needed) * 0.95, 0.4);
        setFitScale(ratio);
      } else {
        setFitScale(1);
      }
    }

    // Use two rAFs to ensure DOM is fully painted, then measure once
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        measure();
      });
    });

    // Re-measure when images finish loading
    const el = ref.current;
    if (!el) return;

    const imgs = el.querySelectorAll('img');
    const onLoad = () => requestAnimationFrame(measure);
    imgs.forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', onLoad);
        img.addEventListener('error', onLoad);
      }
    });

    return () => {
      imgs.forEach(img => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onLoad);
      });
    };
  }, deps);

  const fitStyle = fitScale < 1 ? {
    transformOrigin: 'top left',
    transform: `scale(${fitScale})`,
    width: `${100 / fitScale}%`,
    height: `${100 / fitScale}%`,
  } : {};

  return { ref, fitScale, fitStyle };
}
