import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loginSystem, setAuthToken } from "../services/api";

interface RoleSelectParams {
  restaurantId?: number;
  restaurantName?: string;
}

export default function RoleSelect() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as RoleSelectParams | undefined) || {};
  const [selectedRole, setSelectedRole] = useState<"manager" | "employee" | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!selectedRole) {
      Alert.alert("Error", "Selecciona un rol");
      return;
    }

    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Ingresa usuario y contraseña");
      return;
    }

    try {
      setIsLoading(true);
      const response = await loginSystem(username.trim(), password);
      setAuthToken(response.token);

      if (response.usuario.rol !== selectedRole) {
        const selectedRoleLabel = selectedRole === "manager" ? "Gerente" : "Empleado";
        const userRoleLabel = response.usuario.rol === "manager" ? "gerente" : "empleado";

        Alert.alert(
          "Acceso denegado",
          `Seleccionaste ${selectedRoleLabel}, pero este usuario es ${userRoleLabel}.`
        );
        return;
      }

      if (selectedRole === "manager") {
        (navigation as any).push("Inventory", {
          restaurantId: params.restaurantId,
          restaurantName: params.restaurantName,
        });
      } else {
        (navigation as any).push("EmployeeInventory", {
          restaurantId: params.restaurantId,
          restaurantName: params.restaurantName,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Usuario o contraseña incorrectos.";
      Alert.alert("Acceso", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (selectedRole) {
      setSelectedRole(null);
      setUsername("");
      setPassword("");
    } else {
      (navigation as any).navigate("RestaurantDashboard", {
        restaurantId: params.restaurantId,
        restaurantName: params.restaurantName,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backRow}>
            <Ionicons name="arrow-back" size={28} color="black" />
            <Text style={styles.backLabel}>Volver</Text>
          </TouchableOpacity>
          </View>
        <Text style={styles.title}>Acceso al Inventario</Text>
        <Text style={styles.subtitle}>Selecciona tu rol e inicia sesión</Text>

        {!selectedRole ? (
          <>
            <TouchableOpacity style={styles.roleCard} onPress={() => setSelectedRole("manager")}>
              <Text style={styles.roleTitle}>👨‍💼 Gerente</Text>
              <Text style={styles.roleDescription}>Acceso completo al inventario</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roleCard} onPress={() => setSelectedRole("employee")}>
              <Text style={styles.roleTitle}>👤 Empleado</Text>
              <Text style={styles.roleDescription}>Actualizar cantidades y verificar stock</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.roleTag}>{selectedRole === "manager" ? "Rol: Gerente" : "Rol: Empleado"}</Text>
            <TextInput
              style={styles.input}
              placeholder="👤 Usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <View style={styles.inputRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="🔒 Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.button, selectedRole === "manager" ? styles.managerButton : styles.employeeButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLoading ? "Ingresando..." : "Iniciar Sesión"}</Text>
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
  header: { minHeight: 40, justifyContent: "center", marginBottom: 8 },
  backRow: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  backLabel: { fontSize: 24, marginLeft: 8, color: "#374151", fontWeight: "500" },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  subtitle: { color: "#6b7280", marginTop: 4, marginBottom: 10 },
  roleCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 12, marginTop: 10 },
  roleTitle: { fontWeight: "700", color: "#111827" },
  roleDescription: { color: "#6b7280", fontSize: 12, marginTop: 4 },
  roleTag: { color: "#4b5563", marginTop: 6 },
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
  button: { padding: 14, borderRadius: 8, alignItems: "center", marginTop: 12 },
  managerButton: { backgroundColor: "#a855f7" },
  employeeButton: { backgroundColor: "#3b82f6" },
  buttonText: { color: "#fff", fontWeight: "700" },
});