import { observer } from "mobx-react-lite"
import { ComponentType, FC, useEffect, useMemo, useRef, useState } from "react"
import { TextInput, TextStyle, ViewStyle } from "react-native"
import { Button, Icon, Screen, Text, TextField, TextFieldAccessoryProps } from "../components"
import { useStores } from "../models"
import { AppStackScreenProps } from "../navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "../utils/useAppTheme"
import { api } from "../services/api" // Ensure api has a register method

interface SignUpScreenProps extends AppStackScreenProps<"SignUp"> {}

type ApiResponse<T> = {
  ok: boolean
  data?: T
  problem?: string | null
  status?: number
}

export const SignUpScreen: FC<SignUpScreenProps> = observer(function SignUpScreen(_props) {
  const authPasswordInput = useRef<TextInput>(null)

  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [attemptsCount, setAttemptsCount] = useState(0)
  const [SignUpErrorMessage, setSignUpErrorMessage] = useState("") // Error message state

  const {
    authenticationStore: { validationError },
  } = useStores()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  useEffect(() => {
    setAuthEmail("zhaocunsun@gmail.com")
    setAuthPassword("shield0215@")

    return () => {
      setAuthPassword("")
      setAuthEmail("")
      setSignUpErrorMessage("")
    }
  }, [])

  const error = isSubmitted ? validationError : ""

  // Sign up API request
  const SignUp = async () => {
    setIsSubmitted(true)
    setAttemptsCount(attemptsCount + 1)
    setSignUpErrorMessage("")

    if (!authEmail || !authPassword) {
      setSignUpErrorMessage("Please enter a valid email and password.")
      setIsSubmitted(false)
      return
    }

    try {
      const response: ApiResponse<any> = await api.register(authEmail, authPassword)
      console.log("SignUp Response:", response)

      if (response.status === 200) {
        const { message: _message, auth0Response: _auth0Response } = response.data

        // // Display success message
        // setSignUpErrorMessage(
        //   "Signup successful! A verification email has been sent to your inbox. Please verify to proceed.",
        // )

        // Delay for 1 second before navigating to the Login screen
        setTimeout(() => {
          setAuthEmail("")
          setAuthPassword("")
          _props.navigation.navigate("Login")
        }, 1000)
      } else {
        // Handle errors from the response
        const errorMessage =
          response.data?.details.message ||
          response.data?.error ||
          `Unexpected error: ${response.problem || "Unknown error."}`
        setSignUpErrorMessage(errorMessage)
      }
    } catch (error) {
      console.error("SignUp failed due to an error:", error)
      setSignUpErrorMessage("An unexpected error occurred. Please try again.")
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

  // Handle back button to go back to the Login screen
  const navigateBack = () => {
    _props.navigation.goBack() // This navigates back to the previous screen
  }

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Button
        testID="back-button"
        tx="signUpScreen:back"
        style={themed($backButton)}
        preset="reversed"
        onPress={navigateBack}
      />

      <Text
        testID="SignUp-heading"
        tx="signUpScreen:SignUp"
        preset="heading"
        style={themed($SignUp)}
      />
      <Text tx="signUpScreen:enterDetails" preset="subheading" style={themed($enterDetails)} />

      {SignUpErrorMessage !== "" && <Text style={themed($errorMessage)}>{SignUpErrorMessage}</Text>}

      <TextField
        value={authEmail}
        onChangeText={(value) => setAuthEmail(value.trimStart())} // Trim leading spaces while typing
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
        labelTx="signUpScreen:passwordFieldLabel"
        placeholderTx="signUpScreen:passwordFieldPlaceholder"
        onSubmitEditing={SignUp}
        RightAccessory={PasswordRightAccessory}
      />

      <Button
        testID="SignUp-button"
        tx="signUpScreen:tapToSignUp"
        style={themed($tapButton)}
        preset="reversed"
        onPress={SignUp}
      />
    </Screen>
  )
})

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $SignUp: ThemedStyle<TextStyle> = ({ spacing }) => ({
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

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
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
