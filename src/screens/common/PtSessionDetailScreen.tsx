import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import {
  useCancelPtSession,
  useCompletePtSession,
} from "../../hooks/usePtSessions";
import { useAuthStore } from "../../store/useAuthStore";
import { SafeAreaView } from "react-native-safe-area-context";
type Props = NativeStackScreenProps<RootStackParamList, "PtSessionDetail">;

export default function PtSessionDetailScreen({ route, navigation }: Props) {
  const { session: initialSession } = route.params;
  const [session, setSession] = useState(initialSession);

  const user = useAuthStore((state) => state.user);
  const isTrainer = user?.role === "TRAINER";

  // TanStack mutations
  const cancelMutation = useCancelPtSession();
  const completeMutation = useCompletePtSession();

  const handleCancel = () => {
    Alert.alert(
      "Cancel Session ⚠️",
      "Are you absolutely sure you want to cancel this personal training session?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            cancelMutation.mutate(session.id, {
              onSuccess: () => {
                setSession((prev) => ({ ...prev, status: "CANCELLED" }));
                Alert.alert("Success", "PT Session has been successfully cancelled.", [
                  { text: "OK", onPress: () => navigation.goBack() },
                ]);
              },
              onError: (err: Error) => {
                Alert.alert("Error", err.message || "Failed to cancel session.");
              },
            });
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    Alert.alert(
      "Complete Session ✅",
      "Confirm that this PT session has been successfully completed with the member.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "COMPLETE",
          style: "default",
          onPress: () => {
            completeMutation.mutate(session.id, {
              onSuccess: () => {
                setSession((prev) => ({ ...prev, status: "COMPLETED" }));
                Alert.alert("Success", "PT Session has been successfully marked as completed.", [
                  { text: "OK", onPress: () => navigation.goBack() },
                ]);
              },
              onError: (err: Error) => {
                Alert.alert("Error", err.message || "Failed to complete session.");
              },
            });
          },
        },
      ]
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case "BOOKED":
        return { badge: styles.statusBooked, text: styles.statusBookedText };
      case "COMPLETED":
      case "COMPLETE":
        return { badge: styles.statusCompleted, text: styles.statusCompletedText };
      case "CANCELLED":
        return { badge: styles.statusCancelled, text: styles.statusCancelledText };
      default:
        return { badge: styles.statusNoShow, text: styles.statusNoShowText };
    }
  };

  const statusStyle = getStatusStyle(session.status);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { zIndex: 10 }]}
          onPress={() => navigation.goBack()}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="chevron-back" size={14} color="#FF5E3A" />

          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>SESSION DETAILS</Text>
        </View>
        <View style={{ width: 60, opacity: 0 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Session Card Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarCircle}>
            <Ionicons name="barbell-outline" size={40} color="#FF5E3A" />
          </View>
          <Text style={styles.sessionCode}>{session.session_code}</Text>
          <Text style={styles.heroLabel}>PERSONAL TRAINING SESSION</Text>
          <View style={[styles.statusBadge, statusStyle.badge]}>
            <Text style={[styles.statusText, statusStyle.text]}>
              {session.status.toLowerCase()}
            </Text>
          </View>
        </View>

        {/* Section 1: Session Details Card */}
        <Text style={styles.sectionLabel}>SESSION DETAILS</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SESSION CODE</Text>
            <Text style={styles.infoValue}>{session.session_code}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SESSION TYPE</Text>
            <Text style={styles.infoValue}>{session.session_type}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SESSION SOURCE</Text>
            <Text style={styles.infoValue}>{session.session_source}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>AMOUNT CHARGED</Text>
            <Text style={[styles.infoValue, { color: "#FF5E3A" }]}>
              ₹{session.amount_charged}
            </Text>
          </View>
        </View>

        {/* Section 2: Participants & Schedule Card */}
        <Text style={styles.sectionLabel}>PARTICIPANTS & SCHEDULE</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="person-outline" size={14} color="rgba(255, 255, 255, 0.4)" />
              <Text style={styles.infoLabel}>MEMBER NAME</Text>
            </View>
            <Text style={styles.infoValue}>{session.member_name || "Unknown"}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="fitness-outline" size={14} color="rgba(255, 255, 255, 0.4)" />
              <Text style={styles.infoLabel}>TRAINER NAME</Text>
            </View>
            <Text style={styles.infoValue}>{session.trainer_name}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="calendar-outline" size={14} color="rgba(255, 255, 255, 0.4)" />
              <Text style={styles.infoLabel}>SESSION DATE</Text>
            </View>
            <Text style={styles.infoValue}>
              {new Date(session.session_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        {/* Action console buttons */}
        {session.status === "BOOKED" && (
          <View style={styles.actionSection}>
            <View style={{ gap: 12 }}>
              {/* Show complete button only for TRAINER */}
              {isTrainer && (
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={handleComplete}
                  disabled={completeMutation.isPending || cancelMutation.isPending}
                  activeOpacity={0.8}
                >
                  {completeMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.completeBtnText}>COMPLETE SESSION</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                disabled={completeMutation.isPending || cancelMutation.isPending}
                activeOpacity={0.8}
              >
                {cancelMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="close-circle" size={18} color="#F44336" />
                    <Text style={styles.cancelBtnText}>CANCEL PT SESSION</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1fff",
    // paddingTop: Platform.OS === "ios" ? 48 : (StatusBar.currentHeight || 24),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    position: "relative",
    minHeight: 68,
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    fontWeight: "800",
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
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  scrollContent: {
    padding: 24,
    gap: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    marginVertical: 10,
    gap: 10,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#16161A",
    borderWidth: 2,
    borderColor: "#FF5E3A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF5E3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarText: {
    fontSize: 36,
  },
  sessionCode: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  heroLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statusBooked: {
    backgroundColor: "rgba(255, 94, 58, 0.12)",
    borderColor: "rgba(255, 94, 58, 0.25)",
  },
  statusBookedText: {
    color: "#FF5E3A",
  },
  statusCompleted: {
    backgroundColor: "rgba(76, 175, 80, 0.12)",
    borderColor: "rgba(76, 175, 80, 0.25)",
  },
  statusCompletedText: {
    color: "#4CAF50",
  },
  statusCancelled: {
    backgroundColor: "rgba(244, 67, 54, 0.12)",
    borderColor: "rgba(244, 67, 54, 0.25)",
  },
  statusCancelledText: {
    color: "#F44336",
  },
  statusNoShow: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statusNoShowText: {
    color: "rgba(255, 255, 255, 0.5)",
  },
  sectionLabel: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 10,
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
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  infoValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  actionSection: {
    marginTop: 15,
  },
  cancelBtn: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderWidth: 1.5,
    borderColor: "#F44336",
    borderRadius: 16,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: "#F44336",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  completeBtn: {
    backgroundColor: "#4CAF50",
    borderRadius: 16,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  completeBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  noShowBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  noShowBtnText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
