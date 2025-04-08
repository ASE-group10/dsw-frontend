import { flow, Instance, SnapshotOut, types } from "mobx-state-tree"
import { ApiResponse } from "apisauce"
import { apiUser } from "@/services/api"

export const AuthenticationStoreModel = types
  .model("AuthenticationStore", {
    authToken: types.maybe(types.string),
    authEmail: "",
    authUserId: types.maybe(types.string),
    authName: "",
    authPhoneNumber: "",
    authPicture: types.maybeNull(types.string),
  })
  .views((store) => ({
    get isAuthenticated() {
      return !!store.authToken
    },
    get validationError(): string {
      const email = store.authEmail.trim()
      if (!email) return "Email can't be blank"
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) return "Email must be valid"
      return ""
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

    const setAuthName = (value: string) => {
      store.authName = value
    }

    const setAuthPhoneNumber = (value: string) => {
      store.authPhoneNumber = value
    }

    const setAuthPicture = (value?: string | null) => {
      store.authPicture = value ?? null
    }

    const clearAuthData = () => {
      setAuthToken(undefined)
      setAuthEmail("")
      setAuthUserId(undefined)
      setAuthName("")
      setAuthPhoneNumber("")
      setAuthPicture(null)
    }

    const logout = flow(function* () {
      if (!store.authToken) {
        console.warn("No auth token. Skipping logout API call.")
        clearAuthData()
        return
      }

      try {
        const response: ApiResponse<any> = yield apiUser.apisauce.get("/api/logout") as any

        if (response.ok || response.status === 302) {
          const { message, auth0Response } = response.data ?? {}
          setAuthToken(undefined)
          console.log("Logout success:", message)

          const redirectMatch = auth0Response?.match(/https?:\/\/[^\s]+/)
          if (redirectMatch) {
            console.log("Redirect URL:", redirectMatch[0])
            // Possibly redirect: window.location.href = redirectMatch[0]
          }
        } else {
          console.error("Logout failed:", response.problem)
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
      setAuthName,
      setAuthPhoneNumber,
      setAuthPicture,
      clearAuthData,
      logout,
    }
  })

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
