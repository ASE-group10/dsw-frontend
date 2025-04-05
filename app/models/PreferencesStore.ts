import { flow, Instance, SnapshotOut, types } from "mobx-state-tree"
import { apiUser } from "@/services/api"

export const PreferencesStoreModel = types
  .model("PreferencesStore", {
    notificationsEnabled: true,
    theme: types.optional(types.enumeration(["light", "dark"]), "light"),
  })
  .actions((store) => {
    const setNotificationsEnabled = (value: boolean) => {
      store.notificationsEnabled = value
    }

    const setTheme = (theme: "light" | "dark") => {
      store.theme = theme
    }

    const clearPreferences = () => {
      store.notificationsEnabled = true
      store.theme = "light"
    }

    const fetchPreferences = flow(function* () {
      try {
        const response = yield apiUser.apisauce.get("/api/users/preferences")
        if (response.ok && response.data) {
          const { notificationsEnabled, theme } = response.data
          store.notificationsEnabled = notificationsEnabled
          store.theme = theme
        } else {
          console.warn("Failed to fetch preferences:", response.problem)
        }
      } catch (e) {
        console.error("Error fetching preferences", e)
      }
    })

    const updatePreferences = flow(function* () {
      try {
        const response = yield apiUser.apisauce.post("/api/users/preferences/update", {
          notificationsEnabled: store.notificationsEnabled,
          theme: store.theme,
        })
        if (!response.ok) {
          console.warn("Failed to update preferences:", response.problem)
        }
      } catch (e) {
        console.error("Error updating preferences", e)
      }
    })

    return {
      setNotificationsEnabled,
      setTheme,
      clearPreferences,
      fetchPreferences,
      updatePreferences,
    }
  })

export interface PreferencesStore extends Instance<typeof PreferencesStoreModel> {}
export interface PreferencesStoreSnapshot extends SnapshotOut<typeof PreferencesStoreModel> {}
