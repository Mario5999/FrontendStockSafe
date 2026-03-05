import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
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
import { MaterialIcons } from "@expo/vector-icons";

interface User {
  name: string;
  username: string;
  role: "manager" | "employee";
}

interface DashboardParams {
  profileImage?: string;
  users?: User[];
  restaurantName?: string;
}

const mockUsers: User[] = [
  { name: "María González", username: "maria_manager", role: "manager" },
  { name: "Carlos Ramírez", username: "carlos_staff", role: "employee" },
];



export default function RestaurantDashboard() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as DashboardParams | undefined) || {};

  const [users, setUsers] = useState<User[]>(
    params.users && params.users.length > 0 ? params.users : mockUsers
  );
  const [profileImage, setProfileImage] = useState<string>(params.profileImage || "");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentRole, setCurrentRole] = useState<"manager" | "employee">("manager");
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
  });
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  const stats = {
    totalItems: 156,
    lowStock: 12,
    excessStock: 6,
    outOfStock: 3,
    recentUpdates: 8,
  };

  const pickProfileImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permiso requerido", "Debes permitir acceso a la galería para subir una imagen");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.username || !newUser.password) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    const hasManager = users.some((u) => u.role === "manager");
    if (hasManager && currentRole === "manager") {
      Alert.alert("Error", "Solo puedes tener un gerente");
      return;
    }

    const hasEmployee = users.some((u) => u.role === "employee");
    if (hasEmployee && currentRole === "employee") {
      Alert.alert("Error", "Solo puedes tener un empleado");
      return;
    }

    const user: User = {
      name: newUser.name,
      username: newUser.username,
      role: currentRole,
    };

    setUsers([...users, user]);
    setNewUser({ name: "", username: "", password: "" });
    setShowAddUser(false);
  };

  const handleRemoveUser = (username: string) => {
    Alert.alert("Eliminar usuario", "¿Estás seguro de eliminar este usuario?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => setUsers(users.filter((u) => u.username !== username)),
      },
    ]);
  };

  const canAddManager = !users.some((u) => u.role === "manager");
  const canAddEmployee = !users.some((u) => u.role === "employee");

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    navigation.navigate("Login" as never);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{params.restaurantName || "La Casa del Sabor"}</Text>
            <Text style={styles.subtitle}>Panel del Restaurante</Text>
          </View>
        </View>
 

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Perfil del Restaurante</Text>
        <Text style={styles.cardDescription}>Foto y configuración del establecimiento</Text>

        <View style={styles.imageSection}>
          <View style={styles.avatar}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarFallback}>📷</Text>
            )}
          </View>
          <TouchableOpacity style={styles.secondaryButton} onPress={pickProfileImage}>
            <Text style={styles.secondaryButtonText}>Cambiar Logo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, styles.statIconBlue]}>
            <Ionicons name="cube-outline" size={18} color="#2563eb" />
          </View>
          <View style={styles.statTextWrap}>
            <Text style={styles.statNumber}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, styles.statIconOrange]}>
            <Ionicons name="trending-down-outline" size={18} color="#d97706" />
          </View>
          <View style={styles.statTextWrap}>
            <Text style={styles.statNumber}>{stats.lowStock}</Text>
            <Text style={styles.statLabel}>Stock Bajo</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, styles.statIconIndigo]}>
            <Ionicons name="layers-outline" size={18} color="#1d4ed8" />
          </View>
          <View style={styles.statTextWrap}>
            <Text style={styles.statNumber}>{stats.excessStock}</Text>
            <Text style={styles.statLabel}>Excedentes</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, styles.statIconRed]}>
            <Ionicons name="alert-circle-outline" size={18} color="#dc2626" />
          </View>
          <View style={styles.statTextWrap}>
            <Text style={styles.statNumber}>{stats.outOfStock}</Text>
            <Text style={styles.statLabel}>Sin Stock</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, styles.statIconGreen]}>
            <Ionicons name="trending-up-outline" size={18} color="#16a34a" />
          </View>
          <View style={styles.statTextWrap}>
            <Text style={styles.statNumber}>{stats.recentUpdates}</Text>
            <Text style={styles.statLabel}>Actualizaciones</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Usuarios del Sistema</Text>
        <Text style={styles.cardDescription}>Gerente y empleado con acceso al inventario</Text>

        {users.map((user, index) => (
          <View key={`${user.username}-${index}`} style={styles.userItem}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userDescription}>
                {user.role === "manager"
                  ? "Gerente - Acceso completo"
                  : "Empleado - Solo actualizar cantidades"}
              </Text>
            </View>
            <Text style={user.role === "manager" ? styles.managerBadge : styles.employeeBadge}>
              {user.role === "manager" ? "Gerente" : "Empleado"}
            </Text>
            <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveUser(user.username)}>
              <Ionicons name="trash" size={24} color="red" />
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

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Permisos:</Text>
          <Text style={styles.infoText}>👨‍💼 Gerente: Agregar, editar y eliminar productos</Text>
          <Text style={styles.infoText}>👤 Empleado: Solo actualizar cantidades</Text>
        </View>
      </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("RoleSelect" as never)}
        >
          <Text style={styles.primaryButtonText}>Ver Inventario Completo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutModal(true)}
        >
          <MaterialIcons name="logout" size={24} color="#b91c1c" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.logoutModalCard}>
            <Text style={styles.logoutModalTitle}>¿Deseas cerrar sesión?</Text>
            <Text style={styles.logoutModalSubtitle}>¿Confirmar que deseas cerrar sesión?</Text>

            <View style={styles.logoutModalActions}>
              <TouchableOpacity
                style={[styles.logoutModalButton, styles.logoutCancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.logoutCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutModalButton, styles.logoutConfirmButton]}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.logoutConfirmText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  header: { minHeight: 54, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  backButton: {
    position: "absolute",
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 40,
    lineHeight: 38,
    color: "#111827",
    textAlign: "right",
    includeFontPadding: false,
    transform: [{ translateX: -1 }],
  },
  headerTextContainer: { alignItems: "center", justifyContent: "center", paddingHorizontal: 44 },
  title: { fontSize: 21, fontWeight: "700", color: "#111827", textAlign: "center" },
  subtitle: { fontSize: 13, color: "#6b7280", textAlign: "center", marginTop: 2 },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statCard: {
    width: "48.5%",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconBlue: { backgroundColor: "#dbeafe" },
  statIconOrange: { backgroundColor: "#ffedd5" },
  statIconIndigo: { backgroundColor: "#dbeafe" },
  statIconRed: { backgroundColor: "#fee2e2" },
  statIconGreen: { backgroundColor: "#dcfce7" },
  statTextWrap: { justifyContent: "center" },
  statNumber: { fontSize: 24, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 12, color: "#666" },
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
  userDescription: { fontSize: 12, color: "#666" },
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
  removeButton: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
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
  infoBox: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
  },
  infoTitle: { fontSize: 12, color: "#1e3a8a", fontWeight: "600", marginBottom: 4 },
  infoText: { fontSize: 12, color: "#1e3a8a", marginBottom: 2 },
  logoutButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutButtonText: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logoutModalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  logoutModalSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
  },
  logoutModalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  logoutModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutCancelButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  logoutConfirmButton: {
    backgroundColor: "#dc2626",
  },
  logoutCancelText: {
    color: "#111827",
    fontWeight: "600",
  },
  logoutConfirmText: {
    color: "#fff",
    fontWeight: "700",
  },
});