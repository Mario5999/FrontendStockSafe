import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getRestaurants } from "../services/api";

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
    (navigation as any).navigate("Login");
  };

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
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

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              (navigation as any).navigate("RestaurantDashboard", {
                restaurantName: restaurant.restaurantName,
              })
            }
          >
            <Text style={styles.buttonText}>Ver Detalles</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  button: { marginTop: 10, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, alignItems: "center", padding: 10 },
  buttonText: { color: "#111827", fontWeight: "600" },
});