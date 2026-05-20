import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { registerUser } from "../../services/auth.service";
import { ApiError } from "../../types/auth.types";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

type Props = {
  navigation: RegisterScreenNavigationProp;
};

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Focus states for input glowing borders
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleRegister = async () => {
    const trimmedEmail = email.trim();

    // 1. Name Validation
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter your full name");
      return;
    }

    // 2. Email Validations (Specific step-by-step errors)
    if (!trimmedEmail) {
      Alert.alert("Validation Error", "Please enter your email address");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      Alert.alert("Validation Error", "Email must contain the '@' symbol");
      return;
    }

    if (/[A-Z]/.test(trimmedEmail)) {
      Alert.alert(
        "Validation Error",
        "Email must be entirely in lowercase (no uppercase letters allowed)"
      );
      return;
    }

    const emailEmojiRegex = /[\u2600-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g;
    if (emailEmojiRegex.test(trimmedEmail)) {
      Alert.alert("Validation Error", "Email cannot contain emojis");
      return;
    }

    const emailFormatRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailFormatRegex.test(trimmedEmail)) {
      Alert.alert("Validation Error", "Please enter a valid email format (e.g. user@domain.com)");
      return;
    }

    // 3. Password Validations (Specific step-by-step errors)
    if (!password) {
      Alert.alert("Validation Error", "Please enter a password");
      return;
    }

    if (!/^[A-Z]/.test(password)) {
      Alert.alert(
        "Validation Error",
        "Password must start with a Capital letter (A-Z)"
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Validation Error",
        "Password must be at least 6 characters long"
      );
      return;
    }

    if (!/[A-Z]/.test(password)) {
      Alert.alert(
        "Validation Error",
        "Password must contain at least one uppercase letter (A-Z)"
      );
      return;
    }

    if (!/[a-z]/.test(password)) {
      Alert.alert(
        "Validation Error",
        "Password must contain at least one lowercase letter (a-z)"
      );
      return;
    }

    if (!/[0-9]/.test(password)) {
      Alert.alert(
        "Validation Error",
        "Password must contain at least one numeric digit (0-9)"
      );
      return;
    }

    const passwordEmojiRegex = /[\u2600-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g;
    if (passwordEmojiRegex.test(password)) {
      Alert.alert("Validation Error", "Password cannot contain emojis");
      return;
    }

    // Must contain exactly ONE special character
    const specialChars = password.replace(/[a-zA-Z0-9]/g, "");
    const specialCharCount = specialChars.length;

    if (specialCharCount === 0) {
      Alert.alert(
        "Validation Error",
        "Password must contain exactly one special character (e.g. @, #, $, !, etc.)"
      );
      return;
    }

    if (specialCharCount > 1) {
      Alert.alert(
        "Validation Error",
        `Password must contain ONLY ONE special character (found ${specialCharCount}: "${specialChars}")`
      );
      return;
    }

    // 4. Confirm Password Match
    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // 2. Call backend register API
      await registerUser(name.trim(), email.trim().toLowerCase(), password);

      // 3. Success Feedback
      Alert.alert(
        "Account Created",
        "Your account as a Receptionist has been successfully registered! Please sign in to verify your identity.",
        [
          {
            text: "LOG IN NOW",
            onPress: () => {
              // Redirect to Login Screen, pre-filling their email address
              navigation.navigate("Login", { email: email.trim().toLowerCase() });
            },
          },
        ]
      );
    } catch (err) {
      const error = err as ApiError;
      Alert.alert(
        "Registration Failed",
        error.message || "An error occurred while creating your account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000",
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate("Welcome")}
              >
                <Text style={styles.backButtonText}>← BACK</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join Surat Gym Hub as a Receptionist</Text>
            </View>

            {/* Input Form Card */}
            <View style={styles.card}>
              {/* Full Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>FULL NAME</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === "name" && styles.inputFocused,
                  ]}
                  placeholder="Enter full name"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedInput("name")}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === "email" && styles.inputFocused,
                  ]}
                  placeholder="Enter email address"
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

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>PASSWORD</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      focusedInput === "password" && styles.inputFocused,
                    ]}
                    placeholder="Min. 6 characters"
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

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>CONFIRM PASSWORD</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      focusedInput === "confirmPassword" && styles.inputFocused,
                    ]}
                    placeholder="Repeat password"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocusedInput("confirmPassword")}
                    onBlur={() => setFocusedInput(null)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeText}>
                      {showConfirmPassword ? "HIDE" : "SHOW"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit button */}
              <TouchableOpacity
                style={styles.submitButton}
                activeOpacity={0.8}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>SIGN UP</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Already a member redirection */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>ALREADY HAVE AN ACCOUNT? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.footerLink}>SIGN IN</Text>
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
    paddingTop: Platform.OS === "ios" ? 40 : 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
    paddingVertical: 4,
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
    gap: 18,
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
