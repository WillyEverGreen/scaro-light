import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MonitorScreen from "@/screens/MonitorScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type MonitorStackParamList = {
  Monitor: undefined;
};

const Stack = createNativeStackNavigator<MonitorStackParamList>();

export default function MonitorStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Monitor"
        component={MonitorScreen}
        options={{
          headerTitle: "Monitor",
        }}
      />
    </Stack.Navigator>
  );
}
