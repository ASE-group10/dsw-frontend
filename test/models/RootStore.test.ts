// RootStore.test.ts

import { getSnapshot } from "mobx-state-tree";
import { RootStoreModel } from "../../app/models/RootStore.ts"; // Adjust the path as needed

describe("RootStore", () => {
  let rootStore: typeof RootStoreModel.Type;

  beforeEach(() => {
    // Create a fresh instance of the RootStore
    rootStore = RootStoreModel.create({});
  });

  it("should create a RootStore with default values", () => {
    const snapshot = getSnapshot(rootStore);
    expect(snapshot).toEqual({
      authenticationStore: {
        authToken: undefined,
        authEmail: "",
        authUserId: undefined,
        authName: "",
        authPhoneNumber: "",
        authPicture: null,
      },
      preferencesStore: {
        notificationsEnabled: true,
        theme: "light",
      },
    });
  });

  it("should allow updating data in the authenticationStore via the root store", () => {
    // Update properties on the AuthenticationStore that belongs to the RootStore
    rootStore.authenticationStore.setAuthEmail("user@example.com");
    rootStore.authenticationStore.setAuthName("John Doe");
    rootStore.authenticationStore.setAuthToken("sample_token");

    const snapshot = getSnapshot(rootStore);
    expect(snapshot.authenticationStore.authEmail).toBe("user@example.com");
    expect(snapshot.authenticationStore.authName).toBe("John Doe");
    expect(snapshot.authenticationStore.authToken).toBe("sample_token");
  });

  it("should allow updating data in the preferencesStore via the root store", () => {
    // Update properties on the PreferencesStore that belongs to the RootStore
    rootStore.preferencesStore.setTheme("dark");
    rootStore.preferencesStore.setNotificationsEnabled(false);

    const snapshot = getSnapshot(rootStore);
    expect(snapshot.preferencesStore.theme).toBe("dark");
    expect(snapshot.preferencesStore.notificationsEnabled).toBe(false);
  });

  it("should clear authentication data from the root store", () => {
    // Update authentication data first
    rootStore.authenticationStore.setAuthEmail("user@example.com");
    rootStore.authenticationStore.setAuthName("John Doe");
    rootStore.authenticationStore.setAuthToken("sample_token");

    // Now clear auth data using the store's clear method
    rootStore.authenticationStore.clearAuthData();

    const snapshot = getSnapshot(rootStore);
    expect(snapshot.authenticationStore.authEmail).toBe("");
    expect(snapshot.authenticationStore.authName).toBe("");
    expect(snapshot.authenticationStore.authToken).toBeUndefined();
  });

  it("should reset preferences to defaults", () => {
    // Change preferences values
    rootStore.preferencesStore.setTheme("dark");
    rootStore.preferencesStore.setNotificationsEnabled(false);

    // Clear/reset preferences
    rootStore.preferencesStore.clearPreferences();

    const snapshot = getSnapshot(rootStore);
    expect(snapshot.preferencesStore.notificationsEnabled).toBe(true);
    expect(snapshot.preferencesStore.theme).toBe("light");
  });
});
