// AuthenticationStore.test.ts

import { getSnapshot } from "mobx-state-tree";
import { AuthenticationStoreModel } from "../../app/models/AuthenticationStore"
import { apiUser, apiReward } from "../../app/services/api"

// Mock the API modules
jest.mock("../../app/services/api", () => ({
  apiUser: {
    apisauce: {
      setHeader: jest.fn(),
      deleteHeader: jest.fn(),
      get: jest.fn(),
    },
  },
  apiReward: {
    apisauce: {
      setHeader: jest.fn(),
      deleteHeader: jest.fn(),
    },
  },
}));

describe("AuthenticationStore", () => {
  let store: typeof AuthenticationStoreModel.Type;

  beforeEach(() => {
    // Create a fresh store instance with default values.
    store = AuthenticationStoreModel.create({
      authToken: undefined,
      authEmail: "",
      authUserId: undefined,
      authName: "",
      authPhoneNumber: "",
      authPicture: null,
    });

    // Reset mock call history for each test.
    jest.clearAllMocks();
  });

  // --- Computed Views -------------------------------------------------------
  it("should report isAuthenticated as false when no token exists", () => {
    expect(store.isAuthenticated).toBe(false);
  });

  it("should show a validation error if authEmail is blank", () => {
    // With default (blank) email the error should be present.
    expect(store.validationError).toBe("Email can't be blank");
  });

  it("should have an empty validation error if a valid email is set", () => {
    store.setAuthEmail("test@example.com");
    expect(store.validationError).toBe("");
  });

  // --- Actions: Setter Methods -------------------------------------------------------
  it("setAuthToken should update token and set headers", () => {
    store.setAuthToken("token123");

    expect(store.authToken).toBe("token123");
    expect(apiUser.apisauce.setHeader).toHaveBeenCalledWith("Authorization", "Bearer token123");
    expect(apiReward.apisauce.setHeader).toHaveBeenCalledWith("Authorization", "Bearer token123");
  });

  it("setAuthToken should clear token and delete headers when passed undefined", () => {
    // First set a token
    store.setAuthToken("token123");
    // Then clear it
    store.setAuthToken(undefined);

    expect(store.authToken).toBeUndefined();
    expect(apiUser.apisauce.deleteHeader).toHaveBeenCalledWith("Authorization");
    expect(apiReward.apisauce.deleteHeader).toHaveBeenCalledWith("Authorization");
  });

  it("setAuthEmail should update the authEmail", () => {
    store.setAuthEmail("user@example.com");
    expect(store.authEmail).toBe("user@example.com");
  });

  it("setAuthUserId should update the authUserId", () => {
    store.setAuthUserId("user-1");
    expect(store.authUserId).toBe("user-1");
  });

  it("setAuthName should update the authName", () => {
    store.setAuthName("John Doe");
    expect(store.authName).toBe("John Doe");
  });

  it("setAuthPhoneNumber should update the authPhoneNumber", () => {
    store.setAuthPhoneNumber("1234567890");
    expect(store.authPhoneNumber).toBe("1234567890");
  });

  it("setAuthPicture should update the authPicture", () => {
    store.setAuthPicture("pic.jpg");
    expect(store.authPicture).toBe("pic.jpg");

    // Test setting it to undefined or null
    store.setAuthPicture(undefined);
    expect(store.authPicture).toBeNull();
  });

  it("clearAuthData should reset all auth values", () => {
    // First modify the store values.
    store.setAuthToken("token123");
    store.setAuthEmail("user@example.com");
    store.setAuthUserId("user-1");
    store.setAuthName("John Doe");
    store.setAuthPhoneNumber("1234567890");
    store.setAuthPicture("pic.jpg");

    // Clear all authentication data.
    store.clearAuthData();

    expect(store.authToken).toBeUndefined();
    expect(store.authEmail).toBe("");
    expect(store.authUserId).toBeUndefined();
    expect(store.authName).toBe("");
    expect(store.authPhoneNumber).toBe("");
    expect(store.authPicture).toBeNull();
  });

  // --- Actions: Logout Flow -------------------------------------------------------
  describe("logout", () => {
    it("should skip the logout API call if no auth token exists", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      await store.logout();

      // Since there was no token, warn should have been logged and auth data cleared.
      expect(warnSpy).toHaveBeenCalledWith("No auth token. Skipping logout API call.");
      expect(store.authToken).toBeUndefined();
      warnSpy.mockRestore();
    });

    it("should perform a successful logout", async () => {
      // Set a token to simulate a logged in state.
      store.setAuthToken("token123");

      // Simulate a successful API logout response.
      const response = {
        ok: true,
        status: 200,
        data: { message: "Logged out", auth0Response: "http://redirect.url" },
      };
      (apiUser.apisauce.get as jest.Mock).mockResolvedValueOnce(response);

      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      await store.logout();

      expect(apiUser.apisauce.get).toHaveBeenCalledWith("/api/logout");
      expect(logSpy).toHaveBeenCalledWith("Logout success:", "Logged out");

      // Verify that after logout the store's authToken was cleared.
      expect(store.authToken).toBeUndefined();

      logSpy.mockRestore();
    });

    it("should handle logout failure by logging an error", async () => {
      // Set a token to simulate a logged in state.
      store.setAuthToken("token123");

      // Simulate an API failure response.
      const errorResponse = {
        ok: false,
        status: 500,
        problem: "NETWORK_ERROR",
        data: { error: "Server error" },
      };
      (apiUser.apisauce.get as jest.Mock).mockResolvedValueOnce(errorResponse);

      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await store.logout();

      expect(apiUser.apisauce.get).toHaveBeenCalledWith("/api/logout");
      expect(errorSpy).toHaveBeenCalledWith("Logout failed:", "NETWORK_ERROR");
      expect(errorSpy).toHaveBeenCalledWith("Details:", "Server error");

      // The store should clear auth data even on a logout failure.
      expect(store.authToken).toBeUndefined();

      errorSpy.mockRestore();
    });

    it("should handle exceptions during logout", async () => {
      // Set a token to simulate a logged in state.
      store.setAuthToken("token123");

      // Simulate an exception during the API call.
      (apiUser.apisauce.get as jest.Mock).mockRejectedValueOnce(new Error("Exception"));

      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await store.logout();

      expect(apiUser.apisauce.get).toHaveBeenCalledWith("/api/logout");
      expect(errorSpy).toHaveBeenCalledWith("Exception during logout:", expect.any(Error));

      // Verify that the store cleared its auth token on exception.
      expect(store.authToken).toBeUndefined();

      errorSpy.mockRestore();
    });
  });
});
