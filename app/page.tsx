'use client';

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Download, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ===========================
// Utilidades
// ===========================
const eur = (n) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(Number(n || 0));

function monthDiff(from, to){
  const a = new Date(from.getFullYear(), from.getMonth(), 1);
  const b = new Date(to.getFullYear(), to.getMonth(), 1);
  return (b.getFullYear() - a.getFullYear())*12 + (b.getMonth() - a.getMonth());
}

function rangeMonths(start, end){
  const out = [];
  const d0 = new Date(start.getFullYear(), start.getMonth(), 1);
  const d1 = new Date(end.getFullYear(), end.getMonth(), 1);
  const total = monthDiff(d0, d1) + 1;
  for(let i = 0; i<total; i++){
    const d = new Date(d0.getFullYear(), d0.getMonth()+i, 1);
    out.push(d);
  }
  return out;
}

export default function Page(){
  // ===========================
  // Estado
  // ===========================
  const [inicioMes, setInicioMes] = useState(0);
  const [inicioAnio, setInicioAnio] = useState(new Date().getFullYear());
  const [duracion, setDuracion] = useState(12);

  const [cashInicial, setCashInicial] = useState(50000);
  const [ingresos, setIngresos] = useState(10000);
  const [costos, setCostos] = useState(7000);

  const [inversionON, setInversionON] = useState(false);
  const [inversionMes, setInversionMes] = useState(0);
  const [inversionImporte, setInversionImporte] = useState(20000);

  const [creditoON, setCreditoON] = useState(false);
  const [creditoMes, setCreditoMes] = useState(6);
  const [creditoImporte, setCreditoImporte] = useState(30000);
  const [creditoCuotas, setCreditoCuotas] = useState(12);
  const [creditoTIN, setCreditoTIN] = useState(5);

  const [comision, setComision] = useState(1);

  // ===========================
  // Cálculos memoizados
  // ===========================
  const data = useMemo(()=>{
    const start = new Date(inicioAnio, inicioMes, 1);
    const end = new Date(inicioAnio, inicioMes + duracion -1, 1);
    const meses = rangeMonths(start, end);

    let cashAnt = cashInicial;
    const arr = [];

    const cuotaCapital = creditoON ? (creditoImporte / creditoCuotas) : 0;

    meses.forEach((m, idx)=>{
      const ing = ingresos;
      const cost = costos;
      let inv = 0;
      let credito = 0;
      let cuota = 0;

      if(inversionON && idx === inversionMes){
        inv = inversionImporte;
      }
      if(creditoON && idx === creditoMes){
        credito = creditoImporte;
      }
      if(creditoON && idx >= creditoMes && idx < (creditoMes + creditoCuotas)){
        const saldoPendiente = creditoImporte - cuotaCapital*(idx - creditoMes);
        const intereses = (saldoPendiente*(creditoTIN/100))/12;
        cuota = cuotaCapital + intereses;
      }

      const com = (ing * comision)/100;
      const cf = ing - cost - inv - cuota - com + credito;
      const cashFin = cashAnt + cf;

      arr.push({
        mes: m.toLocaleDateString("es-ES", {year:"numeric",month:"short"}),
        ingresos: ing,
        costos: cost,
        inversion: inv,
        cuotaCredito: cuota,
        credito: credito,
        comision: com,
        cf: cf,
        cashFinal: cashFin
      });

      cashAnt = cashFin;
    });

    return arr;
  }, [inicioMes, inicioAnio, duracion, cashInicial, ingresos, costos, inversionON, inversionMes, inversionImporte, creditoON, creditoMes, creditoImporte, creditoCuotas, creditoTIN, comision]);

  // ===========================
  // Totales
  // ===========================
  const totalIngresos = useMemo(()=> data.reduce((s,r)=>s+r.ingresos,0), [data]);
  const totalCostos = useMemo(()=> data.reduce((s,r)=>s+r.costos,0), [data]);
  const totalInversion = useMemo(()=> data.reduce((s,r)=>s+r.inversion,0), [data]);
  const totalCuotas = useMemo(()=> data.reduce((s,r)=>s+r.cuotaCredito,0), [data]);
  const totalComision = useMemo(()=> data.reduce((s,r)=>s+r.comision,0), [data]);
  const totalCF = useMemo(()=> data.reduce((s,r)=>s+r.cf,0), [data]);

  const cashFinal = data.length>0 ? data[data.length-1].cashFinal : cashInicial;
  const minCash = useMemo(()=>{
    let min = cashInicial;
    data.forEach(r=>{ if(r.cashFinal<min) min=r.cashFinal; });
    return min;
  }, [data, cashInicial]);

  // ===========================
  // Funciones auxiliares
  // ===========================
  const descargarCSV = ()=>{
    let csv = "Mes,Ingresos,Costos,Inversión,Cuota Crédito,Crédito,Comisión,CF,Cash Final\n";
    data.forEach(r=>{
      csv += `"${r.mes}",${r.ingresos},${r.costos},${r.inversion},${r.cuotaCredito},${r.credito},${r.comision},${r.cf},${r.cashFinal}\n`;
    });
    const blob = new Blob([csv], {type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url;
    a.download="simulacion-adiva.csv";
    a.click();
  };

  const resetear = ()=>{
    setInicioMes(0);
    setInicioAnio(new Date().getFullYear());
    setDuracion(12);
    setCashInicial(50000);
    setIngresos(10000);
    setCostos(7000);
    setInversionON(false);
    setInversionMes(0);
    setInversionImporte(20000);
    setCreditoON(false);
    setCreditoMes(6);
    setCreditoImporte(30000);
    setCreditoCuotas(12);
    setCreditoTIN(5);
    setComision(1);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Título */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">ADIVA Planner</h1>
        <p className="text-gray-600 mt-2">Simulador de flujo de caja mensual</p>
      </div>

      {/* Panel de controles */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Periodo */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Período de Simulación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Mes de inicio</Label>
                <Select value={String(inicioMes)} onValueChange={v=>setInicioMes(Number(v))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m,i)=>(
                      <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Año</Label>
                <Input type="number" value={inicioAnio} onChange={e=>setInicioAnio(Number(e.target.value))}/>
              </div>
              <div>
                <Label>Duración (meses)</Label>
                <div className="flex items-center gap-2">
                  <Slider value={[duracion]} onValueChange={v=>setDuracion(v[0])} min={1} max={36} step={1} className="flex-1"/>
                  <span className="w-12 text-right font-medium">{duracion}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cash inicial e Ingresos/Costos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Financiero Mensual</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Cash inicial (€)</Label>
                <Input type="number" value={cashInicial} onChange={e=>setCashInicial(Number(e.target.value))}/>
              </div>
              <div>
                <Label>Ingresos mensuales (€)</Label>
                <Input type="number" value={ingresos} onChange={e=>setIngresos(Number(e.target.value))}/>
              </div>
              <div>
                <Label>Costos mensuales (€)</Label>
                <Input type="number" value={costos} onChange={e=>setCostos(Number(e.target.value))}/>
              </div>
            </div>
          </div>

          {/* Comision */}
          <div>
            <Label>Comisión sobre ingresos (%)</Label>
            <div className="flex items-center gap-2">
              <Slider value={[comision]} onValueChange={v=>setComision(v[0])} min={0} max={10} step={0.1} className="flex-1"/>
              <span className="w-16 text-right font-medium">{comision.toFixed(1)}%</span>
            </div>
          </div>

          {/* Inversion */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Inversión</h3>
              <div className="flex items-center gap-2">
                <Label>Activar</Label>
                <Switch checked={inversionON} onCheckedChange={setInversionON}/>
              </div>
            </div>
            {inversionON && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Mes de inversión (0=primero)</Label>
                  <Input type="number" value={inversionMes} onChange={e=>setInversionMes(Number(e.target.value))} min={0}/>
                </div>
                <div>
                  <Label>Importe (€)</Label>
                  <Input type="number" value={inversionImporte} onChange={e=>setInversionImporte(Number(e.target.value))}/>
                </div>
              </div>
            )}
          </div>

          {/* Credito */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Crédito</h3>
              <div className="flex items-center gap-2">
                <Label>Activar</Label>
                <Switch checked={creditoON} onCheckedChange={setCreditoON}/>
              </div>
            </div>
            {creditoON && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Mes de desembolso</Label>
                  <Input type="number" value={creditoMes} onChange={e=>setCreditoMes(Number(e.target.value))} min={0}/>
                </div>
                <div>
                  <Label>Importe (€)</Label>
                  <Input type="number" value={creditoImporte} onChange={e=>setCreditoImporte(Number(e.target.value))}/>
                </div>
                <div>
                  <Label>Cuotas</Label>
                  <Input type="number" value={creditoCuotas} onChange={e=>setCreditoCuotas(Number(e.target.value))} min={1}/>
                </div>
                <div>
                  <Label>TIN (%)</Label>
                  <Input type="number" value={creditoTIN} onChange={e=>setCreditoTIN(Number(e.target.value))} step={0.1}/>
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <Button onClick={descargarCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4"/>Descargar CSV
            </Button>
            <Button onClick={resetear} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4"/>Resetear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Cash Final</div>
            <div className="text-2xl font-bold" style={{color: cashFinal>=0?"#10b981":"#ef4444"}}>
              {eur(cashFinal)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Cash Mínimo</div>
            <div className="text-2xl font-bold" style={{color: minCash>=0?"#10b981":"#ef4444"}}>
              {eur(minCash)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Ingresos</div>
            <div className="text-2xl font-bold text-green-600">{eur(totalIngresos)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Costos</div>
            <div className="text-2xl font-bold text-red-600">{eur(totalCostos)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Evolución del Cash</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="mes" angle={-45} textAnchor="end" height={80}/>
              <YAxis/>
              <Tooltip
                formatter={(val)=> typeof val==="number"? eur(val): val}
                labelStyle={{color:"#000"}}
              />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3"/>
              <Line type="monotone" dataKey="cashFinal" stroke="#3b82f6" strokeWidth={2} name="Cash"/>
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Detalle Mensual</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Mes</th>
                  <th className="text-right p-2">Ingresos</th>
                  <th className="text-right p-2">Costos</th>
                  <th className="text-right p-2">Inversión</th>
                  <th className="text-right p-2">Cuota Crédito</th>
                  <th className="text-right p-2">Crédito</th>
                  <th className="text-right p-2">Comisión</th>
                  <th className="text-right p-2">CF</th>
                  <th className="text-right p-2">Cash Final</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r,i)=>(
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-2">{r.mes}</td>
                    <td className="text-right p-2">{eur(r.ingresos)}</td>
                    <td className="text-right p-2">{eur(r.costos)}</td>
                    <td className="text-right p-2">{eur(r.inversion)}</td>
                    <td className="text-right p-2">{eur(r.cuotaCredito)}</td>
                    <td className="text-right p-2">{eur(r.credito)}</td>
                    <td className="text-right p-2">{eur(r.comision)}</td>
                    <td className="text-right p-2" style={{color:r.cf>=0?"#10b981":"#ef4444"}}>
                      {eur(r.cf)}
                    </td>
                    <td className="text-right p-2 font-bold" style={{color:r.cashFinal>=0?"#10b981":"#ef4444"}}>
                      {eur(r.cashFinal)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-100">
                  <td className="p-2">TOTAL</td>
                  <td className="text-right p-2">{eur(totalIngresos)}</td>
                  <td className="text-right p-2">{eur(totalCostos)}</td>
                  <td className="text-right p-2">{eur(totalInversion)}</td>
                  <td className="text-right p-2">{eur(totalCuotas)}</td>
                  <td className="text-right p-2">-</td>
                  <td className="text-right p-2">{eur(totalComision)}</td>
                  <td className="text-right p-2" style={{color:totalCF>=0?"#10b981":"#ef4444"}}>
                    {eur(totalCF)}
                  </td>
                  <td className="text-right p-2">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}