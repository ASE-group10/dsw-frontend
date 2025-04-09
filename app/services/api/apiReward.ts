/**
 * This apiReward class lets you define an API endpoint and methods to request
 * data and process it.
 */
import { ApiResponse, ApisauceInstance, create } from "apisauce"
import Config from "../../config"
import type { ApiConfig } from "./api.types"

/**
 * Configuring the apisauce instance.
 */
export const REWARD_API_CONFIG: ApiConfig = {
  url: Config.REWARD_API_URL,
  timeout: 10000,
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class ApiReward {
  apisauce: ApisauceInstance
  config: ApiConfig

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = REWARD_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })

    // Log each request with extra information including token presence
    this.apisauce.addRequestTransform((request) => {
      console.log("API Request Initiated:")
      console.log("  Base URL:", this.config.url)
      console.log("  Method:", request.method?.toUpperCase())
      console.log("  Full URL:", this.config.url + request.url)
      console.log("  Headers:", request.headers)
      if (request.headers && request.headers.Authorization) {
        console.log("  Authorization Token:", request.headers.Authorization)
      } else {
        console.log("  No Authorization token present.")
      }
      if (request.data) {
        console.log("  Request Data:", request.data)
      }
      if (request.params) {
        console.log("  Request Params:", request.params)
      }
    })

    // Log each response with extra details
    this.apisauce.addResponseTransform((response) => {
      console.log("API Response Received:")
      console.log("  Status:", response.status)
      console.log("  URL:", response.config.url)
      console.log("  Request Headers:", response.config.headers)
      console.log("  Response Headers:", response.headers)
      if (response.data) {
        console.log("  Response Data:", response.data)
      }
    })
  }

  // ------------------
  // GENERIC REQUESTS
  // ------------------

  async get(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<any>> {
    return await this.apisauce.get(endpoint, params)
  }

  async post(endpoint: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    return await this.apisauce.post(endpoint, data)
  }

  async put(endpoint: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    return await this.apisauce.put(endpoint, data)
  }

  async delete(endpoint: string): Promise<ApiResponse<any>> {
    return await this.apisauce.delete(endpoint)
  }

  // ------------------
  // CUSTOM REQUESTS
  // ------------------

  async getRewardsHistory(): Promise<ApiResponse<any>> {
    return await this.apisauce.get("/rewards-history")
  }

  async getEligibleCoupons(): Promise<ApiResponse<any>> {
    return await this.apisauce.get("/coupons/eligible")
  }

  async redeemCoupon(couponId: string): Promise<ApiResponse<any>> {
    return await this.apisauce.post("/coupons/redeem", { couponId })
  }

  async getTotalRewards(): Promise<ApiResponse<any>> {
    return await this.apisauce.get("/total-rewards")
  }
}

// Singleton instance of the API for convenience
export const apiReward = new ApiReward()
