'use client';

import { useState, useEffect } from 'react';
import PixelLoader from './PixelLoader';

export default function ClientPageLoader() {
  const [showLoader, setShowLoader] = useState(false);
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    // Check if query string forces the loader to display (e.g. /?loader=true)
    const params = new URLSearchParams(window.location.search);
    const force = params.get('loader') === 'true' || params.get('preview') === 'true';

    if (force) {
      setForceShow(true);
      setShowLoader(true);
      return;
    }

    try {
      const seen = sessionStorage.getItem('buzquitos_loader_seen');
      if (seen !== 'true') {
        setShowLoader(true);
      }
    } catch {
      setShowLoader(true);
    }
  }, []);

  if (!showLoader) return null;

  return (
    <PixelLoader
      forceShow={forceShow}
      onComplete={() => {
        setShowLoader(false);
      }}
    />
  );
}

