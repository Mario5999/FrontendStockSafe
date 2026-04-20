import { Platform } from "react-native";

function getConfiguredApiBaseUrl() {
  const rawValue = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!rawValue) {
    return null;
  }

  return rawValue.replace(/\/$/, "").replace(/\/api$/, "");
}

const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const API_PORT = 4000;
const API_PREFIX = "/api";
const PRODUCTION_API_BASE_URL = "https://backendstocksafe.vercel.app";
const CONFIGURED_API_BASE_URL = getConfiguredApiBaseUrl();

export const API_BASE_URL = CONFIGURED_API_BASE_URL
  ? `${CONFIGURED_API_BASE_URL}${API_PREFIX}`
  : __DEV__
    ? `http://${API_HOST}:${API_PORT}${API_PREFIX}`
    : `${PRODUCTION_API_BASE_URL}${API_PREFIX}`;

let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
}

export function clearAuthToken() {
  authToken = null;
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}) {
  return {
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...extraHeaders,
  };
}

type ApiDataResponse<T> = {
  message: string;
  data: T;
};

type ApiListResponse<T> = {
  message: string;
  data: T[];
};

type ApiErrorResponse = {
  error?: string;
  message?: string;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(init.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorPayload = (isJson ? payload : {}) as ApiErrorResponse;
    const message =
      errorPayload.error ??
      errorPayload.message ??
      (typeof payload === "string" && payload ? payload : "Ocurrió un error en la API.");

    throw new Error(message);
  }

  return payload as T;
}

export interface RestaurantRegisterPayload {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  managerName: string;
  managerEmail: string;
}

export interface RestaurantData {
  id: number;
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  managerName: string;
  managerEmail: string;
}

export interface ProductDto {
  id: number;
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  stockMinimo: number;
  stockMaximo?: number;
  stockExcedente?: number;
  stockInicial?: number;
  entradas?: number;
  salidas?: number;
  diferenciaVerificacion?: number;
}

export interface SectionDto {
  id: number;
  nombre: string;
}

export interface DashboardIndicatorsDto {
  totalItems: number;
  stockBajo: number;
  excedentes: number;
  sinStock: number;
  actualizaciones: number;
}

export interface RestaurantUserDto {
  id: number;
  restauranteId: number;
  nombreCompleto: string;
  nombreUsuario: string;
  rol: "manager" | "employee";
}

export async function loginRestaurant(email: string, password: string) {
  return request<{ message: string; token: string; user: { id: number; email: string; restaurantName: string } }>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginAdmin(email: string, password: string) {
  return request<{ message: string; token: string; admin: { id: number; email: string } }>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginSystem(nombreUsuario: string, contrasena: string) {
  return request<{
    message: string;
    token: string;
    usuario: { nombreCompleto: string; nombreUsuario: string; rol: "manager" | "employee" };
  }>("/user/login", {
    method: "POST",
    body: JSON.stringify({ nombreUsuario, contrasena }),
  });
}

export async function registerRestaurant(payload: RestaurantRegisterPayload) {
  return request<ApiDataResponse<RestaurantData> & { token?: string }>("/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRestaurants() {
  const response = await request<ApiListResponse<RestaurantData>>("/register", {
    method: "GET",
  });

  return response.data;
}

export async function deleteRestaurant(id: number) {
  return request<ApiDataResponse<RestaurantData>>(`/register/${id}`, {
    method: "DELETE",
  });
}

export async function registerSystemUser(payload: {
  restauranteId?: number;
  nombreCompleto: string;
  nombreUsuario: string;
  contrasena: string;
  confirmarContrasena: string;
  rol?: "manager" | "employee";
}) {
  return request<
    ApiDataResponse<{
      id: number;
      restauranteId: number;
      nombreCompleto: string;
      nombreUsuario: string;
      rol: "manager" | "employee";
    }>
  >("/user/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRestaurantUsers(restauranteId?: number) {
  const query = typeof restauranteId === "number" ? `?restauranteId=${encodeURIComponent(String(restauranteId))}` : "";

  const response = await request<ApiListResponse<RestaurantUserDto>>(`/user/users${query}`, {
    method: "GET",
  });

  return response.data;
}

export async function deleteRestaurantUser(id: number, restauranteId?: number) {
  const query = typeof restauranteId === "number" ? `?restauranteId=${encodeURIComponent(String(restauranteId))}` : "";

  return request<ApiDataResponse<RestaurantUserDto>>(`/user/users/${encodeURIComponent(String(id))}${query}`, {
    method: "DELETE",
  });
}

export async function requestPasswordReset(email: string) {
  return request<{ message: string }>("/recuperar/solicitar", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function validateResetToken(token: string) {
  return request<{ message: string }>(`/recuperar/validar/${token}`, {
    method: "GET",
  });
}

export async function validateInternalResetByEmail(email: string) {
  return request<{ message: string }>("/recuperar/interno/validar", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, nuevaPassword: string) {
  return request<{ message: string }>("/recuperar/cambiar", {
    method: "POST",
    body: JSON.stringify({ token, nuevaPassword }),
  });
}

export async function resetPasswordInternal(email: string, nuevaPassword: string) {
  return request<{ message: string }>("/recuperar/interno/cambiar", {
    method: "POST",
    body: JSON.stringify({ email, nuevaPassword }),
  });
}

export async function getDashboardIndicators(restauranteId?: number) {
  const query = typeof restauranteId === "number" ? `?restauranteId=${encodeURIComponent(String(restauranteId))}` : "";

  const response = await request<ApiDataResponse<DashboardIndicatorsDto>>(`/dashboard/indicators${query}`, {
    method: "GET",
  });

  return response.data;
}

export async function getSections() {
  const response = await request<ApiListResponse<SectionDto>>("/sections", {
    method: "GET",
  });

  return response.data;
}

export async function createSection(nombre: string) {
  const response = await request<ApiDataResponse<SectionDto>>("/sections", {
    method: "POST",
    body: JSON.stringify({ nombre }),
  });

  return response.data;
}

export async function deleteSection(id: number) {
  return request<ApiDataResponse<SectionDto>>(`/sections/${id}`, {
    method: "DELETE",
  });
}

export async function getProducts(restauranteId?: number) {
  const query = typeof restauranteId === "number" ? `?restauranteId=${encodeURIComponent(String(restauranteId))}` : "";

  const response = await request<ApiListResponse<ProductDto>>(`/products${query}`, {
    method: "GET",
  });

  return response.data;
}

export async function createProduct(payload: {
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  stockMinimo: number;
  stockMaximo: number;
}) {
  const response = await request<ApiDataResponse<ProductDto>>("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function updateProduct(
  id: number,
  payload: {
    nombre?: string;
    categoria?: string;
    cantidad?: number;
    unidad?: string;
    stockMinimo?: number;
    stockMaximo?: number;
  }
) {
  const response = await request<ApiDataResponse<ProductDto>>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function deleteProduct(id: number) {
  return request<ApiDataResponse<ProductDto>>(`/products/${id}`, {
    method: "DELETE",
  });
}

export async function updateProductQuantity(id: number, cantidad: number) {
  const response = await request<ApiDataResponse<ProductDto>>(`/products/${id}/cantidad`, {
    method: "PUT",
    body: JSON.stringify({ cantidad }),
  });

  return response.data;
}

export async function checkInventory(productId: number, cantidadFisica: number) {
  return request<{
    status: "ok" | "error";
    message: string;
    sistema: number;
    fisico: number;
    diferencia: number;
  }>("/inventory/check", {
    method: "POST",
    body: JSON.stringify({ productId, cantidadFisica }),
  });
}

export function getInventoryPdfUrl(restauranteId?: number) {
  const params = new URLSearchParams();
  if (typeof restauranteId === "number") {
    params.set("restauranteId", String(restauranteId));
  }
  if (authToken) {
    params.set("accessToken", authToken);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return `${API_BASE_URL}/reportes/generar${query}`;
}

export function getHistoricalReportPdfUrl(reportId: number, restauranteId: number) {
  const params = new URLSearchParams({ restauranteId: String(restauranteId) });
  if (authToken) {
    params.set("accessToken", authToken);
  }
  const query = `?${params.toString()}`;
  return `${API_BASE_URL}/reportes/ver/${encodeURIComponent(String(reportId))}${query}`;
}

export async function pingInventoryPdf(restauranteId?: number) {
  const response = await fetch(getInventoryPdfUrl(restauranteId), {
    method: "GET",
    headers: getAuthHeaders({ Accept: "application/pdf" }),
  });

  if (!response.ok) {
    throw new Error("No fue posible generar el PDF.");
  }
}

export interface ReportHistoryItem {
  id: number;
  restauranteId: number;
  generatedAt: string;
  totalItems?: number;
}

export async function getReportHistory(restauranteId: number) {
  const response = await request<ApiListResponse<ReportHistoryItem>>(
    `/reportes/historial?restauranteId=${encodeURIComponent(String(restauranteId))}`,
    { method: "GET" }
  );
  return response.data;
}
