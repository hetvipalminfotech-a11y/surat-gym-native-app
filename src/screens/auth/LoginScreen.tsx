import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { loginUser } from "../../services/auth.service";
import { useAuthStore } from "../../store/useAuthStore";
import { ApiError, UserRole } from "../../types/auth.types";
import { Ionicons } from "@expo/vector-icons";

let Notifications: typeof import("expo-notifications") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require("expo-notifications");
  Notifications?.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (err) {
  console.warn("expo-notifications unavailable (use a dev build to enable):", err);
}

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

type LoginScreenRouteProp = RouteProp<RootStackParamList, "Login">;

type Props = {
  navigation: LoginScreenNavigationProp;
  route: LoginScreenRouteProp;
};

export default function LoginScreen({ navigation, route }: Props) {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Focus states for input glowing borders
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Detect and pre-fill email if passed in from the Register Screen redirection
  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params?.email]);

  useEffect(() => {
    requestPermission();
  }, []);

  async function requestPermission() {
    if (!Notifications) return;
    const { status } = await Notifications.requestPermissionsAsync();
    console.log("Permission Status:", status);
  }

  async function sendLoginNotification(name: string, role: string) {
    if (!Notifications) {
      console.log("Skipping login notification: expo-notifications not available in this build.");
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Welcome back",
        body: `${name} — Logged in as ${role}`,
        data: { screen: "Home" },
      },
      trigger: null,
    });

    console.log("Login Notification Sent!");
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Validation Error", "Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser(email.trim().toLowerCase(), password);

      // Block Admin from logging in on the mobile app per mentor requirement
      if (data.user.role === "ADMIN") {
        Alert.alert(
          "Access Denied",
          "Admins must use the Web Admin Panel. Only Trainers and Receptionists are allowed on the mobile app.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate("Welcome");
              },
            },
          ]
        );
        return;
      }

      await sendLoginNotification(data.user.name, data.user.role);

      // Save tokens to Zustand secure store (which also handles MMKV persistence)
      login(data.user, data.accessToken, data.refreshToken);

    } catch (err) {
      const error = err as ApiError;
      Alert.alert(
        "Login Failed",
        error.message || "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000",
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="chevron-back" size={16} color="#FF5E3A" />
            <Text style={styles.backButtonText}>BACK</Text>
          </View>
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Button and Title */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your Surat Gym Hub account</Text>
            </View>

            {/* Form Card Container */}
            <View style={styles.card}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === "email" && styles.inputFocused,
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>PASSWORD</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      focusedInput === "password" && styles.inputFocused,
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>
                      {showPassword ? "HIDE" : "SHOW"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                activeOpacity={0.8}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>SIGN IN</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Redirect to Signup */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>DON'T HAVE AN ACCOUNT? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.footerLink}>SIGN UP</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 10, 12, 0.8)",
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 70,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  backButton: {
    position: "absolute",
    top: 35,
    left: 0,
    paddingHorizontal: 24,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButtonText: {
    color: "#FF5E3A",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    marginTop: 6,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "rgba(30, 30, 35, 0.65)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 24,
    width: "100%",
    gap: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  inputContainer: {
    width: "100%",
  },
  label: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
    color: "#FFFFFF",
    fontSize: 15,
    height: 52,
    paddingHorizontal: 16,
    width: "100%",
  },
  inputFocused: {
    borderColor: "#FF5E3A",
    backgroundColor: "rgba(255, 94, 58, 0.04)",
  },
  passwordWrapper: {
    position: "relative",
    width: "100%",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 64,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    paddingVertical: 8,
  },
  eyeText: {
    color: "#FF5E3A",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  submitButton: {
    backgroundColor: "#FF5E3A",
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    width: "100%",
    shadowColor: "#FF5E3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  footerLink: {
    color: "#FF5E3A",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});