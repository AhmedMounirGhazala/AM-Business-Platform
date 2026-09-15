/**
 * AM Business Platform - ZATCA TLV (Tag-Length-Value) Binary QR Encoder
 * Compliant with Saudi Zakat, Tax and Customs Authority (ZATCA) FATOORA Standards.
 * Encodes binary Tag (1 byte) + Length (1 or multi-byte ASN.1 BER) + Value.
 */

export interface ZatcaTlvField {
  tag: number;
  value: string | Buffer;
}

export class ZatcaTlvEncoder {
  /**
   * Encodes an array of fields into a binary TLV buffer.
   * Handles multi-byte length prefixes when value exceeds 127 octets.
   */
  public static encodeToBuffer(fields: ZatcaTlvField[]): Buffer {
    const buffers: Buffer[] = [];

    for (const field of fields) {
      const tagBuf = Buffer.from([field.tag]);
      const valBuf = Buffer.isBuffer(field.value)
        ? field.value
        : Buffer.from(String(field.value), 'utf8');

      const len = valBuf.length;
      let lenBuf: Buffer;

      if (len <= 127) {
        lenBuf = Buffer.from([len]);
      } else if (len <= 255) {
        lenBuf = Buffer.from([0x81, len]);
      } else {
        lenBuf = Buffer.from([0x82, (len >> 8) & 0xff, len & 0xff]);
      }

      buffers.push(tagBuf, lenBuf, valBuf);
    }

    return Buffer.concat(buffers);
  }

  /**
   * Encodes fields into standard Base64 string for QR code generation.
   */
  public static encodeToBase64(fields: ZatcaTlvField[]): string {
    const buf = this.encodeToBuffer(fields);
    return buf.toString('base64');
  }

  /**
   * Decodes a Base64 TLV payload back into structured fields.
   */
  public static decodeFromBase64(base64Str: string): ZatcaTlvField[] {
    const buf = Buffer.from(base64Str, 'base64');
    const fields: ZatcaTlvField[] = [];
    let offset = 0;

    while (offset < buf.length) {
      if (offset + 2 > buf.length) break;
      const tag = buf[offset++];
      let len = buf[offset++];

      if (len > 127) {
        const numBytes = len & 0x7f;
        if (numBytes === 1) {
          len = buf[offset++];
        } else if (numBytes === 2) {
          len = (buf[offset++] << 8) | buf[offset++];
        }
      }

      if (offset + len > buf.length) {
        // Truncated or corrupted buffer
        break;
      }

      const val = buf.subarray(offset, offset + len);
      offset += len;
      fields.push({ tag, value: val.toString('utf8') });
    }

    return fields;
  }

  /**
   * Generates standard ZATCA Phase 1 & Phase 2 QR Payload
   */
  public static buildZatcaQrPayload(params: {
    sellerName: string;
    vatRegistrationNumber: string;
    invoiceTimestamp: string;
    invoiceTotalWithVat: number;
    vatTotal: number;
    invoiceHashSha256?: string;
    digitalSignature?: string;
    publicKeyOrCert?: string;
    authorityStamp?: string;
  }): string {
    const fields: ZatcaTlvField[] = [
      { tag: 1, value: params.sellerName },
      { tag: 2, value: params.vatRegistrationNumber },
      { tag: 3, value: params.invoiceTimestamp },
      { tag: 4, value: params.invoiceTotalWithVat.toFixed(2) },
      { tag: 5, value: params.vatTotal.toFixed(2) }
    ];

    if (params.invoiceHashSha256) {
      fields.push({ tag: 6, value: params.invoiceHashSha256 });
    }
    if (params.digitalSignature) {
      fields.push({ tag: 7, value: params.digitalSignature });
    }
    if (params.publicKeyOrCert) {
      fields.push({ tag: 8, value: params.publicKeyOrCert });
    }
    if (params.authorityStamp) {
      fields.push({ tag: 9, value: params.authorityStamp });
    }

    return this.encodeToBase64(fields);
  }

  /**
   * Universal TLV encode helper supporting object dictionary or fields
   */
  public static encode(params: any): string {
    if (Array.isArray(params)) {
      return this.encodeToBase64(params);
    }
    const fields: ZatcaTlvField[] = [];
    if (params.sellerName !== undefined) fields.push({ tag: 1, value: String(params.sellerName) });
    if (params.vatRegistrationNumber !== undefined) fields.push({ tag: 2, value: String(params.vatRegistrationNumber) });
    if (params.invoiceTimestamp !== undefined) fields.push({ tag: 3, value: String(params.invoiceTimestamp) });
    if (params.invoiceTotal !== undefined || params.invoiceTotalWithVat !== undefined) {
      const val = params.invoiceTotal !== undefined ? params.invoiceTotal : params.invoiceTotalWithVat;
      fields.push({ tag: 4, value: typeof val === 'number' ? val.toFixed(2) : String(val) });
    }
    if (params.vatTotal !== undefined) {
      const val = params.vatTotal;
      fields.push({ tag: 5, value: typeof val === 'number' ? val.toFixed(2) : String(val) });
    }
    if (params.invoiceHashSha256) fields.push({ tag: 6, value: params.invoiceHashSha256 });
    if (params.digitalSignature) fields.push({ tag: 7, value: params.digitalSignature });
    if (params.publicKeyOrCert) fields.push({ tag: 8, value: params.publicKeyOrCert });
    if (params.authorityStamp) fields.push({ tag: 9, value: params.authorityStamp });

    return this.encodeToBase64(fields);
  }

  /**
   * Universal TLV decode helper returning tags dictionary and fields
   */
  public static decode(base64Str: string): { tags: Record<number, { tag: number; value: string }>; fields: ZatcaTlvField[] } {
    const fields = this.decodeFromBase64(base64Str);
    const tags: Record<number, { tag: number; value: string }> = {};
    for (const f of fields) {
      tags[f.tag] = { tag: f.tag, value: String(f.value) };
    }
    return { tags, fields };
  }
}
