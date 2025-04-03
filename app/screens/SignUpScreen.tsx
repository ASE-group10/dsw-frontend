import { observer } from "mobx-react-lite"
import { ComponentType, FC, useEffect, useMemo, useRef, useState } from "react"
import { TextInput, TextStyle, ViewStyle } from "react-native"
import { Button, Icon, Screen, Text, TextField, TextFieldAccessoryProps } from "../components"
import { useStores } from "../models"
import { AppStackScreenProps } from "../navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "../utils/useAppTheme"
import { apiUser } from "../services/api" // Ensure API supports phone number

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
  const [phoneNumber, setPhoneNumber] = useState("") 
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
    setAuthEmail("")
    setPhoneNumber("")
    setAuthPassword("")

    return () => {
      setAuthPassword("")
      setAuthEmail("")
      setPhoneNumber("")
      setSignUpErrorMessage("")
    }
  }, [])

  const error = isSubmitted ? validationError : ""

  // Sign up API request
  const SignUp = async () => {
    setIsSubmitted(true)
    setAttemptsCount(attemptsCount + 1)
    setSignUpErrorMessage("")

    // Validation for all fields
    if (!authEmail || !phoneNumber || phoneNumber.length !== 10 || !authPassword) {
      setSignUpErrorMessage("Please enter a valid email, 10-digit phone number, and password.")
      setIsSubmitted(false)
      return
    }

    try {
      const response: ApiResponse<any> = await apiUser.register(authEmail, phoneNumber, authPassword)
      console.log("SignUp Response:", response)

      if (response.status === 200) {
        setTimeout(() => {
          setAuthEmail("")
          setPhoneNumber("")
          setAuthPassword("")
          _props.navigation.navigate("Login")
        }, 1000)
      } else {
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
    _props.navigation.goBack()
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

      {/* Email Field */}
      <TextField
        value={authEmail}
        onChangeText={(value) => setAuthEmail(value.trimStart())}
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

      {/* Phone Number Field */}
      <TextField
        value={phoneNumber}
        onChangeText={(value) => setPhoneNumber(value.replace(/[^0-9]/g, ""))} // Allow only numbers
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="tel"
        autoCorrect={false}
        keyboardType="phone-pad"
        label="Phone Number"
        placeholder="Enter your 10-digit phone number"
        maxLength={10} // Restrict input to 10 digits
      />

      {/* Password Field */}
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