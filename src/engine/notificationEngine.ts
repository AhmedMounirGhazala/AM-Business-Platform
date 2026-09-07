/**
 * Centralized Enterprise Notification Engine
 * Handles In-App, Email, SMS, Push & WhatsApp workflow alerts
 */

import { NotificationChannel, NotificationRecord } from '../types';

export class NotificationEngine {
  private static notificationsStore: NotificationRecord[] = [
    {
      id: 'notif-101',
      tenantId: 'ten-001',
      userId: 'usr-001',
      channel: 'In-App',
      title: 'Workflow Approval Required',
      message: 'Purchase Order PO-2026-0051 (75,000 SAR) requires your approval.',
      entityType: 'PurchaseOrder',
      entityId: 'po-001',
      isRead: false,
      createdAt: '2026-08-10T09:30:00Z'
    },
    {
      id: 'notif-102',
      tenantId: 'ten-001',
      userId: 'usr-001',
      channel: 'Email',
      title: 'Sales Invoice Posted',
      message: 'Sales Invoice INV-2026-00104 auto-posted GL entry JE-2026-0089 successfully.',
      entityType: 'SalesInvoice',
      entityId: 'inv-001',
      isRead: true,
      createdAt: '2026-08-09T16:15:00Z'
    }
  ];

  static getUserNotifications(tenantId: string, userId: string): NotificationRecord[] {
    return this.notificationsStore.filter(n => n.tenantId === tenantId && n.userId === userId);
  }

  static dispatchNotification(
    tenantId: string,
    userId: string,
    title: string,
    message: string,
    channel: NotificationChannel = 'In-App',
    entityType?: string,
    entityId?: string
  ): NotificationRecord {
    const notif: NotificationRecord = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      userId,
      channel,
      title,
      message,
      entityType,
      entityId,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    this.notificationsStore.unshift(notif);
    return notif;
  }

  static markAsRead(notificationId: string): boolean {
    const notif = this.notificationsStore.find(n => n.id === notificationId);
    if (notif) {
      notif.isRead = true;
      return true;
    }
    return false;
  }
}
