import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { registerSystemUser } from "../services/api";
import { getRestaurantLogoUri, saveRestaurantLogoUri } from "../services/localRestaurantLogo";

interface UserData {
  name: string;
  username: string;
  password: string;
  role: "manager" | "employee";
}

export default function RestaurantSetup() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as { restaurantId?: number; restaurantName?: string } | undefined) || {};
  const restaurantId = params.restaurantId;
  const [profileImage, setProfileImage] = useState<string>("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [currentRole, setCurrentRole] = useState<"manager" | "employee">("manager");
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
  });
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSavedProfileImage = async () => {
      const savedUri = await getRestaurantLogoUri(restaurantId);
      if (isMounted && savedUri) {
        setProfileImage(savedUri);
      }
    };

    loadSavedProfileImage();

    return () => {
      isMounted = false;
    };
  }, [restaurantId]);

  const pickProfileImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permiso requerido", "Debes permitir acceso a la galería para subir una imagen");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      const persistedUri = await saveRestaurantLogoUri(restaurantId, selectedUri);
      setProfileImage(persistedUri);
    }
  };

  const handleAddUser = async () => {
    if (!restaurantId) {
      Alert.alert("Error", "No se encontró el restaurante actual. Vuelve a registrarlo.");
      return;
    }

    if (!newUser.name || !newUser.username || !newUser.password) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    const hasManager = users.some((u) => u.role === "manager");
    if (hasManager && currentRole === "manager") {
      Alert.alert("Error", "Solo puedes agregar un gerente");
      return;
    }

    const hasEmployee = users.some((u) => u.role === "employee");
    if (hasEmployee && currentRole === "employee") {
      Alert.alert("Error", "Solo puedes agregar un empleado");
      return;
    }

    try {
      await registerSystemUser({
        restauranteId: restaurantId,
        nombreCompleto: newUser.name,
        nombreUsuario: newUser.username,
        contrasena: newUser.password,
        confirmarContrasena: newUser.password,
        rol: currentRole,
      });

      const user: UserData = {
        name: newUser.name,
        username: newUser.username,
        password: newUser.password,
        role: currentRole,
      };

      setUsers([...users, user]);
      setNewUser({ name: "", username: "", password: "" });
      setShowAddUser(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo registrar el usuario.";
      Alert.alert("Usuarios", message);
    }
  };

  const handleRemoveUser = (index: number) => {
    setUsers(users.filter((_, i) => i !== index));
  };

  const handleFinish = () => {
    if (users.length < 2) {
      Alert.alert("Error", "Debes agregar tanto un gerente como un empleado");
      return;
    }

    const dashboardUsers = users.map(({ name, username, role }) => ({
      name,
      username,
      role,
    }));

    (navigation as any).navigate("RestaurantDashboard", {
      profileImage,
      users: dashboardUsers,
      restaurantId,
      restaurantName: params.restaurantName,
    });
  };

  const canAddManager = !users.some((u) => u.role === "manager");
  const canAddEmployee = !users.some((u) => u.role === "employee");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Configuración del Perfil</Text>
            <Text style={styles.subtitle}>Personaliza tu restaurante y agrega tu equipo</Text>
          </View>
        </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Foto de Perfil</Text>
        <Text style={styles.cardDescription}>Sube el logo o imagen de tu restaurante</Text>

        <View style={styles.imageSection}>
          <View style={styles.avatar}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarFallback}>📷</Text>
            )}
          </View>
          <TouchableOpacity style={styles.secondaryButton} onPress={pickProfileImage}>
            <Text style={styles.secondaryButtonText}>Seleccionar Imagen</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Equipo de Trabajo</Text>
        <Text style={styles.cardDescription}>Agrega 1 gerente y 1 empleado (obligatorio)</Text>

        {users.map((user, index) => (
          <View key={`${user.username}-${index}`} style={styles.userItem}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userUsername}>@{user.username}</Text>
            </View>
            <Text style={user.role === "manager" ? styles.managerBadge : styles.employeeBadge}>
              {user.role === "manager" ? "Gerente" : "Empleado"}
            </Text>
            <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveUser(index)}>
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {showAddUser ? (
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                Agregar {currentRole === "manager" ? "Gerente" : "Empleado"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddUser(false);
                  setNewUser({ name: "", username: "", password: "" });
                  setShowNewUserPassword(false);
                }}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nombre Completo</Text>
            <TextInput
              style={styles.input}
              value={newUser.name}
              onChangeText={(text) => setNewUser({ ...newUser, name: text })}
              placeholder="María González"
            />

            <Text style={styles.label}>Nombre de Usuario</Text>
            <TextInput
              style={styles.input}
              value={newUser.username}
              onChangeText={(text) => setNewUser({ ...newUser, username: text })}
              placeholder="👤 maria123"
            />

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.passwordInput}
                value={newUser.password}
                onChangeText={(text) => setNewUser({ ...newUser, password: text })}
                secureTextEntry={!showNewUserPassword}
                placeholder="🔒 Contraseña de acceso"
              />
              <TouchableOpacity onPress={() => setShowNewUserPassword((prev) => !prev)}>
                <Ionicons
                  name={showNewUserPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleAddUser}>
              <Text style={styles.primaryButtonText}>Agregar Usuario</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {canAddManager && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setCurrentRole("manager");
                  setShowAddUser(true);
                }}
              >
                <Text style={styles.secondaryButtonText}>+  Agregar Gerente   👨‍💼</Text>
              </TouchableOpacity>
            )}
            {canAddEmployee && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setCurrentRole("employee");
                  setShowAddUser(true);
                }}
              >
                <Text style={styles.secondaryButtonText}>+  Agregar Empleado   👤</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {users.length < 2 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ Debes agregar tanto un gerente como un empleado para continuar
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Permisos de Roles</Text>
        <Text style={styles.roleText}>👨‍💼 Gerente: Agregar, eliminar y editar productos</Text>
        <Text style={styles.roleText}>👤 Empleado: Solo verificar inventario</Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, users.length < 2 && styles.disabledButton]}
        onPress={handleFinish}
        disabled={users.length < 2}
      >
        <Text style={styles.primaryButtonText}>Completar Configuración</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { flex: 1, backgroundColor: "#fff" },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  header: { minHeight: 56, justifyContent: "center", alignItems: "center", marginBottom: 18 },
  backButton: {
    position: "absolute",
    left: 0,
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: { alignItems: "center", justifyContent: "center", paddingHorizontal: 52 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", textAlign: "center" },
  subtitle: { fontSize: 13, color: "#6b7280", textAlign: "center", marginTop: 2 },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  cardDescription: { fontSize: 13, color: "#666", marginBottom: 10 },
  imageSection: { alignItems: "center" },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#fdebd3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarFallback: { fontSize: 30 },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f97316",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  userAvatarText: { color: "#fff", fontWeight: "700" },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: "600", color: "#222" },
  userUsername: { fontSize: 12, color: "#666" },
  managerBadge: {
    fontSize: 11,
    color: "#6d28d9",
    backgroundColor: "#ede9fe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
  },
  employeeBadge: {
    fontSize: 11,
    color: "#1d4ed8",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
  },
  removeButton: { paddingHorizontal: 6, paddingVertical: 2 },
  removeButtonText: { color: "#dc2626", fontSize: 16, fontWeight: "700" },
  formContainer: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  formTitle: { fontSize: 14, fontWeight: "600", color: "#1f2937" },
  closeText: { fontSize: 16, color: "#111" },
  label: { fontSize: 12, fontWeight: "500", color: "#374151", marginBottom: 4, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
  },
  inputRow: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: { flex: 1, paddingVertical: 10 },
  primaryButton: {
    backgroundColor: "#f97316",
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  primaryButtonText: { color: "#fff", fontWeight: "bold" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#fff",
  },
  secondaryButtonText: { color: "#111827", fontWeight: "500" },
  warningBox: {
    backgroundColor: "#fef9c3",
    borderColor: "#fde68a",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
  },
  warningText: { fontSize: 12, color: "#854d0e" },
  roleText: { fontSize: 13, color: "#1e3a8a", marginTop: 4 },
  disabledButton: { backgroundColor: "#d1d5db" },
});