import React, { useEffect, useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import { getUser, clearStorage } from "../../storage/mmkv";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { getDailySummary, getMembershipExpiry, DailySummary, MembershipExpiry } from "../../services/receptionist.service";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ReceptionTabs">;
};

export default function DashboardTab({ navigation }: Props) {
  const user = getUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [expiringList, setExpiringList] = useState<MembershipExpiry[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const summaryData = await getDailySummary(today);
      const expiryData = await getMembershipExpiry();

      setSummary(summaryData);
      setExpiringList(expiryData);
    } catch (err) {
      console.warn("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const expiringCount = Array.isArray(expiringList)
    ? expiringList.filter(item => item?.expiry_status === "EXPIRING_SOON").length
    : 0;
  const expiredCount = Array.isArray(expiringList)
    ? expiringList.filter(item => item?.expiry_status === "EXPIRED").length
    : 0;

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5E3A" />
          <Text style={styles.loadingText}>Fetching backend statistics...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Surat Gym Hub 🏋️‍♂️</Text>
            <Text style={styles.bannerSubtitle}>Native Receptionist Control Panel</Text>
          </View>

          {/* Stats Grid */}
          <Text style={styles.sectionTitle}>TODAY'S OVERVIEW</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>👥</Text>
              <Text style={styles.statNumber}>{summary?.new_memberships || 0}</Text>
              <Text style={styles.statLabel}>New Memberships</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🔄</Text>
              <Text style={styles.statNumber}>{summary?.renewals || 0}</Text>
              <Text style={styles.statLabel}>Renewals Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={styles.statNumber}>{summary?.total_checkins || 0}</Text>
              <Text style={styles.statLabel}>Check-Ins Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🗓️</Text>
              <Text style={styles.statNumber}>{summary?.total_pt_sessions || 0}</Text>
              <Text style={styles.statLabel}>PT Sessions Booked</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>💳</Text>
              <Text style={styles.statNumber}>₹{summary?.membership_revenue || 0}</Text>
              <Text style={styles.statLabel}>Membership Revenue</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🏋️</Text>
              <Text style={styles.statNumber}>₹{summary?.pt_revenue || 0}</Text>
              <Text style={styles.statLabel}>PT Session Revenue</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statNumber}>₹{summary?.total_revenue || 0}</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>⚡</Text>
              <Text style={styles.statNumber}>{summary?.peak_hour !== null && summary?.peak_hour !== undefined ? `${summary.peak_hour}:00` : "N/A"}</Text>
              <Text style={styles.statLabel}>Peak Attendance Hour</Text>
            </View>
          </View>


        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 24,
    gap: 24,
  },
  banner: {
    backgroundColor: "rgba(255, 94, 58, 0.08)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 94, 58, 0.2)",
    padding: 20,
    alignItems: "center",
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    color: "#FF5E3A",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: -8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statCard: {
    backgroundColor: "rgba(30, 30, 35, 0.6)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    width: "47%",
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  statEmoji: {
    fontSize: 24,
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  actionCard: {
    backgroundColor: "rgba(30, 30, 35, 0.6)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 20,
    gap: 12,
  },
  actionCardTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  alertRow: {
    width: "100%",
  },
  alertPillWarning: {
    backgroundColor: "rgba(255, 179, 0, 0.1)",
    borderColor: "rgba(255, 179, 0, 0.25)",
    borderWidth: 1,
    color: "#FFB300",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
  },
  alertPillDanger: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderColor: "rgba(244, 67, 54, 0.25)",
    borderWidth: 1,
    color: "#F44336",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
  },
  alertPillSuccess: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderColor: "rgba(76, 175, 80, 0.25)",
    borderWidth: 1,
    color: "#4CAF50",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
  },
});
