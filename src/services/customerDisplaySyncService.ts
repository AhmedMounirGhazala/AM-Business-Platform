/**
 * AM Business Platform - Customer Display Synchronization Service
 * Architecture Baseline: Pilot Readiness 3C
 * 
 * Provides real-time, zero-latency state synchronization between the Cashier Terminal
 * and the Customer-Facing Pole / Secondary Monitor Display.
 * Uses native BroadcastChannel with localStorage event fallback.
 */

export type CustomerDisplayScreenState = 'IDLE' | 'SCANNING' | 'PAYMENT_IN_PROGRESS' | 'COMPLETED';

export interface CustomerDisplayLineItem {
  id: string;
  itemSku: string;
  name: string;
  nameAr?: string;
  quantity: number;
  unitPrice: number;
  uom: string;
  discountAmount?: number;
  lineTotal: number;
}

export interface CustomerDisplayPayment {
  method: string;
  amount: number;
}

export interface CustomerDisplayData {
  companyName: string;
  branchName: string;
  terminalCode: string;
  cashierName: string;
  currency: string;
  state: CustomerDisplayScreenState;
  lines: CustomerDisplayLineItem[];
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  taxRate: number;
  grandTotal: number;
  tendered: number;
  changeDue: number;
  payments: CustomerDisplayPayment[];
  completedReceipt?: {
    receiptNumber: string;
    timestamp: string;
    qrCodeData?: string;
    paymentSummary?: string;
  } | null;
  welcomeMessageEn?: string;
  welcomeMessageAr?: string;
  lastUpdated: string;
}

export type CustomerDisplayPayload = Omit<CustomerDisplayData, 'lastUpdated'>;

const STORAGE_KEY = 'am_erp_customer_display_payload';
const CHANNEL_NAME = 'AM_ERP_POS_CUSTOMER_DISPLAY';

export const DEFAULT_CUSTOMER_DISPLAY_DATA: CustomerDisplayData = {
  companyName: 'AM Business Platform Enterprise',
  branchName: 'Main Retail Flagship - Counter 01',
  terminalCode: 'REG-01-MAIN',
  cashierName: 'Ahmed Mounir',
  currency: 'SAR',
  state: 'IDLE',
  lines: [],
  itemCount: 0,
  subtotal: 0,
  discountTotal: 0,
  taxAmount: 0,
  taxRate: 0.15,
  grandTotal: 0,
  tendered: 0,
  changeDue: 0,
  payments: [],
  completedReceipt: null,
  welcomeMessageEn: 'Welcome to AM Retail Flagship',
  welcomeMessageAr: 'أهلاً بكم في منصة إيه إم للتجزئة الفاخرة',
  lastUpdated: new Date().toISOString()
};

export class CustomerDisplaySyncService {
  private static instance: CustomerDisplaySyncService | null = null;
  private channel: BroadcastChannel | null = null;
  private currentData: CustomerDisplayData = { ...DEFAULT_CUSTOMER_DISPLAY_DATA };
  private listeners: Set<(data: CustomerDisplayData) => void> = new Set();

  private constructor() {
    this.initTransport();
  }

  public static getInstance(): CustomerDisplaySyncService {
    if (!CustomerDisplaySyncService.instance) {
      CustomerDisplaySyncService.instance = new CustomerDisplaySyncService();
    }
    return CustomerDisplaySyncService.instance;
  }

  private initTransport(): void {
    // Load last cached state from localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          this.currentData = { ...DEFAULT_CUSTOMER_DISPLAY_DATA, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.warn('Could not read cached customer display state:', e);
      }
    }

    // Initialize BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event: MessageEvent) => {
          if (event.data && typeof event.data === 'object') {
            this.currentData = event.data;
            this.notifyListeners();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel failed to initialize, relying on storage fallback:', e);
      }
    }

    // Storage event listener fallback (for older browsers or cross-domain contexts)
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key === STORAGE_KEY && event.newValue) {
          try {
            this.currentData = JSON.parse(event.newValue);
            this.notifyListeners();
          } catch (e) {
            console.warn('Failed to parse storage update for customer display:', e);
          }
        }
      });
    }
  }

  /**
   * Broadcasts updated customer screen state from the cashier terminal.
   */
  public broadcast(data: Partial<CustomerDisplayData>): void {
    this.currentData = {
      ...this.currentData,
      ...data,
      lastUpdated: new Date().toISOString()
    };

    // Save to localStorage for instant recovery across tabs/reloads
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentData));
      } catch (e) {
        console.warn('Could not write to localStorage:', e);
      }
    }

    // Broadcast through BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(this.currentData);
      } catch (e) {
        console.warn('Failed to postMessage on customer display channel:', e);
      }
    }

    this.notifyListeners();
  }

  /**
   * Reset customer screen to IDLE / Welcome mode
   */
  public resetToIdle(): void {
    this.broadcast({
      state: 'IDLE',
      lines: [],
      itemCount: 0,
      subtotal: 0,
      discountTotal: 0,
      taxAmount: 0,
      grandTotal: 0,
      tendered: 0,
      changeDue: 0,
      payments: [],
      completedReceipt: null
    });
  }

  public getData(): CustomerDisplayData {
    return { ...this.currentData };
  }

  public getCurrentState(): CustomerDisplayData {
    return { ...this.currentData };
  }

  public subscribe(callback: (data: CustomerDisplayData) => void): () => void {
    this.listeners.add(callback);
    // Send immediate initial state
    callback(this.currentData);

    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentData);
      } catch (e) {
        console.error('Error in customer display listener:', e);
      }
    }
  }

  /**
   * Opens the customer-facing display in a separate secondary browser window.
   */
  public openSecondaryWindow(): Window | null {
    if (typeof window === 'undefined') return null;

    const url = `${window.location.origin}${window.location.pathname}?view=customer-display`;
    const features = 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no';
    const newWindow = window.open(url, 'AM_Customer_Display', features);
    if (newWindow) {
      newWindow.focus();
    }
    return newWindow;
  }
}
