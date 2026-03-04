import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Mock users - in real app would come from database
const mockUsers = [
  {
    name: "María González",
    username: "maria_manager",
    password: "123456",
    role: "manager" as const,
  },
  {
    name: "Carlos Ramírez",
    username: "carlos_staff",
    password: "123456",
    role: "employee" as const,
  },
];

export default function RoleSelect() {
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState<"manager" | "employee" | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    const user = mockUsers.find(
      (u) => u.username === username && u.password === password && u.role === selectedRole
    );

    if (user) {
      if (selectedRole === "manager") {
        (navigation as any).push("Inventory");
      } else {
        (navigation as any).push("EmployeeInventory");
      }
    } else {
      Alert.alert("Error", "Usuario o contraseña incorrectos para el rol seleccionado");
    }
  };

  const handleBack = () => {
    if (selectedRole) {
      setSelectedRole(null);
      setUsername("");
      setPassword("");
    } else {
      (navigation as any).navigate("RestaurantDashboard");
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
            >
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
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