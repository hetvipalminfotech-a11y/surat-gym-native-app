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
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import {
  Member,
  getMembershipPlans,
  MembershipPlan,
} from "../../services/receptionist.service";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useInfiniteMembers,
} from "../../hooks/useMembers";
import { useAuthStore } from "../../store/useAuthStore";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function MembersTab({ navigation }: Props) {
  const currentUser = useAuthStore((state) => state.user);
  const isTrainer = currentUser?.role === "TRAINER";
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedPlanIds, setSelectedPlanIds] = useState<number[]>([]);
  const [tempSelectedPlanIds, setTempSelectedPlanIds] = useState<number[]>([]);
  const [showFilterPlanModal, setShowFilterPlanModal] = useState<boolean>(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400); // 400ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [allPlans, setAllPlans] = useState<MembershipPlan[]>([]);

  const planFilterValue = selectedPlanIds.length > 0 ? selectedPlanIds.join(",") : undefined;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteMembers(debouncedSearch, statusFilter, planFilterValue);

  const members = data?.pages.flatMap((page) => page.members) ?? [];

  // Plan filter multi-select handlers
  const handleOpenFilterModal = () => {
    setTempSelectedPlanIds([...selectedPlanIds]);
    setShowFilterPlanModal(true);
  };

  const handleToggleTempPlan = (planId: number) => {
    if (tempSelectedPlanIds.includes(planId)) {
      setTempSelectedPlanIds(tempSelectedPlanIds.filter((id) => id !== planId));
    } else {
      setTempSelectedPlanIds([...tempSelectedPlanIds, planId]);
    }
  };

  const handleClearTempPlans = () => {
    setTempSelectedPlanIds([]);
  };

  const handleApplyFilters = () => {
    setSelectedPlanIds(tempSelectedPlanIds);
    setShowFilterPlanModal(false);
  };

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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Members Directory</Text>
        </View>
        {!isTrainer ? (
          <TouchableOpacity style={[styles.addButton, { zIndex: 10 }]} onPress={() => navigation.navigate("AddMember")}>
            <Text style={styles.addButtonText}>+ ADD NEW</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      {/* Search and Filters */}
      <View style={styles.filterSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={18} color="rgba(255, 255, 255, 0.4)" />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search name, phone, code..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.filterIconBtn,
              selectedPlanIds.length > 0 && styles.filterIconBtnActive,
            ]}
            onPress={handleOpenFilterModal}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={20} color="#FFFFFF" />
            {selectedPlanIds.length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{selectedPlanIds.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {selectedPlanIds.length > 0 && (
          <View style={styles.activeFiltersRow}>
            <Text style={styles.activeFiltersLabel}>Plans: </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {selectedPlanIds.map((id) => {
                const plan = allPlans.find((p) => p.id === id);
                if (!plan) return null;
                return (
                  <View key={id} style={styles.activeFilterBadge}>
                    <Text style={styles.activeFilterBadgeText}>{plan.name}</Text>
                    <TouchableOpacity
                      onPress={() => setSelectedPlanIds(selectedPlanIds.filter((pId) => pId !== id))}
                      style={styles.activeFilterRemoveBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={12} color="#FF5E3A" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

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
      </View>

      {/* Member List */}
      {isLoading && members.length === 0 ? (
        <View style={styles.centerSpinner}>
          <ActivityIndicator size="large" color="#FF5E3A" />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item: member }) => (
            <TouchableOpacity
              style={styles.memberCard}
              onPress={() => navigation.navigate("MemberDetail", { member })}
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 1 }}>
                  <Ionicons name="call-outline" size={13} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.detailText}>{member.phone}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 1 }}>
                  <Ionicons name="card-outline" size={13} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.detailText}>Plan: {member.plan_name || "Custom Plan"}</Text>
                </View>
                {member.end_date && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 1 }}>
                    <Ionicons name="calendar-outline" size={13} color="rgba(255, 255, 255, 0.5)" />
                    <Text style={styles.detailText}>Ends: {formatDate(member.end_date)}</Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 1 }}>
                  <Ionicons name="fitness-outline" size={13} color="#FF5E3A" />
                  <Text style={[styles.detailText, { color: "#FFFFFF", fontWeight: "600" }]}>Remaining PT: {member.remaining_pt_sessions} sessions</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyView}>
              <Text style={styles.emptyText}>No members found</Text>
            </View>
          )}
          ListFooterComponent={() =>
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color="#FF5E3A" />
              </View>
            ) : null
          }
          refreshing={isLoading && members.length > 0}
          onRefresh={refetch}
          onEndReached={() => {
            if (hasNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
        />
      )}


      {/* Plan Multi-Select Filter Modal */}
      <Modal visible={showFilterPlanModal} transparent animationType="fade">
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900", letterSpacing: 0.5 }}>
                FILTER BY PLAN
              </Text>
              {tempSelectedPlanIds.length > 0 && (
                <TouchableOpacity onPress={handleClearTempPlans}>
                  <Text style={{ color: "#FF5E3A", fontSize: 12, fontWeight: "800" }}>CLEAR ALL</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={{ maxHeight: 300, marginVertical: 8 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 10 }}>
                {allPlans.map((plan) => {
                  const isSelected = tempSelectedPlanIds.includes(plan.id);
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={[
                        styles.planFilterRow,
                        isSelected && styles.planFilterRowActive
                      ]}
                      onPress={() => handleToggleTempPlan(plan.id)}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text style={[styles.planFilterName, isSelected && { color: "#FF5E3A" }]}>
                          {plan.name}
                        </Text>
                        <Text style={styles.planFilterDuration}>
                          {plan.duration_months} {plan.duration_months === 1 ? "Month" : "Months"} • ₹{plan.price}
                        </Text>
                      </View>
                      <View style={[
                        styles.planFilterCheckbox,
                        isSelected && styles.planFilterCheckboxActive
                      ]}>
                        {isSelected && <Ionicons name="checkmark" size={12} color="#000000" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.datePickerCloseBtn, { flex: 1, marginTop: 0 }]}
                onPress={() => setShowFilterPlanModal(false)}
              >
                <Text style={styles.datePickerCloseBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { flex: 1, marginTop: 0, height: 48, borderRadius: 14 }]}
                onPress={handleApplyFilters}
              >
                <Text style={styles.submitBtnText}>APPLY</Text>
              </TouchableOpacity>
            </View>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    position: "relative",
    minHeight: 68,
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
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1.5,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchBarInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    height: "100%",
    padding: 0,
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
  searchRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    width: "100%",
  },
  filterIconBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1.5,
    borderRadius: 14,
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterIconBtnActive: {
    backgroundColor: "rgba(255, 94, 58, 0.12)",
    borderColor: "#FF5E3A",
  },
  filterIconBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  filterBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF5E3A",
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#000000",
    fontSize: 9,
    fontWeight: "900",
  },
  activeFiltersRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -4,
    gap: 6,
  },
  activeFiltersLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  activeFilterBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 94, 58, 0.15)",
    borderColor: "rgba(255, 94, 58, 0.3)",
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 3,
    gap: 4,
  },
  activeFilterBadgeText: {
    color: "#FF5E3A",
    fontSize: 10,
    fontWeight: "800",
  },
  activeFilterRemoveBtn: {
    padding: 2,
  },
  activeFilterRemoveText: {
    color: "#FF5E3A",
    fontSize: 10,
    fontWeight: "900",
  },
  planFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  planFilterRowActive: {
    backgroundColor: "rgba(255, 94, 58, 0.06)",
    borderColor: "rgba(255, 94, 58, 0.2)",
  },
  planFilterName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  planFilterDuration: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  planFilterCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  planFilterCheckboxActive: {
    borderColor: "#FF5E3A",
    backgroundColor: "#FF5E3A",
  },
  planFilterCheckboxTick: {
    color: "#000000",
    fontSize: 11,
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
  },
  datePickerCloseBtnText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
