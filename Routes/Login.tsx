import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loginRestaurant, loginSystem } from "../services/api";

export default function Login() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"restaurant" | "admin">("restaurant");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [restaurantEmail, setRestaurantEmail] = useState("");
  const [restaurantPassword, setRestaurantPassword] = useState("");
  const [showRestaurantPassword, setShowRestaurantPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!adminEmail.trim() || !adminPassword.trim()) {
      Alert.alert("Error", "Ingresa usuario y contraseña de administrador");
      return;
    }

    try {
      setIsLoading(true);
      await loginSystem(adminEmail.trim(), adminPassword);
      (navigation as any).navigate("AdminDashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo iniciar sesión.";
      Alert.alert("Login admin", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestaurantLogin = async () => {
    if (!restaurantEmail.trim() || !restaurantPassword.trim()) {
      Alert.alert("Error", "Ingresa correo y contraseña del restaurante");
      return;
    }

    try {
      setIsLoading(true);
      await loginRestaurant(restaurantEmail.trim(), restaurantPassword);
      const restaurantName = restaurantEmail.split("@")[0] || "Restaurante";
      (navigation as any).navigate("RestaurantDashboard", { restaurantName });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo iniciar sesión.";
      Alert.alert("Login restaurante", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>🍽️</Text>
        <Text style={styles.title}>Inventario Pro</Text>
        <Text style={styles.subtitle}>Sistema de gestión para restaurantes</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "restaurant" && styles.tabButtonActive]}
            onPress={() => setActiveTab("restaurant")}
          >
            <Text style={[styles.tabText, activeTab === "restaurant" && styles.tabTextActive]}>Restaurante</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "admin" && styles.tabButtonActive]}
            onPress={() => setActiveTab("admin")}
          >
            <Text style={[styles.tabText, activeTab === "admin" && styles.tabTextActive]}>Administrador</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "restaurant" ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="📧​ Correo electrónico"
              value={restaurantEmail}
              onChangeText={setRestaurantEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.inputRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="🔒​ Contraseña"
                value={restaurantPassword}
                onChangeText={setRestaurantPassword}
                secureTextEntry={!showRestaurantPassword}
              />
              <TouchableOpacity onPress={() => setShowRestaurantPassword((prev) => !prev)}>
                <Ionicons
                  name={showRestaurantPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleRestaurantLogin} disabled={isLoading}>
              <Text style={styles.primaryButtonText}>{isLoading ? "Ingresando..." : "Iniciar Sesión"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => (navigation as any).navigate("ForgotPassword")}>
              <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => (navigation as any).navigate("Register")}>
              <Text style={styles.link}>¿No tienes cuenta? Registrar Restaurante</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="👤 Usuario administrador"
              value={adminEmail}
              onChangeText={setAdminEmail}
              autoCapitalize="none"
            />
            <View style={styles.inputRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="🔒​ Contraseña"
                value={adminPassword}
                onChangeText={setAdminPassword}
                secureTextEntry={!showAdminPassword}
              />
              <TouchableOpacity onPress={() => setShowAdminPassword((prev) => !prev)}>
                <Ionicons
                  name={showAdminPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.primaryButton, styles.adminButton]} onPress={handleAdminLogin} disabled={isLoading}>
              <Text style={styles.primaryButtonText}>{isLoading ? "Ingresando..." : "Iniciar Sesión"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => (navigation as any).navigate("ForgotPassword")}>
              <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", backgroundColor: "#fff7ed", padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  logo: { fontSize: 36, textAlign: "center" },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center", marginTop: 6 },
  subtitle: { fontSize: 13, color: "#666", textAlign: "center", marginBottom: 12 },
  tabRow: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 8, padding: 4, marginBottom: 10 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: "center" },
  tabButtonActive: { backgroundColor: "#fff" },
  tabText: { color: "#6b7280", fontWeight: "500" },
  tabTextActive: { color: "#111827", fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, marginTop: 10 },
  inputRow: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: { flex: 1, paddingVertical: 12 },
  primaryButton: { backgroundColor: "#f97316", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 12 },
  adminButton: { backgroundColor: "#334155" },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  link: { textAlign: "center", color: "#4b5563", marginTop: 10, fontSize: 13 },
});