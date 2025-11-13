'use client';

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Download, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ==========================
// Utilidades
// ==========================
const eur = (n) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(Number(n || 0));

function monthDiff(from, to){
  const a = new Date(from.getFullYear(), from.getMonth(), 1);
  const b = new Date(to.getFullYear(), to.getMonth(), 1);
  return (b.getFullYear()-a.getFullYear())*12 + (b.getMonth()-a.getMonth());
}

function rangeMonths(start, end){
  const out = [];
  const d0 = new Date(start.getFullYear(), start.getMonth(), 1);
  const d1 = new Date(end.getFullYear(), end.getMonth(), 1);
  const total = monthDiff(d0, d1) + 1;
  for(let i=0;i<total;i++){
    const d = new Date(d0.getFullYear(), d0.getMonth()+i, 1);
    out.push(d);
  }
  return out;
}

// ==========================
// Componente principal
// ==========================
export default function AdivaPlanner(){
  // Supuestos base (del hilo):
  const [startCash, setStartCash] = useState(80000);
  const [rent2025, setRent2025] = useState(24001.34);
  const [rentFrom, setRentFrom] = useState("2026-01");
  const [rentMonthly, setRentMonthly] = useState(25001.34);

  const [arras1Date, setArras1Date] = useState("2025-12");
  const [arras1Amt, setArras1Amt] = useState(80000);

  const [projFeeTotal, setProjFeeTotal] = useState(45000); // técnicos
  const [projUpfrontPct, setProjUpfrontPct] = useState(70); // % antes de licencia
  const [licenseTaxes, setLicenseTaxes] = useState(4500); // provisión entre 3k–6k

  const [arras2Date, setArras2Date] = useState("2026-06");
  const [arras2Amt, setArras2Amt] = useState(80000);

  const [escrituraDate, setEscrituraDate] = useState("2026-12");
  const [escrituraCash, setEscrituraCash] = useState(80000);

  const [promoterOn, setPromoterOn] = useState(false);
  const [promoterFeeHalf1OnLicense, setPromoterFeeHalf1OnLicense] = useState(125000); // 50% a licencia
  const [promoterFeeHalf2AfterOpen, setPromoterFeeHalf2AfterOpen] = useState(125000); // 50% a 6 meses de apertura

  const [obraStart, setObraStart] = useState("2027-01");
  const [obraMonths, setObraMonths] = useState(8);
  const [obraCost, setObraCost] = useState(450000);
  const [legalFinCost, setLegalFinCost] = useState(25000);
  const [obraFinancedPct, setObraFinancedPct] = useState(70); // % que NO sale de caja ADIVA

  const [openDate, setOpenDate] = useState("2027-09"); // 8 meses después aprox.

  // Fechas límite para el timeline
  const startTimeline = useMemo(()=> new Date(2025, 10, 1), []); // Nov 2025 (para sumar renta de 1 mes antes de dic)
  const endTimeline   = useMemo(()=> new Date(2027, 11, 1), []); // Dic 2027
  // Construcción de flujo mensual
  const data = useMemo(()=>{
    const months = rangeMonths(startTimeline, endTimeline);
    const map = new Map();
    months.forEach(d=>{
      const k = d.toISOString().slice(0,7);
      map.set(k, { date: k, inflow: 0, outflow: 0, events: [] });
    });

    // Rentas
    months.forEach(d=>{
      const k = d.toISOString().slice(0,7);
      const ym = k;
      let inflow = 0;
      if(ym < rentFrom){
        inflow = rent2025;
      } else {
        inflow = rentMonthly;
      }
      // solo a partir de Nov-2025 sumamos
      if(ym >= "2025-11"){
        map.get(k).inflow += inflow;
        map.get(k).events.push({ t: "Rentas", amt: inflow });
      }
    });

    // Hitos de salida
    function addOutflow(yyyymm, amt, label){
      const row = map.get(yyyymm);
      if(!row) return;
      row.outflow += amt;
      row.events.push({ t: label, amt: -amt });
    }

    addOutflow(arras1Date, Number(arras1Amt), "Arras 1");

    // Proyectos + tasas en el periodo entre arras 1 y arras 2 (70%)
    const upfront = projFeeTotal * (projUpfrontPct/100);
    // Repartimos ese 70% linealmente de ene-2026 a may-2026 (5 meses)
    const upfrontMonths = ["2026-01","2026-02","2026-03","2026-04","2026-05"]; 
    const perMonth = upfront / upfrontMonths.length;
    upfrontMonths.forEach(m=> addOutflow(m, perMonth, "Honorarios técnicos (70%)"));
    addOutflow("2026-03", Number(licenseTaxes), "Tasas/licencia (provisión)");

    addOutflow(arras2Date, Number(arras2Amt), "Arras 2");

    // Escritura
    addOutflow(escrituraDate, Number(escrituraCash), "Aporte en escritura");

    // Pago final técnicos (30%) en mes de licencia: usaremos el mes de escritura como proxy si no se cambia
    const finalTechMonth = escrituraDate; // editable si se desea
    addOutflow(finalTechMonth, projFeeTotal * (1 - projUpfrontPct/100), "Honorarios técnicos (30%)");

    // Promotor: 125k a licencia y 125k a 6 meses de apertura
    if(promoterOn){
      addOutflow(finalTechMonth, Number(promoterFeeHalf1OnLicense), "Fee promotor (50% a licencia)");
      // 6 meses después de apertura
      const open = new Date(openDate+"-01");
      const pay2 = new Date(open.getFullYear(), open.getMonth()+6, 1);
      const k2 = pay2.toISOString().slice(0,7);
      addOutflow(k2, Number(promoterFeeHalf2AfterOpen), "Fee promotor (50% tras apertura)");
    }

    // Obras: distribuir el coste no financiado a lo largo de obraMonths
    const obraStartDate = new Date(obraStart+"-01");
    const obraOut = obraCost * (1 - obraFinancedPct/100);
    const legalOut = legalFinCost; // suponemos no financiado
    const obraPerMonth = obraMonths>0 ? obraOut/obraMonths : obraOut;

    for(let i=0;i<obraMonths;i++){
      const d = new Date(obraStartDate.getFullYear(), obraStartDate.getMonth()+i, 1);
      const k = d.toISOString().slice(0,7);
      addOutflow(k, obraPerMonth, "Obra (no financiada)");
    }
    // Gastos legales/financieros: primer mes de obra
    addOutflow(obraStart, legalOut, "Gastos legales/financieros");

    // Acumular cash
    let cash = startCash; // incluye caja previa a Nov-2025
    const timeline = [];
    months.forEach(d=>{
      const k = d.toISOString().slice(0,7);
      const row = map.get(k);
      cash += row.inflow - row.outflow;
      timeline.push({
        Mes: k,
        "Entra (rentas)": row.inflow,
        "Sale (proyecto)": row.outflow,
        "Caja acumulada": cash,
        _events: row.events
      });
    });

    return timeline;
  }, [
    startCash,rent2025,rentFrom,rentMonthly,
    arras1Date,arras1Amt,projFeeTotal,projUpfrontPct,licenseTaxes,
    arras2Date,arras2Amt,escrituraDate,escrituraCash,
    promoterOn,promoterFeeHalf1OnLicense,promoterFeeHalf2AfterOpen,
    obraStart,obraMonths,obraCost,legalFinCost,obraFinancedPct,
    openDate,startTimeline,endTimeline
  ]);

  const totals = useMemo(()=>{
    const inflow = data.reduce((a,r)=>a+r["Entra (rentas)"],0);
    const outflow = data.reduce((a,r)=>a+r["Sale (proyecto)"],0);
    const endCash = data.length? data[data.length-1]["Caja acumulada"] : startCash;
    return { inflow, outflow, endCash };
  }, [data, startCash]);

  function downloadCSV(){
    const headers = Object.keys(data[0]||{}).filter(k=>!k.startsWith("_"));
    const rows = data.map(r=> headers.map(h=> r[h]));
    const csv = [headers.join(","), ...rows.map(x=>x.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "adiva_timeline.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function resetDefaults(){
    setStartCash(80000);
    setRent2025(24001.34);
    setRentFrom("2026-01");
    setRentMonthly(25001.34);
    setArras1Date("2025-12"); setArras1Amt(80000);
    setProjFeeTotal(45000); setProjUpfrontPct(70); setLicenseTaxes(4500);
    setArras2Date("2026-06"); setArras2Amt(80000);
    setEscrituraDate("2026-12"); setEscrituraCash(80000);
    setPromoterOn(false); setPromoterFeeHalf1OnLicense(125000); setPromoterFeeHalf2AfterOpen(125000);
    setObraStart("2027-01"); setObraMonths(8); setObraCost(450000); setLegalFinCost(25000); setObraFinancedPct(70);
    setOpenDate("2027-09");
  }

  return (
    <div className="min-h-screen w-full bg-neutral-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">ADIVA Planner – Flujo de caja por hitos</h1>
          <div className="flex gap-2">
            <Button onClick={downloadCSV} className="rounded-2xl"><Download className="mr-2 h-4 w-4"/>Exportar CSV</Button>
            <Button variant="secondary" onClick={resetDefaults} className="rounded-2xl"><RefreshCw className="mr-2 h-4 w-4"/>Reset</Button>
          </div>
        </header>

        {/* Panel de supuestos */}
        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6 grid md:grid-cols-4 gap-4">
            <div>
              <Label>Caja inicial</Label>
              <Input type="number" value={startCash} onChange={e=>setStartCash(Number(e.target.value))} />
            </div>
            <div>
              <Label>Renta mensual hasta {rentFrom}</Label>
              <Input type="number" value={rent2025} onChange={e=>setRent2025(Number(e.target.value))} />
            </div>
            <div>
              <Label>Renta mensual desde</Label>
              <Input type="month" value={rentFrom} onChange={e=>setRentFrom(e.target.value)} />
            </div>
            <div>
              <Label>Renta mensual (desde fecha)</Label>
              <Input type="number" value={rentMonthly} onChange={e=>setRentMonthly(Number(e.target.value))} />
            </div>
          </CardContent>
        </Card>

        {/* Hitos principales */}
        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6 grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Arras 1 – fecha</Label>
              <Input type="month" value={arras1Date} onChange={e=>setArras1Date(e.target.value)} />
              <Label>Arras 1 – importe</Label>
              <Input type="number" value={arras1Amt} onChange={e=>setArras1Amt(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Arras 2 – fecha</Label>
              <Input type="month" value={arras2Date} onChange={e=>setArras2Date(e.target.value)} />
              <Label>Arras 2 – importe</Label>
              <Input type="number" value={arras2Amt} onChange={e=>setArras2Amt(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Escritura – fecha</Label>
              <Input type="month" value={escrituraDate} onChange={e=>setEscrituraDate(e.target.value)} />
              <Label>Escritura – aporte ADIVA</Label>
              <Input type="number" value={escrituraCash} onChange={e=>setEscrituraCash(Number(e.target.value))} />
            </div>
          </CardContent>
        </Card>

        {/* Proyecto / Licencia */}
        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6 grid md:grid-cols-4 gap-4">
            <div>
              <Label>Honorarios técnicos (total)</Label>
              <Input type="number" value={projFeeTotal} onChange={e=>setProjFeeTotal(Number(e.target.value))} />
            </div>
            <div>
              <Label>Pago antes de licencia (%)</Label>
              <div className="pt-2">
                <Slider value={[projUpfrontPct]} onValueChange={(v)=>setProjUpfrontPct(v[0])} min={0} max={100} step={5} />
                <div className="text-sm mt-1">{projUpfrontPct}%</div>
              </div>
            </div>
            <div>
              <Label>Tasas/licencia (provisión)</Label>
              <Input type="number" value={licenseTaxes} onChange={e=>setLicenseTaxes(Number(e.target.value))} />
            </div>
            <div>
              <Label>Fecha de concesión (proxy)</Label>
              <Input type="month" value={escrituraDate} onChange={e=>setEscrituraDate(e.target.value)} />
              <div className="text-xs text-neutral-500 mt-1">Usamos esta fecha como referencia del pago final técnico y (opcional) 50% fee promotor.</div>
            </div>
          </CardContent>
        </Card>

        {/* Obras */}
        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6 grid md:grid-cols-5 gap-4">
            <div>
              <Label>Inicio obras</Label>
              <Input type="month" value={obraStart} onChange={e=>setObraStart(e.target.value)} />
            </div>
            <div>
              <Label>Duración obras (meses)</Label>
              <Input type="number" value={obraMonths} onChange={e=>setObraMonths(Number(e.target.value))} />
            </div>
            <div>
              <Label>Coste obra</Label>
              <Input type="number" value={obraCost} onChange={e=>setObraCost(Number(e.target.value))} />
            </div>
            <div>
              <Label>Gastos legales/financieros</Label>
              <Input type="number" value={legalFinCost} onChange={e=>setLegalFinCost(Number(e.target.value))} />
            </div>
            <div>
              <Label>Obra financiada (%)</Label>
              <div className="pt-2">
                <Slider value={[obraFinancedPct]} onValueChange={(v)=>setObraFinancedPct(v[0])} min={0} max={100} step={5} />
                <div className="text-sm mt-1">{obraFinancedPct}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promotor */}
        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6 grid md:grid-cols-4 gap-4 items-end">
            <div className="flex items-center gap-3">
              <Switch checked={promoterOn} onCheckedChange={setPromoterOn} id="promotor" />
              <Label htmlFor="promotor">Aplicar fee promotor (explotación)</Label>
            </div>
            <div>
              <Label>50% a licencia</Label>
              <Input type="number" value={promoterFeeHalf1OnLicense} disabled={!promoterOn} onChange={e=>setPromoterFeeHalf1OnLicense(Number(e.target.value))} />
            </div>
            <div>
              <Label>50% a los 6 meses de apertura</Label>
              <Input type="number" value={promoterFeeHalf2AfterOpen} disabled={!promoterOn} onChange={e=>setPromoterFeeHalf2AfterOpen(Number(e.target.value))} />
            </div>
            <div>
              <Label>Fecha de apertura</Label>
              <Input type="month" value={openDate} onChange={e=>setOpenDate(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="text-sm text-neutral-500">Entradas por rentas (periodo)</div>
              <div className="text-2xl font-semibold">{eur(totals.inflow)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="text-sm text-neutral-500">Salidas de proyecto (periodo)</div>
              <div className="text-2xl font-semibold">{eur(totals.outflow)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="text-sm text-neutral-500">Caja al final del periodo</div>
              <div className="text-2xl font-semibold">{eur(totals.endCash)}</div>
            </CardContent>
          </Card>
        </div>

      {/* Gráfico */}
      <Card className="shadow-sm">
        <CardContent className="p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">Gráfico</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(v: number) => eur(v)} />
              <ReferenceLine y={0} stroke="#888" strokeWidth={1} />
              <Line type="monotone" dataKey="cajaAcum" stroke="#2563eb" strokeWidth={2} name="Caja acumulada" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="shadow-sm">
        <CardContent className="p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">Tabla</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Mes</th>
                  <th className="text-right p-2">Entra (rentas)</th>
                  <th className="text-right p-2">Sale (proyecto)</th>
                  <th className="text-right p-2">Caja acumulada</th>
                  <th className="text-left p-2">Eventos</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.mes} className={row.mes % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                    <td className="p-2">{row.mes}</td>
                    <td className="text-right p-2">{eur(row.entra)}</td>
                    <td className="text-right p-2">{eur(row.sale)}</td>
                    <td className="text-right p-2 font-semibold">{eur(row.cajaAcum)}</td>
                    <td className="p-2">
                      {row.eventos.length > 0 && (
                        <ul className="list-disc list-inside text-xs">
                          {row.eventos.map((ev, idx) => (
                            <li key={idx}>{ev}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-neutral-500 mt-6">
        Este simulador es una herramienta orientativa. No sustituye un análisis financiero profesional.
      </p>
    </div>
  )
}
