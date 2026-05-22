import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/useAuthStore";
import { RootStackParamList } from "./types";

import ReceptionTabs from "./ReceptionTabs";
import TrainerTabs from "./TrainerTabs";
import MemberDetailScreen from "../screens/common/MemberDetailScreen";
import PtSessionDetailScreen from "../screens/common/PtSessionDetailScreen";
import EditMemberScreen from "../screens/receptionist/EditMemberScreen";
import RenewPlanScreen from "../screens/receptionist/RenewPlanScreen";
import AddMemberScreen from "../screens/receptionist/AddMemberScreen";
import BookPtSessionScreen from "../screens/receptionist/BookPtSessionScreen";
import AddSlotsScreen from "../screens/trainer/AddSlotsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppStack() {
  const user = useAuthStore((state) => state.user);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user?.role === "TRAINER" ? (
        <>
          <Stack.Screen name="TrainerTabs" component={TrainerTabs} />
          <Stack.Screen name="MemberDetail" component={MemberDetailScreen} />
          <Stack.Screen name="PtSessionDetail" component={PtSessionDetailScreen} />
          <Stack.Screen name="AddSlots" component={AddSlotsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="ReceptionTabs" component={ReceptionTabs} />
          <Stack.Screen name="MemberDetail" component={MemberDetailScreen} />
          <Stack.Screen name="PtSessionDetail" component={PtSessionDetailScreen} />
          <Stack.Screen name="EditMember" component={EditMemberScreen} />
          <Stack.Screen name="RenewPlan" component={RenewPlanScreen} />
          <Stack.Screen name="AddMember" component={AddMemberScreen} />
          <Stack.Screen name="BookPtSession" component={BookPtSessionScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}