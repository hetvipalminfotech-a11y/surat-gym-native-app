import React from "react";
import { View, Text, Button, Alert } from "react-native";
import { clearStorage, getUser } from "../../storage/mmkv";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";

type AdminHomeNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AdminHome"
>;

type Props = {
  navigation: AdminHomeNavigationProp;
};

export default function AdminHome({ navigation }: Props) {
  const user = getUser();

  const handleLogout = () => {
    clearStorage();
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Admin Dashboard
      </Text>

      <Text style={{ marginTop: 10 }}>
        Welcome, {user?.name}
      </Text>

      <Text style={{ marginTop: 10 }}>
        Role: {user?.role}
      </Text>

      <View style={{ marginTop: 30 }}>
        <Button
          title="Manage Members"
          onPress={() => Alert.alert("Coming Soon", "Members module")}
        />

        <View style={{ height: 10 }} />

        <Button
          title="Manage Trainers"
          onPress={() => Alert.alert("Coming Soon", "Trainer module")}
        />

        <View style={{ height: 10 }} />

        <Button
          title="Membership Plans"
          onPress={() => Alert.alert("Coming Soon", "Plans module")}
        />

        <View style={{ height: 30 }} />

        <Button title="Logout" color="red" onPress={handleLogout} />
      </View>
    </View>
  );
}