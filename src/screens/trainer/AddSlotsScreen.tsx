import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/useAuthStore";
import { useCreateBulkSlots } from "../../hooks/usePtSessions";
import { Ionicons } from "@expo/vector-icons";

interface PresetSlot {
  id: string;
  label: string;
  start: string;
  end: string;
}

const PRESET_HOURS: PresetSlot[] = [
  { id: "1", label: "06:00 AM - 07:00 AM", start: "06:00:00", end: "07:00:00" },
  { id: "2", label: "07:00 AM - 08:00 AM", start: "07:00:00", end: "08:00:00" },
  { id: "3", label: "08:00 AM - 09:00 AM", start: "08:00:00", end: "09:00:00" },
  { id: "4", label: "09:00 AM - 10:00 AM", start: "09:00:00", end: "10:00:00" },
  { id: "5", label: "10:00 AM - 11:00 AM", start: "10:00:00", end: "11:00:00" },
  { id: "6", label: "11:00 AM - 12:00 PM", start: "11:00:00", end: "12:00:00" },
  { id: "7", label: "12:00 PM - 01:00 PM", start: "12:00:00", end: "13:00:00" },
  { id: "8", label: "01:00 PM - 02:00 PM", start: "13:00:00", end: "14:00:00" },
  { id: "9", label: "02:00 PM - 03:00 PM", start: "14:00:00", end: "15:00:00" },
  { id: "10", label: "03:00 PM - 04:00 PM", start: "15:00:00", end: "16:00:00" },
  { id: "11", label: "04:00 PM - 05:00 PM", start: "16:00:00", end: "17:00:00" },
  { id: "12", label: "05:00 PM - 06:00 PM", start: "17:00:00", end: "18:00:00" },
  { id: "13", label: "06:00 PM - 07:00 PM", start: "18:00:00", end: "19:00:00" },
  { id: "14", label: "07:00 PM - 08:00 PM", start: "19:00:00", end: "20:00:00" },
  { id: "15", label: "08:00 PM - 09:00 PM", start: "20:00:00", end: "21:00:00" },
  { id: "16", label: "09:00 PM - 10:00 PM", start: "21:00:00", end: "22:00:00" },
];

type AddSlotsScreenRouteProp = RouteProp<RootStackParamList, "AddSlots">;
type AddSlotsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "AddSlots">;

type Props = {
  route: AddSlotsScreenRouteProp;
  navigation: AddSlotsScreenNavigationProp;
};

export default function AddSlotsScreen({ route, navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const trainerId = user?.trainerId || null;
  const { selectedDateStr } = route.params;

  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const createBulkSlotsMutation = useCreateBulkSlots();

  const handleSelectPreset = (id: string) => {
    if (selectedPresets.includes(id)) {
      setSelectedPresets((prev) => prev.filter((pid) => pid !== id));
    } else {
      setSelectedPresets((prev) => [...prev, id]);
    }
  };

  const handleSelectAllPresets = () => {
    if (selectedPresets.length === PRESET_HOURS.length) {
      setSelectedPresets([]);
    } else {
      setSelectedPresets(PRESET_HOURS.map((p) => p.id));
    }
  };

  const handlePublishSlots = async () => {
    if (!trainerId) {
      Alert.alert("Error", "Trainer profile not linked to user.");
      return;
    }
    if (selectedPresets.length === 0) {
      Alert.alert("Alert", "Please select at least one hour slot.");
      return;
    }

    const payloadSlots = PRESET_HOURS.filter((p) => selectedPresets.includes(p.id)).map((p) => ({
      startTime: p.start,
      endTime: p.end,
    }));

    try {
      await createBulkSlotsMutation.mutateAsync({
        trainerId,
        slotDate: selectedDateStr,
        slots: payloadSlots,
      });
      Alert.alert("Success", "Time slots published successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      Alert.alert("Failed", apiErr.message || "Could not publish slots. They might already exist.");
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { flexDirection: "row", alignItems: "center", gap: 4, zIndex: 10 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={14} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.backButtonText}>CANCEL</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>Publish Availability</Text>
          <Text style={styles.headerTitle}>Add Slots</Text>
        </View>
        <View style={{ width: 68, opacity: 0 }} />
      </View>

      {/* Selection Info / Date Card */}
      <View style={styles.dateBanner}>
        <Text style={styles.dateBannerLabel}>TARGET SCHEDULE DATE</Text>
        <Text style={styles.dateBannerValue}>{formatDisplayDate(selectedDateStr)}</Text>
      </View>

      {/* Quick Select Actions Bar */}
      <View style={styles.selectActionsBar}>
        <Text style={styles.selectionCount}>
          {selectedPresets.length} of {PRESET_HOURS.length} slots selected
        </Text>
        <TouchableOpacity
          style={styles.selectAllBtn}
          onPress={handleSelectAllPresets}
          activeOpacity={0.7}
        >
          <Text style={styles.selectAllBtnText}>
            {selectedPresets.length === PRESET_HOURS.length ? "DESELECT ALL" : "SELECT ALL"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Slots List */}
      <FlatList
        data={PRESET_HOURS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.presetsList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selectedPresets.includes(item.id);

          return (
            <TouchableOpacity
              style={[styles.presetRow, isSelected && styles.presetRowActive]}
              onPress={() => handleSelectPreset(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.presetTimeIconContainer}>
                <Ionicons name="time" size={16} color={isSelected ? "#FF5E3A" : "rgba(255, 255, 255, 0.4)"} />
              </View>
              <Text style={[styles.presetLabel, isSelected && styles.presetLabelActive]}>
                {item.label}
              </Text>
              <View style={[styles.checkboxCircle, isSelected && styles.checkboxActive]}>
                {isSelected && <Ionicons name="checkmark" size={12} color="#000000" />}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Sticky Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (selectedPresets.length === 0 || createBulkSlotsMutation.isPending) && styles.confirmBtnDisabled,
          ]}
          onPress={handlePublishSlots}
          disabled={selectedPresets.length === 0 || createBulkSlotsMutation.isPending}
          activeOpacity={0.8}
        >
          {createBulkSlotsMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmBtnText}>
              PUBLISH {selectedPresets.length > 0 ? `(${selectedPresets.length})` : ""} SLOTS
            </Text>
          )}
        </TouchableOpacity>
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 11,
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
  headerSubtitle: {
    color: "#FF5E3A",
    fontSize: 10,
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
    textAlign: "center",
  },
  dateBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "rgba(255, 94, 58, 0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 94, 58, 0.2)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  dateBannerLabel: {
    color: "#FF5E3A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 4,
  },
  dateBannerValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  selectActionsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 10,
  },
  selectionCount: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "700",
  },
  selectAllBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  selectAllBtnText: {
    color: "#FF5E3A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  presetsList: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
  presetRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 30, 35, 0.65)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  presetRowActive: {
    borderColor: "#FF5E3A",
    backgroundColor: "rgba(255, 94, 58, 0.05)",
  },
  presetTimeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  presetTimeIcon: {
    fontSize: 14,
  },
  presetLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  presetLabelActive: {
    color: "#FFFFFF",
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    borderColor: "#FF5E3A",
    backgroundColor: "#FF5E3A",
  },
  checkboxCheck: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  footer: {
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    backgroundColor: "#1c1c1fff",
  },
  confirmBtn: {
    backgroundColor: "#FF5E3A",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF5E3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnDisabled: {
    backgroundColor: "rgba(255, 94, 58, 0.15)",
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
