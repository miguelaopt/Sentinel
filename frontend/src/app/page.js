"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // Importa a tua conexão
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Shield, AlertTriangle, FileCode, Loader2 } from 'lucide-react';

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6'];

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatestScan() {
      // Vai buscar o registo mais recente ordenado por data
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

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600"/></div>;
  if (!data) return <div className="p-10 text-center">Nenhum scan encontrado. Corre o scanner primeiro!</div>;

  // Prepara dados para o gráfico
  const chartData = [
    { name: 'Crítico', value: data.summary.critical },
    { name: 'Alto', value: data.summary.high },
    { name: 'Médio', value: data.summary.medium },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10 text-indigo-600" />
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Sentinel Dashboard</h1>
                <p className="text-sm text-gray-500">Última atualização: {new Date(data.scan_timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Cartões de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm">Total de Vulnerabilidades</h3>
            <p className="text-4xl font-bold text-gray-800 mt-2">{data.total_issues}</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-40">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={30} outerRadius={50} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
          </div>

          <div className={`${data.summary.critical > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} p-6 rounded-xl border`}>
            <h3 className={data.summary.critical > 0 ? 'text-red-600' : 'text-green-600'}>Estado do Sistema</h3>
            <p className="text-lg font-semibold mt-2">
              {data.summary.critical > 0 ? 'RISCO CRÍTICO DETETADO' : 'Sistema Seguro'}
            </p>
          </div>
        </div>

        {/* Lista de Problemas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Detalhes do Scan</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data.issues.map((issue, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors flex items-start justify-between">
                <div className="flex gap-4">
                  <AlertTriangle className={`w-6 h-6 ${issue.severity === 'CRITICO' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <div>
                    <h4 className="font-semibold text-gray-800">{issue.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <FileCode size={14} />
                      <span>{issue.file} : Linha {issue.line}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-bold 
                  ${issue.severity === 'CRITICO' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
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