import React, { useState } from "react";
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
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { useUpdateMember } from "../../hooks/useMembers";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "EditMember">;

export default function EditMemberScreen({ route, navigation }: Props) {
  const { member } = route.params;

  // Edit form states
  const [editName, setEditName] = useState(member.name);
  const [editPhone, setEditPhone] = useState(member.phone);
  const [editEmail, setEditEmail] = useState(member.email || "");
  const [editAge, setEditAge] = useState(member.age ? String(member.age) : "");
  const [editGender, setEditGender] = useState<"MALE" | "FEMALE" | "OTHER">(
    (member.gender as "MALE" | "FEMALE" | "OTHER") || "MALE"
  );
  const [editHealth, setEditHealth] = useState(member.health_conditions || "");
  const [editEmergency, setEditEmergency] = useState(member.emergency_contact_phone || "");

  // Update Mutation
  const updateMutation = useUpdateMember();

  const handleUpdate = () => {
    Keyboard.dismiss();
    if (!editName.trim() || !editPhone.trim()) {
      Alert.alert("Required Fields", "Name and phone number are required.");
      return;
    }

    if (!/^[0-9]{10}$/.test(editPhone.trim())) {
      Alert.alert("Validation Error", "Phone number must be exactly 10 digits");
      return;
    }

    if (editEmergency.trim() && !/^[0-9]{10}$/.test(editEmergency.trim())) {
      Alert.alert("Validation Error", "Emergency phone number must be exactly 10 digits");
      return;
    }

    if (editEmail.trim()) {
      const emailLower = editEmail.trim().toLowerCase();
      const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailLower.includes("@") || !emailReg.test(emailLower)) {
        Alert.alert("Validation Error", "Please enter a valid email address");
        return;
      }
    }

    if (editAge.trim()) {
      const ageNum = parseInt(editAge.trim());
      if (isNaN(ageNum) || ageNum <= 13 || ageNum >= 100) {
        Alert.alert("Validation Error", "Age must be a valid number between 14 and 99");
        return;
      }
    }

    updateMutation.mutate(
      {
        id: member.id,
        dto: {
          name: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim() || undefined,
          age: editAge.trim() ? parseInt(editAge.trim()) : undefined,
          gender: editGender,
          healthConditions: editHealth.trim() || undefined,
          emergencyContactPhone: editEmergency.trim() || undefined,
        },
      },
      {
        onSuccess: (updated) => {
          Alert.alert("Success 🎉", "Member details updated successfully!", [
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
          Alert.alert("Error", err.message || "Failed to update profile.");
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backButton, { flexDirection: "row", alignItems: "center", gap: 4, zIndex: 10 }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={14} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.backButtonText}>CANCEL</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>EDIT PROFILE</Text>
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
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter full name"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PHONE NUMBER (10 DIGITS) *</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="Enter phone number"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email address"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>AGE</Text>
                <TextInput
                  style={styles.input}
                  value={editAge}
                  onChangeText={setEditAge}
                  keyboardType="numeric"
                  placeholder="Years"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

              <View style={{ flex: 1.2 }}>
                <Text style={styles.inputLabel}>GENDER</Text>
                <View style={styles.genderRow}>
                  {(["MALE", "FEMALE", "OTHER"] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderBtn,
                        editGender === g && styles.genderBtnActive,
                      ]}
                      onPress={() => setEditGender(g)}
                    >
                      <Text
                        style={[
                          styles.genderBtnText,
                          editGender === g && styles.genderBtnTextActive,
                        ]}
                      >
                        {g.substring(0, 1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMERGENCY PHONE (10 DIGITS)</Text>
              <TextInput
                style={styles.input}
                value={editEmergency}
                onChangeText={setEditEmergency}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="Emergency contact phone"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>HEALTH & MEDICAL CONDITIONS</Text>
              <TextInput
                style={[styles.input, { height: 80, paddingTop: 12, textAlignVertical: "top" }]}
                multiline
                numberOfLines={3}
                value={editHealth}
                onChangeText={setEditHealth}
                placeholder="Asthma, Knee injury, Heart conditions..."
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleUpdate}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.submitBtnText}>SAVE DETAILS</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  row: {
    flexDirection: "row",
    gap: 12,
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  genderBtnActive: {
    backgroundColor: "rgba(255, 94, 58, 0.1)",
    borderColor: "#FF5E3A",
  },
  genderBtnText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    fontWeight: "800",
  },
  genderBtnTextActive: {
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
});
