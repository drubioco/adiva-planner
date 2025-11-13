"use client";
import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Download, RefreshCw } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

const eur = (n: number) => 
  new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:2})
  .format(Number(n||0));

function monthDiff(from: Date, to: Date){
  const a = new Date(from.getFullYear(), from.getMonth(), 1);
  const b = new Date(to.getFullYear(), to.getMonth(), 1);
  return (b.getFullYear()-a.getFullYear())*12 + (b.getMonth()-a.getMonth());
}

function rangeMonths(start: Date, end: Date){
  const out: Date[] = [];
  const d0 = new Date(start.getFullYear(), start.getMonth(), 1);
  const d1 = new Date(end.getFullYear(), end.getMonth(), 1);
  const total = monthDiff(d0, d1);
  for (let i = 0; i <= total; i++){
    out.push(new Date(d0.getFullYear(), d0.getMonth()+i, 1));
  }
  return out;
}

export default function AdivaPlanner(){
  const [cashStart, setCashStart] = useState<number>(50000);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(5000);
  const [monthlyExpense, setMonthlyExpense] = useState<number>(3500);
  const [oneTimeIncome, setOneTimeIncome] = useState<number>(0);
  const [oneTimeIncomeMonth, setOneTimeIncomeMonth] = useState<number>(6);
  const [oneTimeExpense, setOneTimeExpense] = useState<number>(0);
  const [oneTimeExpenseMonth, setOneTimeExpenseMonth] = useState<number>(12);
  const [showOneTimeIncome, setShowOneTimeIncome] = useState<boolean>(false);
  const [showOneTimeExpense, setShowOneTimeExpense] = useState<boolean>(false);
  const [horizonMonths, setHorizonMonths] = useState<number>(24);

  const cashFlow = useMemo(() => {
    const start = new Date();
    const end = new Date(start.getFullYear(), start.getMonth() + horizonMonths, 1);
    const months = rangeMonths(start, end);
    const data = months.map((m, i) => {
      const revenue = monthlyIncome + (showOneTimeIncome && i === oneTimeIncomeMonth ? oneTimeIncome : 0);
      const expense = monthlyExpense + (showOneTimeExpense && i === oneTimeExpenseMonth ? oneTimeExpense : 0);
      const net = revenue - expense;
      return { month: i, date: m, revenue, expense, net };
    });
    const balance: number[] = [];
    balance[0] = cashStart + data[0].net;
    for (let i = 1; i < data.length; i++){
      balance[i] = balance[i - 1] + data[i].net;
    }
    const chartData = data.map((d, i) => ({
      month: i,
      Saldo: balance[i],
      Ingresos: d.revenue,
      Gastos: -d.expense
    }));
    return { data, balance, chartData };
  }, [cashStart, monthlyIncome, monthlyExpense, oneTimeIncome, oneTimeIncomeMonth,
      oneTimeExpense, oneTimeExpenseMonth, showOneTimeIncome, showOneTimeExpense, horizonMonths]);

  const minBalance = useMemo(() => Math.min(...cashFlow.balance), [cashFlow]);
  const finalBalance = useMemo(() => cashFlow.balance[cashFlow.balance.length - 1], [cashFlow]);

  const handleReset = () => {
    setCashStart(50000);
    setMonthlyIncome(5000);
    setMonthlyExpense(3500);
    setOneTimeIncome(0);
    setOneTimeIncomeMonth(6);
    setOneTimeExpense(0);
    setOneTimeExpenseMonth(12);
    setShowOneTimeIncome(false);
    setShowOneTimeExpense(false);
    setHorizonMonths(24);
  };

  const exportCSV = () => {
    const headers = ["Mes", "Fecha", "Ingresos", "Gastos", "Neto", "Saldo"];
    const rows = cashFlow.data.map((d, i) => [
      i,
      d.date.toLocaleDateString("es-ES", { month: "short", year: "numeric" }),
      d.revenue,
      d.expense,
      d.net,
      cashFlow.balance[i]
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "adiva-planner.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            ADIVA Planner
          </h1>
          <p className="text-zinc-400 mt-2">Simulador de Flujo de Caja</p>
        </div>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cashStart">Caja Inicial</Label>
                <Input
                  id="cashStart"
                  type="number"
                  value={cashStart}
                  onChange={(e) => setCashStart(Number(e.target.value))}
                  className="bg-zinc-900 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyIncome">Ingresos Mensuales</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="bg-zinc-900 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyExpense">Gastos Mensuales</Label>
                <Input
                  id="monthlyExpense"
                  type="number"
                  value={monthlyExpense}
                  onChange={(e) => setMonthlyExpense(Number(e.target.value))}
                  className="bg-zinc-900 border-zinc-700"
                />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showOneTimeIncome}
                  onCheckedChange={setShowOneTimeIncome}
                />
                <Label>Ingreso Puntual</Label>
              </div>
              {showOneTimeIncome && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                  <div className="space-y-2">
                    <Label htmlFor="oneTimeIncome">Cantidad</Label>
                    <Input
                      id="oneTimeIncome"
                      type="number"
                      value={oneTimeIncome}
                      onChange={(e) => setOneTimeIncome(Number(e.target.value))}
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oneTimeIncomeMonth">Mes: {oneTimeIncomeMonth}</Label>
                    <Slider
                      value={[oneTimeIncomeMonth]}
                      onValueChange={(v) => setOneTimeIncomeMonth(v[0])}
                      max={horizonMonths}
                      step={1}
                      className="py-4"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showOneTimeExpense}
                  onCheckedChange={setShowOneTimeExpense}
                />
                <Label>Gasto Puntual</Label>
              </div>
              {showOneTimeExpense && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                  <div className="space-y-2">
                    <Label htmlFor="oneTimeExpense">Cantidad</Label>
                    <Input
                      id="oneTimeExpense"
                      type="number"
                      value={oneTimeExpense}
                      onChange={(e) => setOneTimeExpense(Number(e.target.value))}
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oneTimeExpenseMonth">Mes: {oneTimeExpenseMonth}</Label>
                    <Slider
                      value={[oneTimeExpenseMonth]}
                      onValueChange={(v) => setOneTimeExpenseMonth(v[0])}
                      max={horizonMonths}
                      step={1}
                      className="py-4"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Horizonte: {horizonMonths} meses</Label>
                <Slider
                  value={[horizonMonths]}
                  onValueChange={(v) => setHorizonMonths(v[0])}
                  min={6}
                  max={60}
                  step={1}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
            <CardContent className="p-6">
              <div className="text-sm text-blue-200">Saldo Inicial</div>
              <div className="text-2xl font-bold mt-2">{eur(cashStart)}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700">
            <CardContent className="p-6">
              <div className="text-sm text-green-200">Saldo Final</div>
              <div className="text-2xl font-bold mt-2">{eur(finalBalance)}</div>
            </CardContent>
          </Card>
          <Card className={`bg-gradient-to-br ${minBalance < 0 ? 'from-red-900 to-red-800 border-red-700' : 'from-purple-900 to-purple-800 border-purple-700'}`}>
            <CardContent className="p-6">
              <div className={`text-sm ${minBalance < 0 ? 'text-red-200' : 'text-purple-200'}`}>Saldo Mínimo</div>
              <div className="text-2xl font-bold mt-2">{eur(minBalance)}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Evolución del Saldo</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={cashFlow.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  formatter={(value: number) => eur(value)}
                />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Detalle Mensual</h2>
              <div className="space-x-2">
                <Button onClick={exportCSV} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button onClick={handleReset} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resetear
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left p-2">Mes</th>
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-right p-2">Ingresos</th>
                    <th className="text-right p-2">Gastos</th>
                    <th className="text-right p-2">Neto</th>
                    <th className="text-right p-2">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlow.data.map((d, i) => (
                    <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-700/50">
                      <td className="p-2">{i}</td>
                      <td className="p-2">{d.date.toLocaleDateString("es-ES", { month: "short", year: "numeric" })}</td>
                      <td className="text-right p-2 text-green-400">{eur(d.revenue)}</td>
                      <td className="text-right p-2 text-red-400">{eur(d.expense)}</td>
                      <td className={`text-right p-2 ${d.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>{eur(d.net)}</td>
                      <td className={`text-right p-2 font-semibold ${cashFlow.balance[i] >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{eur(cashFlow.balance[i])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
