import { ApiResponse, ApisauceInstance, create } from "apisauce"
import Config from "../../config"
import type { ApiConfig } from "./api.types"

/**
 * Configuring the apisauce instance for route calculations.
 */
export const ROUTE_API_CONFIG: ApiConfig = {
  url: Config.ROUTE_API_URL, // e.g. "http://10.0.2.2:8080"
  timeout: 10000,
}

// Just to be sure we're seeing the actual URL at runtime
console.log("ROUTE_API_URL:", Config.ROUTE_API_URL)

/**
 * Manages all requests related to route calculations.
 * You can use this class to interact with the route calculation backend API.
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
   * Fetches a multi-stop navigation route from the backend API.
   * @param stops - An array of stops as [longitude, latitude] pairs.
   * @param modes - An array of modes corresponding to the segments between stops.
   * @returns ApiResponse containing route details and transformed data.
   */
  async getMultiStopNavigationRoute(
    stops: [number, number][],
    modes: string[],
  ): Promise<ApiResponse<any>> {
    try {
      // console.log("[ApiRoute] Calling getMultiStopNavigationRoute with:", {
      //   stops,
      //   modes,
      // })
      const response = await this.apisauce.post("/route", {
        points: stops,
        modes: modes,
      })

      return response
    } catch (error) {
      // Catch any thrown errors (e.g., if axios/apiause fails unexpectedly)
      console.error("[ApiRoute] Error in getMultiStopNavigationRoute:", error)
      throw error
    }
  }
}

// Singleton instance of the API for convenience
export const apiRoute = new ApiRoute()
