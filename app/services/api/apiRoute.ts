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
   * @returns ApiResponse containing full route details plus transformed data
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
      // Initialize an object for transformed data.
      let transformed: any = {}

      // If the response includes a paths array, process the first path.
      if (response.data.paths && response.data.paths.length > 0) {
        const path = response.data.paths[0]
        // Convert points from [lon, lat] to objects with { latitude, longitude }
        if (path.points) {
          transformed.points = path.points.map((point: [number, number]) => ({
            latitude: point[1],
            longitude: point[0],
          }))
        }
        // Convert time (milliseconds) to minutes.
        if (path.time !== undefined) {
          transformed.time_min = path.time / 60000
        }
        // Convert distance (meters) to kilometers.
        if (path.distance !== undefined) {
          transformed.distance_km = path.distance / 1000
        }
      }

      // Return all original data plus the transformed property.
      return {
        ...response,
        data: {
          ...response.data,
          transformed,
        },
      }
    } else {
      return response
    }
  }
}

// Singleton instance of the API for convenience
export const apiRoute = new ApiRoute()
