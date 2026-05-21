import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AttendanceTab from "../screens/receptionist/AttendanceTab";
import MembersTab from "../screens/common/MembersTab";
import PtSessionsTab from "../screens/common/PtSessionsTab";
import ProfileTab from "../screens/common/ProfileTab";

const Tab = createBottomTabNavigator();

export default function ReceptionTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Attendance"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#FF5E3A",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.4)",
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused, color }) => {
          let iconName: React.ComponentProps<typeof Ionicons>["name"] = "document-text";

          if (route.name === "Attendance") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else if (route.name === "Members") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Pt-sessions") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Attendance" component={AttendanceTab} />
      <Tab.Screen name="Members" component={MembersTab} />
      <Tab.Screen name="Pt-sessions" component={PtSessionsTab} />
      <Tab.Screen name="Profile" component={ProfileTab} />
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
});

