/**
 * Universal Comment, Activity & Internal Notes Engine
 * Complete collaborative timeline, @mentions, internal notes & audit logging
 */

import { ActivityLog, DocumentComment } from '../types';

export class CommentEngine {
  private static commentMutationListener: ((comment: DocumentComment) => void) | null = null;
  private static activityMutationListener: ((activity: ActivityLog) => void) | null = null;

  private static commentsStore: DocumentComment[] = [
    {
      id: 'cmt-101',
      tenantId: 'ten-001',
      entityType: 'PurchaseOrder',
      entityId: 'po-001',
      userId: 'usr-001',
      userName: 'Mounir (Finance Lead)',
      comment: 'Verified budget availability with Cost Center CC-4010 before approval.',
      isInternalNote: true,
      createdAt: '2026-08-05T14:00:00Z'
    }
  ];

  private static activityLogsStore: ActivityLog[] = [
    {
      id: 'act-101',
      tenantId: 'ten-001',
      userId: 'usr-001',
      userName: 'Mounir Admin',
      action: 'APPROVE',
      entityType: 'PurchaseOrder',
      entityId: 'po-001',
      entityNumber: 'PO-2026-0051',
      details: 'Approved Purchase Order PO-2026-0051 (75,000 SAR)',
      timestamp: '2026-08-05T14:05:00Z'
    }
  ];

  static setCommentMutationListener(listener: (comment: DocumentComment) => void): void {
    this.commentMutationListener = listener;
  }

  static setActivityMutationListener(listener: (activity: ActivityLog) => void): void {
    this.activityMutationListener = listener;
  }

  static hydrate(comments?: DocumentComment[], activities?: ActivityLog[]): void {
    if (comments && comments.length > 0) {
      this.commentsStore = [...comments];
    }
    if (activities && activities.length > 0) {
      this.activityLogsStore = [...activities];
    }
  }

  static exportState(): { comments: DocumentComment[]; activities: ActivityLog[] } {
    return {
      comments: [...this.commentsStore],
      activities: [...this.activityLogsStore]
    };
  }

  static getEntityComments(tenantId: string, entityType: string, entityId: string): DocumentComment[] {
    return this.commentsStore.filter(c => c.tenantId === tenantId && c.entityType === entityType && c.entityId === entityId);
  }

  static addComment(
    tenantId: string,
    entityType: string,
    entityId: string,
    userId: string,
    userName: string,
    comment: string,
    isInternalNote: boolean = false,
    mentions: string[] = []
  ): DocumentComment {
    const cmt: DocumentComment = {
      id: `cmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      entityType,
      entityId,
      userId,
      userName,
      comment,
      isInternalNote,
      mentions,
      createdAt: new Date().toISOString()
    };

    this.commentsStore.unshift(cmt);
    this.commentMutationListener?.(cmt);
    return cmt;
  }

  static getEntityActivity(tenantId: string, entityType: string, entityId: string): ActivityLog[] {
    return this.activityLogsStore.filter(a => a.tenantId === tenantId && a.entityType === entityType && a.entityId === entityId);
  }

  static logActivity(
    tenantId: string,
    userId: string,
    userName: string,
    action: string,
    entityType: string,
    entityId: string,
    details: string,
    entityNumber?: string
  ): ActivityLog {
    const act: ActivityLog = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      userId,
      userName,
      action,
      entityType,
      entityId,
      entityNumber,
      details,
      timestamp: new Date().toISOString()
    };

    this.activityLogsStore.unshift(act);
    this.activityMutationListener?.(act);
    return act;
  }
}
