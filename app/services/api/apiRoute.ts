/**
 * This ApiUser class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://docs.infinite.red/ignite-cli/boilerplate/app/services/#backend-api-integration)
 * documentation for more details.
 */
import { ApiResponse, ApisauceInstance, create } from "apisauce"
import Config from "../../config"
import type { ApiConfig } from "./api.types"

/**
 * Configuring the apisauce instance.
 */
export const ROUTE_API_CONFIG: ApiConfig = {
  url: Config.ROUTE_API_URL,
  timeout: 10000,
}
/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class ApiRoute {
  apisauce: ApisauceInstance
  config: ApiConfig

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = ROUTE_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })
  }

  // ----------------------
  // ROUTE CALCULATION METHODS
  // ----------------------

  /**
   * Fetches a navigation route from the backend API.
   * @param fromLat - Starting latitude
   * @param fromLon - Starting longitude
   * @param toLat - Destination latitude
   * @param toLon - Destination longitude
   * @param mode - Mode of travel (e.g., "car", "bike", "walk")
   * @returns ApiResponse containing route details
   */
  async getNavigationRoute(
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number,
    mode: string = "car",
  ): Promise<ApiResponse<any>> {
    const response = await this.apisauce.post("/route", {
      points: [
        [fromLon, fromLat], // API expects [longitude, latitude]
        [toLon, toLat],
      ],
      mode,
    })

    if (response.ok && response.data) {
      // Extract the first path from the response
      const path = response.data.paths[0]
      // Convert points from [lon, lat] to {latitude, longitude}
      const routeCoordinates = path.points.map((point: [number, number]) => ({
        latitude: point[1],
        longitude: point[0],
      }))
      // Convert time from milliseconds to minutes and distance from meters to kilometers
      const timeMin = path.time / 60000
      const distanceKm = path.distance / 1000

      return {
        ...response,
        data: {
          points: routeCoordinates,
          time_min: timeMin,
          distance_km: distanceKm,
        },
      }
    } else {
      return response
    }
  }
}

// Singleton instance of the API for convenience
export const apiRoute = new ApiRoute()
