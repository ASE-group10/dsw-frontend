export interface ConfigBaseProps {
  persistNavigation: "always" | "dev" | "prod" | "never"
  catchErrors: "always" | "dev" | "prod" | "never"
  exitRoutes: string[]
}

export type PersistNavigationConfig = ConfigBaseProps["persistNavigation"]

const BaseConfig: ConfigBaseProps = {
  persistNavigation: "dev", // Navigation persistence for dev environment
  catchErrors: "always", // Always catch errors
  exitRoutes: ["Welcome"], // Example exit routes for Android back button
}

export default BaseConfig
