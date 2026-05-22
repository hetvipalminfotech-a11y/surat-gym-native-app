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
  Keyboard,
  Modal,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import {
  getMembershipPlans,
  MembershipPlan,
} from "../../services/receptionist.service";
import { useRenewMember } from "../../hooks/useMembers";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "RenewPlan">;

export default function RenewPlanScreen({ route, navigation }: Props) {
  const { member } = route.params;

  // Renew form states
  const [renewPlanId, setRenewPlanId] = useState<number>(1);
  const [renewPayment, setRenewPayment] = useState<"CASH" | "UPI" | "CARD" | "ONLINE">("UPI");
  const [renewStartDate, setRenewStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [allPlans, setAllPlans] = useState<MembershipPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Custom calendar date navigation states
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());

  // Renew Mutation
  const renewMutation = useRenewMember();

  // Calendar math properties
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

  // Load membership plans
  useEffect(() => {
    getMembershipPlans()
      .then((plans) => {
        setAllPlans(plans);
        // Default to first plan if available
        if (plans.length > 0) {
          setRenewPlanId(plans[0].id);
        }
      })
      .catch((err) => console.warn("Failed to load plans:", err))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleRenew = () => {
    Keyboard.dismiss();
    if (!renewStartDate.trim()) {
      Alert.alert("Required Field", "Please enter membership activation start date.");
      return;
    }

    // YYYY-MM-DD validation regex
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(renewStartDate.trim())) {
      Alert.alert("Validation Error", "Start date must be in YYYY-MM-DD format.");
      return;
    }

    const startObj = new Date(renewStartDate.trim() + "T00:00:00");
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);

    if (startObj < todayObj) {
      Alert.alert("Validation Error", "Start date cannot be in the past.");
      return;
    }

    renewMutation.mutate(
      {
        id: member.id,
        dto: {
          planId: renewPlanId,
          startDate: renewStartDate.trim(),
          paymentMethod: renewPayment,
        },
      },
      {
        onSuccess: (updated) => {
          Alert.alert("Renewed Successfully 🎉", "Membership plan renewed successfully!", [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate({
                  name: "MemberDetail",
                  params: { member: updated, updatedMember: updated },
                  merge: true,
                });
              },
            },
          ]);
        },
        onError: (err: Error) => {
          Alert.alert("Error", err.message || "Failed to renew plan.");
        },
      }
    );
  };

  const selectedPlan = allPlans.find((p) => p.id === renewPlanId);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backButton, { flexDirection: "row", alignItems: "center", gap: 4, zIndex: 10 }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={14} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.backButtonText}></Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>RENEW MEMBERSHIP</Text>
        </View>
        <View style={{ width: 75, opacity: 0 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>SELECT SUBSCRIPTION PLAN</Text>

            {loadingPlans ? (
              <ActivityIndicator size="small" color="#FF5E3A" style={{ marginVertical: 20 }} />
            ) : allPlans.length === 0 ? (
              <Text style={styles.emptyText}>No subscription plans available.</Text>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CHOOSE PLAN *</Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => setShowDropdown(!showDropdown)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>
                    {selectedPlan
                      ? `${selectedPlan.name} (${selectedPlan.duration_months} ${selectedPlan.duration_months === 1 ? "Month" : "Months"}) - ₹${selectedPlan.price}`
                      : "Select subscription plan..."}
                  </Text>
                  <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={16} color="rgba(255, 255, 255, 0.4)" />
                </TouchableOpacity>

                {showDropdown && (
                  <View style={styles.dropdownList}>
                    {allPlans.map((plan) => (
                      <TouchableOpacity
                        key={plan.id}
                        style={[
                          styles.dropdownItem,
                          renewPlanId === plan.id && styles.dropdownItemActive,
                        ]}
                        onPress={() => {
                          setRenewPlanId(plan.id);
                          setShowDropdown(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownItemHeader}>
                          <Text
                            style={[
                              styles.dropdownItemName,
                              renewPlanId === plan.id && styles.dropdownItemTextActive,
                            ]}
                          >
                            {plan.name}
                          </Text>
                          <Text style={styles.dropdownItemPrice}>₹{plan.price}</Text>
                        </View>
                        <Text style={styles.dropdownItemDesc}>
                          Validity: {plan.duration_months} {plan.duration_months === 1 ? "Month" : "Months"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>ACTIVATION & TRANSACTION</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>START DATE *</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowDatePicker(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownSelectorText}>
                  {renewStartDate ? renewStartDate : "Select start date..."}
                </Text>
                <Ionicons name="calendar-outline" size={18} color="#FF5E3A" />
              </TouchableOpacity>
              <Text style={styles.helpText}>Activation date cannot be selected in the past.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PAYMENT TRANSACTION METHOD</Text>
              <View style={styles.paymentRow}>
                {(["CASH", "UPI", "CARD", "ONLINE"] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.paymentBtn,
                      renewPayment === m && styles.paymentBtnActive,
                    ]}
                    onPress={() => setRenewPayment(m)}
                  >
                    <Text
                      style={[
                        styles.paymentBtnText,
                        renewPayment === m && styles.paymentBtnTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleRenew}
            disabled={renewMutation.isPending}
          >
            {renewMutation.isPending ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.submitBtnText}>CONFIRM RENEW PLAN</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Start Date Custom Datepicker Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerCard}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={prevMonth} style={styles.calendarNavBtn}>
                <Ionicons name="chevron-back" size={14} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>{monthName} {calendarYear}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.calendarNavBtn}>
                <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View style={styles.weekdaysRow}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <Text key={day} style={styles.weekdayText}>{day}</Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {emptyCells.map((_, idx) => (
                <View key={`empty-${idx}`} style={styles.dayCellEmpty} />
              ))}
              {daysArray.map((dayNum) => {
                const cellDate = new Date(calendarYear, calendarMonth, dayNum);
                cellDate.setHours(0, 0, 0, 0);
                const todayLimit = new Date();
                todayLimit.setHours(0, 0, 0, 0);
                const isPast = cellDate < todayLimit;

                const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = renewStartDate === dateString;

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      isPast && styles.dayCellDisabled,
                    ]}
                    disabled={isPast}
                    onPress={() => {
                      setRenewStartDate(dateString);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={[
                      styles.dayCellText,
                      isSelected && styles.dayCellTextSelected,
                      isPast && styles.dayCellTextDisabled,
                    ]}>
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.datePickerCloseBtn}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerCloseBtnText}>CLOSE</Text>
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
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "rgba(30, 30, 35, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    color: "#FF5E3A",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 10,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  helpText: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: -2,
  },
  paymentRow: {
    flexDirection: "row",
    gap: 8,
  },
  paymentBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentBtnActive: {
    backgroundColor: "rgba(255, 94, 58, 0.1)",
    borderColor: "#FF5E3A",
  },
  paymentBtnText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "800",
  },
  paymentBtnTextActive: {
    color: "#FF5E3A",
  },
  submitBtn: {
    backgroundColor: "#FF5E3A",
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#FF5E3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  dropdownSelector: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownSelectorText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  dropdownChevron: {
    color: "#FF5E3A",
    fontSize: 12,
    fontWeight: "800",
  },
  dropdownList: {
    marginTop: 6,
    backgroundColor: "rgba(30, 30, 35, 0.95)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    padding: 8,
    gap: 6,
  },
  dropdownItem: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  dropdownItemActive: {
    backgroundColor: "rgba(255, 94, 58, 0.1)",
    borderColor: "rgba(255, 94, 58, 0.2)",
  },
  dropdownItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownItemName: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    fontWeight: "700",
  },
  dropdownItemTextActive: {
    color: "#FF5E3A",
  },
  dropdownItemPrice: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  dropdownItemDesc: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  // Custom Datepicker Styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  datePickerCard: {
    backgroundColor: "#16161C",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1.5,
    borderRadius: 24,
    width: "100%",
    maxWidth: 340,
    padding: 20,
    gap: 16,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  calendarNavBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderRadius: 10,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarNavText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  calendarMonthTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    paddingBottom: 8,
  },
  weekdayText: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 12,
    fontWeight: "700",
    width: 36,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellSelected: {
    backgroundColor: "#FF5E3A",
  },
  dayCellDisabled: {
    opacity: 0.25,
  },
  dayCellEmpty: {
    width: 38,
    height: 38,
  },
  dayCellText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  dayCellTextSelected: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  dayCellTextDisabled: {
    color: "rgba(255, 255, 255, 0.4)",
    textDecorationLine: "line-through",
  },
  datePickerCloseBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  datePickerCloseBtnText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
