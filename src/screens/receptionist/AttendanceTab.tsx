import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { useQuery } from "@tanstack/react-query";
import {
  getMembers,
  getAllPtSessions,
  AttendanceLog,
  Member,
} from "../../services/receptionist.service";
import {
  useDailyAttendance,
  useCheckInMember,
  useCheckOutMember,
} from "../../hooks/useAttendance";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ReceptionTabs">;
};

export default function AttendanceTab({ navigation }: Props) {
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Redesigned attendance and custom selector states
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [showMemberDropdown, setShowMemberDropdown] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Custom calendar date navigation states
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());

  const formatDisplayDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length !== 3) return dateStr;
      const year = parts[0];
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${monthNames[monthIdx]} ${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handlePrevDay = () => {
    const parts = selectedDate.split("-");
    if (parts.length !== 3) return;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const current = new Date(year, month, day);
    current.setDate(current.getDate() - 1);
    const newDateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    setSelectedDate(newDateStr);
    setCalendarMonth(current.getMonth());
    setCalendarYear(current.getFullYear());
  };

  const handleNextDay = () => {
    const parts = selectedDate.split("-");
    if (parts.length !== 3) return;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const current = new Date(year, month, day);
    current.setDate(current.getDate() + 1);
    const newDateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    setSelectedDate(newDateStr);
    setCalendarMonth(current.getMonth());
    setCalendarYear(current.getFullYear());
  };

  // React Query: Fetch daily gate attendance logs
  const {
    data: attendanceLogs = [],
    isLoading: isAttendanceLoading,
    refetch: refetchAttendance,
  } = useDailyAttendance(selectedDate);

  // React Query: Fetch active members
  const activeMembersQuery = useQuery({
    queryKey: ["members-active"],
    queryFn: () => getMembers("", "ACTIVE"),
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });
  const activeMembers = activeMembersQuery.data || [];

  // React Query: Fetch all PT sessions for today (to identify members with scheduled sessions)
  const todayPtSessionsQuery = useQuery({
    queryKey: ["pt-sessions-today", selectedDate],
    queryFn: () => getAllPtSessions(undefined, selectedDate),
    enabled: !!selectedDate,
    staleTime: 1000 * 30, // 30 seconds stale time
  });
  const sessionList = todayPtSessionsQuery.data || [];

  // Mutations
  const checkInMutation = useCheckInMember();
  const checkOutMutation = useCheckOutMember();

  // Compute related/scheduled members dynamically
  const scheduledMemberIds = useMemo(() => {
    return new Set(sessionList.map((s) => s.member_id));
  }, [sessionList]);

  const relatedMembers = useMemo(() => {
    return activeMembers.filter((m) => scheduledMemberIds.has(m.id));
  }, [activeMembers, scheduledMemberIds]);

  const loadingRelated = activeMembersQuery.isLoading || todayPtSessionsQuery.isLoading;

  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const monthName = new Date(calendarYear, calendarMonth).toLocaleString("en-US", { month: "long" });

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

  const handleLogAttendance = async (status: "CHECK_IN" | "CHECK_OUT") => {
    if (!selectedMember) {
      Alert.alert("Validation Error", "Please select a member first");
      return;
    }

    setLoading(true);
    try {
      if (status === "CHECK_IN") {
        await checkInMutation.mutateAsync(selectedMember.id);
        Alert.alert("Check-In Complete ✅", `${selectedMember.name} has been successfully checked in!`);
      } else {
        await checkOutMutation.mutateAsync(selectedMember.id);
        Alert.alert("Check-Out Complete ✅", `${selectedMember.name} has been successfully checked out!`);
        setSelectedMember(null);
        setSearch("");
      }
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      Alert.alert("Attendance Refused", apiError.message || "Failed to update attendance");
    } finally {
      setLoading(false);
    }
  };

  // Scan attendance logs for the selected member on the selected date (using robust Number casting)
  const memberLog = selectedMember
    ? attendanceLogs.find((log) => Number(log.member_id) === Number(selectedMember.id))
    : undefined;

  // Contextual status flags based on the database check_out_time presence
  const isAlreadyCheckedIn = memberLog !== undefined;
  const isAlreadyCheckedOut = memberLog
    ? (memberLog.check_out_time !== null && memberLog.check_out_time !== undefined && String(memberLog.check_out_time).trim().length > 0)
    : false;

  const presentCount = Array.isArray(attendanceLogs)
    ? attendanceLogs.filter((log) => {
      const isCheckedOut = log.check_out_time !== null && log.check_out_time !== undefined && String(log.check_out_time).trim().length > 0;
      return !isCheckedOut; // PRESENT means checked in but not checked out yet!
    }).length
    : 0;

  const renderHeader = () => (
    <View style={{ gap: 24, marginBottom: 16 }}>
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>PRESENT TODAY</Text>
          <Text style={styles.statValue}>{presentCount}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TOTAL LOGS</Text>
          <Text style={styles.statValue}>{attendanceLogs.length}</Text>
        </View>
      </View>

      {/* Modern Date Filter Strip */}
      <View style={styles.dateSelectorStrip}>
        <TouchableOpacity onPress={handlePrevDay} style={styles.stripArrow}>
          <Ionicons name="chevron-back" size={20} color="#FF5E3A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stripDateBtn}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="calendar-outline" size={16} color="#FF5E3A" />
            <Text style={styles.stripDateText}>
              {formatDisplayDate(selectedDate)}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNextDay} style={styles.stripArrow}>
          <Ionicons name="chevron-forward" size={20} color="#FF5E3A" />
        </TouchableOpacity>
      </View>

      {/* 2. LOG MEMBER ATTENDANCE CARD */}
      <View style={[styles.card, { zIndex: 1000 }]}>
        <Text style={styles.cardTitle}>Log Member Attendance</Text>

        <View style={{ zIndex: 1000 }}>
          <Text style={styles.inputLabel}>SELECT ACTIVE MEMBER *</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => {
              setShowMemberDropdown(!showMemberDropdown);
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <Ionicons
                name={selectedMember ? "person" : "person-outline"}
                size={18}
                color={selectedMember ? "#FF5E3A" : "rgba(255, 255, 255, 0.4)"}
              />
              <Text
                style={{
                  color: selectedMember ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)",
                  fontSize: 14,
                  fontWeight: "600",
                  flex: 1
                }}
                numberOfLines={1}
              >
                {selectedMember ? `${selectedMember.name} (${selectedMember.member_code})` : "Select Active Member..."}
              </Text>
            </View>
            <Ionicons
              name={showMemberDropdown ? "chevron-up" : "chevron-down"}
              size={18}
              color="#FF5E3A"
            />
          </TouchableOpacity>

          {showMemberDropdown && (
            <View style={styles.dropdownOverlayList}>
              <TextInput
                style={styles.dropdownSearchInput}
                placeholder="Type to filter members..."
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                value={search}
                onChangeText={setSearch}
              />
              <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Ionicons
                    name={relatedMembers.length > 0 ? "calendar" : "people"}
                    size={14}
                    color="#FF5E3A"
                  />
                  <Text style={{ color: "#FF5E3A", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>
                    {relatedMembers.length > 0
                      ? "MEMBERS WITH SCHEDULED SESSIONS TODAY"
                      : "ALL ACTIVE MEMBERS (NO SESSIONS BOOKED TODAY)"}
                  </Text>
                </View>
                {loadingRelated ? (
                  <ActivityIndicator size="small" color="#FF5E3A" style={{ marginVertical: 10 }} />
                ) : (
                  (relatedMembers.length > 0 ? relatedMembers : activeMembers)
                    .filter((m) => {
                      const query = search.toLowerCase();
                      return m.name.toLowerCase().includes(query) ||
                        m.phone.includes(query) ||
                        m.member_code.toLowerCase().includes(query);
                    })
                    .map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.dropdownListItem,
                          selectedMember?.id === m.id && { backgroundColor: "rgba(255, 94, 58, 0.12)" }
                        ]}
                        onPress={() => {
                          setSelectedMember(m);
                          setShowMemberDropdown(false);
                          setSearch("");
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>{m.name}</Text>
                          <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 10, fontWeight: "bold" }}>{m.member_code}</Text>
                        </View>
                        <Text style={{ color: "#FF5E3A", fontSize: 10, fontWeight: "600", marginTop: 2 }}>
                          Remaining PT: {m.remaining_pt_sessions} sessions
                        </Text>
                      </TouchableOpacity>
                    ))
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {selectedMember && (
          <View style={{ marginTop: 8 }}>
            {!isAlreadyCheckedIn ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnIn, { height: 48 }]}
                onPress={() => handleLogAttendance("CHECK_IN")}
                disabled={loading || checkInMutation.isPending}
              >
                {loading || checkInMutation.isPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>MARK CHECK-IN</Text>}
              </TouchableOpacity>
            ) : !isAlreadyCheckedOut ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnOut, { height: 48 }]}
                onPress={() => handleLogAttendance("CHECK_OUT")}
                disabled={loading || checkOutMutation.isPending}
              >
                {loading || checkOutMutation.isPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>MARK CHECK-OUT</Text>}
              </TouchableOpacity>
            ) : (
              <View style={[styles.checkedOutBadge, { flexDirection: "row", alignItems: "center", gap: 6 }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color="rgba(255, 255, 255, 0.4)" />
                <Text style={styles.checkedOutText}>Already Checked Out on this date</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Live Logs */}
      <Text style={styles.sectionTitle}>ATTENDANCE LOGS FOR {selectedDate}</Text>
    </View>
  );

  const renderAttendanceLog = (log: AttendanceLog) => {
    const isCheckedOut = log.check_out_time !== null && log.check_out_time !== undefined && String(log.check_out_time).trim().length > 0;
    const statusText = isCheckedOut ? "DEPARTED" : "PRESENT";

    return (
      <View key={log.id} style={styles.logCard}>
        <View style={styles.logLeft}>
          <Text style={styles.logName}>{log.member_name || `Member ID: ${log.member_id}`}</Text>
          {log.member_code && <Text style={styles.logCode}>{log.member_code}</Text>}
        </View>
        <View style={styles.logRight}>
          <Text style={styles.logTime}>In: {log.check_in_time}</Text>
          {log.check_out_time && (
            <Text style={styles.logTime}>Out: {log.check_out_time}</Text>
          )}
          <View style={[
            styles.statusPill,
            statusText === "PRESENT" ? styles.statusPresent : styles.statusDeparted
          ]}>
            <Text style={[
              styles.statusPillText,
              statusText === "PRESENT" ? styles.statusTextPresent : styles.statusTextDeparted
            ]}>
              {statusText}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isAttendanceLoading) {
      return <ActivityIndicator size="large" color="#FF5E3A" style={{ marginTop: 20 }} />;
    }
    return <Text style={styles.emptyText}>No attendance logged for this date.</Text>;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Attendance Panel</Text>
          <Text style={styles.headerSubtitle}>Real-time check-in logs</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isAttendanceLoading && attendanceLogs.length > 0}
              onRefresh={refetchAttendance}
              tintColor="#FF5E3A"
              colors={["#FF5E3A"]}
            />
          }
        >
          {renderHeader()}

          {attendanceLogs.length > 0 ? (
            <View style={styles.logsListContainer}>
              {attendanceLogs.map(renderAttendanceLog)}
            </View>
          ) : (
            renderEmpty()
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Filter Custom Datepicker Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade">
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
                const isSelected = selectedDate === dateString;

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
                      setSelectedDate(dateString);
                      setShowDatePicker(false);
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
              onPress={() => setShowDatePicker(false)}
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
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  headerSubtitle: {
    color: "#FF5E3A",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 4,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 100 : 80,
  },
  logsListContainer: {
    gap: 12,
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(30, 30, 35, 0.6)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
    alignItems: "center",
  },
  dateSelectorStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(30, 30, 35, 0.45)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 6,
  },
  stripArrow: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  stripArrowText: {
    color: "#FF5E3A",
    fontSize: 14,
    fontWeight: "bold",
  },
  stripDateBtn: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 94, 58, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 94, 58, 0.15)",
  },
  stripDateText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  card: {
    backgroundColor: "rgba(30, 30, 35, 0.6)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1.5,
    borderRadius: 12,
    color: "#FFFFFF",
    fontSize: 14,
    height: 48,
    paddingHorizontal: 16,
  },
  dropdown: {
    backgroundColor: "#16161A",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dropName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  dropCode: {
    color: "#FF5E3A",
    fontSize: 12,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  btnIn: {
    backgroundColor: "#4CAF50",
  },
  btnOut: {
    backgroundColor: "#FF5E3A",
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: -8,
  },
  logsContainer: {
    gap: 12,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 20,
  },
  logCard: {
    backgroundColor: "rgba(30, 30, 35, 0.65)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logLeft: {
    gap: 4,
  },
  logName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  logCode: {
    color: "#FF5E3A",
    fontSize: 12,
    fontWeight: "bold",
  },
  logRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  logTime: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    fontWeight: "600",
  },
  statusPill: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
    overflow: "hidden",
  },
  statusPresent: {
    backgroundColor: "rgba(76, 175, 80, 0.12)",
  },
  statusDeparted: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  statusTextPresent: {
    color: "#4CAF50",
  },
  statusTextDeparted: {
    color: "rgba(255, 255, 255, 0.5)",
  },
  dropdownTrigger: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  dropdownOverlayList: {
    backgroundColor: "#16161A",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    marginTop: 6,
    padding: 10,
    gap: 8,
  },
  dropdownSearchInput: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 12,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 6,
  },
  dropdownListItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 1,
  },
  inputLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  checkedOutBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  checkedOutText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
    fontWeight: "bold",
  },
});
