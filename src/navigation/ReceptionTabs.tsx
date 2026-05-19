import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, StyleSheet, Platform } from "react-native";

import DashboardTab from "../screens/receptionist/DashboardTab";
import MembersTab from "../screens/receptionist/MembersTab";
import PtSessionsTab from "../screens/receptionist/PtSessionsTab";
import AttendanceTab from "../screens/receptionist/AttendanceTab";

const Tab = createBottomTabNavigator();

export default function ReceptionTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#FF5E3A",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.4)",
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused }) => {
          let icon = "📊";
          if (route.name === "Dashboard") icon = "📊";
          else if (route.name === "Members") icon = "👥";
          else if (route.name === "Pt-sessions") icon = "🗓️";
          else if (route.name === "Attendance") icon = "📝";

          return (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
              {icon}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardTab} />
      <Tab.Screen name="Members" component={MembersTab} />
      <Tab.Screen name="Pt-sessions" component={PtSessionsTab} />
      <Tab.Screen name="Attendance" component={AttendanceTab} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0F0F12",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    height: Platform.OS === "ios" ? 88 : 68,
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
});
