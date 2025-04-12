import React, { FC, useState, useEffect } from "react"
import { View, ViewStyle, TextStyle, TextInput, TouchableOpacity, Image } from "react-native"
import { Screen, Text, Button, Icon } from "@/components"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { MainTabScreenProps } from "@/navigators/MainNavigator"
import { useStores } from "@/models"
import * as ImagePicker from "react-native-image-picker"
import { apiUser } from "@/services/api"

export const AccountScreen: FC<MainTabScreenProps<"Account">> = function AccountScreen({
  navigation,
}) {
  const { themed } = useAppTheme()
  const { authenticationStore } = useStores()

  const authName = authenticationStore.authName
  const authPhoneNumber = authenticationStore.authPhoneNumber
  const authPicture = authenticationStore.authPicture

  // State for edit mode
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [isEditingPhoneNumber, setIsEditingPhoneNumber] = useState(false)

  // Local state for username, phone number, and avatar
  const [username, setUsername] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    setUsername(authenticationStore.authName)
    setPhoneNumber(authenticationStore.authPhoneNumber)
    setAvatar(authenticationStore.authPicture)
  }, [authenticationStore])

  // Save username with validation
  const saveUsername = () => {
    if (username.trim() === "") {
      alert("Username cannot be empty.")
      return
    }
    authenticationStore.setAuthName(username) 
    apiUser.updateAccountInfo({
      name: username,
      picture: authPicture,
      phoneNumber: authPhoneNumber,
    })
    setIsEditingUsername(false)
    alert(`Username saved: ${username}`)
  }

  // Save phone number with validation
  const savePhoneNumber = () => {
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(phoneNumber)) {
      alert("Please enter a valid 10-digit phone number.")
      return
    }
    authenticationStore.setAuthPhoneNumber(phoneNumber) 
    apiUser.updateAccountInfo({
      name: authName,
      picture: authPicture,
      phoneNumber,
    })
    setIsEditingPhoneNumber(false)
    alert(`Phone number saved: ${phoneNumber}`)
  }

  // Change avatar
  const changeAvatar = () => {
    ImagePicker.launchImageLibrary({ mediaType: "photo", includeBase64: true }, (response) => {
      if (response.assets && response.assets.length > 0) {
        const selectedImage = response.assets[0].uri
        setAvatar(selectedImage || null)
        authenticationStore.setAuthPicture(selectedImage || null) 
      }
    })
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
    
      <TouchableOpacity onPress={() => navigation.goBack()} style={themed($backIconContainer)}>
        <Icon icon="back" size={24} />
      </TouchableOpacity>

     
      <Text style={themed($sectionTitle)} text="Account Settings" />

      {/* Change Username */}
      <Text style={themed($label)} text="Change Username" />
      {isEditingUsername ? (
        <>
          <TextInput
            style={themed($input)}
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
          />
          <Button text="Save" onPress={saveUsername} style={themed($saveButton)} />
        </>
      ) : (
        <TouchableOpacity onPress={() => setIsEditingUsername(true)}>
          <Text style={themed($editableText)}>{username}</Text>
        </TouchableOpacity>
      )}

      {/* Change Phone Number */}
      <Text style={themed($label)} text="Change Phone Number" />
      {isEditingPhoneNumber ? (
        <>
          <TextInput
            style={themed($input)}
            placeholder="Enter your phone number"
            keyboardType="numeric"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <Button text="Save" onPress={savePhoneNumber} style={themed($saveButton)} />
        </>
      ) : (
        <TouchableOpacity onPress={() => setIsEditingPhoneNumber(true)}>
          <Text style={themed($editableText)}>{phoneNumber}</Text>
        </TouchableOpacity>
      )}

      {/* Change Avatar */}
      <Text style={themed($label)} text="Change Avatar" />
      {avatar && <Image source={{ uri: avatar }} style={themed($avatarPreview)} />}
      <Button text="Choose from Gallery" onPress={changeAvatar} style={themed($saveButton)} />
    </Screen>
  )
}

// ----------------------- Themed Styles -----------------------

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
})

const $backIconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  alignSelf: "flex-start",
  padding: spacing.sm,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.xl,
  marginBottom: spacing.md,
  color: colors.text,
  fontSize: 18,
  fontWeight: "bold",
})

const $label: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.lg,
  marginBottom: spacing.sm,
  color: colors.text,
  fontSize: 16,
})

const $input: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  padding: spacing.sm,
  marginBottom: spacing.md,
  color: colors.text,
})

const $saveButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $editableText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  fontSize: 16,
  padding: spacing.sm,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  marginBottom: spacing.md,
})

const $avatarPreview: ThemedStyle<ViewStyle> = () => ({
  width: 100,
  height: 100,
  borderRadius: 50,
  marginBottom: 16,
})

export default AccountScreen
