import { registerRootComponent } from "expo";
import { LogBox } from "react-native";

import App from "@/App";

// Suppress Expo Go SDK 53 notification warnings
LogBox.ignoreLogs([
    "expo-notifications: Android Push notifications",
    "Android Push notifications (remote notifications) functionality provided by expo-notifications was removed"
]);

registerRootComponent(App);
