/**
 * AM Business Platform - HR & Payroll Module
 * Employee Roster, WPS Wage Protection System Payroll Run, & Allowances
 */

import React, { useEffect, useState } from 'react';
import { Users, PlayCircle } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { ApiClient } from '../../services/apiClient';
import { Employee } from '../../types';

export const HrPayrollView: React.FC = () => {
  const { lang, reloadTrigger } = usePlatform();
  const isAr = lang === 'ar';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollError, setPayrollError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHrData() {
      try {
        const res = await ApiClient.getEmployees();
        setEmployees(res);
      } catch (err) {
        console.error('Failed loading HR data:', err);
      }
    }
    loadHrData();
  }, [reloadTrigger]);

  const handleRunWpsPayroll = async () => {
    setPayrollError(
      isAr
        ? 'تشغيل الرواتب غير متاح حتى يتم تفعيل مسار الاعتماد والترحيل الفعلي.'
        : 'Payroll execution is unavailable until the approval, posting, and WPS workflow is enabled.'
    );
  };

  const totalPayrollCost = employees.reduce((acc, e) => acc + e.basicSalary + e.housingAllowance + e.transportAllowance, 0);

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{isAr ? 'إدارة الموارد البشرية والرواتب (HR & Payroll WPS)' : 'Human Resources & WPS Payroll'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr ? 'سجل الموظفين، مسيرات الرواتب الشهرية، حماية الأجور، وتوليد قيود الرواتب التلقائية' : 'Employee master files, GOSI contributions, WPS payroll batch processing'}
          </p>
        </div>

        <button
          onClick={handleRunWpsPayroll}
          className="flex items-center gap-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-xs cursor-pointer"
        >
          <PlayCircle className="w-4 h-4" />
          <span>{isAr ? 'حالة تشغيل الرواتب' : 'Payroll run status'}</span>
        </button>
      </div>

      {payrollError && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900 text-xs font-semibold">
          {payrollError}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">{isAr ? 'إجمالي كتلة الرواتب الشهرية' : 'Monthly Gross Payroll'}</div>
          <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">
            {totalPayrollCost.toLocaleString()} SAR
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">{isAr ? 'إجمالي الموظفين' : 'Active Headcount'}</div>
          <div className="text-xl font-mono font-bold text-indigo-600 mt-1">
            {employees.length} Staff
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">{isAr ? 'نظام حماية الأجور' : 'WPS Compliance'}</div>
          <div className="text-xl font-mono font-bold text-emerald-600 mt-1">
            {isAr ? 'غير مهيأ' : 'Not configured'}
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
          {isAr ? 'سجل الموظفين والبدلات' : 'Employee Payroll Directory'}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Emp ID</th>
                <th className="px-4 py-3">{isAr ? 'الاسم' : 'Full Name'}</th>
                <th className="px-4 py-3">{isAr ? 'القسم والفرع' : 'Department'}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'الراتب الأساسي' : 'Basic Salary'}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'بدل السكن' : 'Housing'}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'بدل النقل' : 'Transport'}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'إجمالي المستحق' : 'Gross Total'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((e) => {
                const gross = e.basicSalary + e.housingAllowance + e.transportAllowance;
                return (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{e.employeeCode}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {isAr ? e.nameAr : e.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{e.department}</td>
                    <td className="px-4 py-3 text-right rtl:text-left font-mono">{e.basicSalary.toLocaleString()} SAR</td>
                    <td className="px-4 py-3 text-right rtl:text-left font-mono">{e.housingAllowance.toLocaleString()} SAR</td>
                    <td className="px-4 py-3 text-right rtl:text-left font-mono">{e.transportAllowance.toLocaleString()} SAR</td>
                    <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-emerald-600">
                      {gross.toLocaleString()} SAR
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
