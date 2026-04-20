import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { registerRestaurant, setAuthToken } from "../services/api";

export default function RestaurantRegister() {
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

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

  const passwordRequirementText =
    "La contrasena debe tener al menos 8 caracteres, con una mayuscula, una minuscula, un numero y un simbolo.";
  const passwordIsValid =
    formData.password.length >= 8 &&
    /[A-Z]/.test(formData.password) &&
    /[a-z]/.test(formData.password) &&
    /\d/.test(formData.password) &&
    /[^A-Za-z0-9]/.test(formData.password);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    const hasEmpty = Object.values(formData).some((value) => !value.trim());
    if (hasEmpty) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    if (!passwordIsValid) {
      Alert.alert("Error", passwordRequirementText);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    if (!acceptedTerms) {
      setShowTermsError(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await registerRestaurant(formData);
      if (created.token) {
        setAuthToken(created.token);
      }
      Alert.alert("Registro Exitoso", "Restaurante registrado correctamente");
      (navigation as any).navigate("Setup", {
        restaurantId: created.data.id,
        restaurantName: created.data.restaurantName,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo registrar el restaurante.";
      Alert.alert("Registro", message);
    } finally {
      setIsSubmitting(false);
    }
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
        <Text style={styles.passwordHint}>{passwordRequirementText}</Text>
        {formData.password.length > 0 && !passwordIsValid ? (
          <Text style={styles.passwordError}>
            {formData.password.length < 8
              ? "La contraseña tiene menos de 8 caracteres."
              : "La contraseña aun no cumple todos los requisitos."}
          </Text>
        ) : null}
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

        <View style={styles.termsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setAcceptedTerms((prev) => {
                const nextValue = !prev;
                if (nextValue) setShowTermsError(false);
                return nextValue;
              });
            }}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
            </View>
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>
            He leído y acepto los{" "}
            <Text
              style={styles.checkboxLink}
              onPress={() => (navigation as any).navigate("TermsAndConditions")}
            >
              términos y condiciones
            </Text>
          </Text>
        </View>

        {/* Botón */}
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
          <Text style={styles.buttonText}>{isSubmitting ? "Registrando..." : "Registrar Restaurante"}</Text>
        </TouchableOpacity>
        {showTermsError ? (
          <Text style={styles.termsError}>Debes de aceptar los términos y condiciones</Text>
        ) : null}
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
  passwordHint: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: -4,
    marginBottom: 6,
  },
  passwordError: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: -2,
    marginBottom: 8,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#f97316",
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  terms: { fontSize: 12, color: "#666", textAlign: "center", marginTop: 10 },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#9ca3af",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  checkboxLabel: { flex: 1, color: "#374151", fontSize: 13 },
  checkboxLink: { color: "#f97316", fontWeight: "700", textDecorationLine: "underline" },
  termsError: {
    color: "#dc2626",
    textAlign: "center",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
  },
});