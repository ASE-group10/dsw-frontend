import { useEffect, useState } from "react";
import * as Location from "expo-location";

// tracking the user's real-time location
export const useLocationTracking = (distanceFilter: number = 5) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  let subscription: Location.LocationSubscription | null = null;

  useEffect(() => {
    const startTracking = async () => {
      try {
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Location permission not granted");
          return;
        }

        // Start watching location changes
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: distanceFilter },
          (newLocation) => setLocation(newLocation)
        );
      } catch (error) {
        console.error("Error starting location tracking:", error);
      }
    };

    startTracking();

    return () => {
      // Cleanup when the component unmounts
      if (subscription) {
        subscription.remove();
      }
    };
  }, [distanceFilter]);

  return location;
};
