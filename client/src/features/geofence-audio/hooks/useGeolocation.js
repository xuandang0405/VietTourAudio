import { useEffect, useState } from 'react';

let lastGpsUpdateTime = 0;

export function useGeolocation(options = {}) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported'));
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (nextPosition) => {
        const now = Date.now();
        if (now - lastGpsUpdateTime < 3000) {
          return;
        }
        lastGpsUpdateTime = now;
        setPosition(nextPosition);
      },
      (nextError) => setError(nextError),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
        ...options
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [options]);

  return { position, error };
}
