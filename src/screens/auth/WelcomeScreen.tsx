import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  Dimensions,

} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { SafeAreaView } from "react-native-safe-area-context";

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

type Props = {
  navigation: WelcomeScreenNavigationProp;
};

const { width } = Dimensions.get("window");

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000",
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Dark overlay to make elements pop */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header section with brand name and styling */}
          <View style={styles.brandContainer}>
            <View style={styles.accentBar} />
            <Text style={styles.brandSubTitle}>WELCOME TO</Text>
            <Text style={styles.brandTitle}>
              SURAT <Text style={styles.brandHighlight}>GYM HUB</Text>
            </Text>
            <Text style={styles.tagline}>
              Push your boundaries, master your body, and unlock your true potential.
            </Text>
          </View>

          {/* Action buttons with neon energy accents */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginButtonText}>GET STARTED</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.registerButtonText}>BECOME A MEMBER</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer version/credit */}
        <Text style={styles.footerText}>Surat Gym Hub v1.0 • Built for Performance</Text>
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
    backgroundColor: "rgba(10, 10, 12, 0.75)",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    width: "100%",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 60,
    width: "100%",
  },
  accentBar: {
    width: 60,
    height: 4,
    backgroundColor: "#FF5E3A",
    borderRadius: 2,
    marginBottom: 16,
  },
  brandSubTitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 4,
    marginBottom: 6,
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 16,
  },
  brandHighlight: {
    color: "#FF5E3A",
  },
  tagline: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
  loginButton: {
    backgroundColor: "#FF5E3A",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF5E3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  registerButton: {
    backgroundColor: "transparent",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
});
