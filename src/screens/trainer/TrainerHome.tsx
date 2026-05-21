import React from "react";
import { View, Text, Button } from "react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";

type TrainerHomeNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TrainerHome"
>;

type Props = {
  navigation: TrainerHomeNavigationProp;
};

export default function TrainerHome({ navigation }: Props) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Trainer Dashboard
      </Text>

      <Text style={{ marginTop: 10 }}>
        Welcome, {user?.name}
      </Text>

      <Text style={{ marginTop: 10 }}>
        Trainer ID: {user?.trainerId || "N/A"}
      </Text>

      <View style={{ marginTop: 30 }}>
        <Button
          title="My Clients"
          onPress={() => alert("Client list coming soon")}
        />

        <View style={{ height: 10 }} />

        <Button
          title="Workout Plans"
          onPress={() => alert("Workout plans coming soon")}
        />

        <View style={{ height: 10 }} />

        <Button
          title="Attendance"
          onPress={() => alert("Attendance module coming soon")}
        />

        <View style={{ height: 30 }} />

        <Button title="Logout" color="red" onPress={handleLogout} />
      </View>
    </View>
  );
}