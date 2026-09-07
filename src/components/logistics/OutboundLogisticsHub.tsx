/**
 * AM BUSINESS PLATFORM — OUTBOUND LOGISTICS & DELIVERY EXECUTION HUB
 * Phase 3.2C-02: Outbound Deliveries, Wave Picking, Handling Units (SSCC-18), PGI, ePOD, ATP & RMA
 * Architectural Alignment: SAP S/4HANA LE-SHP / TM, Oracle SCM Logistics, D365 Supply Chain
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Layers,
  Barcode,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Search,
  Plus,
  ArrowRight,
  FileCheck,
  MapPin,
  Clock,
  ExternalLink,
  DollarSign,
  RefreshCw,
  Box,
  Scale,
  Calendar,
  Warehouse
} from 'lucide-react';
import { OutboundLogisticsEngine } from '../../engine/outboundLogisticsEngine';
import {
  OutboundDelivery,
  PickWave,
  HandlingUnit,
  PGIDocument,
  ReturnAuthorization,
  ProofOfDelivery,
  ATPCheckResponse
} from '../../types/outboundLogistics';

export const OutboundLogisticsHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'DELIVERIES' | 'WAVES' | 'HANDLING_UNITS' | 'PGI' | 'EPOD' | 'RMA' | 'ATP_TOOL'
  >('DELIVERIES');

  const tenantId = 'tenant-egypt-corp';
  const companyId = 'comp-cairo-01';

  const [deliveries, setDeliveries] = useState<OutboundDelivery[]>([]);
  const [waves, setWaves] = useState<PickWave[]>([]);
  const [handlingUnits, setHandlingUnits] = useState<HandlingUnit[]>([]);
  const [rmas, setRmas] = useState<ReturnAuthorization[]>([]);
  const [pgiDocs, setPgiDocs] = useState<PGIDocument[]>([]);
  const [epods, setEpods] = useState<ProofOfDelivery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // ATP Tool State
  const [atpSku, setAtpSku] = useState('SKU-LAPTOP-X1');
  const [atpWarehouse, setAtpWarehouse] = useState('WH-CAIRO-MAIN');
  const [atpQty, setAtpQty] = useState(25);
  const [atpResult, setAtpResult] = useState<ATPCheckResponse | null>(null);

  // Delivery Create Modal
  const [isCreateDeliveryOpen, setIsCreateDeliveryOpen] = useState(false);
  const [newDelCustomer, setNewDelCustomer] = useState('Nile Trading Co.');
  const [newDelRoute, setNewDelRoute] = useState('ROUTE-CAIRO-GIZA');
  const [newDelCarrier, setNewDelCarrier] = useState('DHL-EXPRESS');
  const [newDelSku, setNewDelSku] = useState('SKU-LAPTOP-X1');
  const [newDelQty, setNewDelQty] = useState(5);
  const [newDelPrice, setNewDelPrice] = useState(1500);

  // RMA Create Modal
  const [isCreateRmaOpen, setIsCreateRmaOpen] = useState(false);
  const [rmaSelectedDelId, setRmaSelectedDelId] = useState('');
  const [rmaReason, setRmaReason] = useState<'DEFECTIVE' | 'TRANSIT_DAMAGE' | 'WRONG_ITEM' | 'CUSTOMER_CANCEL'>('DEFECTIVE');
  const [rmaQty, setRmaQty] = useState(1);

  const loadData = () => {
    setDeliveries(OutboundLogisticsEngine.getAllDeliveries(tenantId, companyId));
    setWaves(OutboundLogisticsEngine.getAllWaves(tenantId, companyId));
    setHandlingUnits(OutboundLogisticsEngine.getAllHandlingUnits(tenantId, companyId));
    setRmas(OutboundLogisticsEngine.getAllRMAs(tenantId, companyId));
    setPgiDocs(OutboundLogisticsEngine.getAllPGIDocuments(tenantId, companyId));
    setEpods(OutboundLogisticsEngine.getAllProofOfDeliveries(tenantId, companyId));
  };

  useEffect(() => {
    // Seed initial data if empty
    if (OutboundLogisticsEngine.getAllDeliveries(tenantId, companyId).length === 0) {
      OutboundLogisticsEngine.seedInventory('SKU-LAPTOP-X1', 'WH-CAIRO-MAIN', 100, 20, 10);
      OutboundLogisticsEngine.seedInventory('SKU-LAPTOP-X1', 'WH-ALEX-REGIONAL', 50, 0, 0);
      OutboundLogisticsEngine.seedInventory('SKU-LAPTOP-X2', 'WH-CAIRO-MAIN', 80, 0, 0);

      const d1 = OutboundLogisticsEngine.createOutboundDelivery({
        tenantId,
        companyId,
        salesOrderId: 'so-init-1',
        salesOrderNumber: 'SO-2026-00088',
        customerId: 'cust-501',
        customerName: 'Nile Trading Co.',
        shippingAddress: '15 Smart Village, Giza',
        shippingPoint: 'SP-CAIRO-01',
        carrierCode: 'DHL',
        carrierName: 'DHL Express',
        serviceLevel: 'EXPRESS',
        shippingRoute: 'ROUTE-CAIRO-GIZA',
        plannedDepartureDate: '2026-09-08T08:00:00Z',
        plannedArrivalDate: '2026-09-08T16:00:00Z',
        lines: [
          {
            salesOrderLineId: 'sol-init-1',
            sku: 'SKU-LAPTOP-X1',
            description: 'Enterprise Laptop X1 Carbon',
            orderedQuantity: 10,
            deliveryQuantity: 10,
            uom: 'EA',
            unitPrice: 1500,
            unitCost: 1100,
            warehouseId: 'WH-CAIRO-MAIN',
            storageBin: 'A-01-02'
          }
        ],
        performedBy: 'logistics.planner@am-enterprise.com'
      });

      const w1 = OutboundLogisticsEngine.createPickWave({
        tenantId,
        companyId,
        warehouseId: 'WH-CAIRO-MAIN',
        shippingRoute: 'ROUTE-CAIRO-GIZA',
        carrierCode: 'DHL',
        deliveryIds: [d1.id],
        performedBy: 'warehouse.mgr@am-enterprise.com'
      });

      OutboundLogisticsEngine.confirmPickTask(w1.id, w1.tasks[0].id, 10, 'picker.01@am-enterprise.com');

      OutboundLogisticsEngine.packHandlingUnit({
        tenantId,
        companyId,
        packagingType: 'CARTON',
        deliveryId: d1.id,
        tareWeightKg: 1.2,
        maxWeightCapacityKg: 50,
        volumeCbm: 0.15,
        items: [
          {
            deliveryLineId: d1.lines[0].id,
            sku: d1.lines[0].sku,
            description: d1.lines[0].description,
            quantity: 10,
            uom: 'EA',
            unitWeightKg: 2.1
          }
        ],
        performedBy: 'packer.01@am-enterprise.com'
      });

      OutboundLogisticsEngine.executePostGoodsIssue({
        tenantId,
        companyId,
        deliveryId: d1.id,
        performedBy: 'shipping.officer@am-enterprise.com'
      });
    }
    loadData();
  }, []);

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      OutboundLogisticsEngine.createOutboundDelivery({
        tenantId,
        companyId,
        salesOrderId: `so-${Date.now().toString().slice(-4)}`,
        salesOrderNumber: `SO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: 'cust-501',
        customerName: newDelCustomer,
        shippingAddress: 'Main Commercial District, Cairo',
        shippingPoint: 'SP-CAIRO-01',
        carrierCode: newDelCarrier,
        carrierName: newDelCarrier === 'DHL-EXPRESS' ? 'DHL Express' : 'FedEx Express',
        serviceLevel: 'EXPRESS',
        shippingRoute: newDelRoute,
        plannedDepartureDate: new Date().toISOString(),
        plannedArrivalDate: new Date(Date.now() + 86400000).toISOString(),
        lines: [
          {
            salesOrderLineId: `sol-${Date.now()}`,
            sku: newDelSku,
            description: newDelSku.includes('LAPTOP') ? 'Enterprise Laptop' : 'Hardware Unit',
            orderedQuantity: Number(newDelQty),
            deliveryQuantity: Number(newDelQty),
            uom: 'EA',
            unitPrice: Number(newDelPrice),
            unitCost: Number(newDelPrice) * 0.75,
            warehouseId: 'WH-CAIRO-MAIN',
            storageBin: 'A-02-05'
          }
        ],
        performedBy: 'logistics.planner@am-enterprise.com'
      });
      setIsCreateDeliveryOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Delivery creation error: ${err.message}`);
    }
  };

  const handleCreateWaveForDelivery = (delivery: OutboundDelivery) => {
    try {
      OutboundLogisticsEngine.createPickWave({
        tenantId,
        companyId,
        warehouseId: delivery.lines[0]?.warehouseId || 'WH-CAIRO-MAIN',
        shippingRoute: delivery.shippingRoute,
        carrierCode: delivery.carrierCode,
        deliveryIds: [delivery.id],
        performedBy: 'warehouse.mgr@am-enterprise.com'
      });
      loadData();
      setActiveSubTab('WAVES');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExecutePGI = (deliveryId: string) => {
    try {
      OutboundLogisticsEngine.executePostGoodsIssue({
        tenantId,
        companyId,
        deliveryId,
        performedBy: 'shipping.officer@am-enterprise.com'
      });
      loadData();
    } catch (err: any) {
      alert(`PGI Failed: ${err.message}`);
    }
  };

  const handleExecuteEPOD = (deliveryId: string) => {
    try {
      OutboundLogisticsEngine.recordProofOfDelivery({
        tenantId,
        companyId,
        deliveryId,
        recipientName: 'Dr. Tarek Mansour (Gate Logistics)',
        signatureImageHash: `sha256-sig-${Date.now().toString(36)}`,
        latitude: 30.0444,
        longitude: 31.2357,
        deliveredTimestamp: new Date().toISOString(),
        carrierEstimatedCost: 150,
        carrierActualCost: 150,
        performedBy: 'dhl.driver.09@dhl.com'
      });
      loadData();
      setActiveSubTab('EPOD');
    } catch (err: any) {
      alert(`ePOD Failed: ${err.message}`);
    }
  };

  const handleRunATP = () => {
    const res = OutboundLogisticsEngine.checkATP(
      tenantId,
      companyId,
      [
        {
          sku: atpSku,
          requestedQuantity: Number(atpQty),
          warehouseId: atpWarehouse,
          requiredDeliveryDate: new Date().toISOString()
        }
      ],
      { 'SKU-LAPTOP-X1': 'SKU-LAPTOP-X2' },
      { 'WH-CAIRO-MAIN': ['WH-ALEX-REGIONAL'] }
    );
    setAtpResult(res);
  };

  const handleCreateRMA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmaSelectedDelId) return;
    const del = deliveries.find(d => d.id === rmaSelectedDelId);
    if (!del) return;
    try {
      OutboundLogisticsEngine.createReturnAuthorization({
        tenantId,
        companyId,
        originalSalesOrderId: del.salesOrderId,
        originalDeliveryNumber: del.deliveryNumber,
        customerId: del.customerId,
        customerName: del.customerName,
        lines: [
          {
            originalDeliveryId: del.id,
            originalDeliveryLineId: del.lines[0].id,
            sku: del.lines[0].sku,
            description: del.lines[0].description,
            returnQuantity: Number(rmaQty),
            uom: del.lines[0].uom,
            returnReason: rmaReason,
            unitCreditPrice: del.lines[0].unitPrice
          }
        ],
        performedBy: 'customer.service@am-enterprise.com'
      });
      setIsCreateRmaOpen(false);
      loadData();
      setActiveSubTab('RMA');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleInspectRMA = (rmaId: string, disposition: 'RESTOCK_SELLABLE' | 'SCRAP_WRITE_OFF') => {
    const rma = rmas.find(r => r.id === rmaId);
    if (!rma) return;
    try {
      OutboundLogisticsEngine.inspectAndDispositionRMA({
        tenantId,
        companyId,
        rmaId,
        inspections: [
          {
            lineId: rma.lines[0].id,
            inspectedQuantity: rma.lines[0].returnQuantity,
            disposition,
            dispositionNotes: disposition === 'RESTOCK_SELLABLE' ? 'Passed QA restock checks' : 'Scrapped defective unit',
            restockedToWarehouseId: 'WH-CAIRO-MAIN',
            restockedToBin: 'BIN-RESTOCK-01'
          }
        ],
        performedBy: 'qa.inspector@am-enterprise.com'
      });
      loadData();
    } catch (err: any) {
      alert(`RMA Inspection Error: ${err.message}`);
    }
  };

  // KPIs
  const totalDeliveries = deliveries.length;
  const inTransitCount = deliveries.filter(d => d.status === 'IN_TRANSIT').length;
  const deliveredCount = deliveries.filter(d => d.status === 'DELIVERED').length;
  const totalHUs = handlingUnits.length;
  const totalValueShipped = deliveries
    .filter(d => ['GOODS_ISSUED', 'IN_TRANSIT', 'DELIVERED'].includes(d.status))
    .reduce((acc, d) => acc + d.totalDeliveryValue, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Outbound Logistics & Shipping Execution
                <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  Phase 3.2C-02
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Wave Picking, Handling Units (GS1 SSCC-18), ATP Promising, PGI & Decoupled Financial Accounting, ePOD & RMA
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateDeliveryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Create Outbound Delivery
          </button>
          <button
            onClick={loadData}
            className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
            title="Reload State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Deliveries</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalDeliveries}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
            <Truck className="w-3 h-3" /> Live Tracking Active
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">In-Transit Freight</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{inTransitCount}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> En Route to Consignee
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed ePOD</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{deliveredCount}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Signed & Reconciled
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Handling Units</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{totalHUs}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Barcode className="w-3 h-3" /> SSCC-18 Barcodes
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Value Shipped</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">${totalValueShipped.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> COGS / PGI Accounted
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 bg-white dark:bg-slate-900 p-2 rounded-t-xl">
        {[
          { id: 'DELIVERIES', label: 'Outbound Deliveries', icon: Truck, count: deliveries.length },
          { id: 'WAVES', label: 'Pick Waves & Routing', icon: Layers, count: waves.length },
          { id: 'HANDLING_UNITS', label: 'Handling Units (SSCC-18)', icon: Barcode, count: handlingUnits.length },
          { id: 'PGI', label: 'Goods Issue (PGI)', icon: FileCheck, count: pgiDocs.length },
          { id: 'EPOD', label: 'Proof of Delivery (ePOD)', icon: MapPin, count: epods.length },
          { id: 'RMA', label: 'Customer Returns & RMA', icon: RotateCcw, count: rmas.length },
          { id: 'ATP_TOOL', label: 'ATP Promising Simulator', icon: Warehouse }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-blue-800 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-xl p-6">
        {/* SUBTAB 1: OUTBOUND DELIVERIES */}
        {activeSubTab === 'DELIVERIES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search delivery #, customer, sales order..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Delivery #</th>
                    <th className="py-3 px-4">Sales Order</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Carrier & Route</th>
                    <th className="py-3 px-4">Items / Qty</th>
                    <th className="py-3 px-4">Total Value</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {deliveries
                    .filter(d => 
                      d.deliveryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      d.salesOrderNumber.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(del => (
                      <tr key={del.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {del.deliveryNumber}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {del.salesOrderNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {del.customerName}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">{del.carrierName}</div>
                          <div className="text-[11px] text-slate-500">{del.shippingRoute}</div>
                        </td>
                        <td className="py-3 px-4">
                          {del.lines.map(l => (
                            <div key={l.id} className="font-mono text-slate-700 dark:text-slate-300">
                              {l.sku} ({l.deliveryQuantity} {l.uom})
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          ${del.totalDeliveryValue.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                              del.status === 'DELIVERED'
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                : del.status === 'IN_TRANSIT' || del.status === 'GOODS_ISSUED'
                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                : del.status === 'PICKED' || del.status === 'PACKED'
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {del.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {del.status === 'PLANNED' && (
                            <button
                              onClick={() => handleCreateWaveForDelivery(del)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold"
                            >
                              Release to Wave
                            </button>
                          )}
                          {del.status === 'PACKED' && (
                            <button
                              onClick={() => handleExecutePGI(del.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                            >
                              Execute PGI
                            </button>
                          )}
                          {del.status === 'IN_TRANSIT' && (
                            <button
                              onClick={() => handleExecuteEPOD(del.id)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold"
                            >
                              Record ePOD
                            </button>
                          )}
                          {del.status === 'DELIVERED' && (
                            <button
                              onClick={() => {
                                setRmaSelectedDelId(del.id);
                                setIsCreateRmaOpen(true);
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold"
                            >
                              Create RMA
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 2: PICK WAVES & ROUTING */}
        {activeSubTab === 'WAVES' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pick Waves & FEFO Bin Routing</h3>
                <p className="text-xs text-slate-500">Grouped warehouse pick tasks sorted by earliest batch expiration and bin sequence.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {waves.map(wave => (
                <div key={wave.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <div className="flex items-center gap-2 font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      <Layers className="w-4 h-4" />
                      {wave.waveNumber}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      {wave.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <div>Warehouse: <span className="font-semibold text-slate-900 dark:text-slate-200">{wave.warehouseId}</span></div>
                    <div>Route / Carrier: <span className="font-semibold text-slate-900 dark:text-slate-200">{wave.shippingRoute} ({wave.carrierCode})</span></div>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2 mt-3">
                    <div className="text-[11px] font-semibold uppercase text-slate-500">Pick Tasks (FEFO Optimized):</div>
                    {wave.tasks.map((task, idx) => (
                      <div key={task.id} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            #{idx + 1} {task.sku} — Bin: {task.sourceBin}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Batch: {task.batchNumber || 'N/A'} | Expiry: {task.lotExpiryDate || 'N/A'} | Qty: {task.quantityPicked}/{task.quantityRequested} {task.uom}
                          </div>
                        </div>
                        {task.status !== 'COMPLETED' ? (
                          <button
                            onClick={() => {
                              OutboundLogisticsEngine.confirmPickTask(wave.id, task.id, task.quantityRequested, 'picker.01@am-enterprise.com');
                              loadData();
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                          >
                            Confirm Pick
                          </button>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Picked
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 3: HANDLING UNITS & BARCODE (SSCC-18) */}
        {activeSubTab === 'HANDLING_UNITS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Handling Units & GS1 SSCC-18 Barcode Registry</h3>
                <p className="text-xs text-slate-500">Cartons, Pallets, Cryptographic Packing Seals & Mod-10 Check Digits.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {handlingUnits.map(hu => (
                <div key={hu.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm flex items-center gap-2">
                      <Barcode className="w-4 h-4" />
                      {hu.huNumber} ({hu.packagingType})
                    </div>
                    <span className="text-[10px] font-mono bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-bold">
                      SSCC: {hu.sscc18Barcode}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Net Weight</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{hu.netWeightKg} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tare Weight</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{hu.tareWeightKg} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Gross Weight</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{hu.grossWeightKg} kg</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Digital Tamper Seal: {hu.sealNumber}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 truncate">
                      Hash: {hu.cryptographicSealHash}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 4: PGI DOCUMENTS */}
        {activeSubTab === 'PGI' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Post Goods Issue (PGI) Documents</h3>
              <p className="text-xs text-slate-500">Physical inventory deductions with decoupled financial accounting event dispatch.</p>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">PGI Document #</th>
                    <th className="py-3 px-4">Delivery #</th>
                    <th className="py-3 px-4">Sales Order</th>
                    <th className="py-3 px-4">Cost Value</th>
                    <th className="py-3 px-4">Financial Event ID</th>
                    <th className="py-3 px-4">Posted By / Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {pgiDocs.map(pgi => (
                    <tr key={pgi.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {pgi.pgiNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {pgi.deliveryNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {pgi.salesOrderId}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        ${pgi.totalCostValue.toLocaleString()} {pgi.currency}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-blue-600 dark:text-blue-400">
                        {pgi.financialEventId}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <div>{pgi.postedBy}</div>
                        <div className="text-[10px] text-slate-500">{new Date(pgi.postedAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                          {pgi.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 5: EPOD */}
        {activeSubTab === 'EPOD' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Electronic Proof of Delivery (ePOD)</h3>
              <p className="text-xs text-slate-500">Digital signature capture, GPS coordinates & freight cost reconciliation variance holds.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {epods.map(epod => (
                <div key={epod.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      Signee: {epod.recipientName}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      epod.carrierInvoiceMatch === 'MATCHED'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    }`}>
                      {epod.carrierInvoiceMatch}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <div>GPS Coordinates: <span className="font-mono text-slate-800 dark:text-slate-200">{epod.latitude?.toFixed(4)}, {epod.longitude?.toFixed(4)}</span></div>
                    <div>Carrier Freight Variance: <span className="font-semibold text-slate-900 dark:text-slate-100">${epod.freightCostVariance || 0}</span></div>
                    <div className="font-mono text-[10px] text-slate-500 truncate">Signature Hash: {epod.signatureImageHash}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 6: RMA */}
        {activeSubTab === 'RMA' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Customer Return Material Authorizations (RMA)</h3>
                <p className="text-xs text-slate-500">Inspection dispositions with SoD governance (Restock, Scrap write-off, Refurbish).</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rmas.map(rma => (
                <div key={rma.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                      {rma.rmaNumber}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                      {rma.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <div>Customer: <span className="font-semibold text-slate-900 dark:text-slate-200">{rma.customerName}</span></div>
                    <div>Origin Delivery: <span className="font-mono text-slate-900 dark:text-slate-200">{rma.originalDeliveryNumber}</span></div>
                    <div>Credit Value: <span className="font-bold text-slate-900 dark:text-slate-100">${rma.totalCreditValue}</span></div>
                    <div>Created By: <span className="text-slate-600 dark:text-slate-400">{rma.createdBy}</span></div>
                  </div>

                  {rma.status === 'REQUESTED' && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                      <button
                        onClick={() => handleInspectRMA(rma.id, 'RESTOCK_SELLABLE')}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                      >
                        Restock (QA Pass)
                      </button>
                      <button
                        onClick={() => handleInspectRMA(rma.id, 'SCRAP_WRITE_OFF')}
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold"
                      >
                        Scrap Write-Off
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 7: ATP TOOL */}
        {activeSubTab === 'ATP_TOOL' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Multi-Echelon ATP Promising Simulator</h3>
              <p className="text-xs text-slate-500">Test real-time available-to-promise calculations across multi-echelon stock nodes and SKU substitutions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">SKU</label>
                <select
                  value={atpSku}
                  onChange={e => setAtpSku(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="SKU-LAPTOP-X1">SKU-LAPTOP-X1 (Main)</option>
                  <option value="SKU-LAPTOP-X2">SKU-LAPTOP-X2 (Substitute)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Primary Warehouse</label>
                <select
                  value={atpWarehouse}
                  onChange={e => setAtpWarehouse(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="WH-CAIRO-MAIN">WH-CAIRO-MAIN</option>
                  <option value="WH-ALEX-REGIONAL">WH-ALEX-REGIONAL</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Requested Qty</label>
                <input
                  type="number"
                  value={atpQty}
                  onChange={e => setAtpQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <button
              onClick={handleRunATP}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
            >
              Evaluate Stock Availability
            </button>

            {atpResult && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">ATP Verdict:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    atpResult.isFullyConfirmed
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  }`}>
                    {atpResult.isFullyConfirmed ? '100% AVAILABLE' : 'PARTIAL / SUBSTITUTE'}
                  </span>
                </div>

                {atpResult.results.map((r, i) => (
                  <div key={i} className="text-xs space-y-1 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>Net Available: <span className="font-bold text-slate-900 dark:text-slate-100">{r.netAvailable} EA</span></div>
                    <div>Confirmed Qty: <span className="font-bold text-emerald-600">{r.confirmedQuantity} EA</span></div>
                    <div>Shortfall Qty: <span className="font-bold text-rose-600">{r.shortfallQuantity} EA</span></div>
                    {r.alternativeWarehouseId && (
                      <div className="text-blue-600 dark:text-blue-400 font-semibold">
                        Alternate Warehouse Recommendation: {r.alternativeWarehouseId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE OUTBOUND DELIVERY MODAL */}
      {isCreateDeliveryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Create Outbound Delivery</h2>
            <form onSubmit={handleCreateDelivery} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Customer</label>
                <input
                  type="text"
                  value={newDelCustomer}
                  onChange={e => setNewDelCustomer(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Carrier</label>
                  <select
                    value={newDelCarrier}
                    onChange={e => setNewDelCarrier(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="DHL-EXPRESS">DHL Express</option>
                    <option value="FEDEX">FedEx Express</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Shipping Route</label>
                  <input
                    type="text"
                    value={newDelRoute}
                    onChange={e => setNewDelRoute(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">SKU</label>
                  <input
                    type="text"
                    value={newDelSku}
                    onChange={e => setNewDelSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Qty</label>
                  <input
                    type="number"
                    value={newDelQty}
                    onChange={e => setNewDelQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    value={newDelPrice}
                    onChange={e => setNewDelPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreateDeliveryOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Create Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE RMA MODAL */}
      {isCreateRmaOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Create Return Authorization (RMA)</h2>
            <form onSubmit={handleCreateRMA} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Return Reason</label>
                <select
                  value={rmaReason}
                  onChange={e => setRmaReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="DEFECTIVE">DEFECTIVE (Factory defect)</option>
                  <option value="TRANSIT_DAMAGE">TRANSIT_DAMAGE (Damaged by carrier)</option>
                  <option value="WRONG_ITEM">WRONG_ITEM (Incorrect shipment)</option>
                  <option value="CUSTOMER_CANCEL">CUSTOMER_CANCEL (Customer returned)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Return Quantity</label>
                <input
                  type="number"
                  value={rmaQty}
                  min={1}
                  onChange={e => setRmaQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreateRmaOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
                >
                  Issue RMA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
