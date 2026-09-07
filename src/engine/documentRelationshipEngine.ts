/**
 * Document Relationship Engine
 * Stores, links, and traces complete document lineage across the supply chain & financial lifecycle
 */

import { DocumentRelationship, DocumentRelationshipType } from '../types';

export class DocumentRelationshipEngine {
  /**
   * Link two related business documents
   */
  static createRelationship(
    tenantId: string,
    sourceDocType: string,
    sourceDocId: string,
    sourceDocNumber: string,
    targetDocType: string,
    targetDocId: string,
    targetDocNumber: string,
    relationshipType: DocumentRelationshipType | string,
    relationshipsList: DocumentRelationship[]
  ): DocumentRelationship {
    const link: DocumentRelationship = {
      id: `rel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      sourceDocType,
      sourceDocId,
      sourceDocNumber,
      targetDocType,
      targetDocId,
      targetDocNumber,
      relationshipType,
      createdAt: new Date().toISOString()
    };

    relationshipsList.unshift(link);
    return link;
  }

  /**
   * Trace all upstream and downstream connected documents for a given document
   */
  static traceLineage(
    docId: string,
    relationshipsList: DocumentRelationship[]
  ): { upstream: DocumentRelationship[]; downstream: DocumentRelationship[] } {
    const upstream = relationshipsList.filter(r => r.targetDocId === docId);
    const downstream = relationshipsList.filter(r => r.sourceDocId === docId);

    return { upstream, downstream };
  }
}
