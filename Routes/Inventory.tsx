import React, { useEffect, useRef, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import {
  createProduct,
  createSection,
  deleteProduct,
  deleteSection,
  getProducts,
  getSections,
  ProductDto,
  SectionDto,
  updateProduct,
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

export default function Inventory() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as { restaurantId?: number; restaurantName?: string } | undefined) || {};
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [showAddItem, setShowAddItem] = useState(false);
  const [showSections, setShowSections] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState({ name: "", category: "", quantity: 0, unit: "kg", minStock: 0, maxStock: 0 });
  const [showAddCategoryMenu, setShowAddCategoryMenu] = useState(false);
  const [showAddUnitMenu, setShowAddUnitMenu] = useState(false);
  const [showEditCategoryMenu, setShowEditCategoryMenu] = useState(false);
  const [showEditUnitMenu, setShowEditUnitMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newItem, setNewItem] = useState({ name: "", category: "", quantity: 0, unit: "kg", minStock: 0, maxStock: 0 });
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

  const unitOptions = ["kg", "L", "Pza"];

  const closeAddModal = () => {
    setShowAddItem(false);
    setShowAddCategoryMenu(false);
    setShowAddUnitMenu(false);
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category) {
      Alert.alert("Error", "Por favor completa nombre y categoría");
      return;
    }

    if (newItem.minStock < 0 || newItem.maxStock < 0 || newItem.maxStock < newItem.minStock) {
      Alert.alert("Error", "El stock máximo debe ser mayor o igual al stock mínimo.");
      return;
    }

    try {
      const created = await createProduct({
        nombre: newItem.name.trim(),
        categoria: newItem.category,
        cantidad: Number(newItem.quantity),
        unidad: newItem.unit,
        stockMinimo: Number(newItem.minStock),
        stockMaximo: Number(newItem.maxStock),
      });

      setItems((prev) => [...prev, mapProductToItem(created)]);
      setNewItem({ name: "", category: "", quantity: 0, unit: "kg", minStock: 0, maxStock: 0 });
      closeAddModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo crear el producto.";
      Alert.alert("Inventario", message);
    }
  };

  const handleAddSection = async () => {
    if (!newSectionName.trim()) {
      Alert.alert("Error", "Ingresa un nombre para la sección");
      return;
    }

    const exists = sections.some((section) => section.name.toLowerCase() === newSectionName.toLowerCase());
    if (exists) {
      Alert.alert("Error", "Esta sección ya existe");
      return;
    }

    try {
      const created = await createSection(newSectionName.trim());
      setSections((prev) => [...prev, mapSectionToItem(created)]);
      setNewSectionName("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo crear la sección.";
      Alert.alert("Secciones", message);
    }
  };

  const handleDeleteSection = (sectionId: number) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const hasProducts = items.some((item) => item.category === section.name);
    if (hasProducts) {
      Alert.alert("Error", "No puedes eliminar una sección con productos");
      return;
    }

    Alert.alert("Eliminar", "¿Eliminar esta sección?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSection(sectionId);
            setSections((prev) => prev.filter((s) => s.id !== sectionId));
          } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo eliminar la sección.";
            Alert.alert("Secciones", message);
          }
        },
      },
    ]);
  };

  const handleDeleteItem = (id: number) => {
    Alert.alert("Eliminar", "¿Eliminar este producto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProduct(id);
            setItems((prev) => prev.filter((item) => item.id !== id));
          } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo eliminar el producto.";
            Alert.alert("Inventario", message);
          }
        },
      },
    ]);
  };

  const updateItemQuantity = (id: number, quantity: number) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity,
              status: getStatus(quantity, item.minStock, item.maxStock),
              lastUpdated: "Ahora",
            }
          : item
      )
    );
  };

  const editingItem = items.find((item) => item.id === editingItemId) || null;

  const closeEditModal = () => {
    setEditingItemId(null);
    setShowEditCategoryMenu(false);
    setShowEditUnitMenu(false);
    setEditItem({ name: "", category: "", quantity: 0, unit: "kg", minStock: 0, maxStock: 0 });
  };

  const handleSaveEditItem = async () => {
    if (!editingItem) return;

    if (!editItem.name.trim() || !editItem.category.trim()) {
      Alert.alert("Error", "Completa nombre y categoría");
      return;
    }

    if (
      Number.isNaN(editItem.quantity) ||
      Number.isNaN(editItem.minStock) ||
      Number.isNaN(editItem.maxStock) ||
      editItem.quantity < 0 ||
      editItem.minStock < 0 ||
      editItem.maxStock < 0
    ) {
      Alert.alert("Error", "Ingresa valores válidos");
      return;
    }

    if (editItem.maxStock < editItem.minStock) {
      Alert.alert("Error", "El stock máximo debe ser mayor o igual al stock mínimo.");
      return;
    }

    try {
      const updated = await updateProduct(editingItem.id, {
        nombre: editItem.name.trim(),
        categoria: editItem.category.trim(),
        cantidad: Number(editItem.quantity),
        unidad: editItem.unit.trim() || "kg",
        stockMinimo: Number(editItem.minStock),
        stockMaximo: Number(editItem.maxStock),
      });

      setItems((prev) => prev.map((item) => (item.id === editingItem.id ? mapProductToItem(updated) : item)));
      closeEditModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar el producto.";
      Alert.alert("Inventario", message);
    }
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

  const handleStatusScrollRight = () => {
    scrollFilter("right", statusScrollRef, statusScrollX, statusViewportWidth, statusContentWidth);
  };

  const handleStatusScrollLeft = () => {
    scrollFilter("left", statusScrollRef, statusScrollX, statusViewportWidth, statusContentWidth);
  };

  const handleSectionScrollRight = () => {
    scrollFilter("right", sectionScrollRef, sectionScrollX, sectionViewportWidth, sectionContentWidth);
  };

  const handleSectionScrollLeft = () => {
    scrollFilter("left", sectionScrollRef, sectionScrollX, sectionViewportWidth, sectionContentWidth);
  };

  const getSectionProductCount = (sectionName: string) => {
    return items.filter((item) => item.category === sectionName).length;
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
          <Text style={styles.title}>Inventario</Text>
          <Text style={styles.subtitle}>{filteredItems.length} productos</Text>
        </View>
        <TouchableOpacity style={[styles.actionButton, styles.headerActionButton]} onPress={() => setShowAddItem(!showAddItem)}>
          <Text style={styles.actionButtonText}>+ Producto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.roleBox}>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>👨‍💼 Gerente - Acceso Completo</Text>
        </View>
        <TouchableOpacity style={styles.sectionsButton} onPress={() => setShowSections(!showSections)}>
          <View style={styles.sectionsButtonInner}>
            <Text style={styles.sectionsButtonIcon}>🗂️​</Text>
            <Text style={styles.roleLink}>Secciones</Text>
          </View>
        </TouchableOpacity>
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
          { key: "all", label: "Todos" },
          { key: "ok", label: "Disponibles" },
          { key: "low", label: "Stock Bajo" },
          { key: "excess", label: "Excedentes" },
          { key: "out", label: "Agotados" },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.chip, filterStatus === filter.key && styles.chipActive]}
            onPress={() => setFilterStatus(filter.key)}
          >
            <Text style={[styles.chipText, filterStatus === filter.key && styles.chipTextActive]}>{filter.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.scrollControlRow}>
        <TouchableOpacity style={styles.scrollControlArrow} onPress={handleStatusScrollLeft}>
          <Text style={styles.scrollControlArrowText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.scrollControlTrack} />
        <TouchableOpacity style={styles.scrollControlArrow} onPress={handleStatusScrollRight}>
          <Text style={styles.scrollControlArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.filterTitle}>Sección</Text>
      <View style={styles.sectionFilterWrap}>
        <ScrollView
          ref={sectionScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sectionFilterRow}
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
            <Text style={[styles.chipText, filterSection === "all" && styles.chipTextActive]}>Todas</Text>
          </TouchableOpacity>
          {sections.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[styles.chip, filterSection === section.name && styles.chipActive]}
              onPress={() => setFilterSection(section.name)}
            >
              <Text style={[styles.chipText, filterSection === section.name && styles.chipTextActive]}>{section.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.scrollControlRow}>
        <TouchableOpacity style={styles.scrollControlArrow} onPress={handleSectionScrollLeft}>
          <Text style={styles.scrollControlArrowText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.scrollControlTrack} />
        <TouchableOpacity style={styles.scrollControlArrow} onPress={handleSectionScrollRight}>
          <Text style={styles.scrollControlArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {filteredItems.map((item) => (
        <View key={item.id} style={styles.card}>
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

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setEditingItemId(item.id);
                setEditItem({
                  name: item.name,
                  category: item.category,
                  quantity: item.quantity,
                  unit: item.unit,
                  minStock: item.minStock,
                  maxStock: item.maxStock,
                });
              }}
            >
              <Text style={styles.secondaryButtonText}>📝 Editar Producto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(item.id)}>
              <View style={styles.deleteButtonContent}>
                <Ionicons name="trash" size={18} color="#b91c1c" />
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Modal visible={showAddItem} transparent animationType="fade" onRequestClose={closeAddModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.addModalCard}>
            <TouchableOpacity style={styles.addModalClose} onPress={closeAddModal}>
              <Text style={styles.addModalCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.addModalTitle}>Nuevo Producto</Text>
            <Text style={styles.addModalSubtitle}>Agrega un nuevo producto al inventario</Text>

            <Text style={styles.addFieldLabel}>Nombre</Text>
            <TextInput
              style={styles.addInput}
              placeholder="Ej: Tomate"
              placeholderTextColor="#6b7280"
              value={newItem.name}
              onChangeText={(text) => setNewItem({ ...newItem, name: text })}
            />

            <Text style={styles.addFieldLabel}>Sección/Categoría</Text>
            <View style={[styles.dropdownAnchor, showAddCategoryMenu && styles.dropdownAnchorActive]}>
              <TouchableOpacity
                style={styles.addSelectLike}
                onPress={() => {
                  setShowAddCategoryMenu(!showAddCategoryMenu);
                  setShowAddUnitMenu(false);
                }}
              >
                <Text style={newItem.category ? styles.addSelectValue : styles.addSelectPlaceholder}>
                  {newItem.category || "Selecciona una sección"}
                </Text>
                <Text style={styles.addChevron}>⌄</Text>
              </TouchableOpacity>
              {showAddCategoryMenu && (
                <View style={styles.dropdownMenuOverlay}>
                  {sections.map((section) => (
                    <TouchableOpacity
                      key={`add-category-${section.id}`}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setNewItem({ ...newItem, category: section.name });
                        setShowAddCategoryMenu(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{section.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.addRowFields}>
              <View style={styles.addHalfField}>
                <Text style={styles.addFieldLabel}>Cantidad</Text>
                <TextInput
                  style={styles.addInput}
                  placeholder="0"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  value={String(newItem.quantity)}
                  onChangeText={(text) => setNewItem({ ...newItem, quantity: Number(text) || 0 })}
                />
              </View>

              <View style={styles.addHalfField}>
                <Text style={styles.addFieldLabel}>Unidad</Text>
                <View style={[styles.dropdownAnchor, showAddUnitMenu && styles.dropdownAnchorActive]}>
                  <TouchableOpacity
                    style={styles.addSelectLike}
                    onPress={() => {
                      setShowAddUnitMenu(!showAddUnitMenu);
                      setShowAddCategoryMenu(false);
                    }}
                  >
                    <Text style={styles.addSelectValue}>{newItem.unit || "kg"}</Text>
                    <Text style={styles.addChevron}>⌄</Text>
                  </TouchableOpacity>
                  {showAddUnitMenu && (
                    <View style={styles.dropdownMenuOverlay}>
                      {unitOptions.map((unit) => (
                        <TouchableOpacity
                          key={`add-unit-${unit}`}
                          style={styles.dropdownOption}
                          onPress={() => {
                            setNewItem({ ...newItem, unit });
                            setShowAddUnitMenu(false);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>{unit}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>

            <Text style={styles.addFieldLabel}>Stock Mínimo</Text>
            <TextInput
              style={styles.addInput}
              placeholder="0"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              value={String(newItem.minStock)}
              onChangeText={(text) => setNewItem({ ...newItem, minStock: Number(text) || 0 })}
            />

            <Text style={styles.addFieldLabel}>Stock Máximo</Text>
            <TextInput
              style={styles.addInput}
              placeholder="0"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              value={String(newItem.maxStock)}
              onChangeText={(text) => setNewItem({ ...newItem, maxStock: Number(text) || 0 })}
            />

            <TouchableOpacity style={styles.addSubmitButton} onPress={handleAddItem}>
              <Text style={styles.addSubmitButtonText}>Agregar Producto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSections} transparent animationType="fade" onRequestClose={() => setShowSections(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sectionsModalCard}>
            <TouchableOpacity onPress={() => setShowSections(false)} style={styles.sectionsModalCloseButton}>
              <Text style={styles.sectionsModalCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.sectionsModalTitle}>Gestionar Secciones</Text>
            <Text style={styles.sectionsModalSubtitle}>Agrega y organiza categorías de productos</Text>

            <Text style={styles.sectionsFieldLabel}>Nueva Sección</Text>
            <View style={styles.sectionsInputRow}>
              <TextInput
                style={styles.sectionsInput}
                placeholder="Ej: Bebidas"
                placeholderTextColor="#6b7280"
                value={newSectionName}
                onChangeText={setNewSectionName}
              />
              <TouchableOpacity style={styles.sectionsAddButton} onPress={handleAddSection}>
                <Text style={styles.sectionsAddButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionsFieldLabel}>Secciones Existentes</Text>
            <ScrollView style={styles.sectionsList} showsVerticalScrollIndicator>
              {sections.map((section) => (
                <View key={section.id} style={styles.sectionsListItem}>
                  <View style={styles.sectionsListLeft}>
                    <Text style={styles.sectionsListIcon}>◻</Text>
                    <View>
                      <Text style={styles.sectionText}>{section.name}</Text>
                      <Text style={styles.sectionsCountText}>{getSectionProductCount(section.name)} productos</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteSection(section.id)}>
                    <Text style={styles.sectionsDeleteIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={editingItemId !== null} transparent animationType="fade" onRequestClose={closeEditModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.editModalCard}>
            <TouchableOpacity style={styles.editModalClose} onPress={closeEditModal}>
              <Text style={styles.editModalCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.editModalTitle}>Editar Producto</Text>
            <Text style={styles.editModalSubtitle}>Modifica la información del producto</Text>

            <Text style={styles.editFieldLabel}>Nombre</Text>
            <TextInput
              style={styles.editInput}
              placeholder="Nombre"
              placeholderTextColor="#6b7280"
              value={editItem.name}
              onChangeText={(text) => setEditItem({ ...editItem, name: text })}
            />

            <Text style={styles.editFieldLabel}>Categoría</Text>
            <View style={[styles.dropdownAnchor, showEditCategoryMenu && styles.dropdownAnchorActive]}>
              <TouchableOpacity
                style={styles.editSelectLike}
                onPress={() => {
                  setShowEditCategoryMenu(!showEditCategoryMenu);
                  setShowEditUnitMenu(false);
                }}
              >
                <Text style={editItem.category ? styles.editSelectValue : styles.editSelectPlaceholder}>
                  {editItem.category || "Selecciona una categoría"}
                </Text>
                <Text style={styles.editChevron}>⌄</Text>
              </TouchableOpacity>
              {showEditCategoryMenu && (
                <View style={styles.dropdownMenuOverlay}>
                  {sections.map((section) => (
                    <TouchableOpacity
                      key={`edit-category-${section.id}`}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setEditItem({ ...editItem, category: section.name });
                        setShowEditCategoryMenu(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{section.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.editRowFields}>
              <View style={styles.editHalfField}>
                <Text style={styles.editFieldLabel}>Cantidad</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="0"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  value={String(editItem.quantity)}
                  onChangeText={(text) => setEditItem({ ...editItem, quantity: Number(text) || 0 })}
                />
              </View>

              <View style={styles.editHalfField}>
                <Text style={styles.editFieldLabel}>Unidad</Text>
                <View style={[styles.dropdownAnchor, showEditUnitMenu && styles.dropdownAnchorActive]}>
                  <TouchableOpacity
                    style={styles.editSelectLike}
                    onPress={() => {
                      setShowEditUnitMenu(!showEditUnitMenu);
                      setShowEditCategoryMenu(false);
                    }}
                  >
                    <Text style={styles.editSelectValue}>{editItem.unit || "kg"}</Text>
                    <Text style={styles.editChevron}>⌄</Text>
                  </TouchableOpacity>
                  {showEditUnitMenu && (
                    <View style={styles.dropdownMenuOverlay}>
                      {unitOptions.map((unit) => (
                        <TouchableOpacity
                          key={`edit-unit-${unit}`}
                          style={styles.dropdownOption}
                          onPress={() => {
                            setEditItem({ ...editItem, unit });
                            setShowEditUnitMenu(false);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>{unit}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>

            <Text style={styles.editFieldLabel}>Stock Mínimo</Text>
            <TextInput
              style={styles.editInput}
              placeholder="0"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              value={String(editItem.minStock)}
              onChangeText={(text) => setEditItem({ ...editItem, minStock: Number(text) || 0 })}
            />

            <Text style={styles.editFieldLabel}>Stock Máximo</Text>
            <TextInput
              style={styles.editInput}
              placeholder="0"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              value={String(editItem.maxStock)}
              onChangeText={(text) => setEditItem({ ...editItem, maxStock: Number(text) || 0 })}
            />

            <TouchableOpacity style={styles.editSubmitButton} onPress={handleSaveEditItem}>
              <Text style={styles.editSubmitButtonText}>Guardar Cambios</Text>
            </TouchableOpacity>
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
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 },
  header: { minHeight: 54, justifyContent: "center", alignItems: "center", marginBottom: 14 },
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
    fontSize: 40,
    lineHeight: 38,
    color: "#111827",
    textAlign: "right",
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
  headerTextContainer: {
    position: "absolute",
    left: 62,
    right: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 21, fontWeight: "700", color: "#111827", textAlign: "center" },
  subtitle: { fontSize: 13, color: "#6b7280", textAlign: "center", marginTop: 2 },
  headerActionButton: { position: "absolute", right: 0 },
  actionButton: { backgroundColor: "#f97316", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  actionButtonText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  roleBox: { marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rolePill: { backgroundColor: "#ede9fe", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  roleText: { color: "#6d28d9", fontWeight: "600", fontSize: 12 },
  sectionsButton: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#fff" },
  sectionsButtonInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionsButtonIcon: { color: "#111827", fontSize: 12, fontWeight: "700" },
  roleLink: { color: "#030303", fontWeight: "700", fontSize: 12 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, backgroundColor: "#fff", marginBottom: 8 },
  filterTitle: { fontSize: 12, color: "#4b5563", fontWeight: "700", marginBottom: 6 },
  filterRow: { marginBottom: 4 },
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
  sectionFilterWrap: { marginBottom: 4 },
  sectionFilterRow: { marginBottom: 0 },
  chip: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, backgroundColor: "#fff" },
  chipActive: { backgroundColor: "#111827", borderColor: "#111827" },
  chipText: { color: "#374151", fontSize: 12 },
  chipTextActive: { color: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 8 },
  sectionItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  sectionText: { color: "#111827" },
  deleteText: { color: "#dc2626", fontWeight: "600" },
  itemTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  itemCategory: { fontSize: 12, color: "#6b7280" },
  itemQty: { fontSize: 20, fontWeight: "700", color: "#111827", marginTop: 6 },
  itemMeta: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  okBadge: { color: "#15803d", backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, fontSize: 11 },
  lowBadge: { color: "#b45309", backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, fontSize: 11 },
  excessBadge: { color: "#1d4ed8", backgroundColor: "#dbeafe", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, fontSize: 11 },
  outBadge: { color: "#b91c1c", backgroundColor: "#fee2e2", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, fontSize: 11 },
  buttonRow: { flexDirection: "row", gap: 8 },
  primaryButton: { backgroundColor: "#f97316", borderRadius: 8, padding: 12, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, alignItems: "center", backgroundColor: "#fff" },
  secondaryButtonText: { color: "#111827", fontWeight: "600" },
  deleteButton: { flex: 1, borderWidth: 1, borderColor: "#fca5a5", borderRadius: 8, padding: 10, alignItems: "center", backgroundColor: "#fef2f2" },
  deleteButtonContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  deleteButtonText: { color: "#b91c1c", fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  sectionsModalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  sectionsModalCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  sectionsModalCloseText: { color: "#6b7280", fontSize: 16 },
  sectionsModalTitle: { fontSize: 30, fontWeight: "700", color: "#111827", textAlign: "center" },
  sectionsModalSubtitle: { fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 2, marginBottom: 12 },
  sectionsFieldLabel: { fontSize: 16, color: "#111827", fontWeight: "600", marginBottom: 6 },
  sectionsInputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionsInput: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#9ca3af",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111827",
  },
  sectionsAddButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionsAddButtonText: { color: "#fff", fontSize: 20, lineHeight: 20 },
  sectionsList: { maxHeight: 280 },
  sectionsListItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionsListLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionsListIcon: { color: "#6b7280", fontSize: 14 },
  sectionsCountText: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  sectionsDeleteIcon: { color: "#dc2626", fontSize: 16, fontWeight: "700" },
  addModalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  addModalClose: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  addModalCloseText: { color: "#6b7280", fontSize: 16 },
  addModalTitle: { fontSize: 30, fontWeight: "700", color: "#111827", textAlign: "center" },
  addModalSubtitle: { fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 2, marginBottom: 14 },
  addFieldLabel: { fontSize: 16, color: "#111827", fontWeight: "600", marginBottom: 6 },
  addInput: {
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: "#111827",
  },
  addSelectLike: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  addSelectInput: { flex: 1, paddingVertical: 10, color: "#111827" },
  addSelectValue: { flex: 1, paddingVertical: 10, color: "#111827" },
  addSelectPlaceholder: { flex: 1, paddingVertical: 10, color: "#6b7280" },
  addChevron: { color: "#9ca3af", fontSize: 16, marginLeft: 8 },
  addRowFields: { flexDirection: "row", gap: 10 },
  addHalfField: { flex: 1 },
  addSubmitButton: {
    backgroundColor: "#f97316",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  addSubmitButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  editModalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  editModalClose: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  editModalCloseText: { color: "#6b7280", fontSize: 16 },
  editModalTitle: { fontSize: 30, fontWeight: "700", color: "#111827", textAlign: "center" },
  editModalSubtitle: { fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 2, marginBottom: 14 },
  editFieldLabel: { fontSize: 16, color: "#111827", fontWeight: "600", marginBottom: 6 },
  editInput: {
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: "#111827",
  },
  editSelectLike: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  editSelectInput: { flex: 1, paddingVertical: 10, color: "#111827" },
  editSelectValue: { flex: 1, paddingVertical: 10, color: "#111827" },
  editSelectPlaceholder: { flex: 1, paddingVertical: 10, color: "#6b7280" },
  editChevron: { color: "#9ca3af", fontSize: 16, marginLeft: 8 },
  dropdownAnchor: {
    position: "relative",
    zIndex: 1,
  },
  dropdownAnchorActive: {
    zIndex: 60,
    elevation: 60,
  },
  dropdownMenu: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginTop: -4,
    marginBottom: 10,
    overflow: "hidden",
  },
  dropdownMenuOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    marginTop: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    overflow: "hidden",
    zIndex: 999,
    elevation: 6,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownOptionText: { color: "#111827", fontSize: 14 },
  editRowFields: { flexDirection: "row", gap: 10 },
  editHalfField: { flex: 1 },
  editSubmitButton: {
    backgroundColor: "#f97316",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  editSubmitButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  modalCloseText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "700",
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
