import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

interface Restaurant {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  users: number;
  itemsCount: number;
  status: "active" | "inactive";
  registeredDate: string;
}

const mockRestaurants: Restaurant[] = [
  {
    id: 1,
    name: "La Casa del Sabor",
    address: "Av. Principal 123, Ciudad",
    phone: "+57 300 123 4567",
    email: "info@casadelsabor.com",
    users: 2,
    itemsCount: 156,
    status: "active",
    registeredDate: "15 Ene 2026",
  },
  {
    id: 2,
    name: "El Rincón Gourmet",
    address: "Calle 45 #67-89, Centro",
    phone: "+57 300 234 5678",
    email: "contacto@rincongourmet.com",
    users: 2,
    itemsCount: 203,
    status: "active",
    registeredDate: "18 Ene 2026",
  },
  {
    id: 3,
    name: "Delicias del Mar",
    address: "Carrera 12 #34-56, Norte",
    phone: "+57 300 345 6789",
    email: "info@deliciasdelmar.com",
    users: 2,
    itemsCount: 98,
    status: "active",
    registeredDate: "20 Feb 2026",
  },
];

export default function AdminDashboard() {
  const navigation = useNavigation();
  const [restaurants] = useState<Restaurant[]>(mockRestaurants);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = () => {
    (navigation as any).navigate("Login");
  };

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <Text style={styles.statNumber}>{restaurants.reduce((acc, r) => acc + r.users, 0)}</Text>
          <Text style={styles.statLabel}>Usuarios Totales</Text>
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Buscar restaurantes..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <Text style={styles.sectionTitle}>Restaurantes Registrados ({filteredRestaurants.length})</Text>

      {filteredRestaurants.map((restaurant) => (
        <View key={restaurant.id} style={styles.card}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.muted}>{restaurant.address}</Text>
          <Text style={styles.muted}>📧 {restaurant.email}</Text>
          <Text style={styles.muted}>📱 {restaurant.phone}</Text>
          <Text style={styles.muted}>Usuarios: {restaurant.users} • Items: {restaurant.itemsCount}</Text>
          <Text style={styles.muted}>Registrado: {restaurant.registeredDate}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              (navigation as any).navigate("RestaurantDashboard", {
                restaurantName: restaurant.name,
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