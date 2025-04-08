/**
 * This ApiUser class lets you define an API endpoint and methods to request
 * data and process it.
 */

import { ApiResponse, ApisauceInstance, create } from "apisauce"
import Config from "../../config"
import type { ApiConfig } from "./api.types"

// import { MMKV } from "react-native-mmkv"

// Initialize MMKV storage instance
// const storage = new MMKV()

/**
 * Configuring the apisauce instance.
 */
export const USER_API_CONFIG: ApiConfig = {
  url: Config.USER_API_URL, // e.g., "https://example.com"
  timeout: 10000,
}

interface LoginResponse {
  auth0_user_id: string
  token: string
  message: string
  expires_in: number
  token_type: string
}

interface StartJourneyResponse {
  route_id: string
  message?: string
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class ApiUser {
  apisauce: ApisauceInstance
  config: ApiConfig

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = USER_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })

    // // In ApiUser constructor
    // this.apisauce.axiosInstance.interceptors.request.use((config) => {
    //   const token = storage.getString("authToken")
    //   if (token) {
    //     config.headers.Authorization = `Bearer ${token}`
    //   }
    //   return config
    // })
  }

  // ----------------------
  // AUTHENTICATION METHODS
  // ----------------------

  /**
   * Login API
   * @param email - User email
   * @param password - User password
   * @returns ApiResponse
   */
  async login(email: string, password: string): Promise<ApiResponse<any>> {
    const response = await this.apisauce.post("/api/login", { email, password })
    return response
  }

  /**
   * Register API
   * @param email - User email
   * @param name
   * @param phoneNumber
   * @param password - User password
   * @returns ApiResponse
   */
  async register(
    email: string,
    name: string,
    phoneNumber: string,
    password: string,
  ): Promise<ApiResponse<any>> {
    return await this.apisauce.post("/api/signup", { email, name, phoneNumber, password })
  }

  // ------------------
  // USER MANAGEMENT
  // ------------------

  /**
   * Fetch the authenticated user's account info (name, email, picture, createdAt)
   * @returns ApiResponse
   */
  async getAccountInfo(): Promise<ApiResponse<any>> {
    return await this.apisauce.get("/api/users/account")
  }

  /**
   * Fetch user profile
   * @param userId - The ID of the user
   * @returns ApiResponse
   */
  async getUserProfile(userId: string): Promise<ApiResponse<any>> {
    return await this.apisauce.get(`/api/users/${userId}`)
  }

  /**
   * Update user profile
   * @param userId - The ID of the user
   * @param data - Updated user information
   * @returns ApiResponse
   */
  async updateUserProfile(userId: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    return await this.apisauce.put(`/api/users/${userId}`, data)
  }

  // ------------------
  // GENERIC REQUESTS
  // ------------------

  /**
   * Perform a GET request
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @returns ApiResponse
   */
  async get(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<any>> {
    return await this.apisauce.get(endpoint, params)
  }

  /**
   * Perform a POST request
   * @param endpoint - API endpoint
   * @param data - Data to send
   * @returns ApiResponse
   */
  async post(endpoint: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    return await this.apisauce.post(endpoint, data)
  }

  /**
   * Perform a PUT request
   * @param endpoint - API endpoint
   * @param data - Data to send
   * @returns ApiResponse
   */
  async put(endpoint: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    return await this.apisauce.put(endpoint, data)
  }

  /**
   * Perform a DELETE request
   * @param endpoint - API endpoint
   * @returns ApiResponse
   */
  async delete(endpoint: string): Promise<ApiResponse<any>> {
    return await this.apisauce.delete(endpoint)
  }

  // ------------------
  // JOURNEY ENDPOINT
  // ------------------

  async completeJourney(data: Record<string, any>): Promise<ApiResponse<any>> {
    return await this.apisauce.post("/api/routes/complete", data)
  }

  /**
   * Start a journey by posting waypoints to the backend
   * @param waypoints - Array of latitude/longitude points
   * @returns ApiResponse
   */
  async startJourney(
    waypoints: Array<{ latitude: number; longitude: number }>,
  ): Promise<ApiResponse<any>> {
    try {
      // We no longer need to manually set the header here, as we have a request transform

      const payload = { waypoints }
      // console.log("startJourney payload:", JSON.stringify(payload, null, 2))

      const response = await this.apisauce.post<StartJourneyResponse>("/api/routes/start", payload)

      if (response.ok && response.data?.route_id) {
        console.log("Route ID received:", response.data.route_id)
      }

      return response
    } catch (error) {
      console.error("Error in startJourney API call:", error)
      throw error
    }
  }

  async getRouteHistory(): Promise<ApiResponse<any>> {
    const response = await this.apisauce.get("/api/routes/history")
    console.log("User route history:", response.data)
    return response
  }

  /**
   * Update user preferences (e.g., notifications, theme)
   * @param preferences - Object containing preference settings
   * @returns ApiResponse
   */
  async updateUserPreferences(preferences: {
    notificationsEnabled?: boolean
    theme: string
  }): Promise<ApiResponse<any>> {
    return await this.apisauce.post("/api/users/preferences/update", preferences)
  }

  /**
   * Update user's account details like name or profile picture
   * @param accountData - Object with updated account info (e.g., name, picture)
   * @returns ApiResponse
   */
  async updateAccountInfo(accountData: {
    name: string
    picture: string
  }): Promise<ApiResponse<any>> {
    return await this.apisauce.post("/api/users/account/update", accountData)
  }
}

// Singleton instance of the API for convenience
export const apiUser = new ApiUser()
