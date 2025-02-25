import "dotenv/config" // Loads .env variables into process.env
import fs from "fs"
import path from "path"

// Path to AndroidManifest.xml
const manifestPath = path.join(__dirname, "../android/app/src/main/AndroidManifest.xml")

// Load API key from .env
const apiKey = process.env.MAPS_API_KEY

if (!apiKey) {
  console.error("❌ ERROR: MAPS_API_KEY is missing. Set it in your .env file.")
  process.exit(1)
}

// Read AndroidManifest.xml
fs.readFile(manifestPath, "utf8", (err, data) => {
  if (err) {
    console.error(`❌ ERROR: Could not read AndroidManifest.xml: ${err.message}`)
    process.exit(1)
  }

  let updatedData = data
  let changesMade = false

  // ✅ Insert API key if not present
  if (!data.includes('android:name="com.google.android.geo.API_KEY"')) {
    updatedData = updatedData.replace(
      /<application(.*?)>/,
      `<application$1>\n    <meta-data android:name="com.google.android.geo.API_KEY" android:value="${apiKey}"/>`,
    )
    console.log("✅ Added API key to AndroidManifest.xml")
    changesMade = true
  }

  // ✅ Insert location permissions if not present
  const permissions = [
    '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>',
    '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>',
  ]

  permissions.forEach((permission) => {
    if (!data.includes(permission)) {
      updatedData = updatedData.replace(/<manifest(.*?)>/, `<manifest$1>\n    ${permission}`)
      console.log(`✅ Added ${permission} to AndroidManifest.xml`)
      changesMade = true
    }
  })

  // ✅ Write updated data only if changes were made
  if (changesMade) {
    fs.writeFile(manifestPath, updatedData, "utf8", (err) => {
      if (err) {
        console.error(`❌ ERROR: Could not write to AndroidManifest.xml: ${err.message}`)
        process.exit(1)
      }
      console.log("✅ Successfully updated AndroidManifest.xml")
    })
  } else {
    console.log("✅ AndroidManifest.xml already contains required settings, no changes made.")
  }
})
