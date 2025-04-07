import { observer } from "mobx-react-lite"
import { ComponentType, FC, useEffect, useMemo, useRef, useState } from "react"
import { TextInput, TextStyle, ViewStyle } from "react-native"
import { Button, Icon, Screen, Text, TextField, TextFieldAccessoryProps } from "../components"
import { useStores } from "../models"
import { AppStackScreenProps } from "../navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "../utils/useAppTheme"
import { apiUser } from "../services/api"
import { storage } from "@/utils/storage"

interface LoginScreenProps extends AppStackScreenProps<"Login"> {}

type ApiResponse<T> = {
  ok: boolean
  data?: T
  problem?: string | null
  status?: number
}

export const LoginScreen: FC<LoginScreenProps> = observer(function LoginScreen(_props) {
  const authPasswordInput = useRef<TextInput>(null)

  // Local states
  const [email, setEmail] = useState("bryan.liow.zy@gmail.com")
  const [password, setPassword] = useState("Admin12345!!")
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [attemptsCount, setAttemptsCount] = useState(0)
  const [loginErrorMessage, setLoginErrorMessage] = useState("")

  // Add these from the store
  const {
    authenticationStore: {
      authEmail,
      setAuthEmail,
      setAuthToken,
      setAuthUserId,
      setAuthName,
      setAuthPicture,
      validationError,
    },
  } = useStores()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  useEffect(() => {
    const savedEmail = authEmail || "bryan.liow.zy@gmail.com"
    setEmail(savedEmail)
    setAuthEmail(savedEmail)
    setLoginErrorMessage("")
    return () => {
      // setEmail("")
      setPassword("")
      setLoginErrorMessage("")
    }
  }, [])

  const error = isSubmitted ? validationError : ""

  const handleEmailChange = (text: string) => {
    setEmail(text)
    setAuthEmail(text)
  }

  const login = async () => {
    setIsSubmitted(true)
    setAttemptsCount(attemptsCount + 1)
    setLoginErrorMessage("")

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    // Quick local validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!trimmedEmail || !trimmedPassword || !emailRegex.test(trimmedEmail)) {
      setLoginErrorMessage("Please enter a valid email and password.")
      setIsSubmitted(false)
      return
    }

    try {
      console.log("Attempting login with:", trimmedEmail, trimmedPassword)
      const response: ApiResponse<any> = await apiUser.login(trimmedEmail, trimmedPassword)
      console.log("Login Response:", response)

      if (response.status === 200 && response.data) {
        const data = response.data

        if (data?.token && data?.auth0_user_id) {
          // Store the token in your authenticationStore
          setAuthToken(data.token) // This writes to MMKV or a store, from which the transform picks it up
          setAuthUserId(data.auth0_user_id)
          storage.set("authToken", data.token)
          setAuthEmail(trimmedEmail)

          // Fetch additional account info
          const accountResponse: ApiResponse<any> = await apiUser.getAccountInfo()
          console.log("Account Info Response:", accountResponse)
          if (accountResponse.ok && accountResponse.data) {
            console.log("Account info:", accountResponse)

            const { name, picture } = accountResponse.data
            setAuthName(name)
            setAuthPicture(picture ?? null)
          } else {
            console.warn("Account info fetch failed:", accountResponse)
          }

          // Clear local inputs
          setPassword("")

          console.log("Login Successful.")
        } else {
          setLoginErrorMessage("Unexpected response from the server.")
        }
      } else {
        const errorMessage = response.data?.details?.error_description || "Wrong email or password."
        setLoginErrorMessage(errorMessage)
      }
    } catch (error) {
      console.error("Login failed due to an error:", error)
      setLoginErrorMessage("A network error occurred. Please try again.")
    } finally {
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

      {!!loginErrorMessage && <Text style={themed($errorMessage)}>{loginErrorMessage}</Text>}

      <TextField
        value={authEmail}
        onChangeText={handleEmailChange}
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
        value={password}
        onChangeText={setPassword}
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

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $createAccountButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  top: spacing.xl,
  right: spacing.lg,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.lg,
  borderWidth: 1,
  borderColor: "#000",
  minHeight: 50,
  zIndex: 1,
})

const $errorMessage: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.error,
  marginBottom: spacing.md,
  textAlign: "center",
})
