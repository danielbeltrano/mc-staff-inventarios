import QRCode from 'qrcode';
import { uploadImageToBucket } from './uploadService';

// Genera un QR para un ítem y lo sube al bucket 'QR'.
// El contenido codificado será la URL pública al detalle del ítem
// junto con id y código para referencia rápida.
export async function generateQrForItem(item) {
  if (!item) throw new Error('No item provided');

  // Contenido: una URL al detalle del ítem y metadatos básicos
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const payload = JSON.stringify({
    codigo: item.codigo,
    nombre: item.nombre,
    stockReal: item.stockReal,
    url: `${origin}/items/${item.idItem}`,
  });

  // Generar Data URL (PNG)
  const dataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 400 });

  // Convert dataURL to Blob
  const res = await fetch(dataUrl);
  const blob = await res.blob();

  // Create a File so uploadService naming still works
  const file = new File([blob], `qr_item_${item.idItem}.png`, { type: 'image/png' });

  // Subir al bucket 'QR'
  const publicUrl = await uploadImageToBucket(file, 'QR');
  return publicUrl;
}

export default { generateQrForItem };