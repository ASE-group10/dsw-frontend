import "dotenv/config"
import fs from "fs"
import path from "path"

// 🔍 Print current working directory and structure
console.log("📂 Current working directory:", process.cwd())
console.log("📂 __dirname:", __dirname)
console.log("🔑 MAPS_API_KEY available:", !!process.env.MAPS_API_KEY)

const androidDir = path.join(__dirname, "../android")
const manifestPath = path.join(androidDir, "app/src/main/AndroidManifest.xml")
const appJsonPath = path.join(__dirname, "../app.json")
const easJsonPath = path.join(__dirname, "../eas.json")

console.log("🔍 Checking for paths:")
console.log("- Android dir:", androidDir, "Exists?", fs.existsSync(androidDir))
console.log("- AndroidManifest.xml:", manifestPath, "Exists?", fs.existsSync(manifestPath))
console.log("- app.json:", appJsonPath, "Exists?", fs.existsSync(appJsonPath))
console.log("- eas.json:", easJsonPath, "Exists?", fs.existsSync(easJsonPath))

// Load API key from .env
const apiKey = process.env.MAPS_API_KEY

if (!apiKey) {
  console.error("❌ ERROR: MAPS_API_KEY is missing. Set it in your .env file.")
  process.exit(1)
}

/* ---------------------------
   Update AndroidManifest.xml
---------------------------- */

const manifestContent = fs.readFileSync(manifestPath, "utf8")

// Explicitly look for and update Maps API key
const apiKeyMetaDataRegex = /<meta-data\s+android:name="com\.google\.android\.geo\.API_KEY"[^>]+>/
const newApiKeyMetaData = `<meta-data android:name="com.google.android.geo.API_KEY" android:value="${apiKey}"/>`

let updatedManifest = manifestContent
let manifestChanged = false

if (apiKeyMetaDataRegex.test(manifestContent)) {
  // Update existing API key
  updatedManifest = manifestContent.replace(apiKeyMetaDataRegex, newApiKeyMetaData)
  console.log("✅ Updated existing Maps API key in AndroidManifest.xml")
  manifestChanged = true
} else {
  // Add new API key
  updatedManifest = manifestContent.replace(
    /<application[^>]*>/,
    `$&\n        ${newApiKeyMetaData}`,
  )
  console.log("✅ Added new Maps API key to AndroidManifest.xml")
  manifestChanged = true
}

if (manifestChanged) {
  fs.writeFileSync(manifestPath, updatedManifest, "utf8")
  console.log("✅ Successfully wrote changes to AndroidManifest.xml")

  // Verify the changes
  const verifyContent = fs.readFileSync(manifestPath, "utf8")
  if (verifyContent.includes(apiKey)) {
    console.log("✅ Verified API key is present in AndroidManifest.xml")
  } else {
    throw new Error("Failed to verify API key in AndroidManifest.xml")
  }
} else {
  console.log("✅ No changes needed in AndroidManifest.xml")
}

/* ---------------------------
   Update app.json
---------------------------- */

const appJsonContent = fs.readFileSync(appJsonPath, "utf8")
const appConfig = JSON.parse(appJsonContent)
let appJsonChanged = false

if (!appConfig.expo) {
  appConfig.expo = {}
  appJsonChanged = true
}

if (!appConfig.expo.extra) {
  appConfig.expo.extra = {}
  appJsonChanged = true
}

// Always update the API key to ensure it matches
if (!appConfig.expo.extra.MAPS_API_KEY || appConfig.expo.extra.MAPS_API_KEY !== apiKey) {
  appConfig.expo.extra.MAPS_API_KEY = apiKey
  appJsonChanged = true
  console.log("✅ Updated MAPS_API_KEY in app.json")
}

if (appJsonChanged) {
  fs.writeFileSync(appJsonPath, JSON.stringify(appConfig, null, 2), "utf8")
  console.log("✅ Successfully updated app.json")

  // Verify the changes
  const verifyConfig = JSON.parse(fs.readFileSync(appJsonPath, "utf8"))
  if (verifyConfig.expo?.extra?.MAPS_API_KEY === apiKey) {
    console.log("✅ Verified API key is present in app.json")
  } else {
    throw new Error("Failed to verify API key in app.json")
  }
} else {
  console.log("✅ No changes needed in app.json")
}

/* ---------------------------
   Update eas.json
---------------------------- */

const easJsonContent = fs.readFileSync(easJsonPath, "utf8")
const easConfig = JSON.parse(easJsonContent)
let easJsonChanged = false

// Ensure the build and production sections exist
if (!easConfig.build) {
  easConfig.build = {}
  easJsonChanged = true
}

if (!easConfig.build.production) {
  easConfig.build.production = {}
  easJsonChanged = true
}

if (!easConfig.build.production.android) {
  easConfig.build.production.android = {}
  easJsonChanged = true
}

// Initialize or update the env section
if (!easConfig.build.production.android.env) {
  easConfig.build.production.android.env = {}
  easJsonChanged = true
}

// Update the Maps API key
if (
  !easConfig.build.production.android.env.MAPS_API_KEY ||
  easConfig.build.production.android.env.MAPS_API_KEY !== apiKey
) {
  easConfig.build.production.android.env.MAPS_API_KEY = apiKey
  easJsonChanged = true
  console.log("✅ Updated MAPS_API_KEY in eas.json")
}

if (easJsonChanged) {
  fs.writeFileSync(easJsonPath, JSON.stringify(easConfig, null, 2), "utf8")
  console.log("✅ Successfully updated eas.json")

  // Verify the changes
  const verifyEasConfig = JSON.parse(fs.readFileSync(easJsonPath, "utf8"))
  if (verifyEasConfig.build?.production?.android?.env?.MAPS_API_KEY === apiKey) {
    console.log("✅ Verified API key is present in eas.json")
  } else {
    throw new Error("Failed to verify API key in eas.json")
  }
} else {
  console.log("✅ No changes needed in eas.json")
}
