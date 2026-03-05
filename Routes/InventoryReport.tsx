import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { getInventoryPdfUrl, getProducts, pingInventoryPdf } from "../services/api";

interface ProductMovement {
  id: number;
  productName: string;
  category: string;
  initialStock: number;
  entries: number;
  exits: number;
  currentStock: number;
  unit: string;
  status: "ok" | "low" | "out" | "excess";
}

const toMovementStatus = (quantity: number, minStock: number, maxStock: number): ProductMovement["status"] => {
  if (quantity === 0) return "out";
  if (quantity < minStock) return "low";
  if (maxStock > 0 && quantity > maxStock) return "excess";
  return "ok";
};

type InventoryReportRouteParams = {
  restaurantId?: string;
};

const statusLabels: Record<ProductMovement["status"], string> = {
  ok: "Disponible",
  low: "Stock Bajo",
  out: "Agotado",
  excess: "Excedente",
};

export default function InventoryReport() {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = (route.params ?? {}) as InventoryReportRouteParams;
  const restaurantId = routeParams.restaurantId ?? "N/D";
  const [movements, setMovements] = useState<ProductMovement[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const tableScrollRef = useRef<ScrollView | null>(null);
  const tableScrollX = useRef(0);
  const tableViewportWidth = useRef(0);
  const tableContentWidth = useRef(0);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const products = await getProducts();
        setMovements(
          products.map((product) => {
            const entries = product.entradas ?? 0;
            const exits = product.salidas ?? 0;
            const initialStock = product.stockInicial ?? product.cantidad - entries + exits;

            return {
              id: product.id,
              productName: product.nombre,
              category: product.categoria,
              initialStock,
              entries,
              exits,
              currentStock: product.cantidad,
              unit: product.unidad,
              status: toMovementStatus(product.cantidad, product.stockMinimo, product.stockMaximo ?? product.stockExcedente ?? 0),
            };
          })
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo cargar el reporte.";
        Alert.alert("Reporte", message);
      }
    };

    loadReportData();
  }, []);

  const filteredMovements = movements.filter((movement) => {
    const matchesCategory = filterCategory === "all" || movement.category === filterCategory;
    const matchesStatus = filterStatus === "all" || movement.status === filterStatus;
    return matchesCategory && matchesStatus;
  });

  const categories = useMemo(() => Array.from(new Set(movements.map((m) => m.category))), [movements]);

  const stats = {
    totalProducts: filteredMovements.length,
    totalEntries: filteredMovements.reduce((sum, m) => sum + m.entries, 0),
    totalExits: filteredMovements.reduce((sum, m) => sum + m.exits, 0),
    lowStock: filteredMovements.filter(m => m.status === "low").length,
    excessStock: filteredMovements.filter(m => m.status === "excess").length,
    outOfStock: filteredMovements.filter(m => m.status === "out").length,
  };

  const getCurrentStockTextStyle = (status: ProductMovement["status"]) => {
    if (status === "ok") return styles.currentStockOk;
    if (status === "low") return styles.currentStockLow;
    if (status === "excess") return styles.currentStockExcess;
    return styles.currentStockOut;
  };

  const getStatusBadgeStyle = (status: ProductMovement["status"]) => {
    if (status === "ok") return styles.statusBadgeOk;
    if (status === "low") return styles.statusBadgeLow;
    if (status === "excess") return styles.statusBadgeExcess;
    return styles.statusBadgeOut;
  };

  const getStatusBadgeTextStyle = (status: ProductMovement["status"]) => {
    if (status === "ok") return styles.statusBadgeTextOk;
    if (status === "low") return styles.statusBadgeTextLow;
    if (status === "excess") return styles.statusBadgeTextExcess;
    return styles.statusBadgeTextOut;
  };

  const handleGeneratePDF = async () => {
    try {
      await pingInventoryPdf();
      await Print.printAsync({
        uri: getInventoryPdfUrl(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo generar el PDF.";
      Alert.alert("Reporte", message);
    }
  };

  const handlePrint = () => {
    Alert.alert("Próximamente", "La impresión no está disponible en móvil por ahora.");
  };

  const scrollTable = (direction: "left" | "right") => {
    const step = 140;
    const maxScroll = Math.max(0, tableContentWidth.current - tableViewportWidth.current);
    const target =
      direction === "right"
        ? Math.min(maxScroll, tableScrollX.current + step)
        : Math.max(0, tableScrollX.current - step);

    tableScrollRef.current?.scrollTo({ x: target, animated: true });
    tableScrollX.current = target;
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
            <Text style={styles.subtitle}>Movimientos de stock</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionButton, styles.actionPrimary]} onPress={handleGeneratePDF}>
            <Text style={styles.actionPrimaryText}>Exportar PDF</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, filterCategory === "all" && styles.chipActive]}
            onPress={() => setFilterCategory("all")}
          >
            <Text style={[styles.chipText, filterCategory === "all" && styles.chipTextActive]}>Todas</Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.chip, filterCategory === category && styles.chipActive]}
              onPress={() => setFilterCategory(category)}
            >
              <Text style={[styles.chipText, filterCategory === category && styles.chipTextActive]}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Estado</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {[
            { key: "all", label: "Todos" },
            { key: "ok", label: "Disponible" },
            { key: "low", label: "Stock Bajo" },
            { key: "excess", label: "Excedente" },
            { key: "out", label: "Agotado" },
          ].map((status) => (
            <TouchableOpacity
              key={status.key}
              style={[styles.chip, filterStatus === status.key && styles.chipActive]}
              onPress={() => setFilterStatus(status.key)}
            >
              <Text style={[styles.chipText, filterStatus === status.key && styles.chipTextActive]}>{status.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.reportHeaderCard}>
          <Text style={styles.reportTitle}>Sistema de Control de Stock</Text>
          <Text style={styles.reportMeta}>Fecha: {new Date().toLocaleDateString("es-ES")}</Text>
          <Text style={styles.reportMeta}>Restaurante ID: {restaurantId}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Productos</Text>
            <Text style={styles.statValue}>{stats.totalProducts}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Entradas</Text>
            <Text style={[styles.statValue, styles.positive]}>{stats.totalEntries}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Salidas</Text>
            <Text style={[styles.statValue, styles.negative]}>{stats.totalExits}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Stock Bajo</Text>
            <Text style={[styles.statValue, styles.warning]}>{stats.lowStock}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Excedentes</Text>
            <Text style={[styles.statValue, styles.info]}>{stats.excessStock}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Agotados</Text>
            <Text style={[styles.statValue, styles.negative]}>{stats.outOfStock}</Text>
          </View>
        </View>

        <Text style={styles.tableTitle}>Movimientos de Inventario</Text>
        <ScrollView
          ref={tableScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tableScrollContent}
          onScroll={(event) => {
            tableScrollX.current = event.nativeEvent.contentOffset.x;
          }}
          onLayout={(event) => {
            tableViewportWidth.current = event.nativeEvent.layout.width;
          }}
          onContentSizeChange={(width) => {
            tableContentWidth.current = width;
          }}
          scrollEventThrottle={16}
        >
          <View style={styles.tableWrap}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.cell, styles.productCol, styles.headerText]}>Producto</Text>
              <Text style={[styles.cell, styles.categoryCol, styles.headerText]}>Categoría</Text>
              <Text style={[styles.cell, styles.numberCol, styles.headerText]}>Inicial</Text>
              <Text style={[styles.cell, styles.numberCol, styles.headerText]}>Entradas</Text>
              <Text style={[styles.cell, styles.numberCol, styles.headerText]}>Salidas</Text>
              <Text style={[styles.cell, styles.numberCol, styles.headerText]}>Actual</Text>
              <Text style={[styles.cell, styles.statusCol, styles.headerText]}>Estado</Text>
            </View>

            {filteredMovements.map((movement) => (
              <View key={movement.id} style={styles.tableRow}>
                <Text style={[styles.cell, styles.productCol, styles.productName]}>{movement.productName}</Text>
                <Text style={[styles.cell, styles.categoryCol]}>{movement.category}</Text>
                <Text style={[styles.cell, styles.numberCol]}>{movement.initialStock} {movement.unit}</Text>
                <Text style={[styles.cell, styles.numberCol, styles.positive]}>+{movement.entries} {movement.unit}</Text>
                <Text style={[styles.cell, styles.numberCol, styles.negative]}>-{movement.exits} {movement.unit}</Text>
                <Text style={[styles.cell, styles.numberCol, getCurrentStockTextStyle(movement.status)]}>{movement.currentStock} {movement.unit}</Text>
                <View style={[styles.cell, styles.statusCol]}>
                  <View style={[styles.statusBadge, getStatusBadgeStyle(movement.status)]}>
                    <Text style={[styles.statusBadgeText, getStatusBadgeTextStyle(movement.status)]}>{statusLabels[movement.status]}</Text>
                  </View>
                </View>
              </View>
            ))}

            <View style={[styles.tableRow, styles.tableFooter]}>
              <Text style={[styles.cell, styles.productCol, styles.footerText]}>TOTALES</Text>
              <Text style={[styles.cell, styles.categoryCol]} />
              <Text style={[styles.cell, styles.numberCol, styles.footerText]}>{filteredMovements.reduce((sum, m) => sum + m.initialStock, 0)}</Text>
              <Text style={[styles.cell, styles.numberCol, styles.footerText, styles.positive]}>+{stats.totalEntries}</Text>
              <Text style={[styles.cell, styles.numberCol, styles.footerText, styles.negative]}>-{stats.totalExits}</Text>
              <Text style={[styles.cell, styles.numberCol, styles.footerText]}>{filteredMovements.reduce((sum, m) => sum + m.currentStock, 0)}</Text>
              <Text style={[styles.cell, styles.statusCol]} />
            </View>
          </View>
        </ScrollView>
        <View style={styles.tableScrollControlRow}>
          <TouchableOpacity style={styles.tableScrollArrow} onPress={() => scrollTable("left")}>
            <Text style={styles.tableScrollArrowText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.tableScrollTrack} />
          <TouchableOpacity style={styles.tableScrollArrow} onPress={() => scrollTable("right")}>
            <Text style={styles.tableScrollArrowText}>›</Text>
          </TouchableOpacity>
        </View>

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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 36,
    color: "#111827",
    lineHeight: 30,
    fontWeight: "700",
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    paddingRight: 4,
  },
  chip: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: "#fff7ed",
    borderColor: "#fdba74",
  },
  chipText: {
    color: "#4b5563",
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#c2410c",
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
  tableTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  tableWrap: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  tableScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  tableScrollControlRow: {
    backgroundColor: "#2f2f2f",
    borderRadius: 6,
    height: 16,
    flexDirection: "row",
    alignItems: "center",
    marginTop: -6,
    marginBottom: 12,
    paddingHorizontal: 3,
  },
  tableScrollArrow: {
    width: 16,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#bdbdbd",
    alignItems: "center",
    justifyContent: "center",
  },
  tableScrollArrowText: {
    color: "#2f2f2f",
    fontSize: 10,
    lineHeight: 10,
    fontWeight: "700",
  },
  tableScrollTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#9a9a9a",
    marginHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    minHeight: 44,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#f8fafc",
    borderBottomColor: "#e5e7eb",
  },
  tableFooter: {
    backgroundColor: "#f9fafb",
    borderBottomWidth: 0,
  },
  cell: {
    paddingHorizontal: 8,
    paddingVertical: 9,
    color: "#374151",
    fontSize: 12,
  },
  productCol: {
    width: 140,
  },
  categoryCol: {
    width: 120,
  },
  numberCol: {
    width: 90,
    textAlign: "right",
  },
  statusCol: {
    width: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontWeight: "700",
    color: "#111827",
  },
  productName: {
    fontWeight: "600",
    color: "#111827",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusBadgeOk: {
    backgroundColor: "#dcfce7",
  },
  statusBadgeLow: {
    backgroundColor: "#ffedd5",
  },
  statusBadgeExcess: {
    backgroundColor: "#dbeafe",
  },
  statusBadgeOut: {
    backgroundColor: "#fee2e2",
  },
  statusBadgeTextOk: {
    color: "#15803d",
  },
  statusBadgeTextLow: {
    color: "#c2410c",
  },
  statusBadgeTextExcess: {
    color: "#1d4ed8",
  },
  statusBadgeTextOut: {
    color: "#b91c1c",
  },
  currentStockOk: {
    color: "#15803d",
    fontWeight: "700",
  },
  currentStockLow: {
    color: "#c2410c",
    fontWeight: "700",
  },
  currentStockExcess: {
    color: "#1d4ed8",
    fontWeight: "700",
  },
  currentStockOut: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  positive: {
    color: "#15803d",
  },
  warning: {
    color: "#c2410c",
  },
  info: {
    color: "#1d4ed8",
  },
  negative: {
    color: "#b91c1c",
  },
  footer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontWeight: "700",
    color: "#111827",
  },
  footerTextSmall: {
    fontSize: 11,
    color: "#6b7280",
  },
});
