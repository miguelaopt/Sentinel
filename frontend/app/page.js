"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  Shield, AlertTriangle, FileCode, Loader2, CheckCircle2, 
  Activity, Download, TrendingUp, LayoutDashboard, List, Settings, User 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard'); // Estado para controlar as abas
  const [latestScan, setLatestScan] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ... (MANTÉM O useEffect e o generatePDF IGUAIS AO ANTERIOR) ...
  // ... (Vou omitir para poupar espaço, copia do código anterior as funções useEffect e generatePDF) ...
  // SE PRECISARES QUE EU REPITA ESSAS FUNÇÕES, DIZ-ME.
  
  // COLA AQUI O useEffect do passo anterior
  // COLA AQUI O generatePDF do passo anterior

  // Mock Data para evitar erros se não copiares as funções acima
  useEffect(() => {
    async function fetchData() {
      const { data: scans } = await supabase.from('scans').select('created_at, report').order('created_at', { ascending: true }).limit(30);
      if (scans && scans.length > 0) {
        setLatestScan(scans[scans.length - 1].report);
        setHistoryData(scans.map(s => ({ date: format(new Date(s.created_at), 'dd/MM'), total: s.report.total_issues, critical: s.report.summary.critical })));
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900"><Loader2 className="animate-spin w-12 h-12 text-indigo-500"/></div>;
  if (!latestScan) return <div className="p-10 text-center">Nenhum dado.</div>;

  const isCritical = latestScan.summary.critical > 0;
  const pieData = [{ name: 'Crítico', value: latestScan.summary.critical }, { name: 'Alto', value: latestScan.summary.high }, { name: 'Médio', value: latestScan.summary.medium }, { name: 'Baixo', value: latestScan.summary.low || 0 }].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* --- MENU LATERAL (SIDEBAR) --- */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10 shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-lg">
             <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Sentinel</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          
          <button 
            onClick={() => setActiveTab('vulnerabilities')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'vulnerabilities' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <List size={20} /> Vulnerabilidades
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <User size={20} /> Utilizadores
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings size={20} /> Definições
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800 text-xs text-slate-500 text-center">
          Sentinel Enterprise v2.0
        </div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 ml-64 p-8 md:p-12 overflow-y-auto">
        
        {/* CABEÇALHO COMUM */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 capitalize">{activeTab}</h1>
            <p className="text-slate-500 mt-1">Visão geral do sistema de segurança</p>
          </div>
          {activeTab === 'dashboard' && (
             <button onClick={generatePDF} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-900 shadow-md">
                <Download size={18} /> Exportar Relatório
             </button>
          )}
        </header>

        {/* --- CONTEÚDO DA TAB DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Gráfico Tendência */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><TrendingUp className="text-indigo-500"/> Tendência de Risco</h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historyData}>
                             <defs>
                                <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#334155'}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fontSize: 12, fill: '#334155'}} axisLine={false} tickLine={false} />
                            <RechartsTooltip contentStyle={{borderRadius: '12px'}} />
                            <Area type="monotone" dataKey="total" stroke="#475569" fill="transparent" strokeWidth={2} />
                            <Area type="monotone" dataKey="critical" stroke="#EF4444" fill="url(#colorCritical)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <h3 className="text-slate-500 font-bold uppercase text-xs mb-2">Distribuição</h3>
                    <div className="h-40 w-full">
                        <ResponsiveContainer><PieChart><Pie data={pieData} innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="value"><Cell fill="#EF4444"/><Cell fill="#F59E0B"/><Cell fill="#3B82F6"/></Pie><RechartsTooltip/></PieChart></ResponsiveContainer>
                    </div>
                </div>

                <div className={`col-span-2 p-8 rounded-2xl shadow-sm border flex flex-col justify-center items-center text-center text-white
                    ${isCritical ? 'bg-gradient-to-r from-red-600 to-red-800 border-red-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-700 border-emerald-500'}`}>
                    <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm">
                         {isCritical ? <AlertTriangle className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
                    </div>
                    <h2 className="text-3xl font-extrabold">{isCritical ? 'CRÍTICO' : 'SEGURO'}</h2>
                    <p className="opacity-90 mt-2">{latestScan.total_issues} problemas detetados</p>
                </div>
            </div>
          </div>
        )}

        {/* --- CONTEÚDO DA TAB VULNERABILIDADES --- */}
        {activeTab === 'vulnerabilities' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
             <div className="divide-y divide-slate-100">
                {latestScan.issues.map((issue, index) => (
                  <div key={index} className="p-6 hover:bg-slate-50 flex items-center justify-between group">
                    <div className="flex gap-4">
                        <div className={`mt-1 w-2 h-12 rounded-full ${issue.severity === 'CRITICO' ? 'bg-red-500' : issue.severity === 'ALTO' ? 'bg-yellow-500' : 'bg-blue-400'}`}></div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-lg">{issue.name}</h4>
                            <p className="text-slate-500 font-mono text-sm">{issue.file} : {issue.line}</p>
                            {issue.snippet && <code className="block mt-2 bg-slate-100 p-2 rounded text-xs text-slate-600">{issue.snippet}</code>}
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="px-3 py-1 text-xs font-bold bg-slate-200 text-slate-600 rounded hover:bg-slate-300">Ignorar</button>
                         <button className="px-3 py-1 text-xs font-bold bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200">Ver Código</button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* --- TABS PLACEHOLDER --- */}
        {(activeTab === 'users' || activeTab === 'settings') && (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300">
                <Settings className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Funcionalidade em desenvolvimento...</p>
                <p className="text-xs text-slate-400 mt-1">Disponível na versão 2.1</p>
            </div>
        )}

      </main>
    </div>
  );
}