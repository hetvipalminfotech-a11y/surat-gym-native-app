import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import {
  getTrainers,
  getMembers,
  Trainer,
  Slot,
  Member,
} from "../../services/receptionist.service";
import {
  useTrainerSlots,
  useBookPtSession,
} from "../../hooks/usePtSessions";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "BookPtSession">;

export default function BookPtSessionScreen({ navigation }: Props) {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Member search
  const [memberSearch, setMemberSearch] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Dropdowns & date states
  const [activeMembers, setActiveMembers] = useState<Member[]>([]);
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [showMemberDropdown, setShowMemberDropdown] = useState<boolean>(false);
  const [showTrainerDropdown, setShowTrainerDropdown] = useState<boolean>(false);
  const [showBookingDatePicker, setShowBookingDatePicker] = useState<boolean>(false);

  // Calendar navigation
  const [bookingCalendarMonth, setBookingCalendarMonth] = useState<number>(new Date().getMonth());
  const [bookingCalendarYear, setBookingCalendarYear] = useState<number>(new Date().getFullYear());

  // React Query hooks
  const {
    data: slots = [],
    isLoading: isLoadingSlots,
  } = useTrainerSlots(selectedTrainer?.id || null, bookingDate);

  const bookPtSessionMutation = useBookPtSession();

  const fetchTrainersList = async () => {
    try {
      const list = await getTrainers();
      setTrainers(list);
      if (list.length > 0 && !selectedTrainer) {
        setSelectedTrainer(list[0]);
      }
    } catch (err) {
      console.warn("Failed to fetch trainers:", err);
    }
  };

  const fetchActiveMembersList = async () => {
    try {
      const list = await getMembers("", "ACTIVE");
      setActiveMembers(list);
    } catch (err) {
      console.warn("Failed to fetch active members list:", err);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedMember) {
      Alert.alert("Validation Error", "Please select a member to book this slot.");
      return;
    }

    if (!selectedSlot) {
      Alert.alert("Validation Error", "Please select a trainer slot.");
      return;
    }

    setLoading(true);
    try {
      await bookPtSessionMutation.mutateAsync({
        memberId: selectedMember.id,
        slotId: selectedSlot.id,
      });
      Alert.alert(
        "Session Booked! 🎉",
        `Personal Training slot has been successfully locked and saved in DB for ${selectedMember.name}!`
      );
      navigation.goBack();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      Alert.alert("Booking Refused ⚠️", apiError.message || "Failed to book session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainersList();
    fetchActiveMembersList();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { zIndex: 10 }]}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Book New PT Session</Text>
          <Text style={styles.headerSubtitle}>Lock & Secure a Slot</Text>
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
        >
          {/* 1. MEMBER SELECTION DROPDOWN */}
          <View style={[styles.inputGroup, { zIndex: 1000 }]}>
            <Text style={styles.inputLabel}>SELECT ACTIVE MEMBER *</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                setShowMemberDropdown(!showMemberDropdown);
                setShowTrainerDropdown(false);
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
                    fontSize: 16,
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
                  value={memberSearch}
                  onChangeText={setMemberSearch}
                />
                <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {activeMembers
                    .filter(m => {
                      const query = memberSearch.toLowerCase();
                      return m.name.toLowerCase().includes(query) ||
                        m.phone.includes(query) ||
                        m.member_code.toLowerCase().includes(query);
                    })
                    .map(m => (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.dropdownListItem,
                          selectedMember?.id === m.id && { backgroundColor: "rgba(255, 94, 58, 0.12)" }
                        ]}
                        onPress={() => {
                          setSelectedMember(m);
                          setShowMemberDropdown(false);
                          setMemberSearch("");
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>{m.name}</Text>
                          <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 12, fontWeight: "bold" }}>{m.member_code}</Text>
                        </View>
                        <Text style={{ color: "#FF5E3A", fontSize: 12, fontWeight: "600", marginTop: 2 }}>
                          Sessions Remaining: {m.remaining_pt_sessions}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 2. TRAINER SELECTION DROPDOWN */}
          <View style={[styles.inputGroup, { marginTop: 8, zIndex: 900 }]}>
            <Text style={styles.inputLabel}>SELECT TRAINER *</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                setShowTrainerDropdown(!showTrainerDropdown);
                setShowMemberDropdown(false);
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <Ionicons
                  name="fitness-outline"
                  size={18}
                  color={selectedTrainer ? "#FF5E3A" : "rgba(255, 255, 255, 0.4)"}
                />
                <Text
                  style={{
                    color: selectedTrainer ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)",
                    fontSize: 16,
                    fontWeight: "600",
                    flex: 1
                  }}
                  numberOfLines={1}
                >
                  {selectedTrainer ? `${selectedTrainer.name} (${selectedTrainer.specialization})` : "Select Trainer..."}
                </Text>
              </View>
              <Ionicons
                name={showTrainerDropdown ? "chevron-up" : "chevron-down"}
                size={18}
                color="#FF5E3A"
              />
            </TouchableOpacity>

            {showTrainerDropdown && (
              <View style={styles.dropdownOverlayList}>
                <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {trainers.map(t => (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.dropdownListItem,
                        selectedTrainer?.id === t.id && { backgroundColor: "rgba(255, 94, 58, 0.12)" }
                      ]}
                      onPress={() => {
                        setSelectedTrainer(t);
                        setSelectedSlot(null);
                        setShowTrainerDropdown(false);
                      }}
                    >
                      <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>{t.name}</Text>
                      <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 12, fontWeight: "bold", marginTop: 2 }}>{t.specialization}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 3. SLOT DATE FIELD */}
          <View style={[styles.inputGroup, { marginTop: 8 }]}>
            <Text style={styles.inputLabel}>SELECT SLOT DATE *</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                setShowBookingDatePicker(true);
                setShowMemberDropdown(false);
                setShowTrainerDropdown(false);
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="calendar-outline" size={18} color="#FF5E3A" />
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
                  {bookingDate}
                </Text>
              </View>
              <Text style={{ color: "#FF5E3A", fontSize: 14, fontWeight: "bold" }}>CHANGE</Text>
            </TouchableOpacity>
          </View>

          {/* 4. CHOOSE AVAILABLE SLOTS FOR SELECTED DATE */}
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>CHOOSE AVAILABLE SLOT FOR DATE *</Text>
            {isLoadingSlots && slots.length === 0 ? (
              <ActivityIndicator size="small" color="#FF5E3A" style={{ marginVertical: 20 }} />
            ) : slots.length === 0 ? (
              <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 15, marginTop: 8, fontStyle: "italic" }}>
                No active slots created for this date.
              </Text>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                {slots.map((slot) => {
                  const isSlotSelected = selectedSlot?.id === slot.id;
                  const isUnavailable = slot.status !== "AVAILABLE";

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        {
                          width: "48%",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          borderWidth: 1.5,
                          borderColor: "rgba(255, 255, 255, 0.08)",
                          borderRadius: 12,
                          paddingVertical: 12,
                          paddingHorizontal: 10,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                        isSlotSelected && {
                          backgroundColor: "rgba(255, 94, 58, 0.12)",
                          borderColor: "#FF5E3A",
                        },
                        isUnavailable && {
                          opacity: 0.4,
                          backgroundColor: "rgba(255, 255, 255, 0.02)",
                        }
                      ]}
                      disabled={isUnavailable}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text style={[
                        { color: "#FFFFFF", fontSize: 15, fontWeight: "bold" },
                        isSlotSelected && { color: "#FF5E3A" }
                      ]}>
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </Text>
                      <Text style={{ color: "rgba(255, 255, 255, 0.35)", fontSize: 12, marginTop: 2, fontWeight: "700" }}>
                        {slot.status}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Slot Summary */}
          {selectedSlot && (
            <View style={[styles.slotSummary, { marginTop: 12 }]}>
              <Text style={styles.summaryLabel}>SELECTED SLOT SCHEDULE</Text>
              <Text style={styles.summaryValue}>{selectedSlot.start_time.slice(0, 5)} - {selectedSlot.end_time.slice(0, 5)}</Text>
              <Text style={styles.summaryTrainer}>Trainer: {selectedTrainer?.name}</Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 13, fontWeight: "600", marginTop: 2 }}>Date: {bookingDate}</Text>
            </View>
          )}

          {selectedMember && (
            <View style={[styles.selectedPill, { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedText}>Selected: {selectedMember.name} ({selectedMember.member_code})</Text>
                <Text style={styles.selectedSubText}>Sessions Available: {selectedMember.remaining_pt_sessions}</Text>
              </View>
            </View>
          )}

          {/* SUBMIT BUTTON */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleConfirmBooking} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>CONFIRM & LOCK BOOKING</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Booking Slot Date Custom Datepicker Modal */}
      <Modal visible={showBookingDatePicker} transparent animationType="fade">
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
              <TouchableOpacity
                onPress={() => {
                  if (bookingCalendarMonth === 0) {
                    setBookingCalendarMonth(11);
                    setBookingCalendarYear((prev) => prev - 1);
                  } else {
                    setBookingCalendarMonth((prev) => prev - 1);
                  }
                }}
                style={{ padding: 8 }}
              >
                <Ionicons name="chevron-back" size={20} color="#FF5E3A" />
              </TouchableOpacity>
              <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "900" }}>
                {new Date(bookingCalendarYear, bookingCalendarMonth).toLocaleString("en-US", { month: "long" })} {bookingCalendarYear}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (bookingCalendarMonth === 11) {
                    setBookingCalendarMonth(0);
                    setBookingCalendarYear((prev) => prev + 1);
                  } else {
                    setBookingCalendarMonth((prev) => prev + 1);
                  }
                }}
                style={{ padding: 8 }}
              >
                <Ionicons name="chevron-forward" size={20} color="#FF5E3A" />
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <Text key={day} style={{ color: "rgba(255, 255, 255, 0.3)", width: 36, textAlign: "center", fontSize: 13, fontWeight: "700" }}>{day}</Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" }}>
              {Array.from({ length: new Date(bookingCalendarYear, bookingCalendarMonth, 1).getDay() }).map((_, idx) => (
                <View key={`empty-${idx}`} style={{ width: 42, height: 38 }} />
              ))}
              {Array.from({ length: new Date(bookingCalendarYear, bookingCalendarMonth + 1, 0).getDate() }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateString = `${bookingCalendarYear}-${String(bookingCalendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = bookingDate === dateString;

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
                      setBookingDate(dateString);
                      setShowBookingDatePicker(false);
                    }}
                  >
                    <Text style={[
                      { color: "rgba(255, 255, 255, 0.8)", fontSize: 14, fontWeight: "700" },
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
              onPress={() => setShowBookingDatePicker(false)}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>CLOSE</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 76,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
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
    marginTop: 2,
    textAlign: "center",
  },
  scrollContent: {
    padding: 24,
    gap: 16,
    paddingBottom: Platform.OS === "ios" ? 100 : 80,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  sectionTitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
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
  },
  dropdownOverlayList: {
    backgroundColor: "#1C1C21",
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
    fontSize: 15,
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
  slotSummary: {
    backgroundColor: "rgba(255, 94, 58, 0.08)",
    borderColor: "rgba(255, 94, 58, 0.2)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  summaryLabel: {
    color: "#FF5E3A",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  summaryTrainer: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
    fontWeight: "600",
  },
  selectedPill: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderColor: "rgba(76, 175, 80, 0.25)",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  selectedText: {
    color: "#4CAF50",
    fontSize: 15,
    fontWeight: "bold",
  },
  selectedSubText: {
    color: "rgba(76, 175, 80, 0.8)",
    fontSize: 13,
    marginTop: 2,
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#FF5E3A",
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#FF5E3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
