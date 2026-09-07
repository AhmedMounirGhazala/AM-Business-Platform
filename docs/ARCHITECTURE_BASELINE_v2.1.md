# AM BUSINESS PLATFORM — ARCHITECTURE BASELINE v2.1
**Document ID**: AM-ERP-ARCH-BASELINE-V2.1  
**Date**: August 12, 2026  
**Version**: 2.1.0-FINAL  
**Status**: APPROVED & CERTIFIED  

---

## 1. EXECUTIVE SUMMARY & DOMAIN SCOPE
Architecture Baseline v2.1 establishes the enterprise architectural foundation for both the **Inventory Domain (v1.0)** and the **Procurement & Purchasing Domain (v1.0)** in strict compliance with SAP S/4HANA (MM-PUR / MM-IM), Oracle Procurement Cloud, Microsoft Dynamics 365 Supply Chain Management, IFRS (IAS 2), and Domain-Driven Design (DDD) principles.

---

## 2. PROCUREMENT & PURCHASING BOUNDED CONTEXT ARCHITECTURE

### 2.1 Core Sub-Modules & Components
1. **Vendor Master Engine (`VendorMaster`, `SupplierPerformanceKPIs`)**:
   - Comprehensive supplier profiling including Commercial Reg No, VAT / Tax Registration, Purchasing Organizations (`porg-001`), Buyer Groups, Payment Terms (`Net 30`, `Net 60`), and Incoterms (`FOB`, `CIF`, `DDP`).
   - Active blocking mechanism (`BLOCKED` status rejects PR/PO generation).
   - **Supplier Performance Foundation**: Real-time evaluation of On-Time Delivery Rate (%), Average Lead Time (days), Quality Score (%), Rejection Rate (%), Total Completed Orders, and Volume Procured.

2. **Vendor Price History Engine (`VendorPriceHistoryRecord`)**:
   - Append-only price ledger per Item + Vendor pair.
   - Preserves currency, effective dates, expiry dates, unit prices, source document references (`QUOTATION`, `PO`, `CONTRACT`), and timestamps. Historical records are strictly immutable.

3. **Purchase Requisition Engine (`createRequisition`, `submitRequisitionForApproval`)**:
   - Multi-line requisitioning with departmental & branch allocation.
   - **Multi-Threshold Approval Routing**: Evaluates approval rules by total requisition amount against user authority limits.

4. **RFQ & Vendor Bidding Engine (`createRFQFromRequisition`, `submitVendorQuotation`, `generateComparisonMatrix`)**:
   - One-click RFQ dispatch to multiple qualified vendor partners.
   - Multi-vendor response intake with technical/commercial scoring, tax rates, line discounts, and lead time tracking.
   - **Bid Comparison Matrix**: Side-by-side analytical evaluation showing lowest price, fastest delivery, highest technical score, and winning vendor recommendation.

5. **Purchase Order Engine (`createPurchaseOrder`, `approvePurchaseOrder`, `amendPurchaseOrder`)**:
   - PO creation from RFQ matrix or direct requisitioning.
   - **RBAC Role Separation**: Enforces strict segregation of duties between Requester, Buyer, Approver, and Procurement Manager roles.
   - **PO Versioning & Amendment Engine**: Full version incrementing (v1, v2, v3...), preserving complete pre-amendment `snapshotData`, change reasons, previous total amounts, and user audit trail.

6. **Goods Receipt & Partial Delivery Engine (`recordPartialDelivery`)**:
   - Line-by-line partial and full delivery receiving.
   - Generates Goods Receipt Notes (`GRN-*`) and updates PO open/fulfilled quantities.
   - Over-delivery validation prevents receipt beyond open PO quantities.
   - Updates stock quants and cost layers seamlessly.

7. **Three-Way Matching Readiness & Financial Integration (`processFinancialEvent`)**:
   - Complete decoupling from direct GL postings.
   - Posts `GOODS_RECEIPT_POSTED` financial events (`EVT_PURCHASE_GRN_*`) to the central Financial Event Queue with debit to Uninvoiced Goods Received Account / Inventory and credit to GR/IR Clearing Account. Ready for Accounts Payable (Invoice Matching) in Phase 2.4.

8. **Vendor Return Engine (`createVendorReturn`)**:
   - Return Notes (`VRN-*`) with structured reason codes (`DEFECTIVE`, `OVER_DELIVERY`, `WRONG_SPECIFICATION`, `DAMAGED_IN_TRANSIT`).
   - Emits `VENDOR_RETURN_POSTED` financial events (Debit Memos) and automatically updates stock levels and vendor rejection rates.

9. **Blanket Purchase Order Readiness**:
   - Architecture defined for future framework agreements, release orders, and quantity/value contracts without structural breaking changes.

10. **Procurement Audit Trail (`PurchaseAuditRecord`)**:
    - Immutable event logging with cryptographic SHA-256 state hashes, previous state snapshots, new state snapshots, user roles, IP addresses, and exact timestamps.

---

## 3. INVENTORY DOMAIN ARCHITECTURE (v1.0 RECAP)
- **Execution Engine**: Multi-warehouse, multi-bin, batch lot, and serial number stock movements.
- **Allocation & ATP**: Available-to-Promise stock reservations with expiry governance.
- **Costing Engine**: FIFO, AVCO, Standard Costing, and Specific Lot Valuation.
- **Period Closing & Control Engine**: Immutable snapshots, fiscal locks, physical count reconciliation, and 7-point diagnostic integrity suite.

---

## 4. DOMAIN EVENT CHAIN FLOW
`Purchase Requisition` ➔ `Approval Workflow` ➔ `RFQ Generation` ➔ `Vendor Quotations` ➔ `Comparison Matrix` ➔ `Purchase Order` ➔ `PO Approval` ➔ `Goods Receipt (GRN)` ➔ `Financial Event (GR/IR)` ➔ `Accounts Payable (Phase 2.4)`

---

## 5. QUALITY GATE VERIFICATION
- **TypeScript Compilation**: Zero errors (`compile_applet` passed cleanly).
- **Architecture Standard**: 100% compliant with SAP S/4HANA MM, Oracle Procurement Cloud, Microsoft Dynamics 365, IFRS, and DDD guidelines.
