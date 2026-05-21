import React, { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/useAuthStore";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CompositeNavigationProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, ReceptionTabParamList } from "../../navigation/types";

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<ReceptionTabParamList, "Profile">,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

export default function ProfileTab({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to securely log out of Surat Gym Hub? Your local session details will be cleared.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "LOGOUT",
          style: "destructive",
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return "REC";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("en-US", options);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>Surat Gym Hub Control</Text>
          <Text style={styles.headerTitle}>System Profile</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarGlowContainer}>
            <View style={styles.avatarRingInner}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>
                  {getInitials(user?.name)}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || "Receptionist"}</Text>
          <View style={styles.userRoleTag}>
            <Text style={styles.userRoleText}>
              {user?.role || "RECEPTIONIST"}
            </Text>
          </View>
        </View>

        {/* Credentials Card */}
        <Text style={styles.sectionLabel}>SECURED CREDENTIALS</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>FULL NAME</Text>
            <Text style={styles.infoValue}>{user?.name || "N/A"}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
            <Text style={styles.infoValue}>{user?.email || "N/A"}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SYSTEM ROLE</Text>
            <Text style={[styles.infoValue, { color: "#FF5E3A" }]}>
              {user?.role || "RECEPTIONIST"}
            </Text>
          </View>
          <View style={styles.cardDivider} />
          {/* <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DATABASE USER ID</Text>
            <Text style={styles.infoValueCode}>#{user?.id || "N/A"}</Text>
          </View> */}
        </View>

        {/* Gym Facility & Shift Card */}
        <Text style={styles.sectionLabel}>SHIFT </Text>
        <View style={styles.card}>
          {/* <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>FACILITY BRAND</Text>
            <Text style={styles.infoValue}>Surat Gym Hub</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TERMINAL ACCESS ID</Text>
            <Text style={styles.infoValueCode}>ST-REC-01 (Main Desk)</Text>
          </View> */}
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SHIFT STATUS</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>ACTIVE</Text>
            </View>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TODAY'S SHIFT DATE</Text>
            <Text style={styles.infoValue}>{getFormattedDate()}</Text>
          </View>
        </View>


        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF5252" />
          <Text style={styles.logoutButtonText}>SECURELY LOGOUT SESSION</Text>
        </TouchableOpacity>


      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1fff",
    paddingTop: Platform.OS === "ios" ? 48 : (StatusBar.currentHeight || 24),
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    position: "relative",
    minHeight: 76,
    justifyContent: "center",
  },
  headerTitleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  headerSubtitle: {
    color: "#FF5E3A",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: "center",
  },
  badgeContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 24,
    gap: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    marginVertical: 10,
    gap: 12,
  },
  avatarGlowContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 94, 58, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF5E3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarRingInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "rgba(255, 94, 58, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#16161A",
    borderWidth: 2,
    borderColor: "#FF5E3A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  userRoleTag: {
    backgroundColor: "rgba(255, 94, 58, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 94, 58, 0.25)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  userRoleText: {
    color: "#FF5E3A",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  sectionLabel: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: -10,
    marginTop: 10,
  },
  card: {
    backgroundColor: "rgba(30, 30, 35, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  infoValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  infoValueCode: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.12)",
    borderColor: "rgba(76, 175, 80, 0.25)",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  statusText: {
    color: "#4CAF50",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  switchDesc: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244, 67, 54, 0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(244, 67, 54, 0.35)",
    borderRadius: 18,
    paddingVertical: 16,
    gap: 8,
    marginTop: 15,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutButtonText: {
    color: "#FF5252",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  footerText: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.25)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 10,
  },
});
