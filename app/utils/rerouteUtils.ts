import * as turf from "@turf/turf";

// Checks if the user is off-route (more than 10m away from the planned route)
export function checkIfOffRoute(userCoords: [number, number], selectedRoute: any): boolean {
  if (!selectedRoute || !Array.isArray(selectedRoute)) return false;

  const routeLine = turf.lineString(selectedRoute);
  const userPoint = turf.point(userCoords);
  const nearestPoint = turf.nearestPointOnLine(routeLine, userPoint);
  const distance = turf.distance(userPoint, nearestPoint, { units: "meters" });

  return distance > 10; // checking if user goes Off-route if distance is greater than 10m
}

// here calling  the /route API to fetch a new route when the user goes off-track
export async function getNewRoute(origin: [number, number], destination: [number, number]): Promise<any> {
  try {
    const response = await fetch(`/route?origin=${origin.join(",")}&destination=${destination.join(",")}`);
    if (!response.ok) throw new Error("Failed to fetch new route");
    return await response.json();
  } catch (error) {
    console.error("Error fetching new route:", error);
    return null;
  }
}
