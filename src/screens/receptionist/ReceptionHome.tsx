import React from "react";
import { View, Text, Button, Alert } from "react-native";
import { getUser, clearStorage } from "../../storage/mmkv";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";

type ReceptionHomeNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ReceptionTabs"
>;

type Props = {
  navigation: ReceptionHomeNavigationProp;
};

export default function ReceptionHome({ navigation }: Props) {
  const user = getUser();

  const handleLogout = () => {
    clearStorage();
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Reception Dashboard
      </Text>

      <Text style={{ marginTop: 10 }}>
        Welcome, {user?.name}
      </Text>

      <Text style={{ marginTop: 10 }}>
        Role: {user?.role}
      </Text>

      <View style={{ marginTop: 30 }}>
        <Button
          title="Member Check-in"
          onPress={() => Alert.alert("Check-in", "Feature coming soon")}
        />

        <View style={{ height: 10 }} />

        <Button
          title="Register Member"
          onPress={() => Alert.alert("Register", "Member registration")}
        />

        <View style={{ height: 10 }} />

        <Button
          title="Payments"
          onPress={() => Alert.alert("Payments", "Payment module")}
        />

        <View style={{ height: 30 }} />

        <Button title="Logout" color="red" onPress={handleLogout} />
      </View>
    </View>
  );
}