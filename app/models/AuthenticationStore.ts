import { flow, Instance, SnapshotOut, types } from "mobx-state-tree"
import { apiUser } from "../services/api" // Import your API service

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    authToken: types.maybe(types.string), // Store the token
    authEmail: "", // Store the email
    authUserId: types.maybe(types.string), // Add authUserId to store
  })
  .views((store) => ({
    get isAuthenticated() {
      return !!store.authToken
    },
    get validationError() {
      console.log("authEmail during validation:", store.authEmail)

      const trimmedEmail = store.authEmail.trim()
      if (trimmedEmail.length === 0) return "can't be blank"
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return "must be a valid email address"
      return ""
    },
  }))
  .actions((store) => ({
    setAuthToken(value?: string) {
      store.authToken = value
      if (value) {
        apiUser.apisauce.setHeader("Authorization", `Bearer ${value}`) // Set the token in API headers
      } else {
        apiUser.apisauce.deleteHeader("Authorization") // Clear the token from API headers
      }
    },
    setAuthEmail(value: string) {
      store.authEmail = value
    },
    setAuthUserId(userId?: string) {
      // New action to set authUserId
      store.authUserId = userId
    },
    logout: flow(function* () {
      if (!store.authToken) {
        console.error("No auth token found. Cannot log out.")
        return
      }

      try {
        // Make a GET request to /api/logout
        const response = yield apiUser.apisauce.get("/api/logout")

        // Check for success or redirection
        if (response.ok || response.status === 302) {
          const { message, auth0Response } = response.data

          console.log("Logout Response:", message)
          console.log("Auth0 Response:", auth0Response)

          // Handle redirection
          if (auth0Response?.includes("Redirecting")) {
            const redirectUrlMatch = auth0Response.match(/http[s]?:\/\/[^\s]+/) // Extract redirect URL
            if (redirectUrlMatch) {
              console.log("Redirect URL:", redirectUrlMatch[0])
              // If necessary, navigate to the redirect URL
              // window.location.href = redirectUrlMatch[0];
            }
          }

          // Clear authentication details
          store.authToken = undefined
          store.authEmail = ""
          store.authUserId = undefined
        } else {
          console.error("Failed to log out:", response.problem || "Unknown error", response.status)
          if (response.data?.error) {
            console.error("Error Details:", response.data.error)
          }
        }
      } catch (error) {
        console.error("Error during logout:", error)
      } finally {
        // Always clear authentication data
        store.authToken = undefined
        store.authEmail = ""
        store.authUserId = undefined
      }
    }),
  }))

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
