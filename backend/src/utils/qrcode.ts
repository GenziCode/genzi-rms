import QRCode from 'qrcode';
import { logger } from './logger';

/**
 * Generate QR code as data URL (base64)
 */
export async function generateQRCode(
  text: string,
  options?: {
    width?: number; // Width in pixels
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // Error correction level
    margin?: number; // Quiet zone in modules
    color?: {
      dark?: string; // Dark module color
      light?: string; // Light module color
    };
  }
): Promise<string> {
  try {
    const qrOptions = {
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
      type: 'image/png' as const,
      quality: 1,
      margin: options?.margin || 1,
      width: options?.width || 200,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF',
      },
    };

    const dataUrl = await QRCode.toDataURL(text, qrOptions);
    
    logger.info(`Generated QR code for: ${text.substring(0, 50)}...`);
    
    return dataUrl;
  } catch (error) {
    logger.error('Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as buffer
 */
export async function generateQRCodeBuffer(
  text: string,
  options?: {
    width?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
  }
): Promise<Buffer> {
  try {
    const qrOptions = {
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
      margin: options?.margin || 1,
      width: options?.width || 200,
    };

    const buffer = await QRCode.toBuffer(text, qrOptions);
    
    logger.info(`Generated QR code buffer for: ${text.substring(0, 50)}...`);
    
    return buffer;
  } catch (error) {
    logger.error('Failed to generate QR code buffer:', error);
    throw new Error('Failed to generate QR code buffer');
  }
}

/**
 * Generate QR code for invoice
 * Contains invoice URL and verification data
 */
export async function generateInvoiceQRCode(
  invoiceNumber: string,
  tenantSubdomain: string,
  options?: {
    width?: number;
    includeFullUrl?: boolean;
  }
): Promise<string> {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const invoiceUrl = `${baseUrl}/invoices/${invoiceNumber}`;
    
    // QR code data structure
    const qrData = {
      type: 'invoice',
      number: invoiceNumber,
      tenant: tenantSubdomain,
      url: invoiceUrl,
      timestamp: new Date().toISOString(),
    };

    // Use full URL or JSON data
    const qrText = options?.includeFullUrl 
      ? invoiceUrl 
      : JSON.stringify(qrData);

    return await generateQRCode(qrText, {
      width: options?.width || 150,
      errorCorrectionLevel: 'H', // High error correction for invoices
    });
  } catch (error) {
    logger.error(`Failed to generate invoice QR code for ${invoiceNumber}:`, error);
    throw error;
  }
}

/**
 * Validate QR code text
 */
export function validateQRCodeText(text: string): {
  valid: boolean;
  error?: string;
} {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Text cannot be empty' };
  }

  // QR code can handle up to ~4296 characters (depends on error correction level)
  if (text.length > 4000) {
    return { valid: false, error: 'Text too long for QR code (max ~4000 characters)' };
  }

  return { valid: true };
}

