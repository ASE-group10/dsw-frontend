import { flow, Instance, SnapshotOut, types } from "mobx-state-tree"
import { apiUser } from "@/services/api"

export const AuthenticationStoreModel = types
  .model("AuthenticationStore", {
    authToken: types.maybe(types.string),
    authEmail: "",
    authUserId: types.maybe(types.string),
  })
  .views((store) => ({
    get isAuthenticated() {
      return !!store.authToken
    },
    get validationError(): string {
      const email = store.authEmail.trim()
      if (!email) return "can't be blank"
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email) ? "" : "must be a valid email address"
    },
  }))
  .actions((store) => {
    const setAuthToken = (value?: string) => {
      store.authToken = value
      const headerKey = "Authorization"

      if (value) {
        apiUser.apisauce.setHeader(headerKey, `Bearer ${value}`)
      } else {
        apiUser.apisauce.deleteHeader(headerKey)
      }
    }

    const setAuthEmail = (value: string) => {
      store.authEmail = value
    }

    const setAuthUserId = (userId?: string) => {
      store.authUserId = userId
    }

    const clearAuthData = () => {
      setAuthToken(undefined)
      setAuthEmail("")
      setAuthUserId(undefined)
    }

    const logout = flow(function* () {
      if (!store.authToken) {
        console.warn("No auth token. Skipping logout API call.")
        clearAuthData()
        return
      }

      try {
        const response = yield apiUser.apisauce.get("/api/logout")

        if (response.ok || response.status === 302) {
          const { message, auth0Response } = response.data ?? {}

          console.log("Logout success:", message)

          const redirectMatch = auth0Response?.match(/https?:\/\/[^\s]+/)
          if (redirectMatch) {
            console.log("Redirect URL:", redirectMatch[0])
            // Possibly redirect: window.location.href = redirectMatch[0]
          }
        } else {
          console.error("Logout failed:", response.problem || response.status)
          if (response.data?.error) {
            console.error("Details:", response.data.error)
          }
        }
      } catch (error) {
        console.error("Exception during logout:", error)
      } finally {
        clearAuthData()
      }
    })

    return {
      setAuthToken,
      setAuthEmail,
      setAuthUserId,
      logout,
    }
  })

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
