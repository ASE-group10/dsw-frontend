/**
 * This Api class lets you define an API endpoint and methods to request
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
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  timeout: 10000,
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
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
   * @param password - User password
   * @returns ApiResponse
   */
  async register(email: string, password: string): Promise<ApiResponse<any>> {
    const response = await this.apisauce.post("/api/signup", { email, password })
    return response
  }

  // ------------------
  // USER MANAGEMENT
  // ------------------

  /**
   * Fetch user profile
   * @param userId - The ID of the user
   * @returns ApiResponse
   */
  async getUserProfile(userId: string): Promise<ApiResponse<any>> {
    const response = await this.apisauce.get(`/api/users/${userId}`)
    return response
  }

  /**
   * Update user profile
   * @param userId - The ID of the user
   * @param data - Updated user information
   * @returns ApiResponse
   */
  async updateUserProfile(userId: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.apisauce.put(`/api/users/${userId}`, data)
    return response
  }

  // ------------------
  // POST MANAGEMENT
  // ------------------

  /**
   * Fetch all posts
   * @param params - Optional query parameters
   * @returns ApiResponse
   */
  async getPosts(params?: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.apisauce.get("/api/posts", params)
    return response
  }

  /**
   * Create a new post
   * @param data - Post data
   * @returns ApiResponse
   */
  async createPost(data: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.apisauce.post("/api/posts", data)
    return response
  }

  /**
   * Fetch a specific post by ID
   * @param postId - The ID of the post
   * @returns ApiResponse
   */
  async getPostById(postId: string): Promise<ApiResponse<any>> {
    const response = await this.apisauce.get(`/api/posts/${postId}`)
    return response
  }

  /**
   * Update a post by ID
   * @param postId - The ID of the post
   * @param data - Updated post data
   * @returns ApiResponse
   */
  async updatePost(postId: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.apisauce.put(`/api/posts/${postId}`, data)
    return response
  }

  /**
   * Delete a post by ID
   * @param postId - The ID of the post
   * @returns ApiResponse
   */
  async deletePost(postId: string): Promise<ApiResponse<any>> {
    const response = await this.apisauce.delete(`/api/posts/${postId}`)
    return response
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
    const response = await this.apisauce.get(endpoint, params)
    return response
  }

  /**
   * Perform a POST request
   * @param endpoint - API endpoint
   * @param data - Data to send
   * @returns ApiResponse
   */
  async post(endpoint: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.apisauce.post(endpoint, data)
    return response
  }

  /**
   * Perform a PUT request
   * @param endpoint - API endpoint
   * @param data - Data to send
   * @returns ApiResponse
   */
  async put(endpoint: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.apisauce.put(endpoint, data)
    return response
  }

  /**
   * Perform a DELETE request
   * @param endpoint - API endpoint
   * @returns ApiResponse
   */
  async delete(endpoint: string): Promise<ApiResponse<any>> {
    const response = await this.apisauce.delete(endpoint)
    return response
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
