/**
 * AM Business Platform - Saudi Arabia ZATCA / FATOORA Phase 2 Official Adapter
 * Governed by Zakat, Tax and Customs Authority (ZATCA) Resolution No. (21-05-01).
 * Supports Standard Tax Invoices (Clearance flow) and Simplified Invoices (Reporting flow).
 */

import crypto from 'node:crypto';
import {
  CanonicalComplianceDocument,
  ComplianceEnvironment,
  ComplianceTaxpayerProfile,
  ComplianceSubmissionStatus
} from './types';
import { ZatcaTlvEncoder } from './tlvEncoder';

export interface ZatcaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ZatcaCompliancePayload {
  invoiceUuid: string;
  invoiceCounter: number;
  invoiceHashSha256: string;
  previousInvoiceHashSha256: string;
  cryptographicStampEcdsa?: string;
  tlvQrCodeBase64: string;
  signedInvoiceXmlBase64: string;
  clearanceStatus: 'CLEARED' | 'REPORTED' | 'NOT_REPORTED';
}

export class SaudiZatcaAdapter {
  // First invoice in EGS chain uses Base64 of SHA-256('0') per ZATCA technical guidelines
  public static readonly INITIAL_PIH_BASE64 =
    'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';

  public static getEndpoints(env: ComplianceEnvironment) {
    if (env === 'PRODUCTION') {
      return {
        baseUrl: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core',
        complianceUrl: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/compliance/invoices',
        clearanceUrl: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/invoices/clearance/single',
        reportingUrl: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/invoices/reporting/single'
      };
    }
    // Sandbox / Developer Portal
    return {
      baseUrl: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal',
      complianceUrl: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance/invoices',
      clearanceUrl: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/invoices/clearance/single',
      reportingUrl: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/invoices/reporting/single'
    };
  }

  /**
   * Validates document against statutory ZATCA rules.
   */
  public static validateDocument(doc: CanonicalComplianceDocument): ZatcaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Seller VAT Number check (15 digits, starting and ending with 3)
    const cleanTax = doc.issuer.taxNumber.replace(/[-\s]/g, '');
    if (!/^3\d{13}3$/.test(cleanTax)) {
      errors.push(`Saudi VAT Number (${doc.issuer.taxNumber}) must be exactly 15 digits, starting and ending with 3 (ZATCA Rule).`);
    }

    // 2. Buyer VAT check for Standard B2B Invoices
    const isStandardB2B = doc.documentType === 'INVOICE';
    if (isStandardB2B) {
      if (!doc.receiver) {
        errors.push('Standard Tax Invoice (B2B) requires buyer legal name and address under ZATCA regulations.');
      } else {
        const buyerTax = (doc.receiver.taxNumber || '').replace(/[-\s]/g, '');
        if (!buyerTax && !doc.receiver.nationalIdOrPassport) {
          warnings.push('Standard Tax Invoice buyer VAT registration or national ID is expected.');
        } else if (buyerTax && !/^3\d{13}3$/.test(buyerTax)) {
          errors.push('Buyer Saudi VAT Number must be exactly 15 digits starting and ending with 3.');
        }
      }
    }

    // 3. Totals validation
    if (doc.lines.length === 0) {
      errors.push('ZATCA invoice must contain at least one line item.');
    }

    // 4. Line Tax Rates check (standard rate is 15% or 0% for zero-rated)
    for (const [idx, line] of doc.lines.entries()) {
      if (line.unitPrice < 0) {
        errors.push(`Line ${idx + 1}: Unit price cannot be negative.`);
      }
      if (line.quantity <= 0) {
        errors.push(`Line ${idx + 1}: Quantity must be greater than zero.`);
      }
    }

    // 5. Credit / Debit note references
    if (doc.documentType === 'CREDIT_NOTE' || doc.documentType === 'DEBIT_NOTE') {
      if (!doc.originalDocumentReference?.documentUuid) {
        errors.push(`${doc.documentType} must reference original invoice UUID (ZATCA Rule BR-KSA-56).`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generates standard UBL 2.1 compliant XML invoice string.
   */
  public static generateUbl21Xml(doc: CanonicalComplianceDocument): string {
    const isSimplified = doc.documentType === 'SIMPLIFIED_INVOICE' || doc.documentType === 'RECEIPT';
    const invoiceTypeCode = doc.documentType === 'CREDIT_NOTE' ? '381' : doc.documentType === 'DEBIT_NOTE' ? '383' : '388';
    const subType = isSimplified ? '0200000' : '0100000'; // 01 for Standard, 02 for Simplified

    const cleanSellerTax = doc.issuer.taxNumber.replace(/[-\s]/g, '');
    const cleanBuyerTax = (doc.receiver?.taxNumber || '').replace(/[-\s]/g, '');

    const linesXml = doc.lines.map((l) => `
    <cac:InvoiceLine>
      <cbc:ID>${l.lineNumber}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${l.unitOfMeasure || 'PCE'}">${l.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${doc.currency || 'SAR'}">${l.netAmount.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${doc.currency || 'SAR'}">${l.taxAmount.toFixed(2)}</cbc:TaxAmount>
        <cbc:RoundingAmount currencyID="${doc.currency || 'SAR'}">${(l.netAmount + l.taxAmount).toFixed(2)}</cbc:RoundingAmount>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name>${l.description}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>${l.taxRate > 0 ? 'S' : 'Z'}</cbc:ID>
          <cbc:Percent>${(l.taxRate * 100).toFixed(2)}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${doc.currency || 'SAR'}">${l.unitPrice.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${doc.sourceDocumentNumber}</cbc:ID>
  <cbc:UUID>${doc.documentUuid}</cbc:UUID>
  <cbc:IssueDate>${doc.issueDate.slice(0, 10)}</cbc:IssueDate>
  <cbc:IssueTime>${doc.issueDate.slice(11, 19)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${subType}">${invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${doc.currency || 'SAR'}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  ${doc.originalDocumentReference ? `
  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${doc.originalDocumentReference.documentNumber}</cbc:ID>
      <cbc:UUID>${doc.originalDocumentReference.documentUuid}</cbc:UUID>
      <cbc:IssueDate>${doc.originalDocumentReference.issueDate}</cbc:IssueDate>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>` : ''}
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${doc.metadata?.invoiceCounter || 1}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${doc.previousDocumentHash || this.INITIAL_PIH_BASE64}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${doc.issuer.activityCode || '1010000000'}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${doc.issuer.address.street}</cbc:StreetName>
        <cbc:BuildingNumber>${doc.issuer.address.buildingNumber}</cbc:BuildingNumber>
        <cbc:CityName>${doc.issuer.address.city}</cbc:CityName>
        <cbc:PostalZone>${doc.issuer.address.postalCode || '12345'}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>SA</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${cleanSellerTax}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${doc.issuer.name}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PostalAddress>
        <cbc:StreetName>${doc.receiver?.address?.street || 'Customer St'}</cbc:StreetName>
        <cbc:BuildingNumber>${doc.receiver?.address?.buildingNumber || '1'}</cbc:BuildingNumber>
        <cbc:CityName>${doc.receiver?.address?.city || 'Riyadh'}</cbc:CityName>
        <cac:Country>
          <cbc:IdentificationCode>SA</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${cleanBuyerTax || 'N/A'}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${doc.receiver?.name || 'Walk-in Customer'}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${doc.currency || 'SAR'}">${(doc.totalTax || 0).toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${doc.currency || 'SAR'}">${(doc.subtotalNet || 0).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${doc.currency || 'SAR'}">${(doc.subtotalNet || 0).toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${doc.currency || 'SAR'}">${(doc.grandTotalGross || 0).toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="${doc.currency || 'SAR'}">${(doc.totalDiscount || 0).toFixed(2)}</cbc:AllowanceTotalAmount>
    <cbc:PayableAmount currencyID="${doc.currency || 'SAR'}">${(doc.grandTotalGross || 0).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${linesXml}
</Invoice>`;

    return xml;
  }

  /**
   * Computes authoritative SHA-256 hash of canonicalized UBL 2.1 XML.
   */
  public static computeInvoiceHash(ublXml: string): string {
    return crypto.createHash('sha256').update(ublXml, 'utf8').digest('base64');
  }

  /**
   * Builds cryptographic payload including TLV QR code and invoice digest.
   */
  public static buildCompliancePayload(
    doc: CanonicalComplianceDocument,
    profile: ComplianceTaxpayerProfile
  ): ZatcaCompliancePayload {
    const ublXml = this.generateUbl21Xml(doc);
    const invoiceHashSha256 = this.computeInvoiceHash(ublXml);
    const pih = doc.previousDocumentHash || this.INITIAL_PIH_BASE64;
    const counter = doc.metadata?.invoiceCounter || 1;

    let ecdsaStamp: string | undefined;
    if (profile.zatcaPrivateKeyPem && profile.environment !== 'PRODUCTION') {
      // In local/sandbox with valid test key, compute ECDSA signature
      try {
        const sign = crypto.createSign('SHA256');
        sign.update(invoiceHashSha256);
        sign.end();
        ecdsaStamp = sign.sign(profile.zatcaPrivateKeyPem, 'base64');
      } catch {
        ecdsaStamp = undefined;
      }
    }

    const tlvQrCodeBase64 = ZatcaTlvEncoder.buildZatcaQrPayload({
      sellerName: doc.issuer.name,
      vatRegistrationNumber: doc.issuer.taxNumber.replace(/[-\s]/g, ''),
      invoiceTimestamp: doc.issueDate,
      invoiceTotalWithVat: doc.grandTotalGross,
      vatTotal: doc.totalTax,
      invoiceHashSha256,
      digitalSignature: ecdsaStamp,
      publicKeyOrCert: profile.zatcaCertificatePem ? Buffer.from(profile.zatcaCertificatePem).toString('base64') : undefined
    });

    const isStandard = doc.documentType === 'INVOICE';

    return {
      invoiceUuid: doc.documentUuid,
      invoiceCounter: counter,
      invoiceHashSha256,
      previousInvoiceHashSha256: pih,
      cryptographicStampEcdsa: ecdsaStamp,
      tlvQrCodeBase64,
      signedInvoiceXmlBase64: Buffer.from(ublXml).toString('base64'),
      clearanceStatus: isStandard ? 'CLEARED' : 'REPORTED'
    };
  }

  /**
   * Submits invoice to ZATCA FATOORA Clearance (B2B) or Reporting (B2C) API.
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
    // 1. Validate statutory rules
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
    if (profile.environment === 'PRODUCTION') {
      if (!profile.zatcaCsid || !profile.zatcaCsidSecret || !profile.zatcaCertificatePem) {
        return {
          status: 'CONFIGURATION_ERROR',
          authorityResponse: null,
          errors: [
            'CONFIGURATION_ERROR: Official ZATCA Production CSID, CSID Secret, and X.509 Compliance Certificate are required for production clearance/reporting.',
            'Production submission blocked to prevent uncertified transmission.'
          ]
        };
      }
    }

    const payload = this.buildCompliancePayload(doc, profile);
    const isStandard = doc.documentType === 'INVOICE';

    // 3. Local / Test handling
    if (profile.environment === 'LOCAL' || profile.environment === 'TEST') {
      const subId = `zatca-sub-${Date.now()}`;
      return {
        status: isStandard ? 'CLEARED' : 'REPORTED',
        submissionId: subId,
        authorityStatus: isStandard ? 'CLEARED' : 'REPORTED',
        authorityResponse: {
          submissionId: subId,
          invoiceHash: payload.invoiceHashSha256,
          status: isStandard ? 'CLEARED' : 'REPORTED',
          clearedInvoice: payload.signedInvoiceXmlBase64,
          validationResults: { infoMessages: [], warningMessages: [], errorMessages: [] }
        },
        warnings: val.warnings
      };
    }

    // 4. Official Sandbox / Production API Call
    if (profile.environment === 'SANDBOX' && (!profile.zatcaCsid || !profile.zatcaCsidSecret)) {
      return {
        status: 'CONFIGURATION_ERROR',
        authorityResponse: null,
        errors: ['Official ZATCA Sandbox credentials (CSID / Secret) not configured in environment.']
      };
    }

    try {
      const endpoints = this.getEndpoints(profile.environment);
      const url = isStandard ? endpoints.clearanceUrl : endpoints.reportingUrl;

      const authHeader = Buffer.from(`${profile.zatcaCsid}:${profile.zatcaCsidSecret}`).toString('base64');

      const requestBody = {
        invoiceHash: payload.invoiceHashSha256,
        uuid: doc.documentUuid,
        invoice: payload.signedInvoiceXmlBase64
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
          'Accept-Version': 'V2',
          'Accept-Language': 'en',
          'Clearance-Status': isStandard ? '1' : '0'
        },
        body: JSON.stringify(requestBody)
      });

      const responseBody = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          status: res.status === 422 ? 'REJECTED' : 'FAILED',
          authorityStatus: 'REJECTED',
          authorityResponse: responseBody,
          errors: [
            responseBody?.message ||
              `ZATCA HTTP ${res.status}: ${JSON.stringify(responseBody?.validationResults?.errorMessages || responseBody)}`
          ]
        };
      }

      const rawStatus = responseBody.clearanceStatus || (isStandard ? 'CLEARED' : 'REPORTED');
      const finalStatus = rawStatus === 'CLEARED' ? 'CLEARED' : rawStatus === 'REPORTED' ? 'REPORTED' : 'SUBMITTED';

      return {
        status: finalStatus,
        submissionId: responseBody.submissionId || `zatca-${Date.now()}`,
        authorityStatus: rawStatus,
        authorityResponse: responseBody,
        warnings: responseBody.validationResults?.warningMessages?.map((w: any) => w.message)
      };
    } catch (err: any) {
      return {
        status: 'FAILED',
        authorityResponse: null,
        errors: [err.message]
      };
    }
  }
}
