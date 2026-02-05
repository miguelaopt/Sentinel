"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Shield, AlertTriangle, FileCode, Loader2, CheckCircle2, Activity, Clock } from 'lucide-react';

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatestScan() {
      const { data: scans, error } = await supabase
        .from('scans')
        .select('report')
        .order('created_at', { ascending: false })
        .limit(1);

      if (scans && scans.length > 0) {
        setData(scans[0].report);
      }
      setLoading(false);
    }

    fetchLatestScan();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><Loader2 className="animate-spin w-12 h-12 text-indigo-600"/></div>;
  if (!data) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="p-8 bg-white rounded-xl shadow-md text-center"><Shield className="w-12 h-12 text-gray-400 mx-auto mb-4"/><h2 className="text-xl font-bold text-gray-700">Nenhum scan encontrado</h2><p className="text-gray-500 mt-2">Execute o scanner pela primeira vez para ver os dados aqui.</p></div></div>;

  const chartData = [
    { name: 'Crítico', value: data.summary.critical },
    { name: 'Alto', value: data.summary.high },
    { name: 'Médio', value: data.summary.medium },
    { name: 'Baixo', value: data.summary.low || 0 },
  ].filter(item => item.value > 0);

  const isCritical = data.summary.critical > 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabeçalho Melhorado */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-xl">
                <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Sentinel Dashboard</h1>
                <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                    <Activity size={16} className="text-indigo-500" /> Monitorização em Tempo Real
                </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-4 py-2 rounded-lg">
            <Clock size={16} />
            <span>Último scan: {new Date(data.scan_timestamp).toLocaleString()}</span>
          </div>
        </div>

        {/* Cartões de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Cartão 1: Total */}
          <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-100 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-indigo-50 w-24 h-24 rounded-full opacity-50"></div>
            <div>
                <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Vulnerabilidades Totais</h3>
                <p className="text-5xl font-extrabold text-slate-800 mt-4">{data.total_issues}</p>
            </div>
            <div className="mt-6 text-sm text-slate-400 flex items-center gap-1">
                <AlertTriangle size={14} /> {data.issues.length} ficheiros afetados
            </div>
          </div>
          
          {/* Cartão 2: Gráfico */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex flex-col items-center justify-center">
             <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-4 self-start">Distribuição de Risco</h3>
             <div className="h-48 w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie data={chartData} innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                        {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{filter: `drop-shadow(0px 4px 8px ${COLORS[index % COLORS.length]}40)`}} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} itemStyle={{fontWeight: 'bold'}}/>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: '500', color: '#64748b'}}/>
                    </PieChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Cartão 3: Estado do Sistema (CORREÇÃO DE CONTRASTE AQUI) */}
          <div className={`p-8 rounded-2xl shadow-md border flex flex-col justify-center items-center text-center relative overflow-hidden
            ${isCritical 
                ? 'bg-gradient-to-br from-red-500 to-red-700 text-white border-red-500' // Fundo Escuro, Texto Branco
                : 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-emerald-500'}`}> {/* Fundo Escuro, Texto Branco */}
            
            {/* Efeito de brilho no fundo */}
            <div className="absolute inset-0 bg-white/10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent opacity-40"></div>

            <div className="relative z-10 bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm">
                {isCritical ? <AlertTriangle className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
            </div>
            <h3 className="relative z-10 text-lg font-bold opacity-90 uppercase tracking-widest mb-2">Estado do Sistema</h3>
            <p className="relative z-10 text-2xl font-extrabold leading-tight">
              {isCritical ? 'RISCO CRÍTICO ATIVO' : 'Sistema Seguro'}
            </p>
             {isCritical && <p className="relative z-10 mt-4 text-sm bg-red-800/30 py-1 px-3 rounded-full border border-red-400/30 inline-block">Ação Imediata Necessária</p>}
          </div>
        </div>

        {/* Lista de Problemas */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Detalhes do Scan</h2>
            <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-lg border">{data.issues.length} itens encontrados</span>
          </div>
          
          <div className="divide-y divide-slate-100">
            {data.issues.map((issue, index) => (
              <div key={index} className="p-6 hover:bg-indigo-50/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex gap-4 items-start">
                  <div className={`p-2 rounded-lg shrink-0 ${issue.severity === 'CRITICO' ? 'bg-red-100 text-red-600' : issue.severity === 'ALTO' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{issue.name}</h4>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mt-2 bg-slate-100 w-fit px-3 py-1.5 rounded-md font-mono">
                      <FileCode size={14} className="text-slate-400" />
                      <span className="truncate max-w-md">{issue.file} <span className="text-slate-400 mx-1">|</span> Linha {issue.line}</span>
                    </div>
                    {issue.snippet && (
                        <div className="mt-3 text-xs font-mono bg-slate-800 text-slate-300 p-3 rounded-lg border border-slate-700 shadow-inner overflow-x-auto">
                            <code>{issue.snippet.trim()}</code>
                        </div>
                    )}
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-sm shrink-0 text-center md:text-right
                  ${issue.severity === 'CRITICO' ? 'bg-red-500 text-white md:bg-red-100 md:text-red-700' : 
                    issue.severity === 'ALTO' ? 'bg-yellow-500 text-white md:bg-yellow-100 md:text-yellow-800' : 
                    'bg-blue-500 text-white md:bg-blue-100 md:text-blue-800'}`}>
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