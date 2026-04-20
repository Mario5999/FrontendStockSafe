import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function TermsAndConditions() {
  const navigation = useNavigation();
  const [accepted, setAccepted] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Terminos y Condiciones</Text>
          <Text style={styles.headerSubtitle}>Ultima actualizacion: 10 de marzo, 2026</Text>
        </View>
      </View>

      <View style={styles.content}>
        <ScrollView style={styles.termsBox} showsVerticalScrollIndicator={false}>
          <View style={styles.termsTitleRow}>
            <Ionicons name="document-text-outline" size={20} color="#ea580c" />
            <Text style={styles.termsTitle}>TERMINOS Y CONDICIONES DE USO</Text>
          </View>

          <Text style={styles.paragraph}>
            StockSafe – Aplicación de Gestión de Inventarios para Restaurantes
            Ubicación legal de referencia: Tuxtla Gutiérrez, Chiapas, México
            {'\n'}Aplicación de prueba con fines educativos

          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. ACEPTACION DE LOS TERMINOS</Text>
            <Text style={styles.paragraph}>
            Al acceder y utilizar esta aplicación de gestión de inventario para restaurantes, aceptas estar legalmente vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar la aplicación.
            {'\n'}La aplicación StockSafe es un proyecto escolar, desarrollado únicamente con fines educativos y de demostración técnica. No está destinada a uso comercial real ni a la administración formal de inventarios en negocios operativos.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. USO DE LA APLICACION</Text>
            <Text style={styles.paragraph}>La aplicación está diseñada exclusivamente para fines académicos y permite:</Text>
            <BulletList
              items={[
                "Gestionar inventarios de productos en restaurantes",
                "Registrar y controlar stock de productos",
                "Generar reportes de movimientos de inventario",
                "Gestionar usuarios con roles diferenciados (gerente y empleado)",
              ]}
            />
            <Text style={styles.paragraph}>El usuario se compromete a utilizar la aplicación únicamente para actividades de prueba, simulación o aprendizaje.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. REGISTRO Y CUENTA DE USUARIO</Text>
            <Text style={styles.paragraph}>Al registrar tu restaurante, te comprometes a:</Text>
            <BulletList
              items={[
                "Proporcionar informacion veraz y actualizada (aunque sea de prueba)",
                "Mantener la seguridad de tu contrasena",
                "Notificar inmediatamente cualquier uso no autorizado de tu cuenta",
                "Ser responsable de todas las actividades realizadas bajo tu cuenta",
              ]}
            />
            <Text style={styles.paragraph}>Las credenciales son personales e intransferibles</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. ROLES Y PERMISOS</Text>
            <Text style={styles.roleLabel}>GERENTE:</Text>
            <BulletList
              items={[
                "Agregar, editar y eliminar productos",
                "Gestionar categorias/secciones",
              ]}
            />

            <Text style={styles.roleLabel}>EMPLEADO:</Text>
            <BulletList
              items={[
                "Gestionar entradas y salidas de productos existentes",
                "Verificar inventario fisico vs. sistema",
                "Acceso a reportes de inventario",
                "No puede agregar o eliminar productos",
                "Acceso completo a reportes",
              ]}
            />
          <Text style={styles.paragraph}>Estos roles existen únicamente con fines educativos y de demostración</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. PRIVACIDAD Y DATOS</Text>
            <Text style={styles.paragraph}>Nos comprometemos a proteger la información registrada en la aplicación. Bajo este compromiso:</Text>
            <BulletList
              items={[
                "Los datos de inventario son privados y se utilizan únicamente dentro del entorno de prueba",
                "No compartimos tu informacion con terceros sin tu consentimiento",
                "Implementamos medidas razonables de seguridad para proteger los datos",
              ]}
            />

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                IMPORTANTE: La aplicación no está diseñada para recopilar información personal sensible (PII), datos financieros o información protegida por normativas estrictas. 
                Su uso debe limitarse a datos de inventario y usuarios de prueba.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. LIMITACION DE RESPONSABILIDAD</Text>
            <Text style={styles.paragraph}>
              La aplicacion se proporciona "tal cual" sin garantias de ningun tipo. No somos
              responsables de:
            </Text>
            <BulletList
              items={[
                "Perdidas o danos derivados del uso de la aplicacion",
                "Errores u omisiones en los datos ingresados por los usuarios",
                "Interrupciones del servicio o fallos tecnicos",
                "Decisiones tomadas basandose en la informacion de la aplicacion",
                "- Uso de la aplicación en entornos comerciales reales",
              ]}
            />
            <Text style={styles.paragraph}>Dado que es un proyecto escolar, pueden existir fallas, errores o interrupciones inesperadas.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. MODIFICACIONES DEL SERVICIO</Text>
            <Text style={styles.paragraph}>Nos reservamos el derecho de:</Text>
            <BulletList
              items={[
                "Modificar o descontinuar el servicio en cualquier momento",
                "Actualizar estos terminos y condiciones",
                "Agregar o eliminar funcionalidades como parte del desarrollo académico",
              ]}
            />
            <Text style={styles.paragraph}>
              Los cambios importantes se notificarán dentro de la aplicación o 
              mediante los medios de contacto registrados.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. TERMINACION DE CUENTA</Text>
            <Text style={styles.paragraph}>Podemos suspender o eliminar una cuenta:</Text>
            <BulletList
              items={[
                "Violas estos terminos y condiciones",
                "Haces un uso indebido de la aplicacion",
                "Proporcionas informacion falsa o engañosa",
              ]}
            />
            <Text style={styles.paragraph}>
              El usuario puede solicitar la eliminación de su cuenta 
              contactando al equipo desarrollador.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. LEGISLACIÓN APLICABLE (MÉXICO, CHIAPAS)</Text>
            <Text style={styles.paragraph}>
              Aunque la aplicación es un proyecto escolar, 
              se apega a las leyes mexicanas relacionadas con el manejo de datos y 
              el uso de plataformas digitales, incluyendo:
            </Text>
            <BulletList
              items={[
              "Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)",
              "Reglamento de la LFPDPPP",
              "Código de Comercio de México (uso de mensajes de datos y registros electrónicos)",
              "Código Civil Federal y Código Civil del Estado de Chiapas (responsabilidad civil)",
              "Ley de Firma Electrónica Avanzada (si se implementan firmas digitales)",
              "Reglamentos municipales aplicables en Tuxtla Gutiérrez, Chiapas",

              ]}
            />
            <Text style={styles.paragraph}>Estas leyes se aplican únicamente en el contexto educativo del proyecto.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. CONTACTO</Text>
            <Text style={styles.paragraph}>
              Si tienes preguntas sobre estos terminos y condiciones, puedes contactarnos:
            </Text>
            <View style={styles.contactBox}>
              <Text style={styles.contactText}> 📧 Email: 243716@ids.upchiapas.edu.mx</Text>
              <Text style={styles.contactText}> ​📞 ​Telefono: +52 960 115 2377</Text>
            </View>
          </View>

          <Text style={styles.footnote}>
            Estos terminos son efectivos a partir del 10 de marzo de 2026. Al continuar usando la
            aplicacion tras cualquier modificacion, aceptas automaticamente los terminos revisados.{'\n'}
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    marginRight: 10,
  },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  headerSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  content: { flex: 1, padding: 16 },
  termsBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  termsTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  termsTitle: { marginLeft: 8, fontSize: 14, fontWeight: "700", color: "#111827" },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#111827", marginBottom: 4 },
  paragraph: { fontSize: 13, lineHeight: 20, color: "#4b5563" },
  bulletList: { marginTop: 4, marginBottom: 8 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  bulletDot: { width: 14, fontSize: 15, lineHeight: 20, color: "#4b5563" },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 20, color: "#4b5563" },
  roleLabel: { fontSize: 13, fontWeight: "700", color: "#111827", marginTop: 4 },
  warningBox: {
    backgroundColor: "#fffbeb",
    borderColor: "#fcd34d",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
  warningText: { fontSize: 12, lineHeight: 18, color: "#92400e", fontWeight: "600" },
  contactBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
  contactText: { fontSize: 13, lineHeight: 20, color: "#374151" },
  footnote: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 12,
    fontStyle: "italic",
    color: "#6b7280",
    marginBottom: 8,
  },
  checkboxRow: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#9ca3af",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  checkboxLabel: { flex: 1, color: "#374151", fontSize: 13 },
  actionsRow: { flexDirection: "row", gap: 10 },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelButtonText: { color: "#374151", fontWeight: "600" },
  continueButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "#f97316",
  },
  continueButtonDisabled: {
    backgroundColor: "#fdba74",
  },
  continueButtonText: { color: "#fff", fontWeight: "700" },
});