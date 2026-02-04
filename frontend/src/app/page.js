"use client";
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Shield, AlertTriangle, CheckCircle, FileCode } from 'lucide-react';

// Dados simulados (Isto virá do teu JSON no futuro)
const mockData = {
  scan_timestamp: "2026-02-04T18:30:00",
  total_issues: 5,
  summary: { critical: 2, high: 2, medium: 1 },
  issues: [
    { name: "Chave AWS", severity: "CRITICO", file: "./config.py", line: 12 },
    { name: "Chave Privada", severity: "CRITICO", file: "./keys.pem", line: 1 },
    { name: "Password Hardcoded", severity: "ALTO", file: "./db.py", line: 45 },
    { name: "Token Stripe", severity: "ALTO", file: "./payment.py", line: 8 },
    { name: "Debug Mode On", severity: "MEDIO", file: "./settings.py", line: 2 },
  ]
};

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6']; // Vermelho, Amarelo, Azul

export default function Home() {
  const chartData = [
    { name: 'Crítico', value: mockData.summary.critical },
    { name: 'Alto', value: mockData.summary.high },
    { name: 'Médio', value: mockData.summary.medium },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Sentinel Dashboard</h1>
          </div>
          <span className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-medium">
            Sistema Operacional
          </span>
        </div>

        {/* Cartões de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm">Total de Vulnerabilidades</h3>
            <p className="text-4xl font-bold text-gray-800 mt-2">{mockData.total_issues}</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
            <h3 className="text-gray-500 text-sm mb-2">Distribuição de Risco</h3>
            <div className="h-32 w-full">
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
          </div>

          <div className="bg-red-50 p-6 rounded-xl border border-red-100">
            <h3 className="text-red-600 text-sm">Ação Necessária</h3>
            <p className="text-lg font-semibold text-red-800 mt-2">
              Resolver {mockData.summary.critical} itens críticos imediatamente.
            </p>
          </div>
        </div>

        {/* Lista de Problemas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Detalhes do Scan</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {mockData.issues.map((issue, index) => (
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