import bwipjs from 'bwip-js';
import { logger } from './logger';

/**
 * Generate barcode as PNG buffer
 * Supports CODE128 (default), EAN13, UPC, QR Code, etc.
 */
export async function generateBarcode(
  text: string,
  options?: {
    type?: string; // Barcode type (e.g., 'code128', 'ean13', 'qrcode')
    width?: number; // Width in pixels
    height?: number; // Height in pixels
    includeText?: boolean; // Show text below barcode
  }
): Promise<Buffer> {
  try {
    const barcodeType = options?.type || 'code128';
    const width = options?.width || 2;
    const height = options?.height || 50;
    const includeText = options?.includeText !== false;

    const png = await bwipjs.toBuffer({
      bcid: barcodeType, // Barcode type
      text: text, // Text to encode
      scale: width, // Scaling factor
      height: height, // Bar height in millimeters
      includetext: includeText, // Show text
      textxalign: 'center', // Text alignment
    });

    logger.info(`Generated ${barcodeType} barcode for: ${text}`);
    
    return png;
  } catch (error) {
    logger.error(`Failed to generate barcode for ${text}:`, error);
    throw new Error('Failed to generate barcode');
  }
}

/**
 * Generate barcode as base64 data URL
 */
export async function generateBarcodeBase64(
  text: string,
  options?: {
    type?: string;
    width?: number;
    height?: number;
    includeText?: boolean;
  }
): Promise<string> {
  try {
    const buffer = await generateBarcode(text, options);
    const base64 = buffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    logger.error(`Failed to generate base64 barcode for ${text}:`, error);
    throw error;
  }
}

/**
 * Validate if text is suitable for barcode generation
 */
export function validateBarcodeText(text: string, type: string = 'code128'): {
  valid: boolean;
  error?: string;
} {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Text cannot be empty' };
  }

  // Type-specific validation
  switch (type) {
    case 'ean13':
      if (!/^\d{12,13}$/.test(text)) {
        return { valid: false, error: 'EAN13 requires 12-13 digits' };
      }
      break;
    
    case 'upca':
    case 'upcа':
      if (!/^\d{11,12}$/.test(text)) {
        return { valid: false, error: 'UPC-A requires 11-12 digits' };
      }
      break;
    
    case 'code128':
      // CODE128 accepts alphanumeric
      if (text.length > 80) {
        return { valid: false, error: 'CODE128 text too long (max 80 characters)' };
      }
      break;
  }

  return { valid: true };
}

