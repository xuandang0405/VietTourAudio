import { useEffect, useState } from 'react';

export function useGeolocation(options = {}, distanceToTarget = null) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported'));
      return undefined;
    }

    // Đề xuất 1: Bật enableHighAccuracy = false nếu ở cách xa > 10km (10000m)
    // Mặc định là false để tiết kiệm pin nếu chưa rõ khoảng cách
    const isHighAccuracy = distanceToTarget !== null && distanceToTarget < 10000;

    let lastUpdateTime = 0;

    const watchId = navigator.geolocation.watchPosition(
      (nextPosition) => {
        // Đề xuất 2: Throttling 3-5 giây (3000ms)
        const now = Date.now();
        if (now - lastUpdateTime >= 3000) {
          lastUpdateTime = now;
          setPosition(nextPosition);
        }
      },
      (nextError) => setError(nextError),
      {
        enableHighAccuracy: isHighAccuracy,
        timeout: 10000,
        maximumAge: 5000,
        ...options
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [options, distanceToTarget]);

  return { position, error };
}
