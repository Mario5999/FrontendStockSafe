import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import { getAuthHeaders, getInventoryPdfUrl, getProducts } from "../services/api";

interface ProductMovement {
  id: number;
  sectionName: string;
  productName: string;
  systemQuantity: number;
  entries: number;
  exits: number;
  verificationDifference: number;
  unit: string;
}

type InventoryReportRouteParams = {
  restaurantId?: number;
  restaurantName?: string;
};

function formatQuantity(value: number) {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function getDifferenceStyle(value: number) {
  if (value > 0) return styles.positive;
  if (value < 0) return styles.negative;
  return styles.neutral;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer el PDF descargado."));
    reader.readAsDataURL(blob);
  });
}

export default function InventoryReport() {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = (route.params ?? {}) as InventoryReportRouteParams;
  const restaurantId = routeParams.restaurantId;
  const restaurantName = routeParams.restaurantName ?? "Sin nombre";

  const [movements, setMovements] = useState<ProductMovement[]>([]);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const products = await getProducts(restaurantId);
        setMovements(
          products.map((product) => ({
            id: product.id,
            sectionName: product.categoria,
            productName: product.nombre,
            systemQuantity: product.cantidad,
            entries: product.entradas ?? 0,
            exits: product.salidas ?? 0,
            verificationDifference: product.diferenciaVerificacion ?? 0,
            unit: product.unidad,
          }))
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo cargar el reporte.";
        Alert.alert("Reporte", message);
      }
    };

    loadReportData();
  }, [restaurantId]);

  const sections = useMemo(
    () =>
      Object.entries(
        movements.reduce<Record<string, ProductMovement[]>>((acc, movement) => {
          if (!acc[movement.sectionName]) {
            acc[movement.sectionName] = [];
          }

          acc[movement.sectionName].push(movement);
          return acc;
        }, {})
      ).sort(([sectionA], [sectionB]) => sectionA.localeCompare(sectionB, "es")),
    [movements]
  );

  const stats = {
    totalSections: sections.length,
    totalProducts: movements.length,
    totalEntries: movements.reduce((sum, m) => sum + m.entries, 0),
    totalExits: movements.reduce((sum, m) => sum + m.exits, 0),
    totalDifference: movements.reduce((sum, m) => sum + m.verificationDifference, 0),
  };

  const downloadPdfForPrint = async (pdfUrl: string) => {
    if (!FileSystem.cacheDirectory) {
      throw new Error("No hay cache disponible para preparar el PDF.");
    }

    const localUri = `${FileSystem.cacheDirectory}inventory-report-${Date.now()}.pdf`;
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

  const handleGeneratePDF = async () => {
    try {
      const pdfUrl = getInventoryPdfUrl(restaurantId);
      const localPdfUri = await downloadPdfForPrint(pdfUrl);
      const printableUri =
        Platform.OS === "android" ? await FileSystem.getContentUriAsync(localPdfUri) : localPdfUri;
      await Print.printAsync({ uri: printableUri });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo generar el PDF.";
      Alert.alert("Reporte", message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              position: "absolute",
              left: 0,
              backgroundColor: "#eee",
              padding: 10,
              borderRadius: 50,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Reporte de Inventario</Text>
            <Text style={styles.subtitle}>Secciones, productos, entradas, salidas y diferencia</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionButton, styles.actionPrimary]} onPress={handleGeneratePDF}>
            <Text style={styles.actionPrimaryText}>Exportar PDF</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reportHeaderCard}>
          <Text style={styles.reportTitle}>Sistema de Control de Stock</Text>
          <Text style={styles.reportMeta}>Fecha: {new Date().toLocaleDateString("es-ES")}</Text>
          <Text style={styles.reportMeta}>Restaurante: {restaurantName}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Secciones</Text>
            <Text style={styles.statValue}>{stats.totalSections}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Productos</Text>
            <Text style={styles.statValue}>{stats.totalProducts}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Entradas</Text>
            <Text style={[styles.statValue, styles.positive]}>{formatQuantity(stats.totalEntries)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Salidas</Text>
            <Text style={[styles.statValue, styles.negative]}>{formatQuantity(stats.totalExits)}</Text>
          </View>
          <View style={[styles.statCard, styles.fullCard]}>
            <Text style={styles.statLabel}>Diferencia total de verificación</Text>
            <Text style={[styles.statValue, getDifferenceStyle(stats.totalDifference)]}>{formatQuantity(stats.totalDifference)}</Text>
          </View>
        </View>

        {sections.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No hay datos para este restaurante.</Text>
          </View>
        ) : (
          sections.map(([sectionName, sectionMovements]) => {
            const sectionTotals = {
              system: sectionMovements.reduce((sum, item) => sum + item.systemQuantity, 0),
              entries: sectionMovements.reduce((sum, item) => sum + item.entries, 0),
              exits: sectionMovements.reduce((sum, item) => sum + item.exits, 0),
              difference: sectionMovements.reduce((sum, item) => sum + item.verificationDifference, 0),
            };

            return (
              <View key={sectionName} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{sectionName}</Text>
                  <Text style={styles.sectionCount}>{sectionMovements.length} productos</Text>
                </View>

                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <Text style={[styles.headerCell, styles.productCol]}>Producto</Text>
                  <Text style={[styles.headerCell, styles.numberCol]}>Sistema</Text>
                  <Text style={[styles.headerCell, styles.numberCol]}>Entradas</Text>
                  <Text style={[styles.headerCell, styles.numberCol]}>Salidas</Text>
                  <Text style={[styles.headerCell, styles.numberCol]}>Diferencia</Text>
                </View>

                {sectionMovements.map((movement) => (
                  <View key={movement.id} style={styles.tableRow}>
                    <Text style={[styles.cellText, styles.productCol]}>
                      {movement.productName} ({movement.unit})
                    </Text>
                    <Text style={[styles.cellText, styles.numberCol]}>{formatQuantity(movement.systemQuantity)}</Text>
                    <Text style={[styles.cellText, styles.numberCol, styles.positive]}>{formatQuantity(movement.entries)}</Text>
                    <Text style={[styles.cellText, styles.numberCol, styles.negative]}>{formatQuantity(movement.exits)}</Text>
                    <Text style={[styles.cellText, styles.numberCol, getDifferenceStyle(movement.verificationDifference)]}>
                      {formatQuantity(movement.verificationDifference)}
                    </Text>
                  </View>
                ))}

                <View style={[styles.tableRow, styles.tableFooterRow]}>
                  <Text style={[styles.footerCell, styles.productCol]}>Totales de sección</Text>
                  <Text style={[styles.footerCell, styles.numberCol]}>{formatQuantity(sectionTotals.system)}</Text>
                  <Text style={[styles.footerCell, styles.numberCol, styles.positive]}>{formatQuantity(sectionTotals.entries)}</Text>
                  <Text style={[styles.footerCell, styles.numberCol, styles.negative]}>{formatQuantity(sectionTotals.exits)}</Text>
                  <Text style={[styles.footerCell, styles.numberCol, getDifferenceStyle(sectionTotals.difference)]}>
                    {formatQuantity(sectionTotals.difference)}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.footer}>
          <Text style={styles.footerTextSmall}>© 2026 Sistema de Inventario para Restaurantes</Text>
          <Text style={styles.footerTextSmall}>Página 1 de 1</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerTextWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 56,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionPrimary: {
    backgroundColor: "#f97316",
  },
  actionPrimaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  reportHeaderCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fullCard: {
    width: "100%",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
  },
  sectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff7ed",
    borderBottomWidth: 1,
    borderBottomColor: "#fed7aa",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#9a3412",
  },
  sectionCount: {
    fontSize: 12,
    color: "#9a3412",
    fontWeight: "600",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingHorizontal: 10,
  },
  tableHeaderRow: {
    backgroundColor: "#f8fafc",
  },
  tableFooterRow: {
    backgroundColor: "#f9fafb",
    borderBottomWidth: 0,
  },
  productCol: {
    flex: 1.6,
  },
  numberCol: {
    flex: 1,
    textAlign: "right",
  },
  headerCell: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  cellText: {
    fontSize: 12,
    color: "#1f2937",
  },
  footerCell: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  positive: {
    color: "#15803d",
  },
  negative: {
    color: "#b91c1c",
  },
  neutral: {
    color: "#374151",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 13,
    color: "#6b7280",
  },
  footer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerTextSmall: {
    fontSize: 11,
    color: "#6b7280",
  },
});
