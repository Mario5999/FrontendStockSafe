import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  getAuthHeaders,
  getReportHistory,
  getHistoricalReportPdfUrl,
  ReportHistoryItem,
} from "../services/api";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer el PDF descargado."));
    reader.readAsDataURL(blob);
  });
}

export default function RestaurantReports() {
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurantId, restaurantName } = route.params as {
    restaurantId: number;
    restaurantName: string;
  };

  const [reports, setReports] = useState<ReportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getReportHistory(restaurantId);
      setReports(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo cargar el historial.";
      Alert.alert("Historial", message);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const downloadPdfForPrint = async (pdfUrl: string) => {
    if (!FileSystem.cacheDirectory) {
      throw new Error("No hay cache disponible para preparar el PDF.");
    }

    const localUri = `${FileSystem.cacheDirectory}historical-report-${Date.now()}.pdf`;
    const response = await fetch(pdfUrl, {
      method: "GET",
      headers: getAuthHeaders({ Accept: "application/pdf" }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.toLowerCase().includes("application/json")) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error ?? payload?.message;
        throw new Error(message || `No se pudo descargar el PDF del servidor (${response.status}).`);
      }

      throw new Error(`No se pudo descargar el PDF del servidor (${response.status}).`);
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (typeof contentType === "string" && contentType && !contentType.toLowerCase().includes("application/pdf")) {
      throw new Error("El servidor no devolvió un PDF válido.");
    }

    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    const base64 = dataUrl.split(",", 2)[1] ?? "";

    if (!base64) {
      throw new Error("El PDF descargado llegó vacío.");
    }

    await FileSystem.writeAsStringAsync(localUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return localUri;
  };

  const openPdf = async (reportId: number) => {
    setOpeningId(reportId);
    try {
      const pdfUrl = getHistoricalReportPdfUrl(reportId, restaurantId);
      const localPdfUri = await downloadPdfForPrint(pdfUrl);
      const printableUri =
        Platform.OS === "android" ? await FileSystem.getContentUriAsync(localPdfUri) : localPdfUri;
      await Print.printAsync({ uri: printableUri });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo abrir el reporte.";
      Alert.alert("Reporte PDF", message);
    } finally {
      setOpeningId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.title}>Reportes PDF</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{restaurantName}</Text>
        </View>
      </View>

      {/* Lista de reportes */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />
      ) : reports.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No hay reportes generados aún.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.listHeader}>
            Reportes generados ({reports.length})
          </Text>
          <FlatList
            data={reports}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  <Text style={styles.reportIndex}>
                    Reporte #{reports.length - index}
                  </Text>
                  <Text style={styles.reportDate}>{formatDate(item.generatedAt)}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.viewButton,
                    openingId === item.id && styles.viewButtonDisabled,
                  ]}
                  disabled={openingId === item.id}
                  onPress={() => openPdf(item.id)}
                >
                  <Text style={styles.viewButtonText}>
                    {openingId === item.id ? "Abriendo..." : "Ver PDF"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 12,
  },
  backButton: { paddingRight: 4 },
  backText: { color: "#1d4ed8", fontWeight: "600", fontSize: 15 },
  headerTitles: { flex: 1 },
  title: { fontSize: 17, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  listHeader: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    fontWeight: "700",
    color: "#374151",
    fontSize: 13,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: { flex: 1 },
  reportIndex: { fontSize: 14, fontWeight: "700", color: "#111827" },
  reportDate: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  viewButton: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  viewButtonDisabled: { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" },
  viewButtonText: { color: "#1d4ed8", fontWeight: "600", fontSize: 13 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#374151", textAlign: "center" },
});
