# AM BUSINESS PLATFORM — ARCHITECTURE BASELINE v2.0
**Document ID**: AM-ERP-ARCH-BASELINE-V2.0
**Date**: August 12, 2026
**Version**: 2.0.0-FINAL
**Status**: APPROVED & CERTIFIED

---

## 1. INVENTORY DOMAIN ARCHITECTURE & BOUNDED CONTEXT
The Inventory Domain has reached complete Enterprise Domain Certification v1.0 following SAP S/4HANA (MM-IM / MM-IV), Oracle SCM Cloud, and Microsoft Dynamics 365 Supply Chain Management standards.

### Sub-Engine Architecture Matrix
1. **Inventory Execution Engine (`/src/engine/inventoryEngine.ts`)**:
   - Stock Movements (Goods Receipt, Goods Issue, Internal Transfer, Scrap, Return, Adjustment).
   - Multi-Warehouse, Multi-Bin, Serial Number & Batch Lot Tracking with Expiry Governance.
   - Dual-posting valuation update and quant-level tracking.

2. **Demand Allocation & Reservation Engine (`/src/engine/inventoryAllocationEngine.ts`)**:
   - Hard and Soft stock reservations per order line.
   - Available-to-Promise (ATP) calculation: `ATP = On Hand - Hard Allocations - Safety Stock + Planned Receipts`.
   - Real-time stock reservation expiration and automated release.

3. **Inventory Costing Engine (`/src/engine/inventoryCostEngine.ts`)**:
   - Valuation Methods: FIFO (First-In, First-Out), AVCO (Moving Average Cost), Standard Costing, Specific Lot Identification.
   - Cost Layer Consumption with full audit tracing and variance handling.

4. **Inventory Financial Integration Engine (`/src/engine/inventoryFinancialIntegrationEngine.ts`)**:
   - Zero direct GL posting from Inventory context.
   - Decoupled Financial Event Queue (`InventoryFinancialQueueItem`) outputting standardized payloads (`EVT_GOODS_RECEIPT`, `EVT_GOODS_ISSUE`, `EVT_TRANSFER_IN`, `EVT_TRANSFER_OUT`, `EVT_ADJUSTMENT_PLUS`, `EVT_ADJUSTMENT_MINUS`, `EVT_COST_REVALUATION`).

5. **Inventory Closing & Inventory Control Engine (`/src/engine/inventoryClosingControlEngine.ts`)**:
   - **Inventory Period Engine**: States: `Open`, `Closing`, `Closed`, `Reopened`.
   - **Fiscal Inventory Lock Engine**: Company, Branch, and Warehouse level transaction blocks.
   - **Immutable Snapshot Engine**: Creates encrypted snapshots of Inventory Items, Quants, FIFO Layers, AVCO, Standard Costs, and Values prior to closing.
   - **Reopen Governance**: Mandatory reason recording, audit logging, authorized override validation, and `reopenCounter` increment.
   - **Physical Count & Cycle Counting Engine**: Blind counts, count sheets, recount triggers, variance approval thresholds, and reconciliation proposal generation.
   - **Inventory Health Intelligence**: 100% deterministic health score calculation (Accuracy %, Negative Stock, Dead Stock, Slow Moving, Near Expiry, Expired, FIFO Integrity, Valuation Integrity, Pending Counts, Open Variances).
   - **Integrity Validation Suite**: 7-point diagnostic checks (Orphan Quants, Broken FIFO Layers, Duplicate Lots, Duplicate Serials, Negative Quantities, Valuation Mismatch, Ledger Consistency).
   - **Inventory Certification Record**: Immutable certification record generation containing SHA hash, certificate number, health metrics, and audit references.

---

## 2. CERTIFICATION & COMPLIANCE
- **IFRS Compliance**: IAS 2 (Inventories) valuation & lower of cost and net realizable value (NRV) alignment.
- **Audit Integrity**: Complete cryptographic hashing, immutable snapshot references, and unalterable transaction logs.
- **Domain Decoupling**: Strict DDD boundaries — financial postings occur strictly through the Financial Queue and Posting Profiles.
