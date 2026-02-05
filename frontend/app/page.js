"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart
} from 'recharts';
import { Shield, AlertTriangle, FileCode, Loader2, CheckCircle2, Activity, Clock, Download, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

export default function Home() {
  const [latestScan, setLatestScan] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: scans, error } = await supabase
        .from('scans')
        .select('created_at, report')
        .order('created_at', { ascending: true }) 
        .limit(30);

      if (scans && scans.length > 0) {
        const history = scans.map(scan => ({
          date: format(new Date(scan.created_at), 'dd/MM HH:mm'),
          critical: scan.report.summary.critical,
          total: scan.report.total_issues
        }));
        setHistoryData(history);
        setLatestScan(scans[scans.length - 1].report);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    const data = latestScan;

    doc.setFillColor(31, 41, 55); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Sentinel Enterprise Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);

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

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><Loader2 className="animate-spin w-12 h-12 text-indigo-600"/></div>;
  if (!latestScan) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="p-8 bg-white rounded-xl shadow-md text-center"><Shield className="w-12 h-12 text-gray-400 mx-auto mb-4"/><h2 className="text-xl font-bold text-gray-700">Nenhum scan encontrado</h2></div></div>;

  const pieData = [
    { name: 'Crítico', value: latestScan.summary.critical },
    { name: 'Alto', value: latestScan.summary.high },
    { name: 'Médio', value: latestScan.summary.medium },
    { name: 'Baixo', value: latestScan.summary.low || 0 },
  ].filter(item => item.value > 0);

  const isCritical = latestScan.summary.critical > 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
                <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Sentinel Dashboard</h1>
                <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                    <Activity size={16} className="text-green-500" /> Sistema Operacional • v1.2 Enterprise
                </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
             <button onClick={generatePDF} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-900 transition-all shadow-md hover:shadow-lg active:scale-95">
                <Download size={18} /> Exportar PDF
             </button>
          </div>
        </div>

        {/* GRÁFICO CORRIGIDO - Cores Escuras */}
        <div className="mb-8 bg-white p-6 rounded-2xl shadow-md border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <TrendingUp className="text-indigo-500"/> Tendência de Risco
                </h3>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData}>
                        <defs>
                            <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        {/* AQUI: tick={{fill: '#334155'}} para texto escuro */}
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#334155', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#334155', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                        <RechartsTooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0'}} />
                        {/* AQUI: stroke mais escuro para o Total */}
                        <Area type="monotone" dataKey="total" stroke="#475569" fill="transparent" strokeWidth={2} name="Total Bugs" />
                        <Area type="monotone" dataKey="critical" stroke="#EF4444" fill="url(#colorCritical)" strokeWidth={3} name="Críticos" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex flex-col items-center justify-center">
             <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2 self-start">Distribuição Atual</h3>
             <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie data={pieData} innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="right" layout="vertical" align="right" />
                    </PieChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className={`col-span-2 p-8 rounded-2xl shadow-md border flex flex-col justify-center items-center text-center relative overflow-hidden
            ${isCritical 
                ? 'bg-gradient-to-r from-red-600 to-red-800 text-white border-red-500' 
                : 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white border-emerald-500'}`}>
            <div className="relative z-10 flex items-center gap-4">
                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                    {isCritical ? <AlertTriangle className="w-12 h-12" /> : <CheckCircle2 className="w-12 h-12" />}
                </div>
                <div className="text-left">
                    <h3 className="text-lg font-bold opacity-90 uppercase tracking-widest">Diagnóstico Atual</h3>
                    <p className="text-3xl font-extrabold leading-tight">
                    {isCritical ? 'VULNERÁVEL' : 'SEGURO'}
                    </p>
                </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileCode className="text-indigo-500" /> Detalhe dos Ficheiros
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {latestScan.issues.map((issue, index) => (
              <div key={index} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-4 items-start">
                  <div className={`mt-1 w-2 h-12 rounded-full ${issue.severity === 'CRITICO' ? 'bg-red-500' : issue.severity === 'ALTO' ? 'bg-yellow-500' : 'bg-blue-400'}`}></div>
                  <div>
                    <h4 className="text-md font-bold text-slate-800">{issue.name}</h4>
                    <p className="text-sm text-slate-500 font-mono mt-1">{issue.file} : {issue.line}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                  ${issue.severity === 'CRITICO' ? 'bg-red-100 text-red-700' : 
                    issue.severity === 'ALTO' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-blue-50 text-blue-700'}`}>
                  {issue.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}