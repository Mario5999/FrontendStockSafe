import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { clearAuthToken, getRestaurants, deleteRestaurant } from "../services/api";

interface Restaurant {
  id: number;
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  managerName: string;
  managerEmail: string;
}

export default function AdminDashboard() {
  const navigation = useNavigation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setIsLoading(true);
        const data = await getRestaurants();
        setRestaurants(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo cargar la lista.";
        Alert.alert("Panel admin", message);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    (navigation as any).navigate("Login");
  };

  const handleViewPdf = (restaurant: Restaurant) => {
    (navigation as any).navigate("RestaurantReports", {
      restaurantId: restaurant.id,
      restaurantName: restaurant.restaurantName,
    });
  };

  const handleDelete = (restaurant: Restaurant) => {
    Alert.alert(
      "Eliminar restaurante",
      `¿Seguro que deseas eliminar "${restaurant.restaurantName}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setDeletingId(restaurant.id);
            try {
              await deleteRestaurant(restaurant.id);
              setRestaurants((prev) => prev.filter((r) => r.id !== restaurant.id));
            } catch (error) {
              const message = error instanceof Error ? error.message : "No se pudo eliminar el restaurante.";
              Alert.alert("Error", message);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Panel Admin</Text>
          <Text style={styles.subtitle}>Vista general del sistema</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{restaurants.length}</Text>
          <Text style={styles.statLabel}>Restaurantes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{restaurants.length}</Text>
          <Text style={styles.statLabel}>Usuarios Totales</Text>
        </View>
      </View>

      {isLoading && <Text style={styles.muted}>Cargando restaurantes...</Text>}

      <TextInput
        style={styles.input}
        placeholder="Buscar restaurantes..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <Text style={styles.sectionTitle}>Restaurantes Registrados ({filteredRestaurants.length})</Text>

      {filteredRestaurants.map((restaurant) => (
        <View key={restaurant.id} style={styles.card}>
          <Text style={styles.restaurantName}>{restaurant.restaurantName}</Text>
          <Text style={styles.muted}>{restaurant.address}</Text>
          <Text style={styles.muted}>📧 {restaurant.email}</Text>
          <Text style={styles.muted}>📱 {restaurant.phone}</Text>
          <Text style={styles.muted}>Gerente: {restaurant.managerName}</Text>
          <Text style={styles.muted}>Correo gerente: {restaurant.managerEmail}</Text>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPdf]}
              onPress={() => handleViewPdf(restaurant)}
            >
              <Text style={styles.buttonTextPdf}>
                 📄 Ver Reportes PDF
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonDelete]}
              disabled={deletingId === restaurant.id}
              onPress={() => handleDelete(restaurant)}
            >
              <Text style={styles.buttonTextDelete}>
                {deletingId === restaurant.id ? "Eliminando..." : "🗑 Eliminar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  subtitle: { color: "#6b7280", fontSize: 12 },
  logout: { color: "#dc2626", fontWeight: "600" },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  statCard: { width: "48%", backgroundColor: "#fff", borderRadius: 8, padding: 12 },
  statNumber: { fontSize: 22, fontWeight: "700", color: "#111" },
  statLabel: { color: "#6b7280", fontSize: 12 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 11, backgroundColor: "#fff", marginBottom: 10 },
  sectionTitle: { fontWeight: "700", color: "#111827", marginBottom: 8 },
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 10 },
  restaurantName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  muted: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  button: { flex: 1, borderRadius: 8, alignItems: "center", padding: 10 },
  buttonPdf: { backgroundColor: "#1d4ed8" },
  buttonTextPdf: { color: "#fff", fontWeight: "600", fontSize: 13 },
  buttonDelete: { backgroundColor: "#fee2e2", borderWidth: 1, borderColor: "#fca5a5" },
  buttonTextDelete: { color: "#dc2626", fontWeight: "600", fontSize: 13 },
});