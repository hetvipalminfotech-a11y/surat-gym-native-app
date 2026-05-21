import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/useAuthStore";
import { useTrainerSlots } from "../../hooks/usePtSessions";
import { Ionicons } from "@expo/vector-icons";

export default function MySlotTab() {
  const user = useAuthStore((state) => state.user);
  const trainerId = user?.trainerId || null;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Horizontal date navigation setup (14 days starting from today)
  const dateList = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(dateList[0]);

  // Format date to local YYYY-MM-DD for backend
  const formatDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const selectedDateStr = formatDateString(selectedDate);

  // Queries & Mutations
  const { data: slots = [], isLoading } = useTrainerSlots(trainerId, selectedDateStr);

  const getDayName = (date: Date) => {
    return date.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase();
  };

  const getDateNumber = (date: Date) => {
    return date.getDate();
  };

  const formatDisplayTime = (timeStr: string) => {
    // "18:00:00" -> "06:00 PM"
    try {
      const [hStr, mStr] = timeStr.split(":");
      const hours = parseInt(hStr, 10);
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      return `${String(displayHours).padStart(2, "0")}:${mStr} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>Personal Schedule</Text>
          <Text style={styles.headerTitle}>My Slots Management</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddSlots", { selectedDateStr })}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ ADD SLOTS</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Dates Navigation Row */}
      <View style={styles.dateSelectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datesList}
        >
          {dateList.map((date, idx) => {
            const isSelected = formatDateString(date) === selectedDateStr;
            const isToday = idx === 0;

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.dateCard, isSelected && styles.dateCardActive]}
                onPress={() => setSelectedDate(date)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                  {isToday ? "TODAY" : getDayName(date)}
                </Text>
                <Text style={[styles.numberText, isSelected && styles.numberTextActive]}>
                  {getDateNumber(date)}
                </Text>
                {isSelected && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Slots Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>
          AVAILABILITY ON{" "}
          {selectedDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF5E3A" />
            <Text style={styles.loadingText}>Fetching your slot schedule...</Text>
          </View>
        ) : slots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="rgba(255, 94, 58, 0.4)" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No Slots Published</Text>
            <Text style={styles.emptySubtitle}>
              You haven't set your schedule for this day yet. Publish slots to let members book PT
              sessions with you.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => navigation.navigate("AddSlots", { selectedDateStr })}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyAddBtnText}>SET DAY AVAILABILITY</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={slots}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.slotsList}
            renderItem={({ item }) => {
              const isBooked = item.status === "BOOKED";
              const isBlocked = item.status === "BLOCKED";

              return (
                <View style={[styles.slotItemRow, isBooked && styles.slotItemBooked]}>
                  <View style={styles.slotTimeInfo}>
                    <Text style={styles.slotHours}>
                      {formatDisplayTime(item.start_time)} - {formatDisplayTime(item.end_time)}
                    </Text>
                    <Text style={styles.slotDateDetail}>Hourly PT Training Session</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isBooked && styles.pillBooked,
                      isBlocked && styles.pillBlocked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isBooked && styles.pillTextBooked,
                        isBlocked && styles.pillTextBlocked,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    minHeight: 76,
  },
  headerTitleContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerSubtitle: {
    color: "#FF5E3A",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: "left",
  },
  addButton: {
    backgroundColor: "#FF5E3A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#FF5E3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  dateSelectorContainer: {
    backgroundColor: "#0F0F12",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  datesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  dateCard: {
    width: 62,
    height: 74,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  dateCardActive: {
    backgroundColor: "rgba(255, 94, 58, 0.12)",
    borderColor: "#FF5E3A",
  },
  dayText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dayTextActive: {
    color: "#FF5E3A",
    fontWeight: "900",
  },
  numberText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  numberTextActive: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FF5E3A",
    position: "absolute",
    bottom: 6,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  sectionTitle: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 0.8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyAddBtn: {
    backgroundColor: "rgba(255, 94, 58, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 94, 58, 0.4)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyAddBtnText: {
    color: "#FF5E3A",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  slotsList: {
    gap: 12,
    paddingBottom: 24,
  },
  slotItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    padding: 16,
  },
  slotItemBooked: {
    borderColor: "rgba(76, 175, 80, 0.2)",
    backgroundColor: "rgba(76, 175, 80, 0.02)",
  },
  slotTimeInfo: {
    gap: 4,
  },
  slotHours: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  slotDateDetail: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 11,
    fontWeight: "600",
  },
  statusPill: {
    backgroundColor: "rgba(255, 94, 58, 0.1)",
    borderColor: "rgba(255, 94, 58, 0.3)",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillBooked: {
    backgroundColor: "rgba(76, 175, 80, 0.12)",
    borderColor: "rgba(76, 175, 80, 0.25)",
  },
  pillBlocked: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statusPillText: {
    color: "#FF5E3A",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  pillTextBooked: {
    color: "#4CAF50",
  },
  pillTextBlocked: {
    color: "rgba(255, 255, 255, 0.5)",
  },
});
