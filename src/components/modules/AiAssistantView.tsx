/**
 * AM Business Platform - AI Copilot & Anomaly Detector
 * Natural language ERP intelligence powered by Gemini & Automated Integrity Scanner
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, ShieldAlert, Send, Bot, User, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { ApiClient } from '../../services/apiClient';

export const AiAssistantView: React.FC = () => {
  const { lang, reloadTrigger } = usePlatform();
  const isAr = lang === 'ar';

  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: isAr 
        ? 'أهلاً بك! أنا المساعد الذكي لنظام AM Business Platform. يمكنك سؤالي عن إجمالي الإيرادات، حالة المخزون، أو الشبهات المحاسبية.'
        : 'Welcome! I am your AI Copilot for AM Business Platform. Ask me about cash flow, revenue breakdowns, or audit anomalies.'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  useEffect(() => {
    async function loadAnomalies() {
      try {
        const res = await ApiClient.getAnomalies();
        setAnomalies(res);
      } catch (err) {
        console.error('Failed loading anomalies:', err);
      }
    }
    loadAnomalies();
  }, [reloadTrigger]);

  const handleSendMessage = async () => {
    if (!prompt.trim() || loading) return;

    const userText = prompt;
    setPrompt('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await ApiClient.askCopilot(userText, lang);
      setChatHistory(prev => [...prev, { sender: 'ai', text: res.reply }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'Error connecting to Gemini AI Copilot engine.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>{isAr ? 'المساعد الذكي وكاشف الاحتيال المحاسبي' : 'AI Copilot & Forensic Anomaly Scanner'}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isAr ? 'تحليل لغوي فوري للبيانات المالية وتدقيق آلي لمنع التلاعب والأخطاء' : 'Powered by Gemini AI - Query General Ledger, stock valuation & fraud detection'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chat Window */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col h-[500px]">
          <div className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-500" />
            <span>{isAr ? 'محادثة المساعد التنفيذي' : 'Executive Natural Language Assistant'}</span>
          </div>

          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 my-2">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-lg leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-xs text-slate-400 italic flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>AI processing query...</span>
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isAr ? 'اسأل عن أداء المبيعات أو القوائم المالية...' : 'Ask about sales performance, top items, or cash balance...'}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-hidden text-slate-900 dark:text-white"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Anomaly Scanner Column */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>{isAr ? 'تنبيهات الشبهات والأخطاء المحاسبية' : 'Flagged Accounting Anomalies'}</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
              {anomalies.length} Flagged
            </span>
          </div>

          <div className="space-y-3">
            {anomalies.map((an) => (
              <div
                key={an.id}
                className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/20 text-xs space-y-1"
              >
                <div className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{an.anomalyType}</span>
                </div>
                <div className="text-slate-700 dark:text-slate-300 font-semibold">
                  {an.description}
                </div>
                <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-rose-100 dark:border-rose-900/50">
                  {an.entityNumber} | Confidence: {Math.round(an.severity * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
