import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import { LoginScreen } from "../../app/screens/LoginScreen"
import { apiUser } from "../../app/services/api"
import { TestWrapper } from "../utils/TestWrapper"

jest.mock("@/services/api", () => ({
  apiUser: {
    login: jest.fn(),
    getAccountInfo: jest.fn(),
  },
}))

const mockSetAuthName = jest.fn()
const mockSetAuthPhoneNumber = jest.fn()
const mockSetAuthEmail = jest.fn()
const mockSetAuthPicture = jest.fn()
const mockSetAuthToken = jest.fn()
const mockSetAuthUserId = jest.fn()
const mockFetchPreferences = jest.fn().mockResolvedValue(undefined)

jest.mock("@/models", () => ({
  useStores: () => ({
    authenticationStore: {
      setAuthName: mockSetAuthName,
      setAuthPhoneNumber: mockSetAuthPhoneNumber,
      authEmail: "",
      setAuthPicture: mockSetAuthPicture,
      setAuthEmail: mockSetAuthEmail,
      setAuthToken: mockSetAuthToken,
      setAuthUserId: mockSetAuthUserId,
      validationError: "",
    },
    preferencesStore: {
      fetchPreferences: mockFetchPreferences,
    },
  }),
}))

jest.mock("@/utils/useAppTheme", () => ({
  useAppTheme: () => ({
    themed: (styles: any) => styles,
    theme: { colors: { palette: { neutral800: "#000" }, error: "red" } },
  }),
}))

const createTestProps = (props: object) => ({
  navigation: { navigate: jest.fn() },
  ...props,
})

describe("LoginScreen", () => {
  let props: any

  beforeEach(() => {
    props = createTestProps({})
    jest.clearAllMocks()
  })

  const renderLoginScreen = () =>
    render(
      <TestWrapper>
        <LoginScreen {...props} />
      </TestWrapper>,
    )

  it("renders screen elements", () => {
    const { getByText, getByTestId, getByPlaceholderText } = renderLoginScreen()

    expect(getByText("Log In")).toBeTruthy()
    expect(getByText("Enter your details below")).toBeTruthy()
    expect(getByTestId("create-account-button")).toBeTruthy()
    expect(getByTestId("login-button")).toBeTruthy()
    expect(getByPlaceholderText("Email")).toBeTruthy()
    expect(getByPlaceholderText("Password")).toBeTruthy()
  })

  it("navigates to SignUp screen", () => {
    const { getByTestId } = renderLoginScreen()
    fireEvent.press(getByTestId("create-account-button"))
    expect(props.navigation.navigate).toHaveBeenCalledWith("SignUp")
  })

  it("shows error message if email or password is missing", async () => {
    const { getByTestId, getByText } = renderLoginScreen()
    fireEvent.press(getByTestId("login-button"))
    await waitFor(() =>
      expect(getByText("Please enter a valid email and password.")).toBeTruthy(),
    )
  })

  it("logs in successfully and updates state", async () => {
    const testEmail = "user@test.com"
    const testPassword = "secret"

    // @ts-ignore
    apiUser.login.mockResolvedValueOnce({
      status: 200,
      data: { token: "abc123", auth0_user_id: "user123" },
      ok: true,
    })

    // @ts-ignore
    apiUser.getAccountInfo.mockResolvedValueOnce({
      ok: true,
      data: {
        name: "Test User",
        email: testEmail,
        phoneNumber: "123456789",
        picture: "avatar.png",
      },
    })

    const { getByTestId, getByPlaceholderText } = renderLoginScreen()
    fireEvent.changeText(getByPlaceholderText("Email"), testEmail)
    fireEvent.changeText(getByPlaceholderText("Password"), testPassword)
    fireEvent.press(getByTestId("login-button"))

    await waitFor(() => {
      expect(apiUser.login).toHaveBeenCalledWith(testEmail, testPassword)
      expect(apiUser.getAccountInfo).toHaveBeenCalled()
      expect(mockSetAuthToken).toHaveBeenCalledWith("abc123")
      expect(mockSetAuthUserId).toHaveBeenCalledWith("user123")
      expect(mockSetAuthName).toHaveBeenCalledWith("Test User")
      expect(mockSetAuthPhoneNumber).toHaveBeenCalledWith("123456789")
      expect(mockSetAuthEmail).toHaveBeenCalledWith(testEmail)
      expect(mockSetAuthPicture).toHaveBeenCalledWith("avatar.png")
      expect(mockFetchPreferences).toHaveBeenCalled()
    })
  })

  it("shows error message on invalid credentials", async () => {
    // @ts-ignore
    apiUser.login.mockResolvedValueOnce({
      status: 401,
      data: { details: { error_description: "Invalid credentials" } },
    })

    const { getByTestId, findByText, getByPlaceholderText } = renderLoginScreen()
    fireEvent.changeText(getByPlaceholderText("Email"), "bad@user.com")
    fireEvent.changeText(getByPlaceholderText("Password"), "wrongpass")
    fireEvent.press(getByTestId("login-button"))

    const errorMsg = await findByText("Invalid credentials")
    expect(errorMsg).toBeTruthy()
  })

  it("shows network error when API throws", async () => {
    // @ts-ignore
    apiUser.login.mockRejectedValueOnce(new Error("Network down"))

    const { getByTestId, findByText, getByPlaceholderText } = renderLoginScreen()
    fireEvent.changeText(getByPlaceholderText("Email"), "a@b.com")
    fireEvent.changeText(getByPlaceholderText("Password"), "123456")
    fireEvent.press(getByTestId("login-button"))

    const errorMsg = await findByText("A network error occurred. Please try again.")
    expect(errorMsg).toBeTruthy()
  })
})
