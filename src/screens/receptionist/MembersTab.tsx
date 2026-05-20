import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import {
  getMembers,
  createMember,
  Member,
  getMemberPtSessions,
  updateMember,
  renewMember,
  freezeMember,
  unfreezeMember,
  MemberPtSession,
  UpdateMemberFields,
  RenewMemberFields,
  getMembershipPlans,
  MembershipPlan,
} from "../../services/receptionist.service";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ReceptionTabs">;
};

export default function MembersTab({ navigation }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedFilterPlanId, setSelectedFilterPlanId] = useState<number | undefined>(undefined);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedDetailMember, setSelectedDetailMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Add Member Form State
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
  const [showAddDatePicker, setShowAddDatePicker] = useState<boolean>(false);

  // Detailed Modal Active Sub-states
  const [detailSessions, setDetailSessions] = useState<MemberPtSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editAge, setEditAge] = useState<string>("");
  const [editGender, setEditGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [editHealth, setEditHealth] = useState<string>("");
  const [editEmergency, setEditEmergency] = useState<string>("");

  // Renew Mode state
  const [isRenewing, setIsRenewing] = useState<boolean>(false);
  const [renewPlanId, setRenewPlanId] = useState<number>(1);
  const [renewPayment, setRenewPayment] = useState<"CASH" | "UPI" | "CARD" | "ONLINE">("UPI");
  const [renewStartDate, setRenewStartDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [allPlans, setAllPlans] = useState<MembershipPlan[]>([]);

  useEffect(() => {
    getMembershipPlans()
      .then((plans) => {
        setAllPlans(plans);
      })
      .catch((err) => console.warn("Failed to load plans:", err));
  }, []);

  const calendarYear = currentCalendarMonth.getFullYear();
  const calendarMonth = currentCalendarMonth.getMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
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

  const fetchMembersList = async () => {
    try {
      setRefreshing(true);
      const list = await getMembers(search, statusFilter, selectedFilterPlanId);
      setMembers(list);
    } catch (err) {
      console.warn("Failed to fetch members:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembersList();
  }, [search, statusFilter, selectedFilterPlanId]);

  // Load PT Sessions & Prep Form when a member card is selected
  useEffect(() => {
    if (selectedDetailMember) {
      // 1. Fetch PT Sessions
      setLoadingSessions(true);
      getMemberPtSessions(selectedDetailMember.id)
        .then((sessions) => {
          setDetailSessions(sessions);
        })
        .catch((err) => console.warn("Load PT Sessions error:", err))
        .finally(() => setLoadingSessions(false));

      // 2. Prep Edit fields
      setEditName(selectedDetailMember.name);
      setEditPhone(selectedDetailMember.phone);
      setEditEmail(selectedDetailMember.email || "");
      setEditAge(selectedDetailMember.age ? String(selectedDetailMember.age) : "");
      setEditGender((selectedDetailMember.gender as "MALE" | "FEMALE" | "OTHER") || "MALE");
      setEditHealth(selectedDetailMember.health_conditions || "");
      setEditEmergency(selectedDetailMember.emergency_contact_phone || "");

      // 3. Reset View mode & set renewal defaults
      setIsEditing(false);
      setIsRenewing(false);
      setRenewStartDate(new Date().toISOString().split("T")[0]);
      setRenewPlanId(selectedDetailMember.membership_plan_id || 1);
    } else {
      setDetailSessions([]);
    }
  }, [selectedDetailMember]);

  const handleAddMember = async () => {
    if (!newName.trim()) {
      Alert.alert("Validation Error", "Please enter member name");
      return;
    }
    if (!/^[0-9]{10}$/.test(newPhone)) {
      Alert.alert("Validation Error", "Phone number must be exactly 10 digits");
      return;
    }

    // Optional Emergency Phone Validation
    if (newEmergency.trim() && !/^[0-9]{10}$/.test(newEmergency.trim())) {
      Alert.alert("Validation Error", "Emergency phone number must be exactly 10 digits");
      return;
    }

    // Optional Email Validation (Must contain @, no uppercase letters, valid format)
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

    // Optional Age Validation (Must be > 13 and < 50)
    if (newAge.trim()) {
      const ageNum = parseInt(newAge.trim());
      if (isNaN(ageNum) || ageNum <= 13 || ageNum >= 50) {
        Alert.alert("Validation Error", "Age must be greater than 13 and less than 50");
        return;
      }
    }

    // Start Date Past Validation check
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
        phone: newPhone,
        email: newEmail.trim() || undefined,
        age: newAge ? parseInt(newAge) : undefined,
        gender: newGender,
        membershipPlanId: newPlan,
        startDate: newStartDate,
        paymentMethod: newPayment,
        healthConditions: newHealth.trim() || undefined,
        emergencyContactPhone: newEmergency.trim() || undefined,
      };

      await createMember(payload);
      Alert.alert("Success 🎉", `Member ${newName} has been registered successfully!`);

      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewAge("");
      setNewGender("MALE");
      setNewPlan(1);
      setNewPayment("UPI");
      setNewHealth("");
      setNewEmergency("");
      setNewStartDate(new Date().toISOString().split("T")[0]);

      setShowAddModal(false);
      fetchMembersList();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      Alert.alert("Registration Failed", apiError.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Perform Edit Submit
  const handleUpdateSubmit = async () => {
    if (!selectedDetailMember) return;
    if (!editName.trim()) {
      Alert.alert("Validation Error", "Name is required");
      return;
    }
    if (!/^[0-9]{10}$/.test(editPhone)) {
      Alert.alert("Validation Error", "Phone must be exactly 10 digits");
      return;
    }

    setLoading(true);
    try {
      const dto: UpdateMemberFields = {
        name: editName.trim(),
        phone: editPhone,
        email: editEmail.trim() || undefined,
        age: editAge ? parseInt(editAge) : undefined,
        gender: editGender,
        healthConditions: editHealth.trim() || undefined,
        emergencyContactPhone: editEmergency.trim() || undefined,
      };

      const updated = await updateMember(selectedDetailMember.id, dto);
      Alert.alert("Record Updated ✅", `${editName}'s profile has been updated in database!`);
      setSelectedDetailMember(updated);
      setIsEditing(false);
      fetchMembersList();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      Alert.alert("Update Refused ⚠️", apiError.message || "Failed to update record.");
    } finally {
      setLoading(false);
    }
  };

  // Perform Freeze Toggle
  const handleFreezeToggle = async () => {
    if (!selectedDetailMember) return;

    setLoading(true);
    try {
      let updated: Member;
      if (selectedDetailMember.status === "FROZEN") {
        updated = await unfreezeMember(selectedDetailMember.id);
        Alert.alert("Membership Restored 🔓", `${selectedDetailMember.name}'s membership is active again!`);
      } else {
        updated = await freezeMember(selectedDetailMember.id);
        Alert.alert("Membership Frozen ❄️", `${selectedDetailMember.name}'s sessions are successfully paused!`);
      }
      setSelectedDetailMember(updated);
      fetchMembersList();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      Alert.alert("Action Refused ⚠️", apiError.message || "Status operation failed.");
    } finally {
      setLoading(false);
    }
  };

  // Perform Renewal
  const handleRenewSubmit = async () => {
    if (!selectedDetailMember) return;

    // 1. Validate Date Format & Not in Past
    if (!renewStartDate || !/^\d{4}-\d{2}-\d{2}$/.test(renewStartDate)) {
      Alert.alert("Validation Error", "Please specify a valid start date formatted as YYYY-MM-DD");
      return;
    }

    const chosenStart = new Date(renewStartDate);
    chosenStart.setHours(0, 0, 0, 0);
    const todayLimit = new Date();
    todayLimit.setHours(0, 0, 0, 0);

    if (chosenStart < todayLimit) {
      Alert.alert("Validation Error", "Renewal start date cannot be in the past.");
      return;
    }

    // 2. Validate "Member only renew plan with short duration of expiry of current plan"
    if (selectedDetailMember.end_date) {
      const expiryDate = new Date(selectedDetailMember.end_date);
      expiryDate.setHours(0, 0, 0, 0);
      const diffTime = expiryDate.getTime() - todayLimit.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 7 && selectedDetailMember.status === "ACTIVE") {
        Alert.alert(
          "Renewal Blocked ⚠️",
          `This member's current plan is still active and has ${diffDays} days left (expires on ${formatDate(selectedDetailMember.end_date)}).\n\nTo prevent overlapping, memberships can only be renewed if they have expired or are expiring within 7 days.`
        );
        return;
      }
    }

    setLoading(true);
    try {
      const dto: RenewMemberFields = {
        planId: renewPlanId,
        startDate: renewStartDate,
        paymentMethod: renewPayment,
      };

      const updated = await renewMember(selectedDetailMember.id, dto);
      Alert.alert("Membership Renewed 🎉", `${selectedDetailMember.name} has been successfully renewed!`);
      setSelectedDetailMember(updated);
      setIsRenewing(false);
      fetchMembersList();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      Alert.alert("Renewal Failed ⚠️", apiError.message || "Failed to execute renewal.");
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Members Directory</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+ ADD NEW</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.filterSection}>
        <TextInput
          style={styles.searchBar}
          placeholder="🔍 Search name, phone, code..."
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.tabFilters}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, alignItems: "center" }}
          >
            {["ALL", "ACTIVE", "EXPIRED", "FROZEN", "CANCELLED"].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterPill, statusFilter === status && styles.filterPillActive]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[styles.filterPillText, statusFilter === status && styles.filterPillTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Plans Filter Horizontal Row */}
        <View style={[styles.tabFilters, { marginTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.05)", paddingTop: 10 }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, alignItems: "center" }}
          >
            <TouchableOpacity
              style={[
                styles.filterPill,
                selectedFilterPlanId === undefined && styles.filterPillActive
              ]}
              onPress={() => setSelectedFilterPlanId(undefined)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.filterPillText,
                selectedFilterPlanId === undefined && styles.filterPillTextActive
              ]}>
                📍 All Plans
              </Text>
            </TouchableOpacity>
            {allPlans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.filterPill,
                  selectedFilterPlanId === plan.id && styles.filterPillActive
                ]}
                onPress={() => setSelectedFilterPlanId(plan.id)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.filterPillText,
                  selectedFilterPlanId === plan.id && styles.filterPillTextActive
                ]}>
                  ⚡ {plan.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Member List */}
      {refreshing && members.length === 0 ? (
        <View style={styles.centerSpinner}>
          <ActivityIndicator size="large" color="#FF5E3A" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {members.length === 0 ? (
            <View style={styles.emptyView}>
              <Text style={styles.emptyText}>No members found</Text>
            </View>
          ) : (
            members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberCard}
                onPress={() => setSelectedDetailMember(member)}
                activeOpacity={0.8}
              >
                <View style={styles.memberHeader}>
                  <View>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberCode}>{member.member_code}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    member.status === "ACTIVE" && styles.statusActive,
                    member.status === "EXPIRED" && styles.statusExpired,
                    member.status === "FROZEN" && styles.statusFrozen,
                    member.status === "CANCELLED" && styles.statusCancelled,
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      member.status === "ACTIVE" && styles.statusTextActive,
                      member.status === "EXPIRED" && styles.statusTextExpired,
                      member.status === "FROZEN" && styles.statusTextFrozen,
                      member.status === "CANCELLED" && styles.statusTextCancelled,
                    ]}>
                      {member.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.memberDetails}>
                  <Text style={styles.detailText}>📞 {member.phone}</Text>
                  <Text style={styles.detailText}>💳 Plan: {member.plan_name || "Custom Plan"}</Text>
                  {member.end_date && (
                    <Text style={styles.detailText}>📅 Ends: {formatDate(member.end_date)}</Text>
                  )}
                  <Text style={styles.detailText}>🏋️‍♂️ Remaining PT: {member.remaining_pt_sessions} sessions</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal - Add Member Sheet */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Member</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
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
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>
                    📅 {formatDate(newStartDate)}
                  </Text>
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

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddMember} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>REGISTER NEW MEMBER</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal - Member Detail View Sheet */}
      <Modal visible={!!selectedDetailMember} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Member Profiles</Text>
              <TouchableOpacity onPress={() => setSelectedDetailMember(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedDetailMember && (
              <ScrollView contentContainerStyle={styles.detailForm}>

                {/* 1. Normal View Profile Mode */}
                {!isEditing && !isRenewing && (
                  <>
                    {/* Visual Header card */}
                    <View style={styles.detailProfileHeader}>
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarChar}>
                          {selectedDetailMember.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.detailNameText}>{selectedDetailMember.name}</Text>
                      <Text style={styles.detailCodeText}>{selectedDetailMember.member_code}</Text>
                      <View style={[
                        styles.statusBadge,
                        styles.largeStatusBadge,
                        selectedDetailMember.status === "ACTIVE" && styles.statusActive,
                        selectedDetailMember.status === "EXPIRED" && styles.statusExpired,
                        selectedDetailMember.status === "FROZEN" && styles.statusFrozen,
                        selectedDetailMember.status === "CANCELLED" && styles.statusCancelled,
                      ]}>
                        <Text style={[
                          styles.statusBadgeText,
                          styles.largeStatusBadgeText,
                          selectedDetailMember.status === "ACTIVE" && styles.statusTextActive,
                          selectedDetailMember.status === "EXPIRED" && styles.statusTextExpired,
                          selectedDetailMember.status === "FROZEN" && styles.statusTextFrozen,
                          selectedDetailMember.status === "CANCELLED" && styles.statusTextCancelled,
                        ]}>
                          {selectedDetailMember.status}
                        </Text>
                      </View>
                    </View>

                    {/* Operational Action Panel (3 Options: Edit, Freeze, Renew) */}
                    <View style={styles.actionPanelRow}>
                      <TouchableOpacity
                        style={[styles.panelBtn, styles.panelEditBtn]}
                        onPress={() => setIsEditing(true)}
                      >
                        <Text style={styles.panelBtnText}>✏️ EDIT PROFILE</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.panelBtn, styles.panelFreezeBtn]}
                        onPress={handleFreezeToggle}
                        disabled={loading}
                      >
                        <Text style={styles.panelBtnText}>
                          {selectedDetailMember.status === "FROZEN" ? "❄️ UNFREEZE" : "❄️ FREEZE"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.panelBtn, styles.panelRenewBtn]}
                        onPress={() => setIsRenewing(true)}
                      >
                        <Text style={styles.panelBtnText}>🔄 RENEW PLAN</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 12 Detailed Fields */}
                    <View style={styles.detailSectionCard}>
                      <Text style={styles.sectionTitleText}>MEMBER CLASSIFICATION & PLAN</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Full Name:</Text>
                        <Text style={styles.detailValueText}>{selectedDetailMember.name}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Membership Plan:</Text>
                        <Text style={styles.detailValueText}>{selectedDetailMember.plan_name || "Custom Plan"}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Start Date:</Text>
                        <Text style={styles.detailValueText}>{formatDate(selectedDetailMember.start_date)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>End Date (Expiry):</Text>
                        <Text style={styles.detailValueText}>{formatDate(selectedDetailMember.end_date)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Remaining PT Sessions:</Text>
                        <Text style={styles.detailValueText}>{selectedDetailMember.remaining_pt_sessions} sessions</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Registered On:</Text>
                        <Text style={styles.detailValueText}>{formatDate(selectedDetailMember.created_at)}</Text>
                      </View>
                    </View>

                    <View style={styles.detailSectionCard}>
                      <Text style={styles.sectionTitleText}>CONTACT & PERSONAL PROFILE</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Phone Number:</Text>
                        <Text style={styles.detailValueText}>📞 {selectedDetailMember.phone}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Email Address:</Text>
                        <Text style={styles.detailValueText}>✉️ {selectedDetailMember.email || "Not Provided"}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Age:</Text>
                        <Text style={styles.detailValueText}>{selectedDetailMember.age ? `${selectedDetailMember.age} years old` : "Not Provided"}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Gender:</Text>
                        <Text style={styles.detailValueText}>{selectedDetailMember.gender || "Not Provided"}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Emergency Contact:</Text>
                        <Text style={styles.detailValueText}>🚨 {selectedDetailMember.emergency_contact_phone || "Not Set"}</Text>
                      </View>
                    </View>

                    <View style={[styles.detailSectionCard, selectedDetailMember.health_conditions ? styles.healthCard : null]}>
                      <Text style={[styles.sectionTitleText, selectedDetailMember.health_conditions ? styles.healthTitleText : null]}>
                        🏥 HEALTH & MEDICAL CONDITIONS
                      </Text>
                      <Text style={selectedDetailMember.health_conditions ? styles.healthBodyText : styles.detailValueText}>
                        {selectedDetailMember.health_conditions || "None declared by member."}
                      </Text>
                    </View>

                    {/* Member PT Sessions List Section */}
                    <View style={styles.detailSectionCard}>
                      <Text style={styles.sectionTitleText}>🗓️ MEMBER PT SESSIONS HISTORY</Text>
                      {loadingSessions ? (
                        <ActivityIndicator size="small" color="#FF5E3A" style={{ marginVertical: 10 }} />
                      ) : detailSessions.length === 0 ? (
                        <Text style={styles.emptySessionText}>No personal training sessions booked yet.</Text>
                      ) : (
                        detailSessions.map((session) => (
                          <View key={session.id} style={styles.sessionHistoryCard}>
                            <View style={styles.sessionCardHeader}>
                              <Text style={styles.sessionCodeText}>{session.session_code}</Text>
                              <View style={[
                                styles.statusPill,
                                session.status === "COMPLETED" && styles.statusPillCompleted,
                                session.status === "CANCELLED" && styles.statusPillCancelled,
                                session.status === "BOOKED" && styles.statusPillBooked,
                              ]}>
                                <Text style={[
                                  styles.statusPillTextText,
                                  session.status === "COMPLETED" && styles.statusTextTextCompleted,
                                  session.status === "CANCELLED" && styles.statusTextTextCancelled,
                                  session.status === "BOOKED" && styles.statusTextTextBooked,
                                ]}>
                                  {session.status}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.sessionDetailRow}>
                              <Text style={styles.sessionDetailLabel}>Date:</Text>
                              <Text style={styles.sessionDetailValue}>{formatDate(session.session_date)}</Text>
                            </View>
                            <View style={styles.sessionDetailRow}>
                              <Text style={styles.sessionDetailLabel}>Trainer:</Text>
                              <Text style={styles.sessionDetailValue}>{session.trainer_name}</Text>
                            </View>
                            <View style={styles.sessionDetailRow}>
                              <Text style={styles.sessionDetailLabel}>Type:</Text>
                              <Text style={styles.sessionDetailValue}>{session.session_type}</Text>
                            </View>
                            <View style={styles.sessionDetailRow}>
                              <Text style={styles.sessionDetailLabel}>Source:</Text>
                              <Text style={styles.sessionDetailValue}>{session.session_source}</Text>
                            </View>
                            <View style={styles.sessionDetailRow}>
                              <Text style={styles.sessionDetailLabel}>Amount Charged:</Text>
                              <Text style={styles.sessionDetailValue}>₹{session.amount_charged}</Text>
                            </View>
                          </View>
                        ))
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.submitBtn, styles.closeBtn]}
                      onPress={() => setSelectedDetailMember(null)}
                    >
                      <Text style={styles.submitBtnText}>CLOSE RECORDS</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* 2. Edit Mode Sheet Panel */}
                {isEditing && (
                  <View style={styles.editSection}>
                    <Text style={styles.editSectionTitle}>Edit Member Records</Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>FULL NAME *</Text>
                      <TextInput
                        style={styles.input}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Enter name"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>PHONE NUMBER (10 DIGITS) *</Text>
                      <TextInput
                        style={styles.input}
                        value={editPhone}
                        onChangeText={setEditPhone}
                        placeholder="Enter 10-digit phone"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        keyboardType="numeric"
                        maxLength={10}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                      <TextInput
                        style={styles.input}
                        value={editEmail}
                        onChangeText={setEditEmail}
                        placeholder="Enter email"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        keyboardType="email-address"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>AGE</Text>
                      <TextInput
                        style={styles.input}
                        value={editAge}
                        onChangeText={setEditAge}
                        placeholder="Enter age"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>GENDER</Text>
                      <View style={styles.rowSelector}>
                        {["MALE", "FEMALE", "OTHER"].map((g) => (
                          <TouchableOpacity
                            key={g}
                            style={[styles.selectorBtn, editGender === g && styles.selectorBtnActive]}
                            onPress={() => setEditGender(g as "MALE" | "FEMALE" | "OTHER")}
                          >
                            <Text style={[styles.selectorBtnText, editGender === g && styles.selectorBtnTextActive]}>
                              {g}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>EMERGENCY CONTACT PHONE</Text>
                      <TextInput
                        style={styles.input}
                        value={editEmergency}
                        onChangeText={setEditEmergency}
                        placeholder="Emergency phone number"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>HEALTH & MEDICAL NOTES</Text>
                      <TextInput
                        style={[styles.input, { height: 72, paddingTop: 10 }]}
                        value={editHealth}
                        onChangeText={setEditHealth}
                        placeholder="Physical restrictions or chronic details"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        multiline
                      />
                    </View>

                    <View style={styles.editActionRow}>
                      <TouchableOpacity
                        style={[styles.submitBtn, styles.cancelActionBtn]}
                        onPress={() => setIsEditing(false)}
                      >
                        <Text style={styles.submitBtnText}>CANCEL</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.submitBtn, { flex: 1, marginTop: 0 }]}
                        onPress={handleUpdateSubmit}
                        disabled={loading}
                      >
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>SAVE CHANGES</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* 3. Renew Mode Sheet Panel */}
                {isRenewing && (
                  <View style={styles.editSection}>
                    <Text style={styles.editSectionTitle}>Renew Membership Plan</Text>

                    {/* Membership Plan Selector */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>CHOOSE MEMBERSHIP PLAN</Text>
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
                                paddingVertical: 12,
                                paddingHorizontal: 6,
                                alignItems: "center",
                                justifyContent: "center",
                              },
                              renewPlanId === plan.id && styles.selectorBtnActive
                            ]}
                            onPress={() => setRenewPlanId(plan.id)}
                          >
                            <Text style={[
                              styles.selectorBtnText,
                              { textAlign: "center" },
                              renewPlanId === plan.id && styles.selectorBtnTextActive
                            ]}>
                              {plan.name}{"\n"}
                              <Text style={{ fontSize: 10, opacity: 0.8 }}>₹{plan.price}</Text>
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
                        onPress={() => setShowDatePicker(true)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>
                          📅 {formatDate(renewStartDate)}
                        </Text>
                      </TouchableOpacity>
                      <Text style={{ color: "rgba(255, 255, 255, 0.35)", fontSize: 10, marginTop: 2 }}>
                        ⚠️ Click to select activation date (past dates restricted).
                      </Text>
                    </View>

                    {/* Payment Method Selector */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>PAYMENT METHOD</Text>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 6, marginTop: 4 }}>
                        {["CASH", "UPI", "CARD", "ONLINE"].map((method) => (
                          <TouchableOpacity
                            key={method}
                            style={[
                              {
                                flex: 1,
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                borderWidth: 1,
                                borderColor: "rgba(255, 255, 255, 0.08)",
                                borderRadius: 12,
                                height: 44,
                                alignItems: "center",
                                justifyContent: "center",
                              },
                              renewPayment === method && styles.selectorBtnActive
                            ]}
                            onPress={() => setRenewPayment(method as "CASH" | "UPI" | "CARD" | "ONLINE")}
                          >
                            <Text style={[styles.selectorBtnText, renewPayment === method && styles.selectorBtnTextActive]}>
                              {method}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.editActionRow}>
                      <TouchableOpacity
                        style={[styles.submitBtn, styles.cancelActionBtn]}
                        onPress={() => setIsRenewing(false)}
                      >
                        <Text style={styles.submitBtnText}>CANCEL</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.submitBtn, { flex: 1, marginTop: 0 }]}
                        onPress={handleRenewSubmit}
                        disabled={loading}
                      >
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>CONFIRM RENEW</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Dynamic Custom Datepicker Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerCard}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={prevMonth} style={styles.calendarNavBtn}>
                <Text style={styles.calendarNavText}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>{monthName} {calendarYear}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.calendarNavBtn}>
                <Text style={styles.calendarNavText}>▶</Text>
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

                const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = renewStartDate === dateString;

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                    ]}
                    onPress={() => {
                      const todayLimit = new Date();
                      todayLimit.setHours(0, 0, 0, 0);
                      if (cellDate < todayLimit) {
                        Alert.alert("Invalid Date ⚠️", "Membership start date cannot be selected in the past.");
                        return;
                      }
                      setRenewStartDate(dateString);
                      setShowDatePicker(false);
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
              style={[styles.submitBtn, { backgroundColor: "rgba(255, 255, 255, 0.08)", marginTop: 16 }]}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={[styles.submitBtnText, { color: "#FFFFFF" }]}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dynamic Add Member Start Date Custom Datepicker Modal */}
      <Modal visible={showAddDatePicker} transparent animationType="fade">
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerCard}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={prevMonth} style={styles.calendarNavBtn}>
                <Text style={styles.calendarNavText}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>{monthName} {calendarYear}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.calendarNavBtn}>
                <Text style={styles.calendarNavText}>▶</Text>
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
                      const todayLimit = new Date();
                      todayLimit.setHours(0, 0, 0, 0);
                      if (cellDate < todayLimit) {
                        Alert.alert("Invalid Date ⚠️", "Membership start date cannot be selected in the past.");
                        return;
                      }
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
              style={[styles.submitBtn, { backgroundColor: "rgba(255, 255, 255, 0.08)", marginTop: 16 }]}
              onPress={() => setShowAddDatePicker(false)}
            >
              <Text style={[styles.submitBtnText, { color: "#FFFFFF" }]}>CLOSE</Text>
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
    backgroundColor: "#0A0A0C",
    paddingTop: Platform.OS === "ios" ? 48 : (StatusBar.currentHeight || 24),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    // paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  addButton: {
    backgroundColor: "#FF5E3A",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  filterSection: {
    padding: 24,
    gap: 14,
  },
  searchBar: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1.5,
    borderRadius: 14,
    color: "#FFFFFF",
    fontSize: 15,
    height: 48,
    paddingHorizontal: 16,
  },
  tabFilters: {
    flexDirection: "row",
    gap: 8,
  },
  filterPill: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterPillActive: {
    backgroundColor: "#FF5E3A",
    borderColor: "#FF5E3A",
  },
  filterPillText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  centerSpinner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  memberCard: {
    backgroundColor: "rgba(30, 30, 35, 0.65)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  memberCode: {
    color: "#FF5E3A",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: "hidden",
  },
  statusActive: {
    backgroundColor: "rgba(76, 175, 80, 0.12)",
  },
  statusExpired: {
    backgroundColor: "rgba(244, 67, 54, 0.12)",
  },
  statusFrozen: {
    backgroundColor: "rgba(33, 150, 243, 0.12)",
  },
  statusCancelled: {
    backgroundColor: "rgba(158, 158, 158, 0.15)",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: "#4CAF50",
  },
  statusTextExpired: {
    color: "#F44336",
  },
  statusTextFrozen: {
    color: "#2196F3",
  },
  statusTextCancelled: {
    color: "#9E9E9E",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  memberDetails: {
    gap: 4,
  },
  detailText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
    fontWeight: "500",
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
    maxHeight: "85%",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
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
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
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

  // Member Detail Sheet Specific Styling
  detailForm: {
    gap: 20,
    paddingBottom: 40,
  },
  detailProfileHeader: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 94, 58, 0.15)",
    borderColor: "#FF5E3A",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarChar: {
    color: "#FF5E3A",
    fontSize: 28,
    fontWeight: "900",
  },
  detailNameText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  detailCodeText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: -4,
  },
  largeStatusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 4,
  },
  largeStatusBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },

  // Operations Action Buttons
  actionPanelRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 4,
  },
  panelBtn: {
    flex: 1,
    borderRadius: 12,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  panelEditBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  panelFreezeBtn: {
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    borderColor: "rgba(33, 150, 243, 0.3)",
  },
  panelRenewBtn: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  panelBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  detailSectionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  sectionTitleText: {
    color: "#FF5E3A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    paddingBottom: 6,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabelText: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 13,
    fontWeight: "600",
  },
  detailValueText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  healthCard: {
    backgroundColor: "rgba(244, 67, 54, 0.06)",
    borderColor: "rgba(244, 67, 54, 0.25)",
    borderWidth: 1.5,
    gap: 8,
  },
  healthTitleText: {
    color: "#F44336",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  healthBodyText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  closeBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "transparent",
    elevation: 0,
  },

  // PT Sessions History Styling
  emptySessionText: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 10,
    fontWeight: "600",
  },
  sessionHistoryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 4,
  },
  sessionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    paddingBottom: 6,
    marginBottom: 2,
  },
  sessionCodeText: {
    color: "#FF5E3A",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusPill: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusPillCompleted: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
  },
  statusPillCancelled: {
    backgroundColor: "rgba(244, 67, 54, 0.15)",
  },
  statusPillBooked: {
    backgroundColor: "rgba(255, 193, 7, 0.15)",
  },
  statusPillTextText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  statusTextTextCompleted: {
    color: "#4CAF50",
  },
  statusTextTextCancelled: {
    color: "#F44336",
  },
  statusTextTextBooked: {
    color: "#FFC107",
  },
  sessionDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionDetailLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    fontWeight: "600",
  },
  sessionDetailValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // Edit / Renew Sub-forms
  editSection: {
    gap: 16,
    paddingVertical: 10,
  },
  editSectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  editActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  cancelActionBtn: {
    width: 100,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "transparent",
    elevation: 0,
    marginTop: 0,
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
});
