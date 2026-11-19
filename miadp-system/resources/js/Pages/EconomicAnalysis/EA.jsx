import { useEffect, useMemo } from "react";
import { FaTimes, FaChartLine, FaCoins, FaInfoCircle, FaTable, FaCheckCircle } from "react-icons/fa";

const YEARS = Array.from({ length: 21 }, (_, i) => i);
const ROWS = [
  { key: "voc", label: "VOC savings", aliases: ["svoc", "voc savings", "vehicle operating cost"] },
  { key: "soh", label: "Savings in output hauling costs", aliases: ["saving output hauling", "output hauling"] },
  { key: "sih", label: "Savings in input hauling costs", aliases: ["saving input hauling", "input hauling"] },
  { key: "tts", label: "Savings in travel time for commuters", aliases: ["travel time savings", "travel time"] },
  { key: "nga", label: "Savings in New Cultivated Agri. Land", aliases: ["new cultivated", "agricultural land"] },
  { key: "stl", label: "Savings in Reduction of Transport losses", aliases: ["transport losses", "transport loss"] },
];
const num = (v) => v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null;
const amount = (v) => v == null ? "—" : v === 0 ? "–" : v < 0 ? `(${Math.abs(v / 1000).toLocaleString("en-PH", { minimumFractionDigits: 1, maximumFractionDigits: 1 })})` : (v / 1000).toLocaleString("en-PH", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const peso = (v) => v == null ? "Not available" : new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(v);
const first = (...values) => values.find(v => v !== undefined && v !== null && v !== "");
// Economic Analysis uses index 0 for Year 0 and indexes 1–20 for Years 1–20.
// VOC's saved Tab 3 projection contains 20 objects (year: 1..20), so map by
// the explicit year value rather than treating the first object as Year 0.
const arrayFrom = (source) => {
  if (Array.isArray(source)) {
    if (source.length && typeof source[0] === "object") {
      const result = YEARS.map(() => null);
      source.forEach((entry, index) => {
        const year = Number(first(entry?.year, entry?.year_number, entry?.yearNo));
        const value = num(first(
          entry?.total_savings,
          entry?.totalSavings,
          entry?.annual_savings,
          entry?.annualSavings,
          entry?.total,
          entry?.savings,
          entry?.value
        ));
        if (Number.isInteger(year) && year >= 0 && year <= 20) result[year] = value;
        else if (source.length === 20 && index < 20) result[index + 1] = value;
        else if (source.length === 21 && index < 21) result[index] = value;
      });
      return result;
    }

    // A 20-value array represents Years 1–20; a 21-value array represents
    // Years 0–20. This keeps VOC Year 1 from being shifted into Year 0.
    if (source.length === 20) {
      return [null, ...source.map(num)];
    }
    return YEARS.map(y => num(source[y]));
  }

  if (source && typeof source === "object") {
    return YEARS.map(y => num(first(
      source[y],
      source[`year_${y}`],
      source[`year${y}`]
    )));
  }

  return YEARS.map(() => null);
};

const pickSeries = (record) => {
  if (!record) return null;

  const data = typeof record.data === "string"
    ? (() => { try { return JSON.parse(record.data); } catch { return {}; } })()
    : record.data ?? {};

  // Support the exact structure saved by ModalSVOTab1:
  // tab3.yearlyTotals = [{ year: 1, total: ..., public: ..., private: ... }, ...]
  const candidates = [
    record.tab3?.yearlyTotals,
    record.tab3?.yearly_totals,
    record.yearly_savings,
    record.yearlySavings,
    record.annual_projections,
    record.annualProjections,
    record.projections,
    record.years,
    data.tab3?.yearlyTotals,
    data.tab3?.yearly_totals,
    data.yearly_savings,
    data.yearlySavings,
    data.annual_projections,
    data.annualProjections,
    data.projections,
    data.years,
    data.yearlyData
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) || (candidate && typeof candidate === "object")) {
      const result = arrayFrom(candidate);
      if (result.some(value => value != null)) return result;
    }
  }

  // If only a Year 1 annual value exists, leave Years 2–20 blank.
  const annual = num(first(
    record.annual_savings,
    record.annualSavings,
    data.annual_savings,
    data.annualSavings
  ));
  return YEARS.map(y => y === 1 ? annual : null);
};
function TableRow({ label, values, unit = "", tone = "", indent = false }) {
  const bg = tone === "dark" ? "bg-blue-950 text-white" : tone === "blue" ? "bg-blue-50 text-blue-950" : tone === "green" ? "bg-emerald-50 text-emerald-950" : "bg-white text-slate-700";
  return <tr className={`${bg} group`}>
    <th scope="row" className={`sticky left-0 z-10 min-w-[310px] max-w-[310px] border-b border-r border-slate-200 px-5 py-3 text-left text-xs sm:text-sm ${bg} ${tone ? "font-extrabold" : "font-medium"} ${indent ? "pl-8" : ""}`}>{label}</th>
    <td className="min-w-[65px] border-b border-r border-slate-200 px-2 text-center text-xs opacity-70">{unit}</td>
    {YEARS.map(y => <td key={y} className="min-w-[115px] border-b border-r border-slate-200 px-3 py-3 text-right text-xs font-semibold tabular-nums sm:text-sm">{amount(values[y])}</td>)}
  </tr>;
}
function Section({ title, subtitle }) { return <tr><th colSpan={23} className="border-y border-slate-200 bg-slate-100 px-5 py-3 text-left"><span className="font-extrabold text-slate-800">{title}</span>{subtitle && <span className="ml-3 text-xs font-normal text-slate-500">{subtitle}</span>}</th></tr>; }

export default function ModalEA({ isOpen = true, onClose = () => {}, subproject = null, initialData = null, economic_benefits = [] }) {
  useEffect(() => {
    if (!isOpen) return;
    const escape = e => { if (e.key === "Escape") onClose(); };
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = old; document.removeEventListener("keydown", escape); };
  }, [isOpen, onClose]);
  const calc = useMemo(() => {
    const source = initialData ?? {};
    const entries = Array.isArray(economic_benefits) ? economic_benefits : Object.values(economic_benefits ?? {});
    const investmentValue = num(first(source.investment, source.total_economic_value, source.economic_investment));
    const maintenanceValue = num(first(source.maintenance, source.annual_maintenance));
    const foregoneValue = num(first(source.cropProductionForegone, source.crop_production_foregone));
    const investment = source.investmentYears ? arrayFrom(source.investmentYears) : YEARS.map(y => y === 0 ? investmentValue : investmentValue == null ? null : 0);
    const maintenance = source.maintenanceYears ? arrayFrom(source.maintenanceYears) : YEARS.map(y => y === 0 ? 0 : maintenanceValue);
    const foregone = YEARS.map(y => y === 0 ? 0 : foregoneValue);
    const benefits = Object.fromEntries(ROWS.map(row => {
      const direct = source.benefits?.[row.key];
      const found = entries.find(entry => {
        const name = String(first(entry.benefit_category, entry.category, entry.type, entry.key, "")).toLowerCase();
        return name === row.key || row.aliases.some(alias => name.includes(alias));
      });
      return [row.key, direct != null ? arrayFrom(direct) : pickSeries(found) ?? YEARS.map(() => null)];
    }));
    const totalInputs = YEARS.map(y => [investment[y], maintenance[y], foregone[y]].some(v => v == null) ? null : investment[y] + maintenance[y] + foregone[y]);
    const totalBenefits = YEARS.map(y => y === 0 ? 0 : ROWS.every(r => benefits[r.key][y] != null) ? ROWS.reduce((sum, r) => sum + benefits[r.key][y], 0) : null);
    const net = YEARS.map(y => totalInputs[y] == null || totalBenefits[y] == null ? null : totalBenefits[y] - totalInputs[y]);
    let running = 0;
    const cumulative = net.map(v => { if (v == null) return null; running += v; return running; });
    return { investment, maintenance, foregone, benefits, totalInputs, totalBenefits, net, cumulative };
  }, [initialData, economic_benefits]);
  if (!isOpen) return null;
  const cards = [
    { title: "Initial Economic Investment", value: calc.investment[0], icon: FaCoins, color: "text-blue-700 bg-blue-50" },
    { title: "Year 1 Incremental Benefits", value: calc.totalBenefits[1], icon: FaChartLine, color: "text-emerald-700 bg-emerald-50" },
    { title: "Year 1 Net Benefits", value: calc.net[1], icon: FaCheckCircle, color: "text-indigo-700 bg-indigo-50" },
    { title: "20-Year Cumulative Net", value: calc.cumulative[20], icon: FaTable, color: "text-violet-700 bg-violet-50" },
  ];
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-5" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="ea-modal-title" className="flex max-h-[96vh] w-full max-w-[1700px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl">
      <header className="relative shrink-0 overflow-hidden bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 px-5 py-5 text-white sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border-[35px] border-white/5" />
        <div className="relative flex items-start justify-between gap-4"><div className="flex items-start gap-4"><div className="rounded-2xl bg-white/15 p-3"><FaChartLine className="text-xl" /></div><div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-blue-200">MIADP · Economic Evaluation</p><h2 id="ea-modal-title" className="mt-1 text-xl font-black sm:text-2xl">Economic Analysis</h2><p className="mt-1 text-sm text-blue-100/80">20-Year Economic Cost and Benefit Worksheet · Read-only</p>{subproject?.subproject_title && <p className="mt-2 text-xs font-semibold text-blue-200">{subproject.subproject_title}</p>}</div></div><button type="button" onClick={onClose} aria-label="Close economic analysis" className="rounded-xl bg-white/10 p-3 hover:bg-white/20"><FaTimes /></button></div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50">
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">{cards.map(card => <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className={`rounded-xl p-3 ${card.color}`}><card.icon /></span><span className="text-xs font-semibold text-slate-500">{card.title}</span></div><p className="mt-3 break-all text-xl font-black tracking-tight text-slate-900">{peso(card.value)}</p></div>)}</div>
        <div className="mx-4 mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mx-6"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4"><div><h3 className="font-extrabold text-slate-900">Economic Cost & Benefit Schedule</h3><p className="mt-1 text-xs text-slate-500">All figures in Php'000 · Scroll horizontally to see Years 0–20</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">21 annual columns</span></div>
          <div className="max-h-[50vh] overflow-auto"><table className="w-max min-w-full border-collapse text-sm"><thead className="sticky top-0 z-30"><tr className="bg-slate-900 text-white"><th className="sticky left-0 z-40 min-w-[310px] bg-slate-900 px-5 py-4 text-left">Inputs / Benefits (Php'000)</th><th className="min-w-[65px] border-r border-slate-700 px-2 text-center">Unit</th>{YEARS.map(y => <th key={y} className="min-w-[115px] border-r border-slate-700 px-3 py-4 text-right">{y}</th>)}</tr></thead><tbody>
            <Section title="Inputs (Php'000)" /><Section title="Investment" /><TableRow label="Total economic value" unit="calc" values={calc.investment} indent /><TableRow label="Total (Investment)" values={calc.investment} tone="blue" />
            <Section title="Operating" /><TableRow label="Maintenance" unit="calc" values={calc.maintenance} indent /><TableRow label="Total (Operating)" values={calc.maintenance} tone="blue" />
            <Section title="Dis-benefits" /><TableRow label="Net value of crop production foregone" values={calc.foregone} indent /><TableRow label="Total Inputs" values={calc.totalInputs} tone="blue" />
            <Section title="Incremental Benefits (Php'000)" />{ROWS.map(row => <TableRow key={row.key} label={row.label} values={calc.benefits[row.key]} indent />)}<TableRow label="Total Incremental Benefits" values={calc.totalBenefits} tone="green" /><TableRow label="Net Incremental Benefits" values={calc.net} tone="dark" /><TableRow label="Cumulative Net Benefits" values={calc.cumulative} tone="blue" />
          </tbody></table></div>
        </div>
        <div className="mx-5 mb-5 flex items-start gap-2 text-xs text-slate-500 sm:mx-7"><FaInfoCircle className="mt-0.5 shrink-0" /><p>Missing figures appear as —. VOC savings for Years 1–20 are read from the saved Tab 3 yearlyTotals projection. Other benefits show Years 2–20 only when their yearly projection series is saved; a Year 1-only record is not extrapolated. Provide economic investment and maintenance amounts from your Laravel controller for a complete worksheet.</p></div>
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-8"><span className="text-xs font-semibold text-slate-400">MIADP · View-only economic analysis</span><button type="button" onClick={onClose} className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800">Close Details</button></footer>
    </div>
  </div>;
}
