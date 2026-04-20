import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const LOGO_DIR = `${FileSystem.documentDirectory ?? ""}restaurant-logos`;
const LOGO_INDEX_FILE = `${LOGO_DIR}/index.json`;

type LogoIndex = Record<string, string>;

function normalizeRestaurantId(restauranteId?: number) {
  if (!Number.isInteger(restauranteId) || Number(restauranteId) <= 0) {
    return null;
  }

  return String(restauranteId);
}

function getFileExtension(uri: string) {
  const match = uri.match(/\.(jpg|jpeg|png|webp)$/i);
  return (match?.[0] ?? ".jpg").toLowerCase();
}

async function ensureLogoDirectory() {
  const info = await FileSystem.getInfoAsync(LOGO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(LOGO_DIR, { intermediates: true });
  }
}

async function readLogoIndex(): Promise<LogoIndex> {
  try {
    const file = await FileSystem.readAsStringAsync(LOGO_INDEX_FILE);
    const parsed = JSON.parse(file);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeLogoIndex(index: LogoIndex) {
  await FileSystem.writeAsStringAsync(LOGO_INDEX_FILE, JSON.stringify(index));
}

export async function getRestaurantLogoUri(restauranteId?: number): Promise<string | null> {
  const normalizedId = normalizeRestaurantId(restauranteId);

  if (!normalizedId || Platform.OS === "web" || !FileSystem.documentDirectory) {
    return null;
  }

  await ensureLogoDirectory();
  const index = await readLogoIndex();
  const logoUri = index[normalizedId];

  if (!logoUri) {
    return null;
  }

  const fileInfo = await FileSystem.getInfoAsync(logoUri);
  if (!fileInfo.exists) {
    delete index[normalizedId];
    await writeLogoIndex(index);
    return null;
  }

  return logoUri;
}

export async function saveRestaurantLogoUri(restauranteId: number | undefined, sourceUri: string): Promise<string> {
  const normalizedId = normalizeRestaurantId(restauranteId);

  if (!normalizedId || Platform.OS === "web" || !FileSystem.documentDirectory) {
    return sourceUri;
  }

  await ensureLogoDirectory();
  const index = await readLogoIndex();
  const previousUri = index[normalizedId];
  const extension = getFileExtension(sourceUri);
  const destinationUri = `${LOGO_DIR}/restaurant-${normalizedId}-${Date.now()}${extension}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  index[normalizedId] = destinationUri;
  await writeLogoIndex(index);

  if (previousUri && previousUri !== destinationUri) {
    try {
      await FileSystem.deleteAsync(previousUri, { idempotent: true });
    } catch {
      // Keep old file if it cannot be removed.
    }
  }

  return destinationUri;
}