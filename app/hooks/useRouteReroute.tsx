import { useEffect, useState } from "react";
import { useLocationTracking } from "./useLocationTracking";
import { checkIfOffRoute, getNewRoute } from "../utils/rerouteUtils";

interface Route {
  coordinates: [number, number][]; // have to check if structure is correct???it like depends on route data
}

export const useRouteReroute = (selectedRoute: Route, destination: [number, number]) => {
  const [rerouting, setRerouting] = useState(false);
  const [newRoute, setNewRoute] = useState<any>(null);
  const location = useLocationTracking();
  const [lastRerouteTime, setLastRerouteTime] = useState<number>(0);

  useEffect(() => {
    if (!location) return;

    const userCoords: [number, number] = [location.coords.latitude, location.coords.longitude];

    // Checking if the user is off the route
    if (checkIfOffRoute(userCoords, selectedRoute.coordinates)) {
      const now = Date.now();

      // Preventing rapid reroutes by enforcing a cooldown period (e.g., 30 seconds)
      if (!rerouting && now - lastRerouteTime > 30000) {
        setRerouting(true);
        setLastRerouteTime(now);
        rerouteUser(userCoords, destination);
      }
    } else {
      setRerouting(false); // Reset rerouting state if back on route
    }
  }, [location, selectedRoute]);

  const rerouteUser = async (userCoords: [number, number], destination: [number, number]) => {
    try {
      alert("You're off route! Recalculating...");
      const newRouteData = await getNewRoute(userCoords, destination);
      if (newRouteData) {
        setNewRoute(newRouteData);
      }
    } catch (error) {
      console.error("Rerouting failed:", error);
    } finally {
      setRerouting(false);
    }
  };

  return newRoute;
};
