import { observer } from "mobx-react-lite"
import { ComponentType, FC, useEffect, useMemo, useRef, useState } from "react"
import { TextInput, TextStyle, ViewStyle } from "react-native"
import { Button, Icon, Screen, Text, TextField, TextFieldAccessoryProps } from "../components"
import { useStores } from "../models"
import { AppStackScreenProps } from "../navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "../utils/useAppTheme"
import { api } from "../services/api"

interface LoginScreenProps extends AppStackScreenProps<"Login"> {}

type ApiResponse<T> = {
  ok: boolean
  data?: T
  problem?: string | null
  status?: number
}

export const LoginScreen: FC<LoginScreenProps> = observer(function LoginScreen(_props) {
  const authPasswordInput = useRef<TextInput>(null)

  const [authPassword, setAuthPassword] = useState("")
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [attemptsCount, setAttemptsCount] = useState(0)
  const [loginErrorMessage, setLoginErrorMessage] = useState("") // New state for error message

  const {
    authenticationStore: { authEmail, setAuthEmail, setAuthToken, validationError },
  } = useStores()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  useEffect(() => {
    // Here is where you could fetch credentials from keychain or storage
    // and pre-fill the form fields.
    setAuthEmail("liowz@tcd.ie")
    setAuthPassword("i2*Jd!uHD*ijyzs8FBwr")

    // Return a "cleanup" function that React will run when the component unmounts
    return () => {
      setAuthPassword("")
      setAuthEmail("")
      setLoginErrorMessage("")
    }
  }, [setAuthEmail])

  const error = isSubmitted ? validationError : ""

  const login = async () => {
    setIsSubmitted(true)
    setAttemptsCount(attemptsCount + 1)
    setLoginErrorMessage("")

    // Validate inputs
    if (validationError || !authEmail || !authPassword) {
      setLoginErrorMessage("Please enter a valid email and password.")
      setIsSubmitted(false)
      return
    }

    try {
      // Attempt login via the API
      const response: ApiResponse<any> = await api.login(authEmail, authPassword)
      console.log("Login Response:", response) // Debugging log

      if (response.status === 200) {
        // Handle successful login
        const data = response.data
        if (data && data.access_token) {
          // Store the token and clear fields
          setAuthToken(data.access_token)
          setAuthEmail("")
          setAuthPassword("")
          console.log("Login Successful. Token saved.")
        } else {
          console.log("Error: Unexpected response from the server.")
          setLoginErrorMessage("Unexpected response from the server.")
        }
      } else {
        // Use the error message returned by the backend
        const errorMessage = response.data?.error || "An unexpected error occurred."
        setLoginErrorMessage(errorMessage)
      }
    } catch (error) {
      // Handle network or unexpected errors
      console.error("Login failed due to an error:", error)
      setLoginErrorMessage("A network error occurred. Please try again.")
    } finally {
      // Allow retry
      setIsSubmitted(false)
    }
  }

  const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <Icon
            icon={isAuthPasswordHidden ? "view" : "hidden"}
            color={colors.palette.neutral800}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsAuthPasswordHidden(!isAuthPasswordHidden)}
          />
        )
      },
    [isAuthPasswordHidden, colors.palette.neutral800],
  )

  const navigateToSignUp = () => {
    _props.navigation.navigate("SignUp")
  }

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Button
        testID="create-account-button"
        tx="loginScreen:createAccount"
        style={themed($createAccountButton)}
        preset="reversed"
        onPress={navigateToSignUp}
      />
      <Text testID="login-heading" tx="loginScreen:logIn" preset="heading" style={themed($logIn)} />
      <Text tx="loginScreen:enterDetails" preset="subheading" style={themed($enterDetails)} />
      {attemptsCount > 2 && (
        <Text tx="loginScreen:hint" size="sm" weight="light" style={themed($hint)} />
      )}

      {loginErrorMessage !== "" && ( // Display error message if present
        <Text style={themed($errorMessage)}>{loginErrorMessage}</Text>
      )}

      <TextField
        value={authEmail}
        onChangeText={setAuthEmail}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        labelTx="loginScreen:emailFieldLabel"
        placeholderTx="loginScreen:emailFieldPlaceholder"
        helper={error}
        status={error ? "error" : undefined}
        onSubmitEditing={() => authPasswordInput.current?.focus()}
      />

      <TextField
        ref={authPasswordInput}
        value={authPassword}
        onChangeText={setAuthPassword}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="password"
        autoCorrect={false}
        secureTextEntry={isAuthPasswordHidden}
        labelTx="loginScreen:passwordFieldLabel"
        placeholderTx="loginScreen:passwordFieldPlaceholder"
        onSubmitEditing={login}
        RightAccessory={PasswordRightAccessory}
      />

      <Button
        testID="login-button"
        tx="loginScreen:tapToLogIn"
        style={themed($tapButton)}
        preset="reversed"
        onPress={login}
      />
    </Screen>
  )
})

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $logIn: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $enterDetails: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $hint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginBottom: spacing.md,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $createAccountButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute", // This enables absolute positioning
  top: spacing.xl, // Adjust to control how far from the top
  right: spacing.lg, // Adjust to control how far from the right
  paddingVertical: spacing.sm, // Vertical padding for the button
  paddingHorizontal: spacing.lg, // Horizontal padding for the button
  borderWidth: 1, // Optional: adds a border to the button
  borderColor: "#000", // Black border to make the button visible
  minHeight: 50, // Ensure the button has enough height to be clicked
  zIndex: 1, // Ensure the button is not overlapped by other elements
})

const $errorMessage: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.error,
  marginBottom: spacing.md,
  textAlign: "center",
})
