/**
 * AM Business Platform - Egyptian Tax Authority (ETA) Official Compliance Adapter
 * Covers ETA e-Invoicing (v1.0 / v0.9) and ETA eReceipt / POS (v1.2 / v1.0).
 * Compliance Standard: Egyptian Unified Tax Procedures Law No. 206 of 2020.
 */

import crypto from 'node:crypto';
import {
  CanonicalComplianceDocument,
  ComplianceEnvironment,
  ComplianceTaxpayerProfile,
  ComplianceSubmissionRecord,
  ComplianceSubmissionStatus
} from './types';

export interface EtaTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface EtaSubmissionResponse {
  submissionId: string;
  acceptedDocuments: { uuid: string; internalId: string }[];
  rejectedDocuments: { internalId: string; error: { code: string; message: string; details?: any[] } }[];
}

export class EgyptianTaxAuthorityAdapter {
  private static cachedToken: { token: string; expiresAt: number } | null = null;

  public static getEndpoints(env: ComplianceEnvironment) {
    if (env === 'PRODUCTION') {
      return {
        tokenUrl: 'https://id.eta.gov.eg/connect/token',
        apiBaseUrl: 'https://api.invoicing.eta.gov.eg',
        eReceiptBaseUrl: 'https://api.invoicing.eta.gov.eg/api/v1/receiptsubmissions'
      };
    }
    // Sandbox / Preproduction (and local test mock defaults)
    return {
      tokenUrl: 'https://id.preprod.eta.gov.eg/connect/token',
      apiBaseUrl: 'https://api.preprod.invoicing.eta.gov.eg',
      eReceiptBaseUrl: 'https://api.preprod.invoicing.eta.gov.eg/api/v1/receiptsubmissions'
    };
  }

  /**
   * Validates canonical document against ETA statutory rules.
   */
  public static validateDocument(doc: CanonicalComplianceDocument): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Tax Registration Number (must be exactly 9 digits)
    const cleanIssuerTax = doc.issuer.taxNumber.replace(/[-\s]/g, '');
    if (!/^\d{9}$/.test(cleanIssuerTax)) {
      errors.push(`Egyptian Tax Registration ID (${doc.issuer.taxNumber}) must consist of exactly 9 digits.`);
    }

    // 2. Receiver validation
    if (doc.receiver) {
      if (doc.receiver.type === 'B') {
        const cleanRecTax = (doc.receiver.taxNumber || '').replace(/[-\s]/g, '');
        if (!/^\d{9}$/.test(cleanRecTax)) {
          errors.push('B2B Receiver Tax ID must consist of exactly 9 digits in Egyptian ETA format.');
        }
      } else if (doc.receiver.type === 'P') {
        // ETA Rule: Invoices to natural persons >= 150,000 EGP require National ID (14 digits) or Passport
        if (doc.grandTotalGross >= 150000 && !doc.receiver.nationalIdOrPassport) {
          errors.push('ETA statutory requirement: B2C transactions exceeding 150,000 EGP require valid 14-digit National ID or Passport number.');
        }
      }
    }

    // 3. Line Items Validation
    if (!doc.lines || doc.lines.length === 0) {
      errors.push('Document must contain at least one valid invoice line item.');
    } else {
      doc.lines.forEach((line, idx) => {
        if (!line.commodityCode || line.commodityCode.trim().length < 3) {
          errors.push(`Line ${idx + 1}: GS1 or EGS item commodity code is required by the Egyptian Tax Authority.`);
        }
        if (line.commodityType === 'EGS' && !line.commodityCode.startsWith('EG-')) {
          warnings.push(`Line ${idx + 1}: EGS item code should normally follow format EG-<TaxID>-<InternalCode>.`);
        }
        if (line.quantity <= 0) {
          errors.push(`Line ${idx + 1}: Quantity must be greater than zero.`);
        }
      });
    }

    // 4. Activity Code
    if (!doc.issuer.activityCode) {
      warnings.push('Issuer taxpayer activity code (كود النشاط) is recommended for ETA submission.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates raw ETA JSON payload against Egyptian statutory standards
   */
  public static validatePayload(payload: any): { valid: boolean; isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const issuerTax = payload.issuer?.id || payload.issuer?.taxNumber;
    if (!issuerTax || !/^\d{9}$/.test(issuerTax.replace(/[-\s]/g, ''))) {
      errors.push('Issuer Tax Registration ID must consist of exactly 9 digits.');
    }
    if (!payload.documentType) {
      errors.push('Document type is required (e.g. "I", "C", "D").');
    }
    if (!payload.invoiceLines || payload.invoiceLines.length === 0) {
      errors.push('Document must contain at least one valid invoice line.');
    }
    if (!payload.dateTimeIssued) {
      errors.push('Document issue date is required.');
    }

    const isValid = errors.length === 0;
    return {
      valid: isValid,
      isValid,
      errors,
      warnings
    };
  }

  /**
   * Converts canonical document into ETA e-Invoicing JSON Schema v1.0 payload.
   */
  public static buildEInvoicePayload(doc: CanonicalComplianceDocument): Record<string, any> {
    const cleanIssuerTax = doc.issuer.taxNumber.replace(/[-\s]/g, '');
    const cleanReceiverTax = doc.receiver?.taxNumber ? doc.receiver.taxNumber.replace(/[-\s]/g, '') : '';

    let docType = 'I';
    if (doc.documentType === 'CREDIT_NOTE') docType = 'C';
    if (doc.documentType === 'DEBIT_NOTE') docType = 'D';

    const invoiceLines = doc.lines.map((l) => {
      const lineSales = Math.round(l.quantity * l.unitPrice * 100) / 100;
      const lineDiscount = Math.round(l.discountAmount * 100) / 100;
      const lineNet = Math.round(l.netAmount * 100) / 100;
      const lineVat = Math.round(l.taxAmount * 100) / 100;
      const lineWht = Math.round((l.withholdingTaxAmount || 0) * 100) / 100;

      const taxableItems: any[] = [
        {
          taxType: 'T1', // General VAT
          amount: lineVat,
          subType: 'V009',
          rate: Math.round(l.taxRate * 10000) / 100
        }
      ];

      if (lineWht > 0 && l.withholdingTaxRate) {
        taxableItems.push({
          taxType: 'T4', // Withholding Tax
          amount: lineWht,
          subType: 'W001',
          rate: Math.round(l.withholdingTaxRate * 10000) / 100
        });
      }

      return {
        description: l.description,
        itemType: l.commodityType === 'GS1' ? 'GS1' : 'EGS',
        itemCode: l.commodityCode,
        unitType: l.unitOfMeasure || 'EA',
        quantity: l.quantity,
        unitValue: {
          currencySold: doc.currency || 'EGP',
          amountEGP: l.unitPrice
        },
        salesTotal: lineSales,
        total: lineSales - lineDiscount,
        valueDifference: 0,
        totalTaxableFees: 0,
        netTotal: lineNet,
        itemsDiscount: lineDiscount,
        taxableItems
      };
    });

    const taxTotals: any[] = [
      { taxType: 'T1', amount: Math.round(doc.totalTax * 100) / 100 }
    ];
    if (doc.totalWithholdingTax > 0) {
      taxTotals.push({ taxType: 'T4', amount: Math.round(doc.totalWithholdingTax * 100) / 100 });
    }

    const payload: Record<string, any> = {
      issuer: {
        type: 'B',
        id: cleanIssuerTax,
        name: doc.issuer.name,
        address: {
          country: doc.issuer.address.country || 'EG',
          governate: doc.issuer.address.governate || 'Cairo',
          regionCity: doc.issuer.address.city || 'Nasr City',
          street: doc.issuer.address.street || 'Street 1',
          buildingNumber: doc.issuer.address.buildingNumber || '1'
        }
      },
      receiver: {
        type: doc.receiver?.type || 'B',
        id: doc.receiver?.type === 'P'
          ? (doc.receiver?.nationalIdOrPassport || cleanReceiverTax || 'N/A')
          : (cleanReceiverTax || 'N/A'),
        name: doc.receiver?.name || 'Retail Consumer',
        address: {
          country: doc.receiver?.address?.country || 'EG',
          governate: doc.receiver?.address?.governate || 'Cairo',
          regionCity: doc.receiver?.address?.city || 'Cairo',
          street: doc.receiver?.address?.street || 'Street',
          buildingNumber: doc.receiver?.address?.buildingNumber || '1'
        }
      },
      documentType: docType,
      documentTypeVersion: doc.documentVersion || '1.0',
      dateTimeIssued: doc.issueDate || new Date().toISOString(),
      taxpayerActivityCode: doc.issuer.activityCode || '4690',
      internalID: doc.sourceDocumentNumber,
      invoiceLines,
      totalDiscountAmount: Math.round(doc.totalDiscount * 100) / 100,
      totalSalesAmount: Math.round((doc.subtotalNet + doc.totalDiscount) * 100) / 100,
      netAmount: Math.round(doc.subtotalNet * 100) / 100,
      taxTotals,
      totalAmount: Math.round(doc.grandTotalGross * 100) / 100,
      extraDiscountAmount: 0,
      totalItemsDiscountAmount: Math.round(doc.totalDiscount * 100) / 100
    };

    if (doc.originalDocumentReference) {
      payload.references = [doc.originalDocumentReference.documentUuid];
    }

    return payload;
  }

  /**
   * Converts canonical document into ETA eReceipt / POS Schema v1.2 payload.
   */
  public static buildEReceiptPayload(doc: CanonicalComplianceDocument): Record<string, any> {
    const cleanIssuerTax = doc.issuer.taxNumber.replace(/[-\s]/g, '');

    const receiptType = doc.documentType === 'RETURN_RECEIPT' ? 'R' : 'S';

    const itemData = doc.lines.map((l) => {
      const net = Math.round(l.netAmount * 100) / 100;
      const vat = Math.round(l.taxAmount * 100) / 100;
      return {
        internalCode: l.itemSku,
        description: l.description,
        itemType: l.commodityType === 'GS1' ? 'GS1' : 'EGS',
        itemCode: l.commodityCode,
        unitType: l.unitOfMeasure || 'EA',
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        netSale: net,
        total: Math.round((net + vat) * 100) / 100,
        taxableItems: [
          {
            taxType: 'T1',
            amount: vat,
            subType: 'V009',
            rate: Math.round(l.taxRate * 100)
          }
        ]
      };
    });

    return {
      header: {
        dateTimeIssued: doc.issueDate || new Date().toISOString(),
        receiptNumber: doc.sourceDocumentNumber,
        uuid: doc.documentUuid,
        previousUUID: doc.previousDocumentHash || '',
        referenceOldUUID: doc.originalDocumentReference?.documentUuid || '',
        posSerial: doc.metadata?.posSerial || 'POS-DEFAULT-001',
        posOsVersion: 'AM-Linux-2.8'
      },
      documentType: {
        receiptType,
        typeVersion: doc.documentVersion || '1.2'
      },
      seller: {
        rin: cleanIssuerTax,
        companyTradeName: doc.issuer.name,
        branchCode: doc.issuer.branchCode || '0',
        deviceSerialNumber: doc.metadata?.posSerial || 'POS-DEFAULT-001',
        activityCode: doc.issuer.activityCode || '4711'
      },
      buyer: {
        type: doc.receiver?.type || 'P',
        id: doc.receiver?.nationalIdOrPassport || doc.receiver?.taxNumber || '',
        name: doc.receiver?.name || 'Walk-in Customer'
      },
      itemData,
      totalSales: Math.round((doc.subtotalNet + doc.totalDiscount) * 100) / 100,
      totalCommercialDiscount: Math.round(doc.totalDiscount * 100) / 100,
      netAmount: Math.round(doc.subtotalNet * 100) / 100,
      taxTotals: [
        {
          taxType: 'T1',
          amount: Math.round(doc.totalTax * 100) / 100
        }
      ],
      totalAmount: Math.round(doc.grandTotalGross * 100) / 100
    };
  }

  /**
   * Obtains an OAuth 2.0 Client Credentials token from ETA identity service.
   * Caches token in memory until expiration.
   */
  public static async obtainAccessToken(
    profile: ComplianceTaxpayerProfile
  ): Promise<{ token: string; expiresAt: number }> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 60000) {
      return this.cachedToken;
    }

    if (!profile.etaClientId || !profile.etaClientSecret) {
      throw new Error('CONFIGURATION_ERROR: ETA Client ID and Client Secret are required for official authority authentication.');
    }

    const endpoints = this.getEndpoints(profile.environment);
    const tokenUrl = profile.etaTokenUrl || endpoints.tokenUrl;

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', profile.etaClientId);
    params.append('client_secret', profile.etaClientSecret);

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`ETA Authentication Failed (HTTP ${res.status}): ${errText}`);
    }

    const data = (await res.json()) as EtaTokenResponse;
    const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    this.cachedToken = { token: data.access_token, expiresAt };
    return this.cachedToken;
  }

  /**
   * Submits formatted document to Egyptian Tax Authority e-Invoicing API.
   */
  public static async submitDocument(
    doc: CanonicalComplianceDocument,
    profile: ComplianceTaxpayerProfile
  ): Promise<{
    status: ComplianceSubmissionStatus;
    submissionId?: string;
    authorityStatus?: string;
    authorityResponse: any;
    errors?: string[];
    warnings?: string[];
  }> {
    // 1. Validation check
    const val = this.validateDocument(doc);
    if (!val.isValid) {
      return {
        status: 'VALIDATION_FAILED',
        authorityResponse: null,
        errors: val.errors,
        warnings: val.warnings
      };
    }

    // 2. Production fail-closed protection
    if (profile.environment === 'PRODUCTION' || profile.environment === 'SANDBOX') {
      if (!profile.etaClientId || !profile.etaClientSecret) {
        return {
          status: 'CONFIGURATION_ERROR',
          authorityResponse: null,
          errors: [`Missing official ETA credentials (${profile.environment}). Submission blocked to prevent uncertified transmission.`]
        };
      }
    }

    // 3. Format payload
    const isReceipt = doc.documentType === 'RECEIPT' || doc.documentType === 'RETURN_RECEIPT';
    const payload = isReceipt ? this.buildEReceiptPayload(doc) : this.buildEInvoicePayload(doc);

    // 4. Test / Local handling
    if (profile.environment === 'LOCAL' || profile.environment === 'TEST') {
      const mockSubId = `eta-sub-${Date.now()}`;
      return {
        status: 'ACCEPTED',
        submissionId: mockSubId,
        authorityStatus: 'Valid',
        authorityResponse: {
          submissionId: mockSubId,
          acceptedDocuments: [{ uuid: doc.documentUuid, internalId: doc.sourceDocumentNumber }],
          rejectedDocuments: []
        },
        warnings: val.warnings
      };
    }

    // 5. Official Live Call (Sandbox / Production)
    try {
      const { token } = await this.obtainAccessToken(profile);
      const endpoints = this.getEndpoints(profile.environment);

      let submitUrl: string;
      let requestBody: any;

      if (isReceipt) {
        submitUrl = profile.etaApiBaseUrl
          ? `${profile.etaApiBaseUrl}/api/v1/receiptsubmissions`
          : endpoints.eReceiptBaseUrl;
        requestBody = { receipts: [payload] };
      } else {
        submitUrl = profile.etaApiBaseUrl
          ? `${profile.etaApiBaseUrl}/api/v1.0/documentsubmissions`
          : `${endpoints.apiBaseUrl}/api/v1.0/documentsubmissions`;
        requestBody = { documents: [payload] };
      }

      const res = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseBody = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          status: res.status === 422 ? 'REJECTED' : 'FAILED',
          authorityStatus: 'Rejected',
          authorityResponse: responseBody,
          errors: [
            responseBody?.message ||
              `ETA Authority HTTP ${res.status}: ${JSON.stringify(responseBody)}`
          ]
        };
      }

      const subId = responseBody?.submissionId || responseBody?.id || `eta-sub-${Date.now()}`;
      const hasRejection =
        Array.isArray(responseBody?.rejectedDocuments) &&
        responseBody.rejectedDocuments.length > 0;

      return {
        status: hasRejection ? 'REJECTED' : 'SUBMITTED',
        submissionId: subId,
        authorityStatus: hasRejection ? 'Invalid' : 'Submitted',
        authorityResponse: responseBody,
        errors: hasRejection
          ? responseBody.rejectedDocuments.map(
              (r: any) => `${r.internalId}: ${r.error?.message || 'Document rejected by ETA'}`
            )
          : undefined,
        warnings: val.warnings
      };
    } catch (err: any) {
      return {
        status: 'FAILED',
        authorityResponse: null,
        errors: [err.message]
      };
    }
  }

  /**
   * Queries official submission status from ETA.
   */
  public static async querySubmissionStatus(
    submissionId: string,
    profile: ComplianceTaxpayerProfile
  ): Promise<{ authorityStatus: string; rawResponse: any }> {
    if (profile.environment === 'LOCAL' || profile.environment === 'TEST') {
      return { authorityStatus: 'Valid', rawResponse: { submissionId, status: 'Valid' } };
    }

    const { token } = await this.obtainAccessToken(profile);
    const endpoints = this.getEndpoints(profile.environment);
    const url = `${endpoints.apiBaseUrl}/api/v1.0/documentsubmissions/${submissionId}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    return {
      authorityStatus: data.overallStatus || data.status || 'Unknown',
      rawResponse: data
    };
  }

  /**
   * Requests cancellation of a document with ETA within statutory window.
   */
  public static async cancelDocument(
    docUuid: string,
    reason: string,
    profile: ComplianceTaxpayerProfile
  ): Promise<{ success: boolean; authorityResponse: any }> {
    if (profile.environment === 'LOCAL' || profile.environment === 'TEST') {
      return { success: true, authorityResponse: { uuid: docUuid, status: 'Cancelled', reason } };
    }

    const { token } = await this.obtainAccessToken(profile);
    const endpoints = this.getEndpoints(profile.environment);
    const url = `${endpoints.apiBaseUrl}/api/v1.0/documents/state/${docUuid}/state`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'Cancelled', reason })
    });

    const data = await res.json();
    return {
      success: res.ok,
      authorityResponse: data
    };
  }
}
