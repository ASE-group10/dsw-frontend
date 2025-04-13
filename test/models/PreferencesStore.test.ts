// PreferencesStore.test.ts

import { getSnapshot } from "mobx-state-tree";
import { PreferencesStoreModel } from "../../app/models/PreferencesStore"; // Adjust the import path as needed
import { apiUser } from "../../app/services/api";

// --- Mocks -------------------------------------------------------

// Mock the apisauce methods on the apiUser to simulate API responses.
jest.mock("@/services/api", () => ({
  apiUser: {
    apisauce: {
      get: jest.fn(),
      post: jest.fn(),
    },
  },
}));

describe("PreferencesStore", () => {
  let store: typeof PreferencesStoreModel.Type;

  beforeEach(() => {
    // Create a new instance of the store with default values
    store = PreferencesStoreModel.create({
      notificationsEnabled: true,
      theme: "light",
    });
    // Clear mock histories before each test
    jest.clearAllMocks();
  });

  // --- Synchronous Actions -------------------------------------------------------
  it("setNotificationsEnabled should update notificationsEnabled", () => {
    expect(store.notificationsEnabled).toBe(true);
    store.setNotificationsEnabled(false);
    expect(store.notificationsEnabled).toBe(false);
  });

  it("setTheme should update theme", () => {
    expect(store.theme).toBe("light");
    store.setTheme("dark");
    expect(store.theme).toBe("dark");
  });

  it("clearPreferences should reset preferences to defaults", () => {
    // Change preferences to non-default values first
    store.setNotificationsEnabled(false);
    store.setTheme("dark");

    // Now clear preferences
    store.clearPreferences();

    expect(store.notificationsEnabled).toBe(true);
    expect(store.theme).toBe("light");
  });

  // --- Asynchronous Actions: fetchPreferences -------------------------------------------------------

  describe("fetchPreferences", () => {
    it("should update the store when preferences are fetched successfully", async () => {
      // Simulate a successful API response
      const mockResponse = {
        ok: true,
        data: { notificationsEnabled: false, theme: "dark" },
      };
      (apiUser.apisauce.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      await store.fetchPreferences();

      expect(apiUser.apisauce.get).toHaveBeenCalledWith("/api/users/preferences");
      expect(store.notificationsEnabled).toBe(false);
      expect(store.theme).toBe("dark");
    });

    it("should log a warning when the fetch response is not ok", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      // Simulate an unsuccessful API response.
      const mockResponse = {
        ok: false,
        problem: "SERVER_ERROR",
      };
      (apiUser.apisauce.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      await store.fetchPreferences();

      expect(apiUser.apisauce.get).toHaveBeenCalledWith("/api/users/preferences");
      expect(warnSpy).toHaveBeenCalledWith("Failed to fetch preferences:", "SERVER_ERROR");

      warnSpy.mockRestore();
    });

    it("should log an error if an exception occurs during fetch", async () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      // Simulate an exception thrown during the API call.
      (apiUser.apisauce.get as jest.Mock).mockRejectedValueOnce(new Error("Network failure"));

      await store.fetchPreferences();

      expect(apiUser.apisauce.get).toHaveBeenCalledWith("/api/users/preferences");
      expect(errorSpy).toHaveBeenCalledWith("Error fetching preferences", expect.any(Error));

      errorSpy.mockRestore();
    });
  });

  // --- Asynchronous Actions: updatePreferences -------------------------------------------------------

  describe("updatePreferences", () => {
    it("should post the current preferences if no overrides are provided", async () => {
      // Set initial state to a known value.
      store.setNotificationsEnabled(false);
      store.setTheme("dark");

      // Simulate a successful update response.
      const mockResponse = { ok: true };
      (apiUser.apisauce.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      await store.updatePreferences();

      expect(apiUser.apisauce.post).toHaveBeenCalledWith("/api/users/preferences/update", {
        notificationsEnabled: false,
        theme: "dark",
      });
    });

    it("should post the overridden preferences when provided", async () => {
      // Set initial state
      store.setNotificationsEnabled(true);
      store.setTheme("light");

      // Simulate a successful update response.
      const mockResponse = { ok: true };
      (apiUser.apisauce.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      await store.updatePreferences({ notificationsEnabled: false, theme: "dark" });

      expect(apiUser.apisauce.post).toHaveBeenCalledWith("/api/users/preferences/update", {
        notificationsEnabled: false,
        theme: "dark",
      });
    });

    it("should log a warning if updating preferences fails", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      // Simulate an unsuccessful API response.
      const mockResponse = { ok: false, problem: "TIMEOUT" };
      (apiUser.apisauce.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      await store.updatePreferences();

      expect(apiUser.apisauce.post).toHaveBeenCalledWith("/api/users/preferences/update", {
        notificationsEnabled: true,
        theme: "light",
      });
      expect(warnSpy).toHaveBeenCalledWith("Failed to update preferences:", "TIMEOUT");

      warnSpy.mockRestore();
    });

    it("should log an error if an exception occurs during update", async () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      // Simulate an exception during the API call.
      (apiUser.apisauce.post as jest.Mock).mockRejectedValueOnce(new Error("Update error"));

      await store.updatePreferences();

      expect(apiUser.apisauce.post).toHaveBeenCalledWith("/api/users/preferences/update", {
        notificationsEnabled: true,
        theme: "light",
      });
      expect(errorSpy).toHaveBeenCalledWith("Error updating preferences", expect.any(Error));

      errorSpy.mockRestore();
    });
  });

  // --- Snapshot Testing -------------------------------------------------------
  it("should match the snapshot", () => {
    // Ensure default values are as expected
    expect(getSnapshot(store)).toEqual({
      notificationsEnabled: true,
      theme: "light",
    });
  });
});
