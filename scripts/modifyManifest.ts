import "dotenv/config" // Loads .env variables into process.env
import fs from "fs"
import path from "path"

// Load API key from .env
const apiKey = process.env.MAPS_API_KEY

if (!apiKey) {
  console.error("❌ ERROR: MAPS_API_KEY is missing. Set it in your .env file.")
  process.exit(1)
}

/* ---------------------------
   Update AndroidManifest.xml
---------------------------- */

// Path to AndroidManifest.xml
const manifestPath = path.join(__dirname, "../android/app/src/main/AndroidManifest.xml")

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
      `<application$1>\n    <meta-data android:name="com.google.android.geo.API_KEY" android:value="${apiKey}"/>`
    )
    console.log("✅ Added API key to AndroidManifest.xml")
    changesMade = true
  }

  // ✅ Insert location permissions if not present
  const permissions = [
    '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>',
    '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>'
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

/* ---------------------------
   Update app.json
---------------------------- */

// Path to app.json (adjust path as needed)
const appJsonPath = path.join(__dirname, "../app.json")

fs.readFile(appJsonPath, "utf8", (err, data) => {
  if (err) {
    console.error(`❌ ERROR: Could not read app.json: ${err.message}`)
    process.exit(1)
  }

  let appConfig
  try {
    appConfig = JSON.parse(data)
  } catch (error) {
    console.error("❌ ERROR: Could not parse app.json")
    process.exit(1)
  }

  let changesMade = false

  // Ensure the expo field exists
  if (!appConfig.expo) {
    console.error("❌ ERROR: app.json does not contain an expo field.")
    process.exit(1)
  }

  // Add extra field if missing
  if (!appConfig.expo.extra) {
    appConfig.expo.extra = {}
    changesMade = true
    console.log("✅ Added extra field to expo config in app.json.")
  }

  // Insert API key if not present
  if (!appConfig.expo.extra.MAPS_API_KEY) {
    appConfig.expo.extra.MAPS_API_KEY = apiKey
    changesMade = true
    console.log("✅ Added MAPS_API_KEY to expo.extra in app.json")
  } else {
    console.log("✅ MAPS_API_KEY already exists in app.json")
  }

  // Write updated data only if changes were made
  if (changesMade) {
    fs.writeFile(appJsonPath, JSON.stringify(appConfig, null, 2), "utf8", (err) => {
      if (err) {
        console.error(`❌ ERROR: Could not write to app.json: ${err.message}`)
        process.exit(1)
      }
      console.log("✅ Successfully updated app.json")
    })
  } else {
    console.log("✅ No changes needed in app.json")
  }
})
