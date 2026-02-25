/**
 * Serviço de imagens de pratos
 *
 * Só o picker de imagem. Retorna base64 para enviar ao backend via JSON.
 */

import * as ImagePicker from 'expo-image-picker';

/**
 * Abre o picker de imagem (galeria ou câmera).
 * Retorna a imagem em base64 (com prefixo data:image/...), ou null se cancelou.
 */
export async function pickDishImage(useCamera = false): Promise<string | null> {
  const options: ImagePicker.ImagePickerOptions = {
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  };

  let result: ImagePicker.ImagePickerResult;

  if (useCamera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync({
      ...options,
      mediaTypes: ['images'],
    });
  }

  if (result.canceled || !result.assets[0].base64) return null;

  const asset = result.assets[0];
  const mime = asset.mimeType ?? 'image/jpeg';
  return `data:${mime};base64,${asset.base64}`;
}
