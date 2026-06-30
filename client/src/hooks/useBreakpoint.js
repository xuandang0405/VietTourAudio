import { useState, useEffect } from 'react';

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState('mobile');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setBreakpoint('pc');
      } else if (width >= 768) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('mobile');
      }
    };

    // Initial check
    checkBreakpoint();

    // Add event listener
    window.addEventListener('resize', checkBreakpoint);

    // Cleanup
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
}
