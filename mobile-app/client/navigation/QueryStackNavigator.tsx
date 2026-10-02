import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import QueryScreen from "@/screens/QueryScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type QueryStackParamList = {
  Query: undefined;
};

const Stack = createNativeStackNavigator<QueryStackParamList>();

export default function QueryStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Query"
        component={QueryScreen}
        options={{
          headerTitle: "Risk Intelligence",
        }}
      />
    </Stack.Navigator>
  );
}
