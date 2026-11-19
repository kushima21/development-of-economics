import { useEffect, useMemo, useState } from "react";
import { FaTimes, FaPlus, FaTrash, FaSeedling, FaTable, FaCalculator, FaInfoCircle, FaLeaf, FaSave } from "react-icons/fa";

const initialBarangays = [
  { id: 1, name: "Santo Niño", population2024: 1658, population2025: 1685, growth: 1.52, beneficiaryShare: 100, activePopulation: 1047, distance: 7.9, withoutMinutes: 45 },
  { id: 2, name: "Lintangan", population2024: 1049, population2025: 5581, growth: 1.52, beneficiaryShare: 100, activePopulation: 3834, distance: 7.9, withoutMinutes: 45 },
];
// 2025 population and active counts are computed from the workbook's age-group entries.
const number = (v) => Number(v) || 0;
const fmt = (n, digits = 2) => Number.isFinite(n) ? n.toLocaleString("en-PH", { maximumFractionDigits: digits }) : "—";
const money = (n) => `₱${fmt(n)}`;

export default function ModalTTS({ onClose = () => {}, onSave = () => {}, onEdit, initialData = null, readOnly = false, saving = false }) {
  const [barangays, setBarangays] = useState(() => initialData?.barangays ?? initialBarangays);
  const [tab, setTab] = useState("inputs");
  const [settings, setSettings] = useState(() => ({ populationYear1: 2024, populationYear2: 2025, startYear: 2031, years: 20, commuterPercent: 50, tripsPerDay: 2, workingDays: 260, productivePercent: 50, laborCost: 432.5, economicFactor: 60, withSpeed: 30, ...initialData?.settings }));
  useEffect(() => {
    if (initialData?.barangays) setBarangays(initialData.barangays);
    if (initialData?.settings) setSettings((previous) => ({ ...previous, ...initialData.settings }));
  }, [initialData]);
  const updateSetting = (key, value) => setSettings((s) => ({ ...s, [key]: value }));
  const updateBarangay = (id, key, value) => setBarangays((rows) => rows.map((r) => r.id === id ? { ...r, [key]: value } : r));
  // Excel TTS.xlsx mapping: G37/C8, F55/C11, F93/C18, C17:C25.
  // Default Excel settings project 2025 population to 2031 (six compounding periods).
  const projections = useMemo(() => {
    const startYear = Math.trunc(number(settings.startYear));
    const baseYear = Math.trunc(number(settings.populationYear2));
    const projectionCount = Math.max(1, Math.min(50, Math.trunc(number(settings.years)) || 1));
    const beneficiaries = barangays.map((r) => {
      const projected = number(r.population2025) * Math.pow(1 + number(r.growth) / 100, startYear - baseYear);
      const direct = projected * number(r.beneficiaryShare) / 100;
      const withMinutes = number(settings.withSpeed) > 0
        ? number(r.distance) / number(settings.withSpeed) * 60 : 0;
      const savedPerTrip = number(r.withoutMinutes) - withMinutes;
      return { ...r, projected, direct, withMinutes, savedPerTrip };
    });
    const basePopulation = beneficiaries.reduce((sum, r) => sum + r.direct, 0);
    const activeTotal = barangays.reduce((sum, r) => sum + number(r.activePopulation), 0);
    // Workbook F55 = SUM((active_bgy/pop_bgy) * (active_bgy/total_active)).
    // This is NOT the simple total_active / total_population ratio.
    const activePercent = activeTotal > 0
      ? barangays.reduce((sum, r) => {
          const population = number(r.population2025);
          const active = number(r.activePopulation);
          return sum + (population > 0 ? (active / population) * (active / activeTotal) : 0);
        }, 0)
      : 0;
    const growthRate = basePopulation > 0
      ? beneficiaries.reduce((sum, r) => sum + r.direct * number(r.growth) / 100, 0) / basePopulation
      : 0;
    // Workbook F93 = SUM(time_saved_per_barangay * share_of_direct_beneficiaries).
    const weightedSaving = basePopulation > 0
      ? beneficiaries.reduce((sum, r) => sum + r.savedPerTrip * r.direct / basePopulation, 0)
      : 0;
    const economicWage = number(settings.laborCost) * number(settings.economicFactor) / 100;
    const years = Array.from({ length: projectionCount }, (_, i) => {
      const population = basePopulation * Math.pow(1 + growthRate, i);
      const active = population * activePercent;
      const commuters = active * number(settings.commuterPercent) / 100;
      const trips = commuters * number(settings.tripsPerDay) * number(settings.workingDays);
      const savedMinutes = trips * weightedSaving;
      const savedDays = savedMinutes / 480;
      const productiveDays = savedDays * number(settings.productivePercent) / 100;
      return {
        year: startYear + i, projectYear: i + 1, population, active,
        commuters, trips, weightedSaving, savedMinutes, savedDays,
        productiveDays, economicWage, value: productiveDays * economicWage,
      };
    });
    return {
      beneficiaries, basePopulation, activePercent, growthRate, weightedSaving,
      years, annualBenefit: years[0]?.value ?? 0,
      totalValue: years.reduce((sum, r) => sum + r.value, 0),
    };
  }, [barangays, settings]);
  const exportCSV = () => {
    const headers = ["Project year", "Calendar year", "Projected population", "Economically active", "Commuters", "Annual trips", "Minutes saved per trip", "Total minutes saved", "Working days saved", "Productive days saved", "Economic daily wage (PHP)", "Time saving value (PHP)"];
    const rows = projections.years.map((r) => [r.projectYear, r.year, r.population, r.active, r.commuters, r.trips, r.weightedSaving, r.savedMinutes, r.savedDays, r.productiveDays, r.economicWage, r.value]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "travel-time-savings.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const field = (label, key, suffix = "") => <label key={key} className="block text-sm font-medium text-slate-700">{label}<div className="mt-1 flex overflow-hidden rounded-lg border border-slate-300"><input type="number" step="any" disabled={readOnly} className="w-full min-w-0 px-3 py-2 outline-none focus:bg-emerald-50" value={settings[key]} onChange={(e) => updateSetting(key, e.target.value)} />{suffix && <span className="bg-slate-50 px-3 py-2 text-slate-500">{suffix}</span>}</div></label>;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-label="Travel Time Savings">
    <div className="flex max-h-[96vh] w-full max-w-[1700px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><FaSeedling className="text-xl" /></div><div><h2 className="text-lg font-bold text-slate-800 sm:text-xl">Travel Time Savings (TTS)</h2><p className="mt-1 text-xs text-slate-500 sm:text-sm">Commuter travel time savings and annual economic benefits</p></div></div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close"><FaTimes /></button>
      </div>
             <div className="flex flex-wrap gap-2 border-b border-slate-200 px-5 py-3 sm:px-7">{[["inputs", FaLeaf, "Inputs"], ["results", FaTable, "Benefits Projection"]].map(([key, Icon, label]) => <button key={key} type="button" onClick={() => setTab(key)} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${tab === key ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}><Icon />{label}</button>)}</div>
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-7">
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Direct beneficiaries (Year 1)", fmt(projections.basePopulation, 2)], ["Weighted time saved / trip", `${fmt(projections.weightedSaving)} min`], ["Year 1 annual benefit (Excel C25)", money(projections.annualBenefit)], ["Total projected savings", money(projections.totalValue)]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-emerald-700">{value}</p></div>)}</div>
        {tab === "inputs" && <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="mb-4 flex items-center gap-2"><FaCalculator className="text-emerald-600" /><h3 className="font-bold text-slate-800">Calculation assumptions</h3></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{field("2024 population input year", "populationYear1")}{field("2025 population input year", "populationYear2")}{field("Starting year", "startYear")}{field("Projection years", "years")}{field("Commuters among active population", "commuterPercent", "%")}{field("One-way trips per day", "tripsPerDay")}{field("Working days per year", "workingDays")}{field("Saved time used for work", "productivePercent", "%")}{field("Average labor cost", "laborCost", "PHP/day")}{field("Economic wage factor", "economicFactor", "%")}{field("With-project vehicle speed", "withSpeed", "km/h")}</div></section>
                     <section className="rounded-xl border border-slate-200 bg-white p-5">
             <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-slate-800">Population Inputs</h3><p className="mt-1 text-xs text-slate-500">Set the two input years above, then enter each barangay population. The second input year is the base year for projections.</p></div><button type="button" disabled={readOnly} onClick={() => setBarangays((r) => [...r, { id: Date.now(), name: "", population2024: 0, population2025: 0, growth: 1.52, beneficiaryShare: 100, activePopulation: 0, distance: 7.9, withoutMinutes: 45 }])} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"><FaPlus /> Add barangay</button></div>
             <div className="overflow-x-auto"><table className="w-full min-w-[480px] border-collapse text-left text-sm"><thead><tr className="bg-slate-100 text-slate-700"><th className="border border-slate-200 px-3 py-3">Barangay</th><th className="border border-slate-200 px-3 py-3">{settings.populationYear1} pop.</th><th className="border border-slate-200 px-3 py-3">{settings.populationYear2} pop.</th><th className="w-12 border border-slate-200 px-3 py-3"></th></tr></thead><tbody>{barangays.map((r) => <tr key={r.id}>{[["name", "text"], ["population2024", "number"], ["population2025", "number"]].map(([key, type]) => <td key={key} className="border border-slate-200 p-2"><input type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "1" : undefined} value={r[key]} disabled={readOnly} aria-label={`${r.name || "Barangay"} ${key}`} onChange={(e) => updateBarangay(r.id, key, e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500" /></td>)}<td className="border border-slate-200 text-center"><button type="button" disabled={readOnly} onClick={() => setBarangays((rows) => rows.filter((b) => b.id !== r.id))} className="p-2 text-rose-500" aria-label={`Remove ${r.name}`}><FaTrash /></button></td></tr>)}</tbody></table></div>
             <p className="mt-3 flex items-start gap-2 text-xs text-slate-500"><FaInfoCircle className="mt-0.5 shrink-0" /> Growth, active population, distance and travel times use the existing barangay assumptions. Changing the input-year labels does not estimate missing population or age-group data. The two population columns are the only editable barangay inputs in this table.</p>
           </section>
        </div>}
                 {tab === "results" && <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
           <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-800">Benefits — Travel Time Savings</h3><button type="button" onClick={exportCSV} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Export CSV</button></div>
           <p className="mb-3 text-xs text-slate-500">Excel-style layout: benefit items appear in rows, with project years 1–{projections.years.length} across the columns. Scroll horizontally to view later years.</p>
           <div className="max-w-full overflow-x-auto rounded-lg border border-slate-300">
             <table className="w-max min-w-full border-collapse text-xs text-slate-900 sm:text-sm">
               <thead><tr className="bg-slate-200"><th className="sticky left-0 z-20 min-w-[260px] border border-slate-300 bg-slate-200 px-3 py-2 text-left">Benefits</th><th className="sticky left-[260px] z-20 min-w-[105px] border border-slate-300 bg-slate-200 px-2 py-2 text-center">Unit</th>{projections.years.map((r) => <th key={r.projectYear} className="min-w-[125px] border border-slate-300 px-3 py-2 text-right">{r.projectYear}</th>)}</tr></thead>
               <tbody>{[
                 { label: "Population number/a", unit: "person", value: (r) => r.population, digits: 0, highlighted: true },
                 { label: "Population growth rate/b", unit: "%", value: (r) => r.projectYear === 1 ? null : projections.growthRate * 100, digits: 2, percent: true },
                 { label: "Projected population", unit: "person", value: (r) => r.projectYear === 1 ? null : r.population, digits: 0 },
                 { label: "Estimated % of ec.active population/c", unit: "%", value: () => projections.activePercent * 100, digits: 0, percent: true },
                 { label: "Estimated number of ec.active population", unit: "person", value: (r) => r.active, digits: 0 },
                 { label: "% commuters in ec.active population/d", unit: "%", value: () => number(settings.commuterPercent), digits: 0, percent: true },
                 { label: "Estimated number of commuters", unit: "person", value: (r) => r.commuters, digits: 0 },
                 { label: "Number of one way trips per day/e", unit: "trip/day", value: () => number(settings.tripsPerDay), digits: 0 },
                 { label: "Number of working days/f", unit: "w.day", value: () => number(settings.workingDays), digits: 0 },
                 { label: "Total number of trips for all commuters", unit: "trip", value: (r) => r.trips, digits: 2 },
                 { label: "Time saving for commuters /g", unit: "min/trip", value: (r) => r.weightedSaving, digits: 0 },
                 { label: "Total time saving in min", unit: "min", value: (r) => r.savedMinutes, digits: 0 },
                 { label: "Total time saving in days", unit: "w.day", value: (r) => r.savedDays, digits: 0 },
                 { label: "Share of saved time used for work /h", unit: "%", value: () => number(settings.productivePercent), digits: 0, percent: true },
                 { label: "Net total time saving in days", unit: "w.day", value: (r) => r.productiveDays, digits: 0 },
                 { label: "Average labor cost/i", unit: "PhP/w.day", value: () => number(settings.laborCost), digits: 0 },
                 { label: "Labor cost (economic)", unit: "PhP/w.day", value: (r) => r.economicWage, digits: 0 },
                 { label: "Time saving value", unit: "PhP", value: (r) => r.value, digits: 0, total: true },
               ].map((metric) => <tr key={metric.label} className={metric.total ? "bg-emerald-50 font-bold" : "hover:bg-slate-50"}>
                 <td className={`sticky left-0 z-10 border border-slate-300 px-3 py-2 ${metric.total ? "bg-slate-200" : "bg-slate-200"}`}>{metric.label}</td>
                 <td className={`sticky left-[260px] z-10 border border-slate-300 px-2 py-2 text-center ${metric.total ? "bg-slate-200" : "bg-slate-200"}`}>{metric.unit}</td>
                 {projections.years.map((r) => { const v = metric.value(r); return <td key={r.projectYear} className={`border border-slate-300 px-3 py-2 text-right tabular-nums ${((metric.highlighted && r.projectYear === 1) || (r.projectYear === 1 && ["Estimated % of ec.active population/c", "% commuters in ec.active population/d", "Number of one way trips per day/e", "Number of working days/f", "Time saving for commuters /g", "Share of saved time used for work /h"].includes(metric.label)) || (r.projectYear === 2 && metric.label === "Population growth rate/b")) ? "bg-yellow-300" : "bg-slate-100"}`}>{v === null ? "" : `${fmt(v, metric.digits)}${metric.percent ? "%" : ""}`}</td>; })}
               </tr>)}</tbody>
             </table>
           </div>
         </section>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7"><p className="text-xs text-slate-500">Values update automatically when inputs change.</p><div className="flex gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>{readOnly ? (onEdit && <button type="button" onClick={onEdit} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Edit</button>) : <button type="button" disabled={saving} onClick={() => onSave({ benefit_category: "Travel Time Savings", settings, barangays, projections, annualBenefit: projections.annualBenefit, annual_benefit: projections.annualBenefit, year1TotalTimeSavings: projections.annualBenefit })} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><FaSave /> {saving ? "Saving..." : "Save calculations"}</button>}</div></div>
    </div>
  </div>;
}
