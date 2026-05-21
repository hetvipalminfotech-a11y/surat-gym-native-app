import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { useQuery } from "@tanstack/react-query";
import {
  getMemberPtSessions,
} from "../../services/receptionist.service";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFreezeMember,
  useUnfreezeMember,
} from "../../hooks/useMembers";
import {
  useCancelPtSession,
  useCompletePtSession,
} from "../../hooks/usePtSessions";
import { useAuthStore } from "../../store/useAuthStore";

type Props = NativeStackScreenProps<RootStackParamList, "MemberDetail">;

export default function MemberDetailScreen({ route, navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const { member: initialMember, updatedMember } = route.params;
  const [member, setMember] = useState(initialMember);

  useEffect(() => {
    if (updatedMember) {
      setMember(updatedMember);
      navigation.setParams({ updatedMember: undefined });
    }
  }, [updatedMember, navigation]);

  // Mutations
  const freezeMutation = useFreezeMember();
  const unfreezeMutation = useUnfreezeMember();
  const cancelPtSessionMutation = useCancelPtSession();
  const completePtSessionMutation = useCompletePtSession();
  const [loadingSessionId, setLoadingSessionId] = useState<number | null>(null);

  const handleCompleteSession = (sessionId: number) => {
    Alert.alert(
      "Complete Session ✅",
      "Confirm that this PT session has been successfully completed with the member.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "COMPLETE",
          style: "default",
          onPress: async () => {
            try {
              setLoadingSessionId(sessionId);
              await completePtSessionMutation.mutateAsync(sessionId);
              Alert.alert("Completed!", "PT Session marked as completed.");
            } catch (err: unknown) {
              const apiError = err as { message?: string };
              Alert.alert("Error", apiError.message || "Failed to complete session.");
            } finally {
              setLoadingSessionId(null);
            }
          }
        }
      ]
    );
  };

  const handleCancelSession = (sessionId: number) => {
    Alert.alert(
      "Cancel Session ⚠️",
      "Are you absolutely sure you want to cancel this personal training session?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setLoadingSessionId(sessionId);
              await cancelPtSessionMutation.mutateAsync(sessionId);
              Alert.alert("Cancelled!", "PT Session has been successfully cancelled.");
            } catch (err: unknown) {
              const apiError = err as { message?: string };
              Alert.alert("Error", apiError.message || "Failed to cancel session.");
            } finally {
              setLoadingSessionId(null);
            }
          }
        }
      ]
    );
  };

  // Fetch Member's PT Sessions dynamically (only for non-trainers)
  const { data: ptSessions = [], isLoading: isSessionsLoading } = useQuery({
    queryKey: ["member-sessions", member.id],
    queryFn: () => getMemberPtSessions(member.id),
    staleTime: 1000 * 30, // 30 seconds
    enabled: user?.role !== "TRAINER",
  });

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  // Freeze plan trigger
  const handleFreeze = () => {
    Alert.alert(
      "Freeze Plan",
      "Are you sure you want to suspend this membership plan and put it on hold?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "FREEZE",
          style: "destructive",
          onPress: () => {
            freezeMutation.mutate(member.id, {
              onSuccess: (updated) => {
                setMember(updated);
                Alert.alert("Suspended", "Membership plan is now frozen.");
              },
            });
          },
        },
      ]
    );
  };

  // Unfreeze plan trigger
  const handleUnfreeze = () => {
    unfreezeMutation.mutate(member.id, {
      onSuccess: (updated) => {
        setMember(updated);
        Alert.alert("Activated", "Membership plan is now active again.");
      },
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return { badge: styles.statusActive, text: styles.statusActiveText };
      case "FROZEN":
        return { badge: styles.statusFrozen, text: styles.statusFrozenText };
      default:
        return { badge: styles.statusExpired, text: styles.statusExpiredText };
    }
  };

  const statusStyle = getStatusStyle(member.status);

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
            <Text style={styles.backButtonText}>BACK</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>MEMBER PROFILE</Text>
        </View>
        <View style={{ width: 60, opacity: 0 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
          </View>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberCode}>{member.member_code}</Text>
          <View style={[styles.statusBadge, statusStyle.badge]}>
            <Text style={[styles.statusText, statusStyle.text]}>
              {member.status}
            </Text>
          </View>
        </View>

        {/* Credentials list */}
        <Text style={styles.sectionLabel}>CONTACT & PROFILE DETAILS</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PHONE NUMBER</Text>
            <Text style={styles.infoValue}>{member.phone}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
            <Text style={styles.infoValue}>{member.email || "N/A"}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>AGE / GENDER</Text>
            <Text style={styles.infoValue}>
              {member.age ? `${member.age} Yrs` : "N/A"} • {member.gender || "N/A"}
            </Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>EMERGENCY CONTACT</Text>
            <Text style={styles.infoValue}>{member.emergency_contact_phone || "N/A"}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>HEALTH CONDITIONS</Text>
            <Text style={styles.infoValue}>{member.health_conditions || "None"}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>REMAINING PT SESSIONS</Text>
            <Text style={[styles.infoValue, { color: "#FF5E3A" }]}>
              {member.remaining_pt_sessions}
            </Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>MEMBERSHIP PLAN</Text>
            <Text style={styles.infoValue}>{member.plan_name || "Custom Plan"}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>START DATE</Text>
            <Text style={styles.infoValue}>{formatDate(member.start_date)}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>END DATE</Text>
            <Text style={styles.infoValue}>{formatDate(member.end_date)}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>REGISTERED ON</Text>
            <Text style={styles.infoValue}>{formatDate(member.created_at)}</Text>
          </View>
        </View>

        {/* Action Controls */}
        {user?.role !== "TRAINER" && (
          <>
            <Text style={styles.sectionLabel}>MEMBERSHIP CONSOLE ACTIONS</Text>
            <View style={styles.actionGrid}>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionEdit]}
                  onPress={() => navigation.navigate("EditMember", { member })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>EDIT DETAILS</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    styles.actionRenew,
                    member.status === "FROZEN" && styles.actionDisabled,
                  ]}
                  disabled={member.status === "FROZEN"}
                  onPress={() => navigation.navigate("RenewPlan", { member })}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="flash-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>RENEW PLAN</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {member.status === "ACTIVE" ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionFullWidth, styles.actionFreeze]}
                  onPress={handleFreeze}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="snow" size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>FREEZE PLAN</Text>
                  </View>
                </TouchableOpacity>
              ) : member.status === "FROZEN" ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionFullWidth, styles.actionUnfreeze]}
                  onPress={handleUnfreeze}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="flame" size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>ACTIVATE PLAN</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        )}

        {/* PT Sessions list (only visible to non-trainers) */}
        {user?.role !== "TRAINER" && (
          <>
            <Text style={styles.sectionLabel}>BOOKED PT SESSIONS</Text>
            {isSessionsLoading ? (
              <ActivityIndicator size="small" color="#FF5E3A" style={{ marginVertical: 20 }} />
            ) : ptSessions.length === 0 ? (
              <View style={styles.emptySessionsCard}>
                <Text style={styles.emptyText}>No personal training sessions scheduled.</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {ptSessions.map((sess) => (
                  <View key={sess.id} style={styles.ptSessionCard}>
                    <View style={styles.sessionHeaderRow}>
                      <Text style={styles.sessionCode}>{sess.session_code}</Text>
                      <View style={[
                        styles.sessionStatusBadge,
                        sess.status === "COMPLETED" && styles.statusActive,
                        sess.status === "CANCELLED" && styles.statusExpired,
                        sess.status === "BOOKED" && styles.statusFrozen
                      ]}>
                        <Text style={[
                          styles.sessionStatusText,
                          sess.status === "COMPLETED" && styles.statusActiveText,
                          sess.status === "CANCELLED" && styles.statusExpiredText,
                          sess.status === "BOOKED" && styles.statusFrozenText
                        ]}>
                          {sess.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sessionGrid}>
                      <View style={styles.sessionGridRow}>
                        <Text style={styles.sessionGridLabel}>Date:</Text>
                        <Text style={styles.sessionGridValue}>{formatDate(sess.session_date)}</Text>
                      </View>
                      <View style={styles.sessionGridRow}>
                        <Text style={styles.sessionGridLabel}>Trainer:</Text>
                        <Text style={styles.sessionGridValue}>{sess.trainer_name}</Text>
                      </View>
                      <View style={styles.sessionGridRow}>
                        <Text style={styles.sessionGridLabel}>Type:</Text>
                        <Text style={styles.sessionGridValue}>{sess.session_type}</Text>
                      </View>
                      <View style={styles.sessionGridRow}>
                        <Text style={styles.sessionGridLabel}>Source:</Text>
                        <Text style={styles.sessionGridValue}>{sess.session_source}</Text>
                      </View>
                      <View style={styles.sessionGridRow}>
                        <Text style={styles.sessionGridLabel}>Amount:</Text>
                        <Text style={[styles.sessionGridValue, { color: "#FF5E3A" }]}>₹{sess.amount_charged}</Text>
                      </View>
                    </View>

                    {/* Direct actions for BOOKED status */}
                    {sess.status === "BOOKED" && (
                      <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.05)", paddingTop: 12 }}>
                        {loadingSessionId === sess.id ? (
                          <ActivityIndicator size="small" color="#FF5E3A" />
                        ) : (
                          <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity
                              style={{
                                flex: 1,
                                backgroundColor: "#4CAF50",
                                borderRadius: 10,
                                height: 34,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onPress={() => handleCompleteSession(sess.id)}
                              activeOpacity={0.8}
                            >
                              <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>
                                COMPLETE
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={{
                                flex: 1,
                                borderWidth: 1,
                                borderColor: "rgba(244, 67, 54, 0.5)",
                                backgroundColor: "rgba(244, 67, 54, 0.05)",
                                borderRadius: 10,
                                height: 34,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onPress={() => handleCancelSession(sess.id)}
                              activeOpacity={0.8}
                            >
                              <Text style={{ color: "#F44336", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>
                                CANCEL
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1fff",
    paddingTop: Platform.OS === "ios" ? 0 : (StatusBar.currentHeight || 24),
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
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  memberName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  memberCode: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "800",
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
  },
  statusActive: {
    backgroundColor: "rgba(76, 175, 80, 0.12)",
    borderColor: "rgba(76, 175, 80, 0.25)",
  },
  statusActiveText: {
    color: "#4CAF50",
  },
  statusFrozen: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statusFrozenText: {
    color: "rgba(255, 255, 255, 0.5)",
  },
  statusExpired: {
    backgroundColor: "rgba(244, 67, 54, 0.12)",
    borderColor: "rgba(244, 67, 54, 0.25)",
  },
  statusExpiredText: {
    color: "#F44336",
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
  actionGrid: {
    gap: 10,
    width: "100%",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
  },
  actionFullWidth: {
    flex: 0,
    width: "100%",
  },
  actionEdit: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  actionRenew: {
    backgroundColor: "rgba(255, 94, 58, 0.05)",
    borderColor: "rgba(255, 94, 58, 0.25)",
  },
  actionDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderColor: "rgba(255, 255, 255, 0.05)",
    opacity: 0.35,
  },
  actionFreeze: {
    backgroundColor: "rgba(244, 67, 54, 0.05)",
    borderColor: "rgba(244, 67, 54, 0.2)",
  },
  actionUnfreeze: {
    backgroundColor: "rgba(76, 175, 80, 0.05)",
    borderColor: "rgba(76, 175, 80, 0.2)",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  emptySessionsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "600",
  },
  ptSessionCard: {
    backgroundColor: "rgba(30, 30, 35, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  sessionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionCode: {
    color: "#FF5E3A",
    fontSize: 14,
    fontWeight: "900",
  },
  sessionStatusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sessionStatusText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sessionGrid: {
    gap: 6,
  },
  sessionGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionGridLabel: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 11,
    fontWeight: "700",
  },
  sessionGridValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
