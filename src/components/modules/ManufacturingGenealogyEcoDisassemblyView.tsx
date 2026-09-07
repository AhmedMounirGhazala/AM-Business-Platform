import React, { useState } from 'react';
import {
  GitFork,
  Network,
  GitPullRequest,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Lock,
  Search,
  Check,
  X,
  FileText,
  DollarSign,
  Activity,
  Cpu,
  AlertOctagon
} from 'lucide-react';
import { ManufacturingGenealogyEcoDisassemblyEngine } from '../../engine/manufacturingGenealogyEcoDisassemblyEngine';
import {
  JointProductionCostAnalysis,
  BatchGenealogyNode,
  BatchTraceResult,
  EngineeringChangeOrder,
  DisassemblyOrder,
  DisassemblyFinancialEvent
} from '../../types/manufacturingGenealogyEcoDisassembly';

export const ManufacturingGenealogyEcoDisassemblyView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'jointCost' | 'genealogy' | 'eco' | 'disassembly'>('jointCost');

  // =========================================================================
  // 1. Joint & By-Product Costing State
  // =========================================================================
  const [grossCost, setGrossCost] = useState<number>(15000);
  const [allocationMethod, setAllocationMethod] = useState<'EQUIVALENCE_NUMBERS' | 'NET_REALIZABLE_VALUE' | 'PHYSICAL_QUANTITY'>('EQUIVALENCE_NUMBERS');
  const [jointAnalysis, setJointAnalysis] = useState<JointProductionCostAnalysis | null>(() => {
    const res = ManufacturingGenealogyEcoDisassemblyEngine.calculateJointProductionCosts({
      tenantId: 'TEN-01',
      companyId: 'COMP-01',
      manufacturingOrderId: 'MO-CHEM-SPLIT-01',
      totalOrderCostGross: 15000,
      allocationMethod: 'EQUIVALENCE_NUMBERS',
      coProducts: [
        { itemSku: 'CP-HIGH-OCTANE', productName: 'Aviation High-Octane Fuel', isPrimary: true, producedQty: 600, unitOfMeasure: 'L', equivalenceFactor: 1.0, plannedSalesPricePerUnit: 25.0 },
        { itemSku: 'CP-NAPHTHA', productName: 'Petrochemical Naphtha Base', isPrimary: false, producedQty: 400, unitOfMeasure: 'L', equivalenceFactor: 0.6, plannedSalesPricePerUnit: 12.0 }
      ],
      byProducts: [
        { itemSku: 'BP-BITUMEN', productName: 'Residual Bitumen Pitch', producedQty: 100, unitOfMeasure: 'KG', standardCreditRatePerUnit: 5.0 }
      ]
    });
    return res.analysis;
  });

  const [jointFinancialEvent, setJointFinancialEvent] = useState<DisassemblyFinancialEvent | null>(() => {
    const res = ManufacturingGenealogyEcoDisassemblyEngine.calculateJointProductionCosts({
      tenantId: 'TEN-01',
      companyId: 'COMP-01',
      manufacturingOrderId: 'MO-CHEM-SPLIT-01',
      totalOrderCostGross: 15000,
      allocationMethod: 'EQUIVALENCE_NUMBERS',
      coProducts: [
        { itemSku: 'CP-HIGH-OCTANE', productName: 'Aviation High-Octane Fuel', isPrimary: true, producedQty: 600, unitOfMeasure: 'L', equivalenceFactor: 1.0, plannedSalesPricePerUnit: 25.0 },
        { itemSku: 'CP-NAPHTHA', productName: 'Petrochemical Naphtha Base', isPrimary: false, producedQty: 400, unitOfMeasure: 'L', equivalenceFactor: 0.6, plannedSalesPricePerUnit: 12.0 }
      ],
      byProducts: [
        { itemSku: 'BP-BITUMEN', productName: 'Residual Bitumen Pitch', producedQty: 100, unitOfMeasure: 'KG', standardCreditRatePerUnit: 5.0 }
      ]
    });
    return res.financialEvent;
  });

  const handleRecalculateJointCost = () => {
    const res = ManufacturingGenealogyEcoDisassemblyEngine.calculateJointProductionCosts({
      tenantId: 'TEN-01',
      companyId: 'COMP-01',
      manufacturingOrderId: `MO-CHEM-${Date.now().toString().slice(-4)}`,
      totalOrderCostGross: grossCost,
      allocationMethod,
      coProducts: [
        { itemSku: 'CP-HIGH-OCTANE', productName: 'Aviation High-Octane Fuel', isPrimary: true, producedQty: 600, unitOfMeasure: 'L', equivalenceFactor: 1.0, plannedSalesPricePerUnit: 25.0 },
        { itemSku: 'CP-NAPHTHA', productName: 'Petrochemical Naphtha Base', isPrimary: false, producedQty: 400, unitOfMeasure: 'L', equivalenceFactor: 0.6, plannedSalesPricePerUnit: 12.0 }
      ],
      byProducts: [
        { itemSku: 'BP-BITUMEN', productName: 'Residual Bitumen Pitch', producedQty: 100, unitOfMeasure: 'KG', standardCreditRatePerUnit: 5.0 }
      ]
    });
    setJointAnalysis(res.analysis);
    setJointFinancialEvent(res.financialEvent);
  };

  // =========================================================================
  // 2. Batch Genealogy State
  // =========================================================================
  const [searchLot, setSearchLot] = useState<string>('SN-AERO-ENGINE-7701');
  const [activeTraceResult, setActiveTraceResult] = useState<BatchTraceResult | null>(() => {
    try {
      return ManufacturingGenealogyEcoDisassemblyEngine.traceUpstreamWhereUsed('SN-AERO-ENGINE-7701');
    } catch {
      return null;
    }
  });
  const [quarantineReason, setQuarantineReason] = useState<string>('Supplier quality alert: Inclusions in titanium heat melt');
  const [containmentNotice, setContainmentNotice] = useState<string | null>(null);

  const handleTraceUpstream = () => {
    try {
      const res = ManufacturingGenealogyEcoDisassemblyEngine.traceUpstreamWhereUsed(searchLot);
      setActiveTraceResult(res);
      setContainmentNotice(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTraceDownstream = () => {
    try {
      const res = ManufacturingGenealogyEcoDisassemblyEngine.traceDownstreamImpact(searchLot);
      setActiveTraceResult(res);
      setContainmentNotice(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApplyQuarantine = () => {
    try {
      const res = ManufacturingGenealogyEcoDisassemblyEngine.applyGenealogyQuarantineContainment({
        suspectLotNumber: searchLot,
        quarantineReason,
        operatorId: 'USR-QA-DIRECTOR'
      });
      setActiveTraceResult(res.traceResult);
      setContainmentNotice(`Successfully locked ${res.lockedCount} downstream lots into QUARANTINE_HOLD: ${res.lockedLots.join(', ')}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // =========================================================================
  // 3. Engineering Change Order (ECO) State
  // =========================================================================
  const [selectedEco, setSelectedEco] = useState<EngineeringChangeOrder | null>(() => {
    const ecos = ManufacturingGenealogyEcoDisassemblyEngine.getAllEcos();
    return ecos.length > 0 ? ecos[0] : null;
  });
  const [approverRole, setApproverRole] = useState<'CCB_CHAIR' | 'CHIEF_ENGINEER'>('CCB_CHAIR');
  const [approverId, setApproverId] = useState<string>('CCB-CHAIR-BOB');
  const [sodError, setSodError] = useState<string | null>(null);

  const handleApproveEco = (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedEco) return;
    setSodError(null);
    try {
      const updated = ManufacturingGenealogyEcoDisassemblyEngine.approveEngineeringChangeOrder({
        ecoId: selectedEco.id,
        approverId,
        approverName: approverId === 'CCB-CHAIR-BOB' ? 'Bob Martinez' : 'Alice Johnson (Originator)',
        role: approverRole,
        decision,
        comments: 'Change approved via Change Control Board digital signature.'
      });
      setSelectedEco({ ...updated });
    } catch (err: any) {
      setSodError(err.message);
    }
  };

  const handleActivateEco = () => {
    if (!selectedEco) return;
    try {
      const updated = ManufacturingGenealogyEcoDisassemblyEngine.activateEcoEffectivity(selectedEco.id);
      setSelectedEco({ ...updated });
    } catch (err: any) {
      alert(err.message);
    }
  };

  // =========================================================================
  // 4. Disassembly Order State
  // =========================================================================
  const [activeDisassembly, setActiveDisassembly] = useState<DisassemblyOrder | null>(() => {
    const orders = ManufacturingGenealogyEcoDisassemblyEngine.getAllDisassemblyOrders();
    return orders.length > 0 ? orders[0] : null;
  });
  const [teardownHours, setTeardownHours] = useState<number>(4.0);
  const [disassemblyFinancialEvent, setDisassemblyFinancialEvent] = useState<DisassemblyFinancialEvent | null>(null);

  const handleExecuteTeardown = () => {
    if (!activeDisassembly) return;
    try {
      const res = ManufacturingGenealogyEcoDisassemblyEngine.executeComponentHarvesting({
        disassemblyOrderId: activeDisassembly.id,
        teardownHoursLabor: teardownHours,
        harvestedComponents: [
          { componentSku: 'HARV-MAIN-HOUSING', componentName: 'Cast Iron Housing', harvestedQty: 1, unitOfMeasure: 'EA', conditionGrade: 'GRADE_A_REUSABLE' },
          { componentSku: 'HARV-MOTOR-STATOR', componentName: 'Electric Motor Stator', harvestedQty: 1, unitOfMeasure: 'EA', conditionGrade: 'GRADE_B_REFURB_NEEDED' },
          { componentSku: 'HARV-BRASS-FITTINGS', componentName: 'Scrap Brass Connectors', harvestedQty: 2, unitOfMeasure: 'KG', conditionGrade: 'GRADE_C_SCRAP_SALVAGE' },
          { componentSku: 'HARV-SEALS-WASTE', componentName: 'Degraded Elastomer Seals', harvestedQty: 4, unitOfMeasure: 'EA', conditionGrade: 'UNSALVAGEABLE_WASTE' }
        ]
      });
      setActiveDisassembly({ ...res.order });
      setDisassemblyFinancialEvent(res.financialEvent);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div id="mfg-genealogy-eco-view" className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                Phase 3.2D-09 Certified
              </span>
              <span className="text-xs text-slate-500 font-mono">Platform v2.8-build.104</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Co-Products, Batch Genealogy, ECO Redlining & Disassembly
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Enterprise process manufacturing equivalence costing, bidirectional As-Built genealogy serialization with automated quarantine containment locks, Change Control Board (CCB) engineering redlining, and de-manufacturing teardown workflows.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              id="subtab-joint-cost"
              onClick={() => setActiveSubTab('jointCost')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSubTab === 'jointCost'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              Co-Products & By-Products
            </button>
            <button
              id="subtab-genealogy"
              onClick={() => setActiveSubTab('genealogy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSubTab === 'genealogy'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Batch Genealogy Tree
            </button>
            <button
              id="subtab-eco"
              onClick={() => setActiveSubTab('eco')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSubTab === 'eco'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              ECO & BOM Redlining
            </button>
            <button
              id="subtab-disassembly"
              onClick={() => setActiveSubTab('disassembly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSubTab === 'disassembly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              De-Manufacturing Teardown
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 1. CO-PRODUCTS & BY-PRODUCTS COST ALLOCATION SUB-TAB               */}
      {/* =================================================================== */}
      {activeSubTab === 'jointCost' && jointAnalysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gross Production Cost</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">${jointAnalysis.totalOrderCostGross.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">Manufacturing order total gross inputs</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">By-Product WIP Credit</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">-${jointAnalysis.byProductCreditTotal.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">Direct deduction from WIP balance</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Net Joint Cost Allocated</span>
              <div className="text-2xl font-bold text-blue-700 mt-1">${jointAnalysis.netJointCostToAllocate.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">Apportioned across primary & co-products</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Allocation Engine</span>
              <div className="text-lg font-bold text-indigo-700 mt-1">{jointAnalysis.allocationMethod}</div>
              <div className="text-xs text-slate-500 mt-1">IFRS / GAAP compliant joint accounting</div>
            </div>
          </div>

          {/* Allocation Controls & Co-Products Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Joint Cost Allocation Simulator
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Gross Manufacturing Order Cost ($)</label>
                <input
                  type="number"
                  value={grossCost}
                  onChange={e => setGrossCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Allocation Method</label>
                <select
                  value={allocationMethod}
                  onChange={e => setAllocationMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="EQUIVALENCE_NUMBERS">Equivalence Numbers (Weight Factors)</option>
                  <option value="NET_REALIZABLE_VALUE">Net Realizable Value (Sales Revenue)</option>
                  <option value="PHYSICAL_QUANTITY">Physical Volume / Weight Quantity</option>
                </select>
              </div>

              <button
                id="btn-recalc-joint-cost"
                onClick={handleRecalculateJointCost}
                className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Recalculate Joint Cost Allocations
              </button>
            </div>

            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Co-Products & By-Products Output Matrix
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">SKU & Product</th>
                      <th className="py-2.5 px-3 text-right">Produced Qty</th>
                      <th className="py-2.5 px-3 text-right">Factor / NRV</th>
                      <th className="py-2.5 px-3 text-right">Allocated Cost</th>
                      <th className="py-2.5 px-3 text-right">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jointAnalysis.coProducts.map(cp => (
                      <tr key={cp.itemSku} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            cp.isPrimary ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {cp.isPrimary ? 'PRIMARY' : 'CO-PRODUCT'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-900">{cp.productName}</div>
                          <div className="text-xs text-slate-500 font-mono">{cp.itemSku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">{cp.producedQty} {cp.unitOfMeasure}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{cp.equivalenceFactor}x</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">${cp.allocatedJointCost.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">${cp.unitManufacturingCost.toFixed(4)}</td>
                      </tr>
                    ))}
                    {jointAnalysis.byProducts.map(bp => (
                      <tr key={bp.itemSku} className="bg-emerald-50/50">
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            BY-PRODUCT
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-900">{bp.productName}</div>
                          <div className="text-xs text-slate-500 font-mono">{bp.itemSku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">{bp.producedQty} {bp.unitOfMeasure}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">${bp.standardCreditRatePerUnit.toFixed(2)}/unit</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">-${bp.totalCreditValue.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">Credit</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Event-Driven Balanced GL Postings */}
              {jointFinancialEvent && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Event-Driven Balanced GL Postings (Zero Direct GL Mutation)
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">
                      Balanced: DEBITS = CREDITS
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs font-mono">
                    {jointFinancialEvent.glPostings.map((line, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-slate-200/60 last:border-0">
                        <span className="text-slate-700">{line.accountCode} - {line.accountName}</span>
                        <span className="font-semibold">
                          {line.debitAmount > 0 ? `DR $${line.debitAmount.toFixed(2)}` : `CR $${line.creditAmount.toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. MULTI-LEVEL BATCH GENEALOGY SUB-TAB                             */}
      {/* =================================================================== */}
      {activeSubTab === 'genealogy' && (
        <div className="space-y-6">
          {/* Containment banner if present */}
          {containmentNotice && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-900">Quarantine Containment Lock Active</h4>
                <p className="text-xs text-amber-800 mt-0.5">{containmentNotice}</p>
              </div>
            </div>
          )}

          {/* Trace Query Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Lot / Serial Number (Finished Good, Subassembly, or Raw Material)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchLot}
                    onChange={e => setSearchLot(e.target.value)}
                    placeholder="e.g. SN-AERO-ENGINE-7701 or LOT-RAW-TITANIUM-001"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    id="btn-trace-upstream"
                    onClick={handleTraceUpstream}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Upstream Trace (Where-Used)
                  </button>
                  <button
                    id="btn-trace-downstream"
                    onClick={handleTraceDownstream}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Downstream Impact Trace
                  </button>
                </div>
              </div>

              {/* Quarantine Action Box */}
              <div className="md:w-80 border-l border-slate-200 pl-4 space-y-2">
                <label className="block text-xs font-medium text-rose-700">Genealogy Containment Trigger</label>
                <input
                  type="text"
                  value={quarantineReason}
                  onChange={e => setQuarantineReason(e.target.value)}
                  placeholder="Quarantine justification reason..."
                  className="w-full px-2.5 py-1.5 text-xs border border-rose-200 rounded-lg"
                />
                <button
                  id="btn-apply-quarantine"
                  onClick={handleApplyQuarantine}
                  className="w-full py-1.5 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Lock All Downstream Lots
                </button>
              </div>
            </div>
          </div>

          {/* Trace Results View */}
          {activeTraceResult && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Network className="w-4 h-4 text-indigo-600" />
                    As-Built Genealogy Tree Lineage: {activeTraceResult.rootLotNumber}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Direction: {activeTraceResult.direction} • {activeTraceResult.totalNodesCount} nodes traversed
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  activeTraceResult.containsQuarantinedItems
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {activeTraceResult.containsQuarantinedItems ? 'QUARANTINE CONTAINMENT ACTIVE' : 'ALL NODES CLEARED'}
                </span>
              </div>

              <div className="space-y-3">
                {activeTraceResult.traversedNodes.map(node => (
                  <div
                    key={node.lotOrSerialNumber}
                    className={`p-4 rounded-xl border transition-all ${
                      node.quarantineStatus === 'QUARANTINE_HOLD'
                        ? 'bg-rose-50/70 border-rose-300'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          node.nodeType === 'FINISHED_GOOD'
                            ? 'bg-indigo-100 text-indigo-800'
                            : node.nodeType === 'SUBASSEMBLY'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}>
                          {node.nodeType}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            {node.lotOrSerialNumber}
                            <span className="text-xs text-slate-500 font-normal">({node.itemDescription})</span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            SKU: {node.itemSku} • Work Center: {node.workCenterId} • Operator: {node.operatorId}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        {node.telemetry && (
                          <div className="text-slate-600">
                            {node.telemetry.torqueNewtonMeters && `Torque: ${node.telemetry.torqueNewtonMeters} Nm `}
                            {node.telemetry.purityPct && `Purity: ${node.telemetry.purityPct}% `}
                            {node.telemetry.dimensionMm && `Dim: ${node.telemetry.dimensionMm} mm`}
                          </div>
                        )}

                        <span className={`px-2.5 py-1 rounded-full font-semibold ${
                          node.quarantineStatus === 'QUARANTINE_HOLD'
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {node.quarantineStatus}
                        </span>
                      </div>
                    </div>

                    {node.quarantineReason && (
                      <div className="mt-2 text-xs text-rose-700 bg-rose-100/60 p-2 rounded-lg font-medium">
                        Hold Justification: {node.quarantineReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. ENGINEERING CHANGE ORDERS (ECO) & BOM REDLINING SUB-TAB         */}
      {/* =================================================================== */}
      {activeSubTab === 'eco' && selectedEco && (
        <div className="space-y-6">
          {sodError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-900">Segregation of Duties (SoD) Violation</h4>
                <p className="text-xs text-rose-800 mt-0.5">{sodError}</p>
              </div>
            </div>
          )}

          {/* ECO Header Overview */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedEco.status === 'EFFECTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedEco.status === 'APPROVED'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedEco.status === 'CCB_REVIEW'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {selectedEco.status}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{selectedEco.ecoCode}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedEco.title}</h2>
                <p className="text-xs text-slate-600 mt-0.5">{selectedEco.description}</p>
                <div className="text-xs text-slate-500 mt-2 flex items-center gap-3">
                  <span>Product: <strong>{selectedEco.targetProductSku}</strong></span>
                  <span>Revision: <strong>{selectedEco.currentBomRevision} → {selectedEco.proposedBomRevision}</strong></span>
                  <span>Originator: <strong>{selectedEco.originatorId}</strong></span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-2 border border-slate-200 p-2 rounded-lg bg-slate-50">
                  <span className="text-xs font-medium text-slate-600">Simulate Approver:</span>
                  <select
                    value={approverId}
                    onChange={e => {
                      setApproverId(e.target.value);
                      if (e.target.value === 'ENG-LEAD-ALICE') setApproverRole('CHIEF_ENGINEER');
                      else setApproverRole('CCB_CHAIR');
                    }}
                    className="text-xs bg-white border border-slate-300 rounded px-2 py-1"
                  >
                    <option value="CCB-CHAIR-BOB">Bob Martinez (CCB Chair - Authorized)</option>
                    <option value="ENG-LEAD-ALICE">Alice Johnson (Originator - SoD Trigger)</option>
                  </select>
                </div>

                {selectedEco.status === 'CCB_REVIEW' && (
                  <button
                    id="btn-approve-eco"
                    onClick={() => handleApproveEco('APPROVED')}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Sign CCB Approval
                  </button>
                )}

                {selectedEco.status === 'APPROVED' && (
                  <button
                    id="btn-activate-eco"
                    onClick={handleActivateEco}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Activate Effectivity
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* BOM Redlining Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              BOM Redlining & Inventory Disposition Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Change Type</th>
                    <th className="py-2.5 px-3">Component SKU</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Previous Qty</th>
                    <th className="py-2.5 px-3 text-center">New Qty</th>
                    <th className="py-2.5 px-3">Disposition Action</th>
                    <th className="py-2.5 px-3 text-right">Rework / Scrap Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedEco.redlineItems.map(item => (
                    <tr key={item.componentSku} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.changeType === 'COMPONENT_ADDED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.changeType === 'COMPONENT_REMOVED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.changeType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs font-semibold">{item.componentSku}</td>
                      <td className="py-2.5 px-3 text-slate-700">{item.componentDescription}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{item.previousQty}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">{item.newQty}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">
                          {item.dispositionAction}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        ${item.estimatedReworkScrapCost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Approvals Signatures Section */}
            {selectedEco.approvals.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Change Control Board (CCB) Cryptographic Signatures
                </span>
                <div className="space-y-2">
                  {selectedEco.approvals.map((sig, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{sig.approverName} ({sig.role})</div>
                        <div className="text-slate-500 font-mono mt-0.5">{sig.signatureToken}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                          {sig.decision}
                        </span>
                        <div className="text-slate-400 mt-0.5">{new Date(sig.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. DISASSEMBLY / DE-MANUFACTURING SUB-TAB                          */}
      {/* =================================================================== */}
      {activeSubTab === 'disassembly' && activeDisassembly && (
        <div className="space-y-6">
          {/* Order Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    activeDisassembly.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {activeDisassembly.status}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{activeDisassembly.disassemblyCode}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  Core Unit Teardown & Component Harvesting
                </h2>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-4">
                  <span>Source SKU: <strong>{activeDisassembly.sourceItemSku}</strong></span>
                  <span>Serial: <strong>{activeDisassembly.sourceSerialOrLot}</strong></span>
                  <span>Source Book Value: <strong>${activeDisassembly.sourceUnitBookValue.toFixed(2)}</strong></span>
                </div>
              </div>

              {activeDisassembly.status !== 'COMPLETED' && (
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Teardown Labor (Hrs)</label>
                    <input
                      type="number"
                      value={teardownHours}
                      onChange={e => setTeardownHours(Number(e.target.value))}
                      className="w-24 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <button
                    id="btn-execute-teardown"
                    onClick={handleExecuteTeardown}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors mt-4"
                  >
                    Execute Teardown & Harvest
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Harvested Components Breakdown */}
          {activeDisassembly.harvestedComponents.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  Harvested Components Condition & Residual Allocation
                </h3>
                <div className="text-sm">
                  Total Recovered Value: <strong className="text-emerald-700">${activeDisassembly.totalHarvestedValue.toFixed(2)}</strong>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Condition Grade</th>
                      <th className="py-2.5 px-3">Component SKU & Name</th>
                      <th className="py-2.5 px-3 text-right">Harvested Qty</th>
                      <th className="py-2.5 px-3">Assigned Lot</th>
                      <th className="py-2.5 px-3 text-right">Allocated Residual Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeDisassembly.harvestedComponents.map(c => (
                      <tr key={c.componentSku} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.conditionGrade === 'GRADE_A_REUSABLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.conditionGrade === 'GRADE_B_REFURB_NEEDED'
                              ? 'bg-blue-100 text-blue-800'
                              : c.conditionGrade === 'GRADE_C_SCRAP_SALVAGE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {c.conditionGrade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{c.componentName}</div>
                          <div className="text-xs text-slate-500 font-mono">{c.componentSku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">{c.harvestedQty} {c.unitOfMeasure}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-slate-600">{c.assignedConditionLot}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ${c.allocatedResidualCost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Postings for Disassembly */}
              {disassemblyFinancialEvent && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Balanced De-Manufacturing Journal Entry (Event-Driven)
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">
                      Debits = Credits Strictly Balanced
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs font-mono">
                    {disassemblyFinancialEvent.glPostings.map((line, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-slate-200/60 last:border-0">
                        <span className="text-slate-700">{line.accountCode} - {line.accountName}</span>
                        <span className="font-semibold">
                          {line.debitAmount > 0 ? `DR $${line.debitAmount.toFixed(2)}` : `CR $${line.creditAmount.toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
