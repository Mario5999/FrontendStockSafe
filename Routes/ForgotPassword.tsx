import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.successCircle}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.successTitle}>¡Correo Enviado!</Text>
          <Text style={styles.successSubText}>Hemos enviado un enlace de recuperación a:</Text>
          <Text style={styles.emailText}>{email}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Instrucciones:</Text>
            <Text style={styles.infoText}>• Revisa tu bandeja de entrada</Text>
            <Text style={styles.infoText}>• Haz clic en el enlace de recuperación</Text>
            <Text style={styles.infoText}>• Crea tu nueva contraseña</Text>
            <Text style={styles.expireText}>El enlace expirará en 24 horas</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => (navigation as any).navigate("ResetPassword")}>
            <Text style={styles.primaryText}>Ir a Restablecer Contraseña</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSubmitted(false)}>
            <Text style={styles.link}>¿No recibiste el correo? Reenviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
            <Ionicons name="arrow-back" size={28} color="black" />
            <Text style={styles.backLabel}>Volver</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Recuperar Contraseña</Text>
        <Text style={styles.subText}>Ingresa tu correo y te enviaremos un enlace</Text>

        <TextInput
          style={styles.input}
          placeholder="📧 tu@correo.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={isLoading}>
          <Text style={styles.primaryText}>{isLoading ? "Enviando..." : "Enviar Enlace de Recuperación"}</Text>
        </TouchableOpacity>
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
  subText: { color: "#6b7280", marginTop: 4, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, marginTop: 10 },
  primaryButton: { backgroundColor: "#f97316", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 12 },
  primaryText: { color: "#fff", fontWeight: "700" },
  successCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#d1fae5",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  successCheck: {
    fontSize: 28,
    lineHeight: 28,
    color: "#16a34a",
    fontWeight: "700",
  },
  successTitle: { fontSize: 34, fontWeight: "700", color: "#111827", textAlign: "center" },
  successSubText: { color: "#4b5563", marginTop: 6, textAlign: "center" },
  emailText: { fontWeight: "700", textAlign: "center", marginTop: 10, marginBottom: 12, fontSize: 28, color: "#111827" },
  infoBox: {
    backgroundColor: "#dbeafe",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#93c5fd",
    padding: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  infoTitle: { color: "#1e40af", fontSize: 14, fontWeight: "700", marginBottom: 6 },
  infoText: { color: "#1e40af", fontSize: 12, marginBottom: 4 },
  expireText: { color: "#1d4ed8", fontSize: 11, marginTop: 6 },
  link: { textAlign: "center", color: "#4b5563", marginTop: 12 },
});