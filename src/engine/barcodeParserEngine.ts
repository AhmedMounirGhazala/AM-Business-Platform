/**
 * AM Business Platform - Configurable EAN-13 Barcode Parsing Engine
 * Architecture Baseline: Pilot Readiness 3B
 * 
 * Supports:
 * 1. In-store Variable Measure / Random-Weight barcodes (e.g. 20xxxxxxxxxx, 99xxxxxxxxxx)
 * 2. In-store Variable Price barcodes (e.g. 20xxxxxxxxxx, 99xxxxxxxxxx)
 * 3. Standard Fixed EAN-13 barcodes (e.g. 628xxxxxxxxxx, 622xxxxxxxxxx)
 * 4. Non-EAN standard barcodes (Code 128, Alphanumeric SKUs)
 * 
 * Features:
 * - Configurable prefix (e.g. 20, 99, 21, 28, etc.)
 * - Configurable item-code digits start and length
 * - Configurable weight/price digits start and length
 * - Configurable decimal precision (e.g. 3 for kg, 2 for price)
 * - Strict Modulo-10 checksum calculation & verification
 * - Safe rejection of malformed or invalid barcodes without throwing exceptions
 * - Seamless preservation of normal EAN-13 and standard product resolution
 */

export type BarcodeValueType = 'WEIGHT' | 'PRICE';

export interface BarcodeProfile {
  id: string;
  name: string;
  nameAr?: string;
  prefix: string; // e.g. '20', '99', '21', '22', '28'
  valueType: BarcodeValueType;
  itemCodeStart: number; // 0-based index in 13-digit string (e.g. 2 for after 2-digit prefix)
  itemCodeLength: number; // e.g. 5 (characters 2 to 6 inclusive)
  valueStart: number; // e.g. 7 (characters 7 to 11 inclusive)
  valueLength: number; // e.g. 5
  decimalPrecision: number; // e.g. 3 for weight (01450 => 1.450 kg), 2 for price (04550 => 45.50 SAR)
  unitOfMeasure: string; // e.g. 'KG', 'G', 'SAR', 'EGP'
  active: boolean;
  description?: string;
}

export type BarcodeClassification =
  | 'VARIABLE_WEIGHT'
  | 'VARIABLE_PRICE'
  | 'STANDARD_EAN13'
  | 'NON_EAN'
  | 'INVALID';

export type BarcodeErrorCode =
  | 'EMPTY_INPUT'
  | 'NON_NUMERIC'
  | 'MALFORMED_LENGTH'
  | 'INVALID_CHECKSUM'
  | 'PROFILE_MISMATCH'
  | 'OUT_OF_BOUNDS';

export interface ParsedBarcodeResult {
  rawBarcode: string;
  isValid: boolean;
  barcodeType: BarcodeClassification;
  itemCode: string; // Extracted item PLU/Code or full barcode
  matchedProfile?: BarcodeProfile;
  quantity: number; // Parsed weight in UOM (e.g. 1.450 kg) or 1 for standard
  embeddedPrice?: number; // Parsed embedded total price if VARIABLE_PRICE
  uom: string; // 'KG', 'PCS', 'UNIT', etc.
  checksumValid: boolean;
  expectedCheckDigit?: number;
  actualCheckDigit?: number;
  errorCode?: BarcodeErrorCode;
  errorMessage?: string;
}

// Standard Default Profiles for GS1 Retail In-Store Measure
export const DEFAULT_BARCODE_PROFILES: BarcodeProfile[] = [
  {
    id: 'PROF-20-WEIGHT',
    name: 'Prefix 20 - Variable Weight (3 Decimals / KG)',
    nameAr: 'بادئة 20 - وزن متغير (3 خانات عشرية / كجم)',
    prefix: '20',
    valueType: 'WEIGHT',
    itemCodeStart: 2,
    itemCodeLength: 5,
    valueStart: 7,
    valueLength: 5,
    decimalPrecision: 3,
    unitOfMeasure: 'KG',
    active: true,
    description: 'Standard GS1 In-store random weight (e.g. 20 IIIII WWWWW C)'
  },
  {
    id: 'PROF-99-WEIGHT',
    name: 'Prefix 99 - Variable Weight (3 Decimals / KG)',
    nameAr: 'بادئة 99 - وزن متغير (3 خانات عشرية / كجم)',
    prefix: '99',
    valueType: 'WEIGHT',
    itemCodeStart: 2,
    itemCodeLength: 5,
    valueStart: 7,
    valueLength: 5,
    decimalPrecision: 3,
    unitOfMeasure: 'KG',
    active: true,
    description: 'Internal Retail / Scale random weight (e.g. 99 IIIII WWWWW C)'
  },
  {
    id: 'PROF-20-PRICE',
    name: 'Prefix 20 - Variable Price (2 Decimals)',
    nameAr: 'بادئة 20 - سعر متغير (خانتان عشريتان)',
    prefix: '20',
    valueType: 'PRICE',
    itemCodeStart: 2,
    itemCodeLength: 5,
    valueStart: 7,
    valueLength: 5,
    decimalPrecision: 2,
    unitOfMeasure: 'SAR',
    active: false, // Inactive by default when prefix 20 is set to weight
    description: 'Alternative GS1 In-store price encoded barcode'
  },
  {
    id: 'PROF-99-PRICE',
    name: 'Prefix 99 - Variable Price (2 Decimals)',
    nameAr: 'بادئة 99 - سعر متغير (خانتان عشريتان)',
    prefix: '99',
    valueType: 'PRICE',
    itemCodeStart: 2,
    itemCodeLength: 5,
    valueStart: 7,
    valueLength: 5,
    decimalPrecision: 2,
    unitOfMeasure: 'SAR',
    active: false, // Inactive by default when prefix 99 is set to weight
    description: 'Internal Retail price encoded barcode'
  }
];

export class BarcodeParserEngine {
  private static profiles: BarcodeProfile[] = DEFAULT_BARCODE_PROFILES.map(p => ({ ...p }));
  private static STORAGE_KEY = 'am_erp_pos_barcode_profiles';

  static {
    this.loadPersistedProfiles();
  }

  private static loadPersistedProfiles(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.profiles = parsed.map((p: any) => ({ ...p }));
          }
        }
      } catch (e) {
        console.warn('Could not load barcode profiles from localStorage:', e);
      }
    }
  }

  public static saveProfiles(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.profiles));
      } catch (e) {
        console.warn('Could not persist barcode profiles to localStorage:', e);
      }
    }
  }

  /**
   * Retrieves all configured barcode profiles.
   */
  public static getProfiles(): BarcodeProfile[] {
    return this.profiles.map(p => ({ ...p }));
  }

  /**
   * Registers or updates a barcode profile.
   * If the profile is active, deactivates other profiles with the same prefix to prevent conflicts.
   */
  public static registerProfile(profile: BarcodeProfile): void {
    if (profile.active) {
      for (const p of this.profiles) {
        if (p.prefix === profile.prefix && p.id !== profile.id) {
          p.active = false;
        }
      }
    }

    const idx = this.profiles.findIndex(p => p.id === profile.id);
    if (idx >= 0) {
      this.profiles[idx] = { ...profile };
    } else {
      this.profiles.unshift({ ...profile });
    }
    this.saveProfiles();
  }

  /**
   * Activates or deactivates a barcode profile.
   * When activating, deactivates any other profile with the identical prefix.
   */
  public static setProfileActive(id: string, active: boolean): void {
    const profile = this.profiles.find(p => p.id === id);
    if (profile) {
      profile.active = active;
      if (active) {
        for (const p of this.profiles) {
          if (p.prefix === profile.prefix && p.id !== profile.id) {
            p.active = false;
          }
        }
      }
      this.saveProfiles();
    }
  }

  /**
   * Resets barcode profiles to default system definitions.
   */
  public static resetToDefaults(): void {
    this.profiles = DEFAULT_BARCODE_PROFILES.map(p => ({ ...p }));
    this.saveProfiles();
  }

  /**
   * Calculates the standard EAN-13 Modulo-10 checksum digit for the first 12 digits.
   * Modulo-10 Algorithm:
   * - Positions 0, 2, 4, 6, 8, 10 (even indices): weight 1
   * - Positions 1, 3, 5, 7, 9, 11 (odd indices): weight 3
   * - Check digit = (10 - (sum % 10)) % 10
   */
  public static calculateEan13Checksum(first12Digits: string): number {
    if (!/^\d{12}$/.test(first12Digits)) {
      throw new Error(`Cannot compute EAN-13 checksum: Input must be exactly 12 numeric digits, received '${first12Digits}'`);
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(first12Digits[i], 10);
      const weight = i % 2 === 0 ? 1 : 3;
      sum += digit * weight;
    }

    return (10 - (sum % 10)) % 10;
  }

  /**
   * Validates if a 13-digit string has a mathematically correct Modulo-10 check digit.
   */
  public static validateEan13Checksum(barcode13: string): boolean {
    if (!/^\d{13}$/.test(barcode13)) return false;
    const first12 = barcode13.substring(0, 12);
    const expected = this.calculateEan13Checksum(first12);
    const actual = parseInt(barcode13[12], 10);
    return expected === actual;
  }

  /**
   * Generates a fully valid 13-digit EAN-13 barcode given a 12-digit payload.
   */
  public static generateValidEan13(first12Digits: string): string {
    const checksum = this.calculateEan13Checksum(first12Digits);
    return `${first12Digits}${checksum}`;
  }

  /**
   * Generates a sample random-weight barcode for testing or scale simulation.
   */
  public static generateRandomWeightBarcode(
    prefix: string = '20',
    itemCode: string = '12345',
    weightKg: number = 1.450,
    decimals: number = 3
  ): string {
    const cleanPrefix = prefix.padStart(2, '0').substring(0, 2);
    const cleanItem = itemCode.padStart(5, '0').substring(0, 5);
    const multiplier = Math.pow(10, decimals);
    const rawVal = Math.round(weightKg * multiplier);
    const cleanVal = String(rawVal).padStart(5, '0').substring(0, 5);
    const first12 = `${cleanPrefix}${cleanItem}${cleanVal}`;
    return this.generateValidEan13(first12);
  }

  /**
   * Generates a sample random-price barcode for testing or scale simulation.
   */
  public static generateRandomPriceBarcode(
    prefix: string = '20',
    itemCode: string = '12345',
    price: number = 45.50,
    decimals: number = 2
  ): string {
    const cleanPrefix = prefix.padStart(2, '0').substring(0, 2);
    const cleanItem = itemCode.padStart(5, '0').substring(0, 5);
    const multiplier = Math.pow(10, decimals);
    const rawVal = Math.round(price * multiplier);
    const cleanVal = String(rawVal).padStart(5, '0').substring(0, 5);
    const first12 = `${cleanPrefix}${cleanItem}${cleanVal}`;
    return this.generateValidEan13(first12);
  }

  /**
   * Core Parsing Function.
   * Takes any scanned barcode string, safely normalizes it, and evaluates:
   * 1. Rejects malformed / empty input safely without throwing.
   * 2. If non-numeric or length !== 13: classifies as NON_EAN or INVALID.
   * 3. Validates Modulo-10 checksum. If checksum fails, rejects as INVALID_CHECKSUM.
   * 4. Matches against active BarcodeProfiles (e.g. prefix 20, 99, etc.).
   *    If matched: parses weight or price with configured decimal precision.
   * 5. If 13 digits with valid checksum but no variable profile matches:
   *    Preserves normal standard EAN-13 behavior (quantity: 1, itemCode: raw barcode).
   */
  public static parse(input: string | null | undefined): ParsedBarcodeResult {
    if (!input || typeof input !== 'string') {
      return {
        rawBarcode: input || '',
        isValid: false,
        barcodeType: 'INVALID',
        itemCode: '',
        quantity: 0,
        uom: 'UNIT',
        checksumValid: false,
        errorCode: 'EMPTY_INPUT',
        errorMessage: 'Barcode input is null or empty'
      };
    }

    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return {
        rawBarcode: '',
        isValid: false,
        barcodeType: 'INVALID',
        itemCode: '',
        quantity: 0,
        uom: 'UNIT',
        checksumValid: false,
        errorCode: 'EMPTY_INPUT',
        errorMessage: 'Barcode input is empty'
      };
    }

    // Check for standard Non-EAN barcode (e.g. Alphanumeric SKU, Code128, QR code)
    if (!/^\d+$/.test(trimmed)) {
      return {
        rawBarcode: trimmed,
        isValid: true,
        barcodeType: 'NON_EAN',
        itemCode: trimmed,
        quantity: 1,
        uom: 'UNIT',
        checksumValid: false,
        errorMessage: 'Non-numeric code (treated as standard SKU/code)'
      };
    }

    // If numeric but not 13 digits:
    if (trimmed.length !== 13) {
      return {
        rawBarcode: trimmed,
        isValid: true,
        barcodeType: 'NON_EAN',
        itemCode: trimmed,
        quantity: 1,
        uom: 'UNIT',
        checksumValid: false,
        errorCode: 'MALFORMED_LENGTH',
        errorMessage: `Numeric code has length ${trimmed.length} (not standard 13-digit EAN-13)`
      };
    }

    // Validate EAN-13 Modulo-10 Checksum
    const expectedChecksum = this.calculateEan13Checksum(trimmed.substring(0, 12));
    const actualChecksum = parseInt(trimmed[12], 10);
    const checksumValid = expectedChecksum === actualChecksum;

    if (!checksumValid) {
      return {
        rawBarcode: trimmed,
        isValid: false,
        barcodeType: 'INVALID',
        itemCode: trimmed,
        quantity: 0,
        uom: 'UNIT',
        checksumValid: false,
        expectedCheckDigit: expectedChecksum,
        actualCheckDigit: actualChecksum,
        errorCode: 'INVALID_CHECKSUM',
        errorMessage: `EAN-13 Modulo-10 checksum validation failed: expected ${expectedChecksum}, got ${actualChecksum}`
      };
    }

    // Check if barcode matches any configured variable profile (e.g. prefix 20, 99)
    const matchingProfile = this.profiles.find(p => p.active && trimmed.startsWith(p.prefix));

    if (matchingProfile) {
      try {
        const { itemCodeStart, itemCodeLength, valueStart, valueLength, decimalPrecision, valueType, unitOfMeasure } = matchingProfile;

        // Verify sub-string boundaries
        if (itemCodeStart + itemCodeLength > 12 || valueStart + valueLength > 12) {
          return {
            rawBarcode: trimmed,
            isValid: false,
            barcodeType: 'INVALID',
            itemCode: trimmed,
            quantity: 0,
            uom: unitOfMeasure,
            checksumValid: true,
            errorCode: 'OUT_OF_BOUNDS',
            errorMessage: 'Profile configuration exceeds 12 data digits boundary'
          };
        }

        const extractedItemRaw = trimmed.substring(itemCodeStart, itemCodeStart + itemCodeLength);
        const extractedItemCode = extractedItemRaw.replace(/^0+/, '') || extractedItemRaw; // Strip leading zeros or keep raw
        const extractedValueStr = trimmed.substring(valueStart, valueStart + valueLength);
        const rawNumericValue = parseInt(extractedValueStr, 10);

        const divisor = Math.pow(10, Math.max(0, decimalPrecision));
        const computedValue = Number((rawNumericValue / divisor).toFixed(decimalPrecision));

        if (valueType === 'WEIGHT') {
          return {
            rawBarcode: trimmed,
            isValid: true,
            barcodeType: 'VARIABLE_WEIGHT',
            itemCode: extractedItemCode,
            matchedProfile: matchingProfile,
            quantity: computedValue,
            uom: unitOfMeasure || 'KG',
            checksumValid: true,
            expectedCheckDigit: expectedChecksum,
            actualCheckDigit: actualChecksum
          };
        } else {
          // VARIABLE_PRICE
          return {
            rawBarcode: trimmed,
            isValid: true,
            barcodeType: 'VARIABLE_PRICE',
            itemCode: extractedItemCode,
            matchedProfile: matchingProfile,
            quantity: 1,
            embeddedPrice: computedValue,
            uom: unitOfMeasure || 'SAR',
            checksumValid: true,
            expectedCheckDigit: expectedChecksum,
            actualCheckDigit: actualChecksum
          };
        }
      } catch (err: any) {
        return {
          rawBarcode: trimmed,
          isValid: false,
          barcodeType: 'INVALID',
          itemCode: trimmed,
          quantity: 0,
          uom: 'UNIT',
          checksumValid: true,
          errorCode: 'OUT_OF_BOUNDS',
          errorMessage: `Error extracting profile values: ${err.message}`
        };
      }
    }

    // Standard Normal EAN-13 Behavior:
    // Barcode has valid checksum and 13 digits, but is a fixed-weight/fixed-price standard product
    return {
      rawBarcode: trimmed,
      isValid: true,
      barcodeType: 'STANDARD_EAN13',
      itemCode: trimmed,
      quantity: 1,
      uom: 'UNIT',
      checksumValid: true,
      expectedCheckDigit: expectedChecksum,
      actualCheckDigit: actualChecksum
    };
  }
}
