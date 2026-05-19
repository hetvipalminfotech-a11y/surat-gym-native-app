import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import {
  getTrainers,
  getTrainerSlots,
  getMembers,
  bookPtSession,
  Trainer,
  Slot,
  Member,
  MemberPtSession,
  getAllPtSessions,
  cancelPtSession,
} from "../../services/receptionist.service";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ReceptionTabs">;
};

export default function PtSessionsTab({ navigation }: Props) {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showBookModal, setShowBookModal] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  
  // Search Active Member to Book
  const [memberSearch, setMemberSearch] = useState<string>("");
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchingMembers, setSearchingMembers] = useState<boolean>(false);
  
  // Custom booking form select dropdowns & slot date states
  const [activeMembers, setActiveMembers] = useState<Member[]>([]);
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [showMemberDropdown, setShowMemberDropdown] = useState<boolean>(false);
  const [showTrainerDropdown, setShowTrainerDropdown] = useState<boolean>(false);
  const [showBookingDatePicker, setShowBookingDatePicker] = useState<boolean>(false);
  
  // Dedicated booking calendar navigation states
  const [bookingCalendarMonth, setBookingCalendarMonth] = useState<number>(new Date().getMonth());
  const [bookingCalendarYear, setBookingCalendarYear] = useState<number>(new Date().getFullYear());

  // Booked sessions directory state
  const [sessions, setSessions] = useState<MemberPtSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);
  const [selectedDetailSession, setSelectedDetailSession] = useState<MemberPtSession | null>(null);
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

  const fetchBookedSessions = async () => {
    try {
      setSessionsLoading(true);
      let apiStatus: string | undefined = undefined;
      if (statusFilter === "booked") apiStatus = "BOOKED";
      else if (statusFilter === "complete") apiStatus = "COMPLETED";
      else if (statusFilter === "cancelled") apiStatus = "CANCELLED";
      else if (statusFilter === "no_show") apiStatus = "NO_SHOW";

      const list = await getAllPtSessions(apiStatus, dateFilter || undefined);
      
      // Sort by session_date descending (newest dates first)
      const sorted = [...list].sort((a, b) => {
        const timeA = new Date(a.session_date).getTime();
        const timeB = new Date(b.session_date).getTime();
        return timeB - timeA;
      });

      setSessions(sorted);
    } catch (err) {
      console.warn("Failed to fetch booked sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

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

  const fetchSlotsList = async () => {
    if (!selectedTrainer) return;
    try {
      setLoading(true);
      const list = await getTrainerSlots(selectedTrainer.id, bookingDate);
      setSlots(list);
    } catch (err) {
      console.warn("Failed to fetch trainer slots:", err);
    } finally {
      setLoading(false);
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
              await cancelPtSession(sessionId);
              Alert.alert("Cancelled!", "PT Session has been successfully cancelled.");
              fetchBookedSessions();
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
      await bookPtSession(selectedMember.id, selectedSlot.id);
      Alert.alert(
        "Session Booked! 🎉",
        `Personal Training slot has been successfully locked and saved in DB for ${selectedMember.name}!`
      );
      
      setShowBookModal(false);
      setSelectedSlot(null);
      setSelectedMember(null);
      setMemberSearch("");
      
      // Refetch booked list
      fetchBookedSessions();
      fetchSlotsList();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      Alert.alert("Booking Refused ⚠️", apiError.message || "Failed to book session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookedSessions();
    fetchTrainersList();
    fetchActiveMembersList();
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    if (selectedTrainer) {
      fetchSlotsList();
    }
  }, [selectedTrainer, bookingDate]);

  // Handle member search live
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (memberSearch.trim().length > 0) {
        setSearchingMembers(true);
        try {
          const list = await getMembers(memberSearch, "ACTIVE");
          setMembersList(list);
        } catch (err) {
          console.warn("Search members error:", err);
        } finally {
          setSearchingMembers(false);
        }
      } else {
        setMembersList([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [memberSearch]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with inline Book Session Trigger */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={styles.headerTitle}>PT Session Slots</Text>
            <Text style={styles.headerSubtitle}>Locked & Secured Booking</Text>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: "#FF5E3A",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              shadowColor: "#FF5E3A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 3,
            }}
            onPress={() => {
              setBookingDate(new Date().toISOString().split("T")[0]);
              setShowBookModal(true);
              setSelectedSlot(null);
              setSelectedMember(null);
              setMemberSearch("");
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 0.5 }}>+ BOOK SESSION</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List Filters */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, gap: 12 }}>
        <Text style={styles.sectionTitle}>FILTER BY STATUS</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {["all", "booked", "complete", "cancelled", "no_show"].map((status) => (
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
              onPress={() => setStatusFilter(status as any)}
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
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
              📅 {dateFilter ? `Filter: ${new Date(dateFilter).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}` : "Select Date Filter"}
            </Text>
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
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        {sessionsLoading ? (
          <ActivityIndicator size="large" color="#FF5E3A" style={{ marginTop: 20 }} />
        ) : sessions.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 14, fontWeight: "600" }}>No booked sessions match your criteria.</Text>
          </View>
        ) : (
          sessions.map((sess) => (
            <TouchableOpacity
              key={sess.id}
              activeOpacity={0.8}
              onPress={() => setSelectedDetailSession(sess)}
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

              <View style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.05)", paddingBottom: 10, gap: 6 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
                  👤 Member: <Text style={{ color: "#FF5E3A" }}>{sess.member_name || "Unknown"}</Text>
                </Text>
                <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12, fontWeight: "600" }}>
                  🏋️ Trainer: <Text style={{ color: "#FFFFFF" }}>{sess.trainer_name}</Text>
                </Text>
                <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 11, fontWeight: "500" }}>
                  📅 Date: {new Date(sess.session_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
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

              {/* Actions Column (If user cancel session, show cancel option, otherwise show nothing) */}
              {sess.status === "BOOKED" ? (
                <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: "rgba(244, 67, 54, 0.4)",
                    borderRadius: 12,
                    height: 38,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 4,
                  }}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent modal popping up on button tap!
                    handleCancelSession(sess.id);
                  }}
                >
                  <Text style={{ color: "#F44336", fontSize: 12, fontWeight: "800", letterSpacing: 0.5 }}>
                    CANCEL SESSION
                  </Text>
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Immersive Trainer & Slot Match Booking Modal */}
      <Modal visible={showBookModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book New PT Session</Text>
              <TouchableOpacity onPress={() => setShowBookModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} keyboardShouldPersistTaps="handled">
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
                  <Text style={{ color: selectedMember ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)", fontSize: 14, fontWeight: "600" }}>
                    {selectedMember ? `👤 ${selectedMember.name} (${selectedMember.member_code})` : "Select Active Member..."}
                  </Text>
                  <Text style={{ color: "#FF5E3A", fontSize: 12, fontWeight: "bold" }}>{showMemberDropdown ? "▲" : "▼"}</Text>
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
                              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>{m.name}</Text>
                              <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 10, fontWeight: "bold" }}>{m.member_code}</Text>
                            </View>
                            <Text style={{ color: "#FF5E3A", fontSize: 10, fontWeight: "600", marginTop: 2 }}>
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
                  <Text style={{ color: selectedTrainer ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)", fontSize: 14, fontWeight: "600" }}>
                    {selectedTrainer ? `🏋️ ${selectedTrainer.name} (${selectedTrainer.specialization})` : "Select Trainer..."}
                  </Text>
                  <Text style={{ color: "#FF5E3A", fontSize: 12, fontWeight: "bold" }}>{showTrainerDropdown ? "▲" : "▼"}</Text>
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
                            setSelectedSlot(null); // Reset slot choice when trainer changes
                            setShowTrainerDropdown(false);
                          }}
                        >
                          <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>{t.name}</Text>
                          <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 10, fontWeight: "bold", marginTop: 2 }}>{t.specialization}</Text>
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
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>
                    📅 {bookingDate}
                  </Text>
                  <Text style={{ color: "#FF5E3A", fontSize: 12, fontWeight: "bold" }}>CHANGE</Text>
                </TouchableOpacity>
              </View>

              {/* 4. CHOOSE AVAILABLE SLOTS FOR SELECTED DATE */}
              <View style={{ marginTop: 12 }}>
                <Text style={styles.sectionTitle}>CHOOSE AVAILABLE SLOT FOR DATE *</Text>
                {loading && slots.length === 0 ? (
                  <ActivityIndicator size="small" color="#FF5E3A" style={{ marginVertical: 20 }} />
                ) : slots.length === 0 ? (
                  <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 13, marginTop: 8, fontStyle: "italic" }}>
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
                            { color: "#FFFFFF", fontSize: 13, fontWeight: "bold" },
                            isSlotSelected && { color: "#FF5E3A" }
                          ]}>
                            {slot.start_time} - {slot.end_time}
                          </Text>
                          <Text style={{ color: "rgba(255, 255, 255, 0.35)", fontSize: 10, marginTop: 2, fontWeight: "700" }}>
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
                  <Text style={styles.summaryValue}>{selectedSlot.start_time} - {selectedSlot.end_time}</Text>
                  <Text style={styles.summaryTrainer}>Trainer: {selectedTrainer?.name}</Text>
                  <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 11, fontWeight: "600", marginTop: 2 }}>Date: {bookingDate}</Text>
                </View>
              )}

              {selectedMember && (
                <View style={[styles.selectedPill, { marginTop: 12 }]}>
                  <Text style={styles.selectedText}>✓ Selected: {selectedMember.name} ({selectedMember.member_code})</Text>
                  <Text style={styles.selectedSubText}>Sessions Available: {selectedMember.remaining_pt_sessions}</Text>
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
          </View>
        </View>
      </Modal>

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
                <Text style={{ color: "#FF5E3A", fontSize: 16, fontWeight: "bold" }}>◀</Text>
              </TouchableOpacity>
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900" }}>{monthName} {calendarYear}</Text>
              <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }}>
                <Text style={{ color: "#FF5E3A", fontSize: 16, fontWeight: "bold" }}>▶</Text>
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
                <Text style={{ color: "#FF5E3A", fontSize: 16, fontWeight: "bold" }}>◀</Text>
              </TouchableOpacity>
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900" }}>
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
                <Text style={{ color: "#FF5E3A", fontSize: 16, fontWeight: "bold" }}>▶</Text>
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
              onPress={() => setShowBookingDatePicker(false)}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PT Session Detail Modal (Just like Member Profile Modal) */}
      <Modal visible={!!selectedDetailSession} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>PT Session Details</Text>
              <TouchableOpacity onPress={() => setSelectedDetailSession(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedDetailSession && (
              <ScrollView contentContainerStyle={styles.modalForm}>
                {/* Profile visual header */}
                <View style={{ alignItems: "center", paddingVertical: 20, gap: 8 }}>
                  <View style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "rgba(255, 94, 58, 0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1.5,
                    borderColor: "#FF5E3A",
                  }}>
                    <Text style={{ fontSize: 28 }}>🏋️</Text>
                  </View>
                  <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "900" }}>{selectedDetailSession.session_code}</Text>
                  <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 12, fontWeight: "bold" }}>PERSONAL TRAINING SESSION</Text>

                  <View style={[
                    styles.statusBookedBadge,
                    selectedDetailSession.status === "COMPLETED" && { backgroundColor: "rgba(76, 175, 80, 0.1)", borderColor: "rgba(76, 175, 80, 0.25)" },
                    selectedDetailSession.status === "CANCELLED" && { backgroundColor: "rgba(244, 67, 54, 0.1)", borderColor: "rgba(244, 67, 54, 0.25)" },
                    selectedDetailSession.status === "NO_SHOW" && { backgroundColor: "rgba(255, 255, 255, 0.05)", borderColor: "rgba(255, 255, 255, 0.1)" },
                  ]}>
                    <Text style={[
                      styles.statusBookedText,
                      selectedDetailSession.status === "COMPLETED" && { color: "#4CAF50" },
                      selectedDetailSession.status === "CANCELLED" && { color: "#F44336" },
                      selectedDetailSession.status === "NO_SHOW" && { color: "rgba(255, 255, 255, 0.5)" },
                    ]}>
                      {selectedDetailSession.status === "BOOKED" ? "booked" :
                       selectedDetailSession.status === "COMPLETED" ? "complete" :
                       selectedDetailSession.status === "CANCELLED" ? "cancelled" :
                       selectedDetailSession.status === "NO_SHOW" ? "no_show" :
                       selectedDetailSession.status.toLowerCase()}
                    </Text>
                  </View>
                </View>

                {/* Field details section 1 */}
                <View style={{
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.06)",
                  borderRadius: 18,
                  padding: 16,
                  gap: 12,
                }}>
                  <Text style={styles.sectionTitle}>SESSION DETAILS</Text>
                  
                  <View style={{ flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.05)", paddingBottom: 8 }}>
                    <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 13, fontWeight: "600" }}>Session Code:</Text>
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "bold" }}>{selectedDetailSession.session_code}</Text>
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.05)", paddingBottom: 8 }}>
                    <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 13, fontWeight: "600" }}>Session Type:</Text>
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "bold" }}>{selectedDetailSession.session_type}</Text>
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.05)", paddingBottom: 8 }}>
                    <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 13, fontWeight: "600" }}>Session Source:</Text>
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "bold" }}>{selectedDetailSession.session_source}</Text>
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 13, fontWeight: "600" }}>Amount Charged:</Text>
                    <Text style={{ color: "#FF5E3A", fontSize: 14, fontWeight: "bold" }}>₹{selectedDetailSession.amount_charged}</Text>
                  </View>
                </View>

                {/* Field details section 2 */}
                <View style={{
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.06)",
                  borderRadius: 18,
                  padding: 16,
                  gap: 12,
                }}>
                  <Text style={styles.sectionTitle}>PARTICIPANTS & SCHEDULE</Text>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.05)", paddingBottom: 8 }}>
                    <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 13, fontWeight: "600" }}>👤 Member Name:</Text>
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "bold" }}>{selectedDetailSession.member_name || "Unknown"}</Text>
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.05)", paddingBottom: 8 }}>
                    <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 13, fontWeight: "600" }}>🏋️ Trainer Name:</Text>
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "bold" }}>{selectedDetailSession.trainer_name}</Text>
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 13, fontWeight: "600" }}>📅 Session Date:</Text>
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "bold" }}>
                      {new Date(selectedDetailSession.session_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </View>

                {/* Action Option Panel inside Modal */}
                {selectedDetailSession.status === "BOOKED" && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: "rgba(244, 67, 54, 0.12)",
                      borderWidth: 1.5,
                      borderColor: "#F44336",
                      borderRadius: 14,
                      height: 50,
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 10,
                    }}
                    onPress={() => {
                      setSelectedDetailSession(null);
                      handleCancelSession(selectedDetailSession.id);
                    }}
                  >
                    <Text style={{ color: "#F44336", fontSize: 14, fontWeight: "800", letterSpacing: 0.5 }}>
                      🚫 CANCEL PT SESSION
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#FF5E3A",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  trainerSelectorContainer: {
    paddingTop: 8,
    gap: 8,
  },
  trainerScroll: {
    gap: 12,
    paddingRight: 24,
  },
  trainerCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: "center",
  },
  trainerCardActive: {
    backgroundColor: "rgba(255, 94, 58, 0.12)",
    borderColor: "#FF5E3A",
  },
  trainerNameText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "800",
  },
  trainerNameTextActive: {
    color: "#FF5E3A",
  },
  trainerSpecText: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 24,
    gap: 20,
  },
  sectionTitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  slotsGrid: {
    gap: 16,
  },
  centerSpinner: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyView: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 15,
    fontWeight: "600",
  },
  slotCard: {
    backgroundColor: "rgba(30, 30, 35, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slotCardBooked: {
    borderColor: "rgba(255, 94, 58, 0.15)",
    backgroundColor: "rgba(255, 94, 58, 0.02)",
  },
  slotMain: {
    flex: 1.2,
    gap: 4,
  },
  slotTime: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  slotTrainer: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    fontWeight: "600",
  },
  slotStatusContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  statusAvailableBadge: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderColor: "rgba(76, 175, 80, 0.25)",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statusAvailableText: {
    color: "#4CAF50",
    fontSize: 10,
    fontWeight: "800",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0F0F12",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  modalClose: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 20,
    padding: 4,
  },
  modalForm: {
    gap: 16,
    paddingBottom: 40,
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
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  summaryTrainer: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    fontWeight: "600",
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
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
  },
  dropMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  dropStatus: {
    fontSize: 9,
    fontWeight: "800",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  statusActive: {
    backgroundColor: "rgba(76, 175, 80, 0.12)",
    color: "#4CAF50",
  },
  dropPt: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    marginTop: 2,
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
    fontSize: 13,
    fontWeight: "bold",
  },
  selectedSubText: {
    color: "rgba(76, 175, 80, 0.8)",
    fontSize: 11,
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
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
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
});
