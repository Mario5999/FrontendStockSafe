import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function RestaurantRegister() {
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    restaurantName: "",
    address: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    managerName: "",
    managerEmail: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    console.log("Registrando restaurante:", formData);

    // Navegar a otra pantalla (ejemplo: Setup)
    navigation.navigate("Setup" as never);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Formulario */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nuevo Restaurante</Text>
        <Text style={styles.cardDescription}>
          Completa la información para registrar tu restaurante
        </Text>

        {/* Información del Restaurante */}
        <Text style={styles.sectionTitle}>Información del Restaurante</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre del Restaurante"
          value={formData.restaurantName}
          onChangeText={(text) => handleChange("restaurantName", text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Dirección"
          value={formData.address}
          onChangeText={(text) => handleChange("address", text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(text) => handleChange("phone", text)}
        />

        {/* Cuenta de Acceso */}
        <Text style={styles.sectionTitle}>Cuenta de Acceso</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(text) => handleChange("email", text)}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Contraseña"
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={(text) => handleChange("password", text)}
          />
          <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirmar Contraseña"
            secureTextEntry={!showConfirmPassword}
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange("confirmPassword", text)}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
            <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Gerente */}
        <Text style={styles.sectionTitle}>Gerente Principal</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre del Gerente"
          value={formData.managerName}
          onChangeText={(text) => handleChange("managerName", text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Correo del Gerente"
          keyboardType="email-address"
          value={formData.managerEmail}
          onChangeText={(text) => handleChange("managerEmail", text)}
        />

        {/* Botón */}
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Registrar Restaurante</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          Al registrarte, aceptas nuestros términos y condiciones
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButton: { marginRight: 10 },
  backText: { fontSize: 20 },
  title: { fontSize: 18, fontWeight: "bold", color: "#333" },
  subtitle: { fontSize: 14, color: "#666" },
  card: { backgroundColor: "#f9f9f9", borderRadius: 8, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  cardDescription: { fontSize: 14, textAlign: "center", color: "#666", marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  inputRow: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: { flex: 1, paddingVertical: 10 },
  button: {
    backgroundColor: "#f97316",
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  terms: { fontSize: 12, color: "#666", textAlign: "center", marginTop: 10 },
});