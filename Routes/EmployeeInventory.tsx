import React, { useEffect, useRef, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import {
  checkInventory,
  getProducts,
  getSections,
  ProductDto,
  SectionDto,
  updateProductQuantity,
} from "../services/api";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  maxStock: number;
  status: "ok" | "low" | "out" | "excess";
  lastUpdated: string;
}

interface Section {
  id: number;
  name: string;
}

type QuantityMovementType = "entry" | "exit";

const getStatus = (quantity: number, minStock: number, maxStock: number): "ok" | "low" | "out" | "excess" => {
  if (quantity === 0) return "out";
  if (quantity < minStock) return "low";
  if (maxStock > 0 && quantity > maxStock) return "excess";
  return "ok";
};

const mapProductToItem = (product: ProductDto): InventoryItem => ({
  id: product.id,
  name: product.nombre,
  category: product.categoria,
  quantity: product.cantidad,
  unit: product.unidad,
  minStock: product.stockMinimo,
  maxStock: product.stockMaximo ?? product.stockExcedente ?? 0,
  status: getStatus(product.cantidad, product.stockMinimo, product.stockMaximo ?? product.stockExcedente ?? 0),
  lastUpdated: "Ahora",
});

const mapSectionToItem = (section: SectionDto): Section => ({
  id: section.id,
  name: section.nombre,
});

export default function EmployeeInventory() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as { restaurantId?: number; restaurantName?: string } | undefined) || {};
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [selectedMovementType, setSelectedMovementType] = useState<QuantityMovementType | null>(null);
  const [showMovementTypeModal, setShowMovementTypeModal] = useState(false);
  const [verifyingItemId, setVerifyingItemId] = useState<number | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [newQuantity, setNewQuantity] = useState<string>("");
  const [verifiedQuantity, setVerifiedQuantity] = useState<string>("");
  const [verifiedItems, setVerifiedItems] = useState<Map<number, { verified: boolean; matches: boolean; verifiedQty: number }>>(new Map());
  const statusScrollRef = useRef<ScrollView | null>(null);
  const statusScrollX = useRef(0);
  const statusViewportWidth = useRef(0);
  const statusContentWidth = useRef(0);
  const sectionScrollRef = useRef<ScrollView | null>(null);
  const sectionScrollX = useRef(0);
  const sectionViewportWidth = useRef(0);
  const sectionContentWidth = useRef(0);

  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        const [apiSections, apiProducts] = await Promise.all([getSections(), getProducts()]);
        setSections(apiSections.map(mapSectionToItem));
        setItems(apiProducts.map(mapProductToItem));
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo cargar inventario.";
        Alert.alert("Inventario", message);
      }
    };

    loadInventoryData();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesSection = filterSection === "all" || item.category === filterSection;
    return matchesSearch && matchesStatus && matchesSection;
  });

  const editingItem = items.find((item) => item.id === editingItemId) || null;
  const verifyingItem = items.find((item) => item.id === verifyingItemId) || null;

  const closeUpdateModal = () => {
    setEditingItemId(null);
    setSelectedMovementType(null);
    setShowMovementTypeModal(false);
    setNewQuantity("");
  };

  const handleSelectMovementType = (movementType: QuantityMovementType) => {
    setSelectedMovementType(movementType);
    setNewQuantity("");
    setShowMovementTypeModal(false);
  };

  const handleBackToMovementType = () => {
    setSelectedMovementType(null);
    setShowMovementTypeModal(true);
    setNewQuantity("");
  };

  const closeVerifyModal = () => {
    setVerifyingItemId(null);
    setVerifiedQuantity("");
  };

  const handleUpdateQuantity = async () => {
    if (!editingItem || !selectedMovementType) return;
    const value = Number(newQuantity);
    if (Number.isNaN(value) || value <= 0) {
      Alert.alert("Error", "Ingresa una cantidad válida mayor a 0");
      return;
    }

    const updatedQuantity =
      selectedMovementType === "entry"
        ? editingItem.quantity + value
        : editingItem.quantity - value;

    if (updatedQuantity < 0) {
      Alert.alert("Error", "La salida no puede dejar cantidad negativa");
      return;
    }

    try {
      const updated = await updateProductQuantity(editingItem.id, updatedQuantity);
      setItems((prev) => prev.map((currentItem) => (currentItem.id === editingItem.id ? mapProductToItem(updated) : currentItem)));
      closeUpdateModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar la cantidad.";
      Alert.alert("Inventario", message);
    }
  };

  const handleVerifyQuantity = async () => {
    if (!verifyingItem) return;
    const value = Number(verifiedQuantity);
    if (Number.isNaN(value) || value < 0) {
      Alert.alert("Error", "Ingresa una cantidad válida");
      return;
    }

    try {
      const response = await checkInventory(verifyingItem.id, value);
      setVerifiedItems((prev) => {
        const next = new Map(prev);
        next.set(verifyingItem.id, {
          verified: true,
          matches: response.status === "ok",
          verifiedQty: value,
        });
        return next;
      });
      closeVerifyModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo verificar el inventario.";
      Alert.alert("Inventario", message);
    }
  };

  const stats = {
    total: items.length,
    verified: Array.from(verifiedItems.values()).filter((value) => value.verified).length,
    lowStock: items.filter((item) => item.status === "low").length,
    excessStock: items.filter((item) => item.status === "excess").length,
    outOfStock: items.filter((item) => item.status === "out").length,
  };

  const scrollFilter = (
    direction: "left" | "right",
    scrollRef: React.MutableRefObject<ScrollView | null>,
    positionRef: React.MutableRefObject<number>,
    viewportRef: React.MutableRefObject<number>,
    contentRef: React.MutableRefObject<number>
  ) => {
    const step = 140;
    const maxScroll = Math.max(0, contentRef.current - viewportRef.current);
    const target =
      direction === "right"
        ? Math.min(maxScroll, positionRef.current + step)
        : Math.max(0, positionRef.current - step);

    scrollRef.current?.scrollTo({ x: target, animated: true });
    positionRef.current = target;
  };

  const handleOpenReport = () => {
    (navigation as any).navigate("InventoryReport", {
      restaurantId: params.restaurantId,
      restaurantName: params.restaurantName,
    });
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    (navigation as any).navigate("RoleSelect", {
      restaurantId: params.restaurantId,
      restaurantName: params.restaurantName,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setShowLogoutModal(true)}
          style={styles.headerLogoutButton}
        >
          <MaterialIcons name="logout" size={18} color="#b91c1c" />
          <Text style={styles.headerLogoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Verificación de Inventario</Text>
          <Text style={styles.subtitle}>{filteredItems.length} productos</Text>
        </View>
      </View>

      <View style={styles.roleBox}>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>👤 Empleado - Solo Lectura</Text>
        </View>
        <TouchableOpacity style={styles.reportButton} onPress={handleOpenReport}>
          <Text style={styles.reportButtonText}>📋  Reporte</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.roleCount}>Verificado: {stats.verified}/{stats.total}</Text>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardOk]}><Text style={[styles.statNumber, styles.statOkNumber]}>{stats.total - stats.lowStock - stats.outOfStock - stats.excessStock}</Text><Text style={[styles.statLabel, styles.statOkLabel]}>Disponibles</Text></View>
        <View style={[styles.statCard, styles.statCardLow]}><Text style={[styles.statNumber, styles.statLowNumber]}>{stats.lowStock}</Text><Text style={[styles.statLabel, styles.statLowLabel]}>Stock Bajo</Text></View>
        <View style={[styles.statCard, styles.statCardExcess]}><Text style={[styles.statNumber, styles.statExcessNumber]}>{stats.excessStock}</Text><Text style={[styles.statLabel, styles.statExcessLabel]}>Excedentes</Text></View>
        <View style={[styles.statCard, styles.statCardOut]}><Text style={[styles.statNumber, styles.statOutNumber]}>{stats.outOfStock}</Text><Text style={[styles.statLabel, styles.statOutLabel]}>Agotados</Text></View>
      </View>

      <TextInput style={styles.input} placeholder="Buscar productos..." value={searchTerm} onChangeText={setSearchTerm} />

      <Text style={styles.filterTitle}>Estado</Text>
      <ScrollView
        ref={statusScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterRowContent}
        onScroll={(event) => {
          statusScrollX.current = event.nativeEvent.contentOffset.x;
        }}
        onLayout={(event) => {
          statusViewportWidth.current = event.nativeEvent.layout.width;
        }}
        onContentSizeChange={(width) => {
          statusContentWidth.current = width;
        }}
        scrollEventThrottle={16}
      >
        {[
          { key: "all", label: "◯ Todos" },
          { key: "ok", label: "Disponibles" },
          { key: "low", label: "Stock Bajo" },
          { key: "excess", label: "Excedentes" },
          { key: "out", label: "Agotados" },
        ].map((filter) => (
          <TouchableOpacity key={filter.key} style={[styles.chip, filterStatus === filter.key && styles.chipActive]} onPress={() => setFilterStatus(filter.key)}>
            <Text style={[styles.chipText, filterStatus === filter.key && styles.chipTextActive]}>{filter.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.scrollControlRow}>
        <TouchableOpacity style={styles.scrollControlArrow} onPress={() => scrollFilter("left", statusScrollRef, statusScrollX, statusViewportWidth, statusContentWidth)}>
          <Text style={styles.scrollControlArrowText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.scrollControlTrack} />
        <TouchableOpacity style={styles.scrollControlArrow} onPress={() => scrollFilter("right", statusScrollRef, statusScrollX, statusViewportWidth, statusContentWidth)}>
          <Text style={styles.scrollControlArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.filterTitle}>Sección</Text>
      <ScrollView
        ref={sectionScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterRowContent}
        onScroll={(event) => {
          sectionScrollX.current = event.nativeEvent.contentOffset.x;
        }}
        onLayout={(event) => {
          sectionViewportWidth.current = event.nativeEvent.layout.width;
        }}
        onContentSizeChange={(width) => {
          sectionContentWidth.current = width;
        }}
        scrollEventThrottle={16}
      >
        <TouchableOpacity style={[styles.chip, filterSection === "all" && styles.chipActive]} onPress={() => setFilterSection("all")}>
          <Text style={[styles.chipText, filterSection === "all" && styles.chipTextActive]}>◻ Todas las Secciones</Text>
        </TouchableOpacity>
        {sections.map((section) => (
          <TouchableOpacity key={section.id} style={[styles.chip, filterSection === section.name && styles.chipActive]} onPress={() => setFilterSection(section.name)}>
            <Text style={[styles.chipText, filterSection === section.name && styles.chipTextActive]}>{section.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.scrollControlRow}>
        <TouchableOpacity style={styles.scrollControlArrow} onPress={() => scrollFilter("left", sectionScrollRef, sectionScrollX, sectionViewportWidth, sectionContentWidth)}>
          <Text style={styles.scrollControlArrowText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.scrollControlTrack} />
        <TouchableOpacity style={styles.scrollControlArrow} onPress={() => scrollFilter("right", sectionScrollRef, sectionScrollX, sectionViewportWidth, sectionContentWidth)}>
          <Text style={styles.scrollControlArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {filteredItems.map((item) => {
        const verification = verifiedItems.get(item.id);
        const isVerified = verification?.verified || false;
        const matches = verification?.matches || false;

        return (
          <View key={item.id} style={[styles.card, isVerified && (matches ? styles.cardOk : styles.cardWarn)]}>
            <View style={styles.itemTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
              </View>
              <Text
                style={
                  item.status === "ok"
                    ? styles.okBadge
                    : item.status === "low"
                      ? styles.lowBadge
                      : item.status === "excess"
                        ? styles.excessBadge
                        : styles.outBadge
                }
              >
                {item.status === "ok" ? "Disponible" : item.status === "low" ? "Stock Bajo" : item.status === "excess" ? "Excedente" : "Agotado"}
              </Text>
            </View>

            <Text style={styles.itemQty}>{item.quantity} {item.unit}</Text>
            <Text style={styles.itemMeta}>Mínimo: {item.minStock} {item.unit} • Máximo: {item.maxStock} {item.unit} • {item.lastUpdated}</Text>

            {isVerified && (
              <Text style={[styles.verifyText, matches ? styles.verifyOk : styles.verifyWarn]}>
                {matches ? "✓ Verificación correcta" : `⚠ Diferencia detectada (físico: ${verification?.verifiedQty} ${item.unit})`}
              </Text>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setEditingItemId(item.id);
                  setSelectedMovementType(null);
                  setNewQuantity("");
                  setShowMovementTypeModal(true);
                }}
              >
                <Text style={styles.secondaryButtonText}>📝​ Actualizar Cantidad</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => {
                  setVerifyingItemId(item.id);
                  setVerifiedQuantity(String(item.quantity));
                }}
              >
                <Text style={styles.verifyButtonText}>{isVerified ? "✅​ Reverificar" : "​✅​​ Verificar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <Modal visible={showMovementTypeModal && editingItem !== null} transparent animationType="fade" onRequestClose={closeUpdateModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.employeeModalCard}>
            <TouchableOpacity style={styles.employeeModalClose} onPress={closeUpdateModal}>
              <Text style={styles.employeeModalCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.employeeModalTitle}>Tipo de Movimiento</Text>
            <Text style={styles.employeeModalSubtitle}>Elige si vas a registrar una entrada o salida de producto</Text>

            {editingItem && (
              <>
                <View style={styles.employeeInfoBox}>
                  <View style={styles.employeeInfoRow}>
                    <Text style={styles.employeeInfoLabel}>Producto:</Text>
                    <Text style={styles.employeeInfoValue}>{editingItem.name}</Text>
                  </View>
                  <View style={styles.employeeInfoRow}>
                    <Text style={styles.employeeInfoLabel}>Cantidad Actual:</Text>
                    <Text style={styles.employeeInfoQty}>{editingItem.quantity} {editingItem.unit}</Text>
                  </View>
                </View>

                <View style={styles.movementTypeButtonColumn}>
                  <TouchableOpacity style={[styles.movementTypeButton, styles.movementTypeEntryButton]} onPress={() => handleSelectMovementType("entry")}>
                    <Text style={[styles.movementTypeButtonText, styles.movementTypeEntryButtonText]}>Entrada de Producto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.movementTypeButton, styles.movementTypeExitButton]} onPress={() => handleSelectMovementType("exit")}>
                    <Text style={[styles.movementTypeButtonText, styles.movementTypeExitButtonText]}>Salida de Producto</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={editingItem !== null && selectedMovementType !== null} transparent animationType="fade" onRequestClose={closeUpdateModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.employeeModalCard}>
            <TouchableOpacity style={styles.employeeModalClose} onPress={closeUpdateModal}>
              <Text style={styles.employeeModalCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.employeeModalTitle}>{selectedMovementType === "entry" ? "Entrada de Producto" : "Salida de Producto"}</Text>
            <Text style={styles.employeeModalSubtitle}>
              {selectedMovementType === "entry"
                ? "Ingresa la cantidad que se agrega al inventario"
                : "Ingresa la cantidad que se retira del inventario"}
            </Text>

            {editingItem && (
              <>
                <View style={styles.employeeInfoBox}>
                  <View style={styles.employeeInfoRow}>
                    <Text style={styles.employeeInfoLabel}>Producto:</Text>
                    <Text style={styles.employeeInfoValue}>{editingItem.name}</Text>
                  </View>
                  <View style={styles.employeeInfoRow}>
                    <Text style={styles.employeeInfoLabel}>Categoría:</Text>
                    <Text style={styles.employeeInfoValue}>{editingItem.category}</Text>
                  </View>
                  <View style={styles.employeeInfoRow}>
                    <Text style={styles.employeeInfoLabel}>Cantidad Actual:</Text>
                    <Text style={styles.employeeInfoQty}>{editingItem.quantity} {editingItem.unit}</Text>
                  </View>
                </View>

                <Text style={styles.employeeFieldLabel}>
                  {selectedMovementType === "entry" ? "Cantidad de Entrada" : "Cantidad de Salida"} ({editingItem.unit})
                </Text>
                <TextInput
                  style={styles.employeeInput}
                  keyboardType="numeric"
                  value={newQuantity}
                  onChangeText={setNewQuantity}
                />
                <Text style={styles.employeeHint}>Stock mínimo recomendado: {editingItem.minStock} {editingItem.unit} • Stock máximo: {editingItem.maxStock} {editingItem.unit}</Text>

                <View style={styles.employeeNoteBox}>
                  <Text style={styles.employeeNoteText}>
                    {selectedMovementType === "entry"
                      ? "ℹ️ Nota: Registra solo la cantidad que ingresó. El sistema la sumará a la existencia actual."
                      : "ℹ️ Nota: Registra solo la cantidad que salió. El sistema la restará de la existencia actual."}
                  </Text>
                </View>

                <TouchableOpacity style={styles.employeePrimaryButton} onPress={handleUpdateQuantity}>
                  <Text style={styles.employeePrimaryButtonText}>{selectedMovementType === "entry" ? "Registrar Entrada" : "Registrar Salida"}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.employeeSecondaryModalButton} onPress={handleBackToMovementType}>
                  <Text style={styles.employeeSecondaryModalButtonText}>Volver</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={verifyingItem !== null} transparent animationType="fade" onRequestClose={closeVerifyModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.employeeModalCard}>
            <TouchableOpacity style={styles.employeeModalClose} onPress={closeVerifyModal}>
              <Text style={styles.employeeModalCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.employeeModalTitle}>Verificar Cantidad</Text>
            <Text style={styles.employeeModalSubtitle}>Ingresa la cantidad física que encontraste en el inventario</Text>

            {verifyingItem && (
              <>
                <View style={styles.employeeInfoBox}>
                  <View style={styles.employeeInfoRow}>
                    <Text style={styles.employeeInfoLabel}>Producto:</Text>
                    <Text style={styles.employeeInfoValue}>{verifyingItem.name}</Text>
                  </View>
                  <View style={styles.employeeInfoRow}>
                    <Text style={styles.employeeInfoLabel}>Categoría:</Text>
                    <Text style={styles.employeeInfoValue}>{verifyingItem.category}</Text>
                  </View>
                  <View style={styles.employeeInfoRow}>
                    <Text style={styles.employeeInfoLabel}>Cantidad en Sistema:</Text>
                    <Text style={styles.employeeInfoQty}>{verifyingItem.quantity} {verifyingItem.unit}</Text>
                  </View>
                </View>

                <Text style={styles.employeeFieldLabel}>Cantidad Física Encontrada ({verifyingItem.unit})</Text>
                <TextInput
                  style={styles.employeeInput}
                  keyboardType="numeric"
                  value={verifiedQuantity}
                  onChangeText={setVerifiedQuantity}
                />

                <View style={styles.employeeNoteBox}>
                  <Text style={styles.employeeNoteText}>💡 Consejo: Verifica físicamente el producto y registra la cantidad exacta que encuentres. Si hay diferencias, se marcarán en rojo para revisión del gerente.</Text>
                </View>

                <TouchableOpacity style={styles.employeePrimaryButton} onPress={handleVerifyQuantity}>
                  <Text style={styles.employeePrimaryButtonText}>Confirmar Verificación</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

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
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 28 },
  header: { minHeight: 54, justifyContent: "center", alignItems: "center", marginBottom: 10 },
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
  back: {
    fontSize: 36,
    lineHeight: 30,
    color: "#111827",
    textAlign: "center",
    includeFontPadding: false,
    transform: [{ translateX: -1 }],
  },
  headerLogoutButton: {
    position: "absolute",
    left: 0,
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 7,
    flexDirection: "row",
    gap: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  headerLogoutButtonText: { color: "#b91c1c", fontWeight: "700", fontSize: 9 },
  headerTextContainer: { alignItems: "center", justifyContent: "center", paddingHorizontal: 62 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827", textAlign: "center" },
  subtitle: { fontSize: 12, color: "#6b7280", textAlign: "center" },
  roleBox: { marginBottom: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rolePill: { backgroundColor: "#dbeafe", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  roleText: { color: "#1d4ed8", fontWeight: "600", fontSize: 12 },
  roleCount: { color: "#374151", fontWeight: "500", fontSize: 12, marginBottom: 10 },
  reportButton: {
    borderWidth: 1,
    borderColor: "#fb923c",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff7ed",
  },
  reportButtonText: { color: "#ea580c", fontWeight: "700", fontSize: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  statCard: { width: "24%", borderRadius: 8, padding: 10, alignItems: "center" },
  statCardOk: { backgroundColor: "#dcfce7" },
  statCardLow: { backgroundColor: "#ffedd5" },
  statCardExcess: { backgroundColor: "#dbeafe" },
  statCardOut: { backgroundColor: "#fee2e2" },
  statNumber: { fontSize: 18, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 11 },
  statOkNumber: { color: "#15803d" },
  statLowNumber: { color: "#c2410c" },
  statExcessNumber: { color: "#1d4ed8" },
  statOutNumber: { color: "#b91c1c" },
  statOkLabel: { color: "#15803d" },
  statLowLabel: { color: "#c2410c" },
  statExcessLabel: { color: "#1d4ed8" },
  statOutLabel: { color: "#b91c1c" },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, backgroundColor: "#fff", marginBottom: 8 },
  filterTitle: { fontSize: 12, color: "#4b5563", fontWeight: "700", marginBottom: 6 },
  filterRow: { marginBottom: 8 },
  filterRowContent: { paddingRight: 8 },
  scrollControlRow: {
    backgroundColor: "#2f2f2f",
    borderRadius: 6,
    height: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 3,
  },
  scrollControlArrow: {
    width: 16,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#bdbdbd",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollControlArrowText: { color: "#2f2f2f", fontSize: 10, lineHeight: 10, fontWeight: "700" },
  scrollControlTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#9a9a9a",
    marginHorizontal: 6,
  },
  chip: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, backgroundColor: "#fff" },
  chipActive: { backgroundColor: "#111827", borderColor: "#111827" },
  chipText: { color: "#374151", fontSize: 12 },
  chipTextActive: { color: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 10 },
  cardOk: { borderWidth: 1, borderColor: "#86efac" },
  cardWarn: { borderWidth: 1, borderColor: "#fca5a5" },
  itemTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  itemCategory: { fontSize: 12, color: "#6b7280" },
  itemQty: { fontSize: 20, fontWeight: "700", color: "#111827", marginTop: 6 },
  itemMeta: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  verifyText: { fontSize: 12, marginBottom: 8, fontWeight: "600" },
  verifyOk: { color: "#15803d" },
  verifyWarn: { color: "#b91c1c" },
  okBadge: { color: "#15803d", backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, fontSize: 11 },
  lowBadge: { color: "#b45309", backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, fontSize: 11 },
  excessBadge: { color: "#1d4ed8", backgroundColor: "#dbeafe", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, fontSize: 11 },
  outBadge: { color: "#b91c1c", backgroundColor: "#fee2e2", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, fontSize: 11 },
  buttonRow: { flexDirection: "row", gap: 8 },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, alignItems: "center", backgroundColor: "#fff" },
  secondaryButtonText: { color: "#111827", fontWeight: "600", fontSize: 12 },
  verifyButton: { flex: 1, borderWidth: 1, borderColor: "#93c5fd", borderRadius: 8, padding: 10, alignItems: "center", backgroundColor: "#eff6ff" },
  verifyButtonText: { color: "#1d4ed8", fontWeight: "600", fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  employeeModalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  employeeModalClose: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  employeeModalCloseText: { color: "#6b7280", fontSize: 16 },
  employeeModalTitle: { fontSize: 30, fontWeight: "700", color: "#111827", textAlign: "center" },
  employeeModalSubtitle: { fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 2, marginBottom: 14 },
  employeeInfoBox: { backgroundColor: "#f3f4f6", borderRadius: 10, padding: 10, marginBottom: 12 },
  employeeInfoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  employeeInfoLabel: { color: "#6b7280", fontSize: 12 },
  employeeInfoValue: { color: "#111827", fontSize: 14, fontWeight: "600" },
  employeeInfoQty: { color: "#111827", fontSize: 16, fontWeight: "600" },
  employeeFieldLabel: { fontSize: 16, color: "#111827", fontWeight: "600", marginBottom: 6 },
  employeeInput: {
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#9ca3af",
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 6,
    color: "#111827",
  },
  employeeHint: { fontSize: 12, color: "#6b7280", marginBottom: 10 },
  employeeNoteBox: {
    backgroundColor: "#eff6ff",
    borderColor: "#93c5fd",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  employeeNoteText: { color: "#1e40af", fontSize: 12 },
  employeePrimaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  employeePrimaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  employeeSecondaryModalButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  employeeSecondaryModalButtonText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 16,
  },
  movementTypeButtonColumn: {
    gap: 10,
  },
  movementTypeButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  movementTypeEntryButton: {
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
  },
  movementTypeExitButton: {
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
  },
  movementTypeButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  movementTypeEntryButtonText: {
    color: "#1d4ed8",
  },
  movementTypeExitButtonText: {
    color: "#b91c1c",
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
