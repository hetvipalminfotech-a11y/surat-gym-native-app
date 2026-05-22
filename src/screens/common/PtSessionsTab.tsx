import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import {
  MemberPtSession,
} from "../../services/receptionist.service";
import {
  useInfinitePtSessions,
  useCancelPtSession,
  useCompletePtSession,
} from "../../hooks/usePtSessions";

import { useAuthStore } from "../../store/useAuthStore";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function PtSessionsTab({ navigation }: Props) {
  const currentUser = useAuthStore((state) => state.user);
  const isTrainer = currentUser?.role === "TRAINER";
  const [loading, setLoading] = useState<boolean>(false);

  // Booked sessions directory state

  const [statusFilter, setStatusFilter] = useState<"all" | "booked" | "complete" | "cancelled" | "no_show">("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [showListDatePicker, setShowListDatePicker] = useState<boolean>(false);

  // Calendar states (for Date Filter)
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[calendarMonth];

  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((prev) => prev - 1);
    } else {
      setCalendarMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((prev) => prev + 1);
    } else {
      setCalendarMonth((prev) => prev + 1);
    }
  };

  // Map filters to API values
  const apiStatus =
    statusFilter === "all"
      ? "ALL"
      : statusFilter === "booked"
        ? "BOOKED"
        : statusFilter === "complete"
          ? "COMPLETED"
          : statusFilter === "cancelled"
            ? "CANCELLED"
            : "NO_SHOW";

  // React Query hooks & mutations
  const {
    data: sessionsData,
    fetchNextPage: fetchNextSessionsPage,
    hasNextPage: hasNextSessionsPage,
    isFetchingNextPage: isFetchingNextSessionsPage,
    isLoading: isSessionsLoading,
    refetch: refetchSessions,
  } = useInfinitePtSessions(apiStatus, dateFilter || undefined);

  const sessions = sessionsData?.pages.flatMap((page) => page.sessions) ?? [];

  const cancelPtSessionMutation = useCancelPtSession();
  const completePtSessionMutation = useCompletePtSession();

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
              setLoading(true);
              await completePtSessionMutation.mutateAsync(sessionId);
              Alert.alert("Completed!", "PT Session marked as completed.");
            } catch (err: unknown) {
              const apiError = err as { message?: string };
              Alert.alert("Error", apiError.message || "Failed to complete session.");
            } finally {
              setLoading(false);
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
              setLoading(true);
              await cancelPtSessionMutation.mutateAsync(sessionId);
              Alert.alert("Cancelled!", "PT Session has been successfully cancelled.");
            } catch (err: unknown) {
              const apiError = err as { message?: string };
              Alert.alert("Error", apiError.message || "Failed to cancel session.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with inline Book Session Trigger */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>PT Session Slots</Text>
          <Text style={styles.headerSubtitle}>Locked & Secured Booking</Text>
        </View>

        {!isTrainer ? (
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => navigation.navigate("BookPtSession")}
            activeOpacity={0.8}
          >
            <Text style={styles.bookBtnText}>+ BOOK SESSION</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 120 }} /> // keeps layout balanced
        )}
      </View>

      {/* Main List Filters */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, gap: 12 }}>
        <Text style={styles.sectionTitle}>FILTER BY STATUS</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, alignItems: "center" }}
          >
            {(["all", "booked", "complete", "cancelled", "no_show"] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  {
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.08)",
                  },
                  statusFilter === status && {
                    backgroundColor: "rgba(255, 94, 58, 0.12)",
                    borderColor: "#FF5E3A",
                  }
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: statusFilter === status ? "#FF5E3A" : "rgba(255, 255, 255, 0.6)",
                }}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Date Filter Selection card */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.08)",
              borderRadius: 12,
              paddingHorizontal: 16,
              height: 44,
            }}
            onPress={() => setShowListDatePicker(true)}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="calendar-outline" size={16} color="#FF5E3A" />
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
                {dateFilter ? `Filter: ${new Date(dateFilter).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}` : "Select Date Filter"}
              </Text>
            </View>
            <Text style={{ color: "#FF5E3A", fontSize: 13, fontWeight: "bold" }}>CHANGE</Text>
          </TouchableOpacity>

          {dateFilter !== "" && (
            <TouchableOpacity
              style={{
                backgroundColor: "rgba(255, 94, 58, 0.1)",
                borderWidth: 1,
                borderColor: "rgba(255, 94, 58, 0.3)",
                borderRadius: 12,
                paddingHorizontal: 16,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => setDateFilter("")}
            >
              <Text style={{ color: "#FF5E3A", fontSize: 13, fontWeight: "800" }}>RESET</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Booked Sessions Directory */}
      {isSessionsLoading && sessions.length === 0 ? (
        <View style={styles.centerSpinner}>
          <ActivityIndicator size="large" color="#FF5E3A" />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(sess) => sess.id.toString()}
          contentContainerStyle={{ padding: 24, gap: 16 }}
          renderItem={({ item: sess }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate("PtSessionDetail", { session: sess })}
              style={{
                backgroundColor: "rgba(30, 30, 35, 0.65)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.08)",
                borderRadius: 18,
                padding: 16,
                gap: 12,
              }}
            >
              {/* Top info and status badge */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>PT SESSION CODE</Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "bold" }}>{sess.session_code}</Text>
                </View>
                <View style={[
                  styles.statusBookedBadge,
                  sess.status === "COMPLETED" && { backgroundColor: "rgba(76, 175, 80, 0.1)", borderColor: "rgba(76, 175, 80, 0.25)" },
                  sess.status === "CANCELLED" && { backgroundColor: "rgba(244, 67, 54, 0.1)", borderColor: "rgba(244, 67, 54, 0.25)" },
                  sess.status === "NO_SHOW" && { backgroundColor: "rgba(255, 255, 255, 0.05)", borderColor: "rgba(255, 255, 255, 0.1)" },
                ]}>
                  <Text style={[
                    styles.statusBookedText,
                    sess.status === "COMPLETED" && { color: "#4CAF50" },
                    sess.status === "CANCELLED" && { color: "#F44336" },
                    sess.status === "NO_SHOW" && { color: "rgba(255, 255, 255, 0.5)" },
                  ]}>
                    {sess.status === "BOOKED" ? "booked" :
                      sess.status === "COMPLETED" ? "complete" :
                        sess.status === "CANCELLED" ? "cancelled" :
                          sess.status === "NO_SHOW" ? "no_show" :
                            sess.status.toLowerCase()}
                  </Text>
                </View>
              </View>

              <View style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.05)", paddingBottom: 10, gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="person" size={14} color="#FF5E3A" />
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
                    Member: <Text style={{ color: "#FF5E3A" }}>{sess.member_name || "Unknown"}</Text>
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="fitness" size={14} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12, fontWeight: "600" }}>
                    Trainer: <Text style={{ color: "#FFFFFF" }}>{sess.trainer_name}</Text>
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="calendar" size={14} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 11, fontWeight: "500" }}>
                    Date: {new Date(sess.session_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              </View>

              {/* Footnote details */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 11, fontWeight: "600" }}>
                  Type: {sess.session_type} ({sess.session_source})
                </Text>
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "bold" }}>
                  Amount: ₹{sess.amount_charged}
                </Text>
              </View>

              {/* Actions Column (Complete and Cancel buttons) */}
              {sess.status === "BOOKED" ? (
                <View style={{ flexDirection: "row", gap: 10 }}>

                  {isTrainer && (
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: "#4CAF50",
                        borderRadius: 12,
                        height: 38,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCompleteSession(sess.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 }}>
                        COMPLETE
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: "rgba(244, 67, 54, 0.5)",
                      backgroundColor: "rgba(244, 67, 54, 0.05)",
                      borderRadius: 12,
                      height: 38,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCancelSession(sess.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: "#F44336", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 }}>
                      CANCEL
                    </Text>
                  </TouchableOpacity>

                </View>
              ) : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 14, fontWeight: "600" }}>
                No booked sessions match your criteria.
              </Text>
            </View>
          )}
          ListFooterComponent={() =>
            isFetchingNextSessionsPage ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color="#FF5E3A" />
              </View>
            ) : null
          }
          refreshing={isSessionsLoading && sessions.length > 0}
          onRefresh={refetchSessions}
          onEndReached={() => {
            if (hasNextSessionsPage) {
              fetchNextSessionsPage();
            }
          }}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* Date Filter Custom Datepicker Modal */}
      <Modal visible={showListDatePicker} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}>
          <View style={{
            backgroundColor: "#121216",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.08)",
            borderRadius: 24,
            padding: 20,
            width: "100%",
            maxWidth: 340,
          }}>
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}>
              <TouchableOpacity onPress={prevMonth} style={{ padding: 8 }}>
                <Ionicons name="chevron-back" size={20} color="#FF5E3A" />
              </TouchableOpacity>
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900" }}>{monthName} {calendarYear}</Text>
              <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }}>
                <Ionicons name="chevron-forward" size={20} color="#FF5E3A" />
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <Text key={day} style={{ color: "rgba(255, 255, 255, 0.3)", width: 36, textAlign: "center", fontSize: 11, fontWeight: "700" }}>{day}</Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" }}>
              {emptyCells.map((_, idx) => (
                <View key={`empty-${idx}`} style={{ width: 42, height: 38 }} />
              ))}
              {daysArray.map((dayNum) => {
                const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = dateFilter === dateString;

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={[
                      {
                        width: 42,
                        height: 38,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        marginVertical: 1,
                      },
                      isSelected && { backgroundColor: "#FF5E3A" }
                    ]}
                    onPress={() => {
                      setDateFilter(dateString);
                      setShowListDatePicker(false);
                    }}
                  >
                    <Text style={[
                      { color: "rgba(255, 255, 255, 0.8)", fontSize: 12, fontWeight: "700" },
                      isSelected && { color: "#FFFFFF", fontWeight: "900" }
                    ]}>
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderRadius: 12,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 16,
              }}
              onPress={() => setShowListDatePicker(false)}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 76,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  headerSubtitle: {
    color: "#FF5E3A",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  bookBtn: {
    backgroundColor: "#FF5E3A",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#FF5E3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },

  bookBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  centerSpinner: {
    paddingVertical: 40,
    alignItems: "center",
  },
  statusBookedBadge: {
    backgroundColor: "rgba(255, 94, 58, 0.1)",
    borderColor: "rgba(255, 94, 58, 0.25)",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statusBookedText: {
    color: "#FF5E3A",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
