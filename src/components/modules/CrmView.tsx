/**
 * AM Business Platform - Customer Relationship Management (CRM)
 * Interactive Deal Pipeline Kanban Board & Lead Tracking
 */

import React, { useEffect, useState } from 'react';
import { Target, PlusCircle, ArrowRight, DollarSign, Award, ChevronRight } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { ApiClient } from '../../services/apiClient';
import { Lead } from '../../types';

export const CrmView: React.FC = () => {
  const { lang, triggerReload, reloadTrigger } = usePlatform();
  const isAr = lang === 'ar';

  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    async function loadCrmData() {
      try {
        const res = await ApiClient.getLeads();
        setLeads(res);
      } catch (err) {
        console.error('Failed loading CRM leads:', err);
      }
    }
    loadCrmData();
  }, [reloadTrigger]);

  const stages: Array<'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost'> = [
    'New', 'Qualified', 'Proposal', 'Negotiation', 'Won'
  ];

  const handleAdvanceStage = async (leadId: string, currentStage: string) => {
    const stageOrder: Array<'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won'> = [
      'New', 'Qualified', 'Proposal', 'Negotiation', 'Won'
    ];
    const currentIndex = stageOrder.indexOf(currentStage as any);
    if (currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      await ApiClient.updateLeadStage(leadId, nextStage);
      triggerReload();
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>{isAr ? 'إدارة علاقات العملاء وفرص البيع (CRM Pipeline)' : 'Enterprise CRM & Sales Pipeline Kanban'}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isAr ? 'تتبع الفرص الاستثمارية، التنبؤ بالمبيعات، ونقل الصفقات عبر مراحل التأهيل والتعاقد' : 'Lead qualification, deal pipeline stages, contract negotiation & ARR forecasting'}
        </p>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = leads.filter(l => l.stage === stage);
          const stageTotal = stageLeads.reduce((a, b) => a + b.estimatedValue, 0);

          return (
            <div
              key={stage}
              className="bg-slate-100/70 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col min-w-[220px]"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  {stage}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  {stageLeads.length}
                </span>
              </div>

              <div className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-3">
                Value: {stageTotal.toLocaleString()} SAR
              </div>

              <div className="space-y-3 flex-1">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs text-xs space-y-2 hover:shadow-md transition"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">
                      {lead.title}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Company: {lead.companyName}
                    </div>
                    <div className="flex items-center justify-between font-mono font-bold text-emerald-600 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>{lead.estimatedValue.toLocaleString()} SAR</span>
                      <span className="text-[10px] text-slate-400">{Math.round(lead.probability * 100)}% prob</span>
                    </div>

                    {stage !== 'Won' && (
                      <button
                        onClick={() => handleAdvanceStage(lead.id, lead.stage)}
                        className="w-full mt-2 flex items-center justify-center gap-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 py-1 rounded-lg font-semibold text-[10px] transition cursor-pointer"
                      >
                        <span>Advance Stage</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
