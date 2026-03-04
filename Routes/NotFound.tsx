import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function NotFound() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.code}>404</Text>
      <Text style={styles.message}>Página no encontrada</Text>
      <TouchableOpacity style={styles.button} onPress={() => (navigation as any).navigate("Login")}>
        <Text style={styles.buttonText}>Volver al inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb", padding: 16 },
  icon: { fontSize: 48, marginBottom: 8 },
  code: { fontSize: 36, fontWeight: "700", color: "#111827" },
  message: { color: "#6b7280", marginBottom: 14 },
  button: { backgroundColor: "#f97316", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
