/**
 * Universal Attachment Engine
 * Multi-file attachment handling with file versioning for all enterprise entities
 */

import { DocumentAttachment, FileVersion } from '../types';

export class AttachmentEngine {
  private static attachmentsStore: DocumentAttachment[] = [
    {
      id: 'att-101',
      tenantId: 'ten-001',
      entityType: 'SalesInvoice',
      entityId: 'inv-001',
      fileName: 'Signed_Invoice_INV202600104.pdf',
      fileType: 'application/pdf',
      fileSize: 1048576,
      fileUrl: '/assets/docs/inv-104.pdf',
      version: 1,
      versions: [
        {
          versionNumber: 1,
          fileName: 'Signed_Invoice_INV202600104.pdf',
          fileUrl: '/assets/docs/inv-104.pdf',
          fileSize: 1048576,
          uploadedBy: 'usr-001',
          uploadedAt: '2026-08-01T10:00:00Z'
        }
      ],
      uploadedBy: 'usr-001',
      uploadedAt: '2026-08-01T10:00:00Z'
    }
  ];

  static getEntityAttachments(tenantId: string, entityType: string, entityId: string): DocumentAttachment[] {
    return this.attachmentsStore.filter(
      a => a.tenantId === tenantId && a.entityType === entityType && a.entityId === entityId
    );
  }

  static uploadAttachment(
    tenantId: string,
    entityType: string,
    entityId: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    uploadedBy: string,
    fileUrl?: string
  ): DocumentAttachment {
    const existing = this.attachmentsStore.find(
      a => a.tenantId === tenantId && a.entityType === entityType && a.entityId === entityId && a.fileName === fileName
    );

    const now = new Date().toISOString();
    const resolvedUrl = fileUrl || `/uploads/${entityType}/${fileName}`;

    if (existing) {
      // Add new version
      const newVersionNum = existing.version + 1;
      const newVer: FileVersion = {
        versionNumber: newVersionNum,
        fileName,
        fileUrl: resolvedUrl,
        fileSize,
        uploadedBy,
        uploadedAt: now
      };
      existing.version = newVersionNum;
      existing.versions.unshift(newVer);
      existing.fileUrl = resolvedUrl;
      existing.uploadedBy = uploadedBy;
      existing.uploadedAt = now;
      return existing;
    }

    const newAttachment: DocumentAttachment = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      entityType,
      entityId,
      fileName,
      fileType,
      fileSize,
      fileUrl: resolvedUrl,
      version: 1,
      versions: [
        {
          versionNumber: 1,
          fileName,
          fileUrl: resolvedUrl,
          fileSize,
          uploadedBy,
          uploadedAt: now
        }
      ],
      uploadedBy,
      uploadedAt: now
    };

    this.attachmentsStore.unshift(newAttachment);
    return newAttachment;
  }
}
