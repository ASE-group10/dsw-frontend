import { flow, Instance, SnapshotOut, types } from "mobx-state-tree"
import { api } from "../services/api" // Import your API service

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    authToken: types.maybe(types.string),
    authEmail: "",
  })
  .views((store) => ({
    get isAuthenticated() {
      return !!store.authToken
    },
    get validationError() {
      if (store.authEmail.length === 0) return "can't be blank"
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.authEmail))
        return "must be a valid email address"
      return ""
    },
  }))
  .actions((store) => ({
    setAuthToken(value?: string) {
      store.authToken = value
      if (value) {
        api.apisauce.setHeader("Authorization", `Bearer ${value}`) // Set the token in API headers
      } else {
        api.apisauce.deleteHeader("Authorization") // Clear the token from API headers
      }
    },
    setAuthEmail(value: string) {
      store.authEmail = value.replace(/ /g, "")
    },
    logout: flow(function* () {
      if (!store.authToken) {
        console.error("No auth token found. Cannot log out.")
        return
      }

      try {
        // Make a GET request to /api/logout
        const response = yield api.apisauce.get("/api/logout")
        if (response.ok) {
          console.log("Logout successful.")
        } else {
          console.error("Failed to log out:", response.problem || "Unknown error", response.status)
        }
      } catch (error) {
        console.error("Error during logout:", error)
      } finally {
        // Clear authentication details regardless of the API call result
        store.authToken = undefined
        store.authEmail = ""
      }
    }),
  }))

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
