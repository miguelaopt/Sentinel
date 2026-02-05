"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  Shield, AlertTriangle, Loader2, CheckCircle2, 
  Download, TrendingUp, LayoutDashboard, List, Settings, User 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [latestScan, setLatestScan] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Buscar dados ao Supabase
  useEffect(() => {
    async function fetchData() {
      const { data: scans } = await supabase
        .from('scans')
        .select('created_at, report')
        .order('created_at', { ascending: true })
        .limit(30);

      if (scans && scans.length > 0) {
        // Dados para o histórico
        setHistoryData(scans.map(s => ({ 
          date: format(new Date(s.created_at), 'dd/MM'), 
          total: s.report.total_issues, 
          critical: s.report.summary.critical 
        })));
        
        // Dados do último scan
        setLatestScan(scans[scans.length - 1].report);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // 2. Função de Gerar PDF (Que estava em falta!)
  const generatePDF = () => {
    if (!latestScan) return;
    
    const doc = new jsPDF();
    const data = latestScan;

    // Cabeçalho Dark Mode
    doc.setFillColor(31, 41, 55); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Sentinel Enterprise Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);

    // Resumo
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Resumo Executivo", 14, 55);
    
    const summaryData = [
      ['Total de Vulnerabilidades', data.total_issues],
      ['Críticas', data.summary.critical],
      ['Altas', data.summary.high],
      ['Médias', data.summary.medium]
    ];

    autoTable(doc, {
      startY: 60,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    // Tabela de Issues
    doc.text("Detalhes Técnicos", 14, doc.lastAutoTable.finalY + 15);

    const issuesData = data.issues.map(issue => [
      issue.severity,
      issue.name,
      `${issue.file} (L: ${issue.line})`
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Gravidade', 'Vulnerabilidade', 'Local']],
      body: issuesData,
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38] },
      styles: { fontSize: 8 }
    });

    doc.save(`sentinel-report-${Date.now()}.pdf`);
  };

  // 3. Loading State
  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900"><Loader2 className="animate-spin w-12 h-12 text-indigo-500"/></div>;
  if (!latestScan) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">Nenhum dado encontrado. Execute um scan primeiro.</div>;

  const isCritical = latestScan.summary.critical > 0;
  const pieData = [
    { name: 'Crítico', value: latestScan.summary.critical }, 
    { name: 'Alto', value: latestScan.summary.high }, 
    { name: 'Médio', value: latestScan.summary.medium }, 
    { name: 'Baixo', value: latestScan.summary.low || 0 }
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* MENU LATERAL */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10 shadow-xl hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-lg">
             <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Sentinel</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('vulnerabilities')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'vulnerabilities' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <List size={20} /> Vulnerabilidades
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <User size={20} /> Utilizadores
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Settings size={20} /> Definições
          </button>
        </nav>
        
        <div className="p-6 border-t border-slate-800 text-xs text-slate-500 text-center">
          Sentinel Enterprise v2.0
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 md:ml-64 p-8 md:p-12 overflow-y-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 capitalize">{activeTab === 'dashboard' ? 'Visão Geral' : activeTab}</h1>
            <p className="text-slate-500 mt-1">Monitorização de Segurança em Tempo Real</p>
          </div>
          {activeTab === 'dashboard' && (
             <button onClick={generatePDF} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-900 shadow-md transition-all active:scale-95">
                <Download size={18} /> Exportar Relatório
             </button>
          )}
        </header>

        {/* TAB DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Gráfico */}
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
                            <Area type="monotone" dataKey="total" stroke="#475569" fill="transparent" strokeWidth={2} name="Total Issues" />
                            <Area type="monotone" dataKey="critical" stroke="#EF4444" fill="url(#colorCritical)" strokeWidth={3} name="Critical" />
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

        {/* TAB VULNERABILIDADES */}
        {activeTab === 'vulnerabilities' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
             <div className="divide-y divide-slate-100">
                {latestScan.issues.map((issue, index) => (
                  <div key={index} className="p-6 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all">
                    <div className="flex gap-4">
                        <div className={`mt-1 w-2 h-12 rounded-full shrink-0 ${issue.severity === 'CRITICO' ? 'bg-red-500' : issue.severity === 'ALTO' ? 'bg-yellow-500' : 'bg-blue-400'}`}></div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-lg">{issue.name}</h4>
                            <p className="text-slate-500 font-mono text-sm break-all">{issue.file} : {issue.line}</p>
                            {issue.snippet && <code className="block mt-2 bg-slate-100 p-2 rounded text-xs text-slate-600 font-mono overflow-x-auto max-w-lg">{issue.snippet}</code>}
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity self-start md:self-center">
                         <button className="px-3 py-1.5 text-xs font-bold bg-slate-200 text-slate-600 rounded hover:bg-slate-300">Ignorar</button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* TABS PLACEHOLDER */}
        {(activeTab === 'users' || activeTab === 'settings') && (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 animate-in zoom-in-95 duration-300">
                <Settings className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Funcionalidade em desenvolvimento...</p>
                <p className="text-xs text-slate-400 mt-1">Disponível na versão 2.1</p>
            </div>
        )}

      </main>
    </div>
  );
}