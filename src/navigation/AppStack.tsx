import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getUser } from "../storage/mmkv";

import TrainerHome from "../screens/trainer/TrainerHome";
import ReceptionTabs from "./ReceptionTabs";

const Stack = createNativeStackNavigator();

export default function AppStack() {
  const user = getUser();
  
  // Dynamically set initial screen based on user role
  let initialRoute = "ReceptionTabs";
  if (user?.role === "TRAINER") {
    initialRoute = "TrainerHome";
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerHome" component={TrainerHome} />
      <Stack.Screen name="ReceptionTabs" component={ReceptionTabs} />
    </Stack.Navigator>
  );
}