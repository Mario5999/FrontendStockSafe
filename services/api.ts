import { Platform } from "react-native";

const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const API_PORT = 4000;
const API_PREFIX = "/api";

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}${API_PREFIX}`;

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
}

export interface SectionDto {
  id: number;
  nombre: string;
}

export async function loginRestaurant(email: string, password: string) {
  return request<{ message: string; user: { email: string } }>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginSystem(nombreUsuario: string, contrasena: string) {
  return request<{ message: string; usuario: { nombreUsuario: string } }>("/user/login", {
    method: "POST",
    body: JSON.stringify({ nombreUsuario, contrasena }),
  });
}

export async function registerRestaurant(payload: RestaurantRegisterPayload) {
  return request<ApiDataResponse<RestaurantData>>("/register", {
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

export async function registerSystemUser(payload: {
  nombreCompleto: string;
  nombreUsuario: string;
  contrasena: string;
  confirmarContrasena: string;
}) {
  return request<ApiDataResponse<{ nombreCompleto: string; nombreUsuario: string }>>("/user/register", {
    method: "POST",
    body: JSON.stringify(payload),
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

export async function resetPassword(token: string, nuevaPassword: string) {
  return request<{ message: string }>("/recuperar/cambiar", {
    method: "POST",
    body: JSON.stringify({ token, nuevaPassword }),
  });
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

export async function getProducts() {
  const response = await request<ApiListResponse<ProductDto>>("/products", {
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

export function getInventoryPdfUrl() {
  return `${API_BASE_URL}/reportes/generar`;
}

export async function pingInventoryPdf() {
  const response = await fetch(getInventoryPdfUrl(), { method: "GET" });

  if (!response.ok) {
    throw new Error("No fue posible generar el PDF.");
  }
}
