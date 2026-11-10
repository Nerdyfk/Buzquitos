'use client';

import { useState, useEffect } from 'react';
import PixelLoader from './PixelLoader';

export default function ClientPageLoader({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Prevent scrolling while loading interface is active
    if (!loaded) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [loaded]);

  return (
    <>
      {/* Loading Interface: Always runs on visit and on reload */}
      {!loaded && (
        <PixelLoader
          onComplete={() => {
            setLoaded(true);
          }}
        />
      )}

      {/* Website Components: Completely hidden until loading is finished */}
      <div
        style={{
          visibility: loaded ? 'visible' : 'hidden',
          opacity: loaded ? 1 : 0,
          pointerEvents: loaded ? 'auto' : 'none',
          height: loaded ? 'auto' : 0,
          overflow: loaded ? 'visible' : 'hidden'
        }}
        className="transition-opacity duration-700 ease-out"
      >
        {children}
      </div>
    </>
  );
}
