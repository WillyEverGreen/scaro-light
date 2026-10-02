import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GraphScreen from "@/screens/GraphScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type GraphStackParamList = {
  Graph: undefined;
};

const Stack = createNativeStackNavigator<GraphStackParamList>();

export default function GraphStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Graph"
        component={GraphScreen}
        options={{
          headerTitle: "Supply Chain",
        }}
      />
    </Stack.Navigator>
  );
}
