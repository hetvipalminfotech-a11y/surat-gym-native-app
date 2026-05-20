import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from "react-native";
import { getUser, clearStorage } from "../../storage/mmkv";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CompositeNavigationProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, ReceptionTabParamList } from "../../navigation/types";

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<ReceptionTabParamList, "Dashboard">,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

export default function DashboardTab({ navigation }: Props) {
  const user = getUser();

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "LOGOUT",
        style: "destructive",
        onPress: () => {
          clearStorage();
        },
      },
    ]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning ☀️";
    if (hour < 17) return "Good Afternoon 🌤️";
    return "Good Evening 🌙";
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date().toLocaleDateString("en-US", options);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome Back,</Text>
          <Text style={styles.nameText}>{user?.name || "Receptionist"}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Greeting Banner */}
        <View style={styles.greetingBanner}>
          <View style={styles.accentBar} />
          <Text style={styles.greetingSub}>{getGreeting()}</Text>
          <Text style={styles.greetingTitle}>Hello, {user?.name || "Receptionist"}!</Text>
          <Text style={styles.greetingText}>
            Ready to shape a premium gym experience? Check in members, manage personal training slots, and track active memberships below.
          </Text>
        </View>

        {/* Shift Details Card */}
        <View style={styles.shiftCard}>
          <View style={styles.shiftRow}>
            <View>
              <Text style={styles.shiftLabel}>TODAY'S DATE</Text>
              <Text style={styles.shiftValue}>{getFormattedDate()}</Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.shiftLabel}>SHIFT STATUS</Text>
              <View style={styles.statusRow}>
                <View style={styles.activeDot} />
                <Text style={styles.shiftValueActive}>ACTIVE</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Shortcuts */}
        <Text style={styles.sectionTitle}>QUICK SYSTEM SHORTCUTS</Text>
        <View style={styles.shortcutsContainer}>

          <TouchableOpacity
            style={[styles.shortcutCard, styles.shortcutGreen]}
            onPress={() => navigation.navigate("Attendance")}
            activeOpacity={0.8}
          >
            <View style={styles.shortcutHeader}>
              <Text style={styles.shortcutIcon}>📝</Text>
              <Text style={styles.shortcutTitleGreen}>ATTENDANCE</Text>
            </View>
            <Text style={styles.shortcutDesc}>Record real-time member check-ins and check-out logs.</Text>
            <View style={styles.shortcutArrowContainer}>
              <Text style={styles.shortcutArrowGreen}>GO TO PANEL ➜</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutCard, styles.shortcutOrange]}
            onPress={() => navigation.navigate("Members")}
            activeOpacity={0.8}
          >
            <View style={styles.shortcutHeader}>
              <Text style={styles.shortcutIcon}>👥</Text>
              <Text style={styles.shortcutTitleOrange}>MEMBERS</Text>
            </View>
            <Text style={styles.shortcutDesc}>Register new members, renew plans, and manage status.</Text>
            <View style={styles.shortcutArrowContainer}>
              <Text style={styles.shortcutArrowOrange}>GO TO PANEL ➜</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutCard, styles.shortcutPurple]}
            onPress={() => navigation.navigate("Pt-sessions")}
            activeOpacity={0.8}
          >
            <View style={styles.shortcutHeader}>
              <Text style={styles.shortcutIcon}>🗓️</Text>
              <Text style={styles.shortcutTitlePurple}>PT SESSIONS</Text>
            </View>
            <Text style={styles.shortcutDesc}>Schedule and coordinate trainer personal sessions.</Text>
            <View style={styles.shortcutArrowContainer}>
              <Text style={styles.shortcutArrowPurple}>GO TO PANEL ➜</Text>
            </View>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
    paddingTop: Platform.OS === "ios" ? 48 : (StatusBar.currentHeight || 24),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  welcomeText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  nameText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 94, 58, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 94, 58, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  logoutIcon: {
    fontSize: 14,
  },
  logoutText: {
    color: "#FF5E3A",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 24,
    gap: 24,
  },
  greetingBanner: {
    backgroundColor: "rgba(30, 30, 35, 0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 24,
    position: "relative",
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 4,
    backgroundColor: "#FF5E3A",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  greetingSub: {
    color: "#FF5E3A",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  greetingTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  greetingText: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  shiftCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
  },
  shiftRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  shiftLabel: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },
  shiftValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  shiftValueActive: {
    color: "#4CAF50",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: -8,
  },
  shortcutsContainer: {
    gap: 12,
  },
  shortcutCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    gap: 8,
  },
  shortcutGreen: {
    backgroundColor: "rgba(76, 175, 80, 0.04)",
    borderColor: "rgba(76, 175, 80, 0.15)",
  },
  shortcutOrange: {
    backgroundColor: "rgba(255, 94, 58, 0.04)",
    borderColor: "rgba(255, 94, 58, 0.15)",
  },
  shortcutPurple: {
    backgroundColor: "rgba(156, 39, 176, 0.04)",
    borderColor: "rgba(156, 39, 176, 0.15)",
  },
  shortcutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shortcutIcon: {
    fontSize: 18,
  },
  shortcutTitleGreen: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  shortcutTitleOrange: {
    color: "#FF5E3A",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  shortcutTitlePurple: {
    color: "#BF5AF2",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  shortcutDesc: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  shortcutArrowContainer: {
    alignItems: "flex-end",
    marginTop: 4,
  },
  shortcutArrowGreen: {
    color: "#4CAF50",
    fontSize: 11,
    fontWeight: "800",
  },
  shortcutArrowOrange: {
    color: "#FF5E3A",
    fontSize: 11,
    fontWeight: "800",
  },
  shortcutArrowPurple: {
    color: "#BF5AF2",
    fontSize: 11,
    fontWeight: "800",
  },
});
