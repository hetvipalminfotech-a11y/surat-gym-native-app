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
import { useCreateMember } from "../../hooks/useMembers";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "AddMember">;

export default function AddMemberScreen({ navigation }: Props) {
  // Form states
  const [newName, setNewName] = useState<string>("");
  const [newPhone, setNewPhone] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");
  const [newAge, setNewAge] = useState<string>("");
  const [newGender, setNewGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [newPlan, setNewPlan] = useState<number>(1);
  const [newPayment, setNewPayment] = useState<"CASH" | "UPI" | "CARD" | "ONLINE">("UPI");
  const [newHealth, setNewHealth] = useState<string>("");
  const [newEmergency, setNewEmergency] = useState<string>("");
  const [newStartDate, setNewStartDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Custom Datepicker state
  const [showAddDatePicker, setShowAddDatePicker] = useState<boolean>(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [allPlans, setAllPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Mutation
  const createMemberMutation = useCreateMember();

  useEffect(() => {
    getMembershipPlans()
      .then((plans) => {
        setAllPlans(plans);
        if (plans.length > 0) {
          setNewPlan(plans[0].id);
        }
      })
      .catch((err) => console.warn("Failed to load plans:", err));
  }, []);

  // Calendar properties and math
  const calendarYear = currentCalendarMonth.getFullYear();
  const calendarMonth = currentCalendarMonth.getMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[calendarMonth];
  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
  const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const emptyCells = Array(firstDayIndex).fill(null);
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  const prevMonth = () => {
    setCurrentCalendarMonth(new Date(calendarYear, calendarMonth - 1, 1));
  };
  const nextMonth = () => {
    setCurrentCalendarMonth(new Date(calendarYear, calendarMonth + 1, 1));
  };

  const handleAddMember = async () => {
    Keyboard.dismiss();
    if (!newName.trim()) {
      Alert.alert("Validation Error", "Please enter member name");
      return;
    }
    if (!/^[0-9]{10}$/.test(newPhone.trim())) {
      Alert.alert("Validation Error", "Phone number must be exactly 10 digits");
      return;
    }

    if (newEmergency.trim() && !/^[0-9]{10}$/.test(newEmergency.trim())) {
      Alert.alert("Validation Error", "Emergency phone number must be exactly 10 digits");
      return;
    }

    if (newEmail.trim()) {
      if (/[A-Z]/.test(newEmail)) {
        Alert.alert("Validation Error", "Email address cannot contain uppercase letters");
        return;
      }
      const emailLower = newEmail.trim().toLowerCase();
      const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailLower.includes("@") || !emailReg.test(emailLower)) {
        Alert.alert("Validation Error", "Please enter a valid email address (e.g. user@example.com)");
        return;
      }
    }

    if (newAge.trim()) {
      const ageNum = parseInt(newAge.trim());
      if (isNaN(ageNum) || ageNum <= 13 || ageNum >= 50) {
        Alert.alert("Validation Error", "Age must be greater than 13 and less than 50");
        return;
      }
    }

    const startObj = new Date(newStartDate + 'T00:00:00');
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);
    if (startObj < todayObj) {
      Alert.alert("Validation Error", "Start date cannot be in the past");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || undefined,
        age: newAge.trim() ? parseInt(newAge.trim()) : undefined,
        gender: newGender,
        membershipPlanId: newPlan,
        startDate: newStartDate,
        paymentMethod: newPayment,
        healthConditions: newHealth.trim() || undefined,
        emergencyContactPhone: newEmergency.trim() || undefined,
      };

      await createMemberMutation.mutateAsync(payload);
      Alert.alert("Success 🎉", `Member ${newName} has been registered successfully!`, [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        }
      ]);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      Alert.alert("Registration Failed", apiError.message || "An error occurred");
    } finally {
      setLoading(false);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backButton, { flexDirection: "row", alignItems: "center", gap: 4, zIndex: 10 }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={14} color="rgba(255, 255, 255, 0.6)" />

        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>REGISTER MEMBER</Text>
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
            <Text style={styles.sectionTitle}>MEMBER RECORDS FORM</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter name"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={newName}
                onChangeText={setNewName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PHONE NUMBER (10 DIGITS) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 10-digit phone"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={newEmail}
                onChangeText={(text) => setNewEmail(text.toLowerCase())}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>AGE (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter age"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={newAge}
                onChangeText={setNewAge}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GENDER</Text>
              <View style={styles.rowSelector}>
                {["MALE", "FEMALE", "OTHER"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.selectorBtn, newGender === g && styles.selectorBtnActive]}
                    onPress={() => setNewGender(g as "MALE" | "FEMALE" | "OTHER")}
                  >
                    <Text style={[styles.selectorBtnText, newGender === g && styles.selectorBtnTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Membership Plan Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CHOOSE MEMBERSHIP PLAN *</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10, marginTop: 4 }}>
                {allPlans.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      {
                        width: "48%",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.08)",
                        borderRadius: 12,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                      newPlan === plan.id && styles.selectorBtnActive
                    ]}
                    onPress={() => setNewPlan(plan.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.selectorBtnText,
                      { fontSize: 13, fontWeight: "700" },
                      newPlan === plan.id && styles.selectorBtnTextActive
                    ]}>
                      {plan.name}
                    </Text>
                    <Text style={{
                      color: newPlan === plan.id ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.5)",
                      fontSize: 11,
                      fontWeight: "600",
                      marginTop: 2
                    }}>
                      ₹{plan.price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment Method Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PAYMENT METHOD</Text>
              <View style={styles.rowSelector}>
                {["CASH", "UPI", "CARD", "ONLINE"].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.selectorBtn,
                      { width: "23%", paddingVertical: 10 },
                      newPayment === method && styles.selectorBtnActive
                    ]}
                    onPress={() => setNewPayment(method as "CASH" | "UPI" | "CARD" | "ONLINE")}
                  >
                    <Text style={[
                      styles.selectorBtnText,
                      { fontSize: 11 },
                      newPayment === method && styles.selectorBtnTextActive
                    ]}>
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Start Date Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MEMBERSHIP START DATE *</Text>
              <TouchableOpacity
                style={[styles.input, { justifyContent: "center" }]}
                onPress={() => setShowAddDatePicker(true)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="calendar-outline" size={16} color="#FF5E3A" />
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>
                    {formatDate(newStartDate)}
                  </Text>
                </View>
              </TouchableOpacity>
              <Text style={{ color: "rgba(255, 255, 255, 0.35)", fontSize: 10, marginTop: 2 }}>
                ⚠️ Click to select activation date (past dates restricted).
              </Text>
            </View>

            {/* Emergency Contact */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMERGENCY CONTACT PHONE (10 DIGITS)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 10-digit emergency number"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={newEmergency}
                onChangeText={setNewEmergency}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            {/* Health Conditions */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>HEALTH CONDITIONS / PHYSICAL RESTRICTIONS</Text>
              <TextInput
                style={[styles.input, { height: 80, paddingTop: 10, textAlignVertical: "top" }]}
                placeholder="e.g. Asthma, Knee Injury, none"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={newHealth}
                onChangeText={setNewHealth}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleAddMember} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>REGISTER NEW MEMBER</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Start Date Custom Datepicker Modal */}
      <Modal visible={showAddDatePicker} transparent animationType="fade">
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
                const isTodayLimit = new Date();
                isTodayLimit.setHours(0, 0, 0, 0);
                const isPast = cellDate < isTodayLimit;

                if (isPast) {
                  return (
                    <View key={`past-${dayNum}`} style={styles.dayCellEmpty} />
                  );
                }

                const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = newStartDate === dateString;

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                    ]}
                    onPress={() => {
                      setNewStartDate(dateString);
                      setShowAddDatePicker(false);
                    }}
                  >
                    <Text style={[
                      styles.dayCellText,
                      isSelected && styles.dayCellTextSelected,
                    ]}>
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.datePickerCloseBtn}
              onPress={() => setShowAddDatePicker(false)}
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
  rowSelector: {
    flexDirection: "row",
    gap: 8,
  },
  selectorBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorBtnActive: {
    backgroundColor: "rgba(255, 94, 58, 0.1)",
    borderColor: "#FF5E3A",
  },
  selectorBtnText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    fontWeight: "700",
  },
  selectorBtnTextActive: {
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
