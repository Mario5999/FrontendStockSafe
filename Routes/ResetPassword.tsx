import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { resetPassword } from "../services/api";

export default function ResetPassword() {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = (route.params ?? {}) as { token?: string };
  const [token, setToken] = useState(routeParams.token ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword !== "";

  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

  const handleSubmit = async () => {
    if (!token.trim()) {
      Alert.alert("Error", "Ingresa el token de recuperación");
      return;
    }

    if (!isPasswordValid) {
      Alert.alert("Error", "La contraseña no cumple con los requisitos");
      return;
    }

    if (!passwordsMatch) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(token.trim(), newPassword);
      setIsSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar la contraseña.";
      Alert.alert("Restablecer contraseña", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.card}>
          <View style={styles.successCircle}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.successTitle}>¡Contraseña Actualizada!</Text>
          <Text style={styles.subText}>Ya puedes iniciar sesión con tu nueva contraseña.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => (navigation as any).navigate("Login")}>
            <Text style={styles.primaryText}>Ir a Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.brandSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🍽️</Text>
        </View>
        <Text style={styles.brandTitle}>Inventario Pro</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Nueva Contraseña</Text>
        <Text style={styles.subText}>Crea una contraseña segura para tu cuenta</Text>

        <Text style={styles.fieldLabel}>Token de Recuperación</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa el token recibido"
          placeholderTextColor="#9ca3af"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
        />

        <Text style={styles.fieldLabel}>Nueva Contraseña</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu nueva contraseña"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.fieldLabel, styles.secondFieldLabel]}>Confirmar Contraseña</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Confirma tu contraseña"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.requirementsBox}>
          <Text style={styles.requirementsTitle}>Requisitos de la contraseña:</Text>
          <RequirementItem met={hasMinLength} text="Mínimo 8 caracteres" />
          <RequirementItem met={hasUpperCase} text="Una letra mayúscula" />
          <RequirementItem met={hasLowerCase} text="Una letra minúscula" />
          <RequirementItem met={hasNumber} text="Un número" />
          <RequirementItem met={passwordsMatch} text="Las contraseñas coinciden" />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, (!isPasswordValid || !passwordsMatch) && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={!isPasswordValid || !passwordsMatch || isSubmitting}
        >
          <Text style={styles.primaryText}>{isSubmitting ? "Actualizando..." : "Restablecer Contraseña"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <Text style={{ color: met ? "#15803d" : "#6b7280", fontSize: 12 }}>
      {met ? "✓" : "✗"} {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fff7ed",
    paddingHorizontal: 16,
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 24,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subText: {
    color: "#6b7280",
    marginTop: 4,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  fieldLabel: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
    marginBottom: 6,
  },
  secondFieldLabel: {
    marginTop: 10,
  },
  inputRow: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cfd4dc",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    paddingRight: 42,
    backgroundColor: "#f5f5f7",
    fontSize: 15,
    color: "#111827",
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  requirementsBox: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 4,
  },
  requirementsTitle: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  primaryButton: {
    backgroundColor: "#f97316",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 14,
  },
  disabledButton: { backgroundColor: "#fdba74" },
  primaryText: { color: "#fff", fontWeight: "700" },
  successCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#d1fae5",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  successCheck: {
    fontSize: 28,
    lineHeight: 28,
    color: "#16a34a",
    fontWeight: "700",
  },
  successTitle: { fontSize: 34, fontWeight: "700", color: "#111827", textAlign: "center" },
});
