import { useEffect, useMemo, useState } from "react";
import {
    FaTimes, FaDownload, FaSave, FaFileInvoiceDollar, FaInfoCircle,
    FaLock, FaCoins, FaCheckCircle, FaChartLine, FaCalendarAlt,
    FaRoad, FaCalculator,
} from "react-icons/fa";

const HORIZON = Array.from({ length: 21 }, (_, year) => year);
const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const result = Number(value);
    return Number.isFinite(result) ? result : null;
};
const money = (value) => value === null
    ? "—"
    : Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const recordYear = (record) => Number(record?.evaluation_year ?? record?.evaluationYear ?? record?.year_evaluation);
const recordSubproject = (record) => record?.subproject_id ?? record?.subject_id;
const economicInvestment = (record) => toNumber(
    record?.calculations?.economicTotal ?? record?.total_economic_cost ?? record?.totalEconomicCost
);
const economicMaintenance = (record) => toNumber(
    record?.total_annual_maintenance_cost_economic ?? record?.total_annual__maintenance_cost_economic
);
const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

/**
 * Year 0 = ECOS investment; years 1–20 = saved AMC annual economic cost.
 * AMC is repeated for all operating years because the AMC table currently
 * stores only its first-year economic amount. No escalation is assumed.
 */
export default function ModalIMC({
    data = null,
    setData,
    setIsLoading,
    isOpen = true,
    onClose = () => {},
    subproject = null,
    economicCostAnalyses = [],
    annualMaintenanceAnalyses = [],
    evaluation_year = null,
    onSave,
    savedIMCAnalyses = [],
    savedAnalysis = null,
}) {
    const subprojectId = subproject?.subproject_id ?? data?.subproject_id ?? data?.subject_id ?? null;
    const ecos = Array.isArray(economicCostAnalyses) ? economicCostAnalyses : [];
    const amc = Array.isArray(annualMaintenanceAnalyses) ? annualMaintenanceAnalyses : [];
    const matchingSubproject = (record) =>
        subprojectId !== null && String(recordSubproject(record)) === String(subprojectId);

    const years = useMemo(() => [...new Set([
        ...ecos.filter(matchingSubproject).map(recordYear),
        ...amc.filter(matchingSubproject).map(recordYear),
    ])].filter(Number.isInteger).sort((a, b) => b - a), [ecos, amc, subprojectId]);

    const viewOnly = Boolean(savedAnalysis);
    const [selectedYear, setSelectedYear] = useState(() =>
        Number(savedAnalysis?.evaluation_year ?? evaluation_year ?? data?.evaluation_year ?? years[0] ?? new Date().getFullYear())
    );
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const preferred = Number(savedAnalysis?.evaluation_year ?? evaluation_year ?? data?.evaluation_year);
        setSelectedYear(viewOnly && Number.isInteger(preferred)
            ? preferred
            : Number.isInteger(preferred) && years.includes(preferred)
                ? preferred : years[0] ?? (Number.isInteger(preferred) ? preferred : new Date().getFullYear()));
    }, [savedAnalysis?.evaluation_year, evaluation_year, data?.evaluation_year, years.join(",")]);

    const investmentRecord = ecos.find((item) => matchingSubproject(item) && recordYear(item) === selectedYear);
    const maintenanceRecord = amc.find((item) => matchingSubproject(item) && recordYear(item) === selectedYear);
    const investment = investmentRecord ? economicInvestment(investmentRecord) : null;
    const maintenance = maintenanceRecord ? economicMaintenance(maintenanceRecord) : null;
    const ready = investment !== null && maintenance !== null;
    const savedRecord = savedIMCAnalyses.find((item) =>
        String(recordSubproject(item)) === String(subprojectId) && recordYear(item) === selectedYear
    );

    const calculatedColumns = useMemo(() => HORIZON.map((year) => {
        const investmentCost = year === 0 ? investment : 0;
        const operatingCost = year === 0 ? 0 : maintenance;
        return {
            year,
            calendarYear: selectedYear + year,
            investment: investmentCost,
            operating: operatingCost,
            total: investmentCost === null || operatingCost === null
                ? null : investmentCost + operatingCost,
        };
    }), [investment, maintenance, selectedYear]);

    // View mode uses the actual stored database snapshot, not recalculated ECOS/AMC.
    const columns = viewOnly && Array.isArray(savedAnalysis?.yearly_costs)
        ? savedAnalysis.yearly_costs
        : calculatedColumns;
    const displayedInvestment = viewOnly ? toNumber(savedAnalysis?.investment_economic_cost) : investment;
    const displayedMaintenance = viewOnly ? toNumber(savedAnalysis?.annual_maintenance_economic_cost) : maintenance;
    const displayedTotal = viewOnly ? toNumber(savedAnalysis?.total_20_year_cost) : (ready ? investment + maintenance * 20 : null);

    const downloadCSV = () => {
        const rows = [
            ["Investment and Maintenance Cost (Economic)"],
            ["Subproject ID", subprojectId ?? ""],
            ["Evaluation Year", selectedYear],
            ["Cost", "Unit", ...columns.map((item) => item.year)],
            ["Calendar Year", "", ...columns.map((item) => item.calendarYear)],
            ["INVESTMENT"],
            ["Total economic", "calc", ...columns.map((item) => item.investment ?? "")],
            ["Total (Investment)", "", ...columns.map((item) => item.investment ?? "")],
            ["OPERATING"],
            ["Maintenance", "calc", ...columns.map((item) => item.operating ?? "")],
            ["Total (Operating)", "", ...columns.map((item) => item.operating ?? "")],
            ["Total Investment and Operating Costs", "", ...columns.map((item) => item.total ?? "")],
        ];
        const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\r\n");
        const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `IMC_${subprojectId ?? "subproject"}_${selectedYear}_20years.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const saveSnapshot = async () => {
        if (viewOnly) return;
        if (savedRecord) {
            setMessage("This evaluation year is already saved. Close this form and use the eye icon to view its record.");
            return;
        }
        if (!ready) {
            setMessage("Save ECOS and AMC for the same subproject and evaluation year first.");
            return;
        }
        if (typeof onSave !== "function") {
            setMessage("IMC save handler is missing. Pass onSave from CostComponents.");
            return;
        }
        setSaving(true);
        setIsLoading?.(true);
        setMessage("");
        try {
            await onSave({ evaluation_year: selectedYear });
            setData?.((previous) => ({
                ...(previous && typeof previous === "object" ? previous : {}),
                subproject_id: subprojectId,
                evaluation_year: selectedYear,
                investment_economic_cost: investment,
                annual_maintenance_economic_cost: maintenance,
                imc_years: columns,
            }));
            onClose();
        } catch (error) {
            setMessage(error?.message || "Failed to save IMC. Please try again.");
        } finally {
            setSaving(false);
            setIsLoading?.(false);
        }
    };

    if (!isOpen) return null;

    const row = (label, accessor, style = "") => (
        <tr className={style}>
            <th scope="row" className="sticky left-0 z-10 min-w-[220px] border border-slate-200 bg-inherit px-4 py-3 text-left text-sm font-semibold">{label}</th>
            <td className="min-w-[80px] border border-slate-200 px-3 py-3 text-center text-xs text-slate-500">{label === "Total economic" || label === "Maintenance" ? "calc" : ""}</td>
            {columns.map((item) => (
                <td key={item.year} className="min-w-[135px] whitespace-nowrap border border-slate-200 px-3 py-3 text-right text-sm tabular-nums">
                    {money(item[accessor])}
                </td>
            ))}
        </tr>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <div role="dialog" aria-modal="true" aria-label="Investment and Maintenance Cost" className="flex max-h-[96vh] w-full max-w-[1700px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <header className="flex shrink-0 items-start justify-between gap-4 bg-gradient-to-r from-slate-950 via-blue-950 to-teal-900 p-5 text-white sm:p-7">
                    <div>
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-200"><FaRoad /> MIADP · Cost Components</p>
                        <h2 className="mt-2 flex items-center gap-3 text-xl font-black sm:text-2xl"><FaFileInvoiceDollar /> Investment and Maintenance Cost</h2>
                        <p className="mt-2 text-sm text-slate-200">Economic cost schedule · Year 0 investment + Years 1–20 maintenance</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="rounded-xl border border-white/20 p-3 hover:bg-white/10"><FaTimes /></button>
                </header>

                <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Selected subproject</p>
                            <p className="mt-1 font-bold text-slate-900">{subproject?.subproject_title ?? data?.subproject_title ?? `Subproject ${subprojectId ?? "not selected"}`}</p>
                            <p className="mt-1 text-xs text-slate-500">ID: {subprojectId ?? "—"}</p>
                        </div>
                        <label className="block text-sm font-bold text-slate-700"><span className="mb-2 flex items-center gap-2"><FaCalendarAlt /> Evaluation year</span>
                            <select disabled={viewOnly} value={selectedYear} onChange={(event) => { setSelectedYear(Number(event.target.value)); setMessage(""); }} className="w-full min-w-[190px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm">
                                {!years.includes(selectedYear) && <option value={selectedYear}>{selectedYear}</option>}
                                {years.map((year) => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </label>
                    </div>

                    {viewOnly && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><FaCheckCircle className="mr-2 inline" /> Saved IMC evaluation · View only</div>}

                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="flex items-center gap-2 text-xs font-bold text-blue-700"><FaCoins /> Year 0 · Investment (ECOS)</p><p className="mt-2 text-xl font-black text-blue-950">{money(displayedInvestment)}</p><p className="mt-1 text-xs text-blue-700">{investmentRecord ? "Matching ECOS found" : "No matching ECOS record"}</p></div>
                        <div className="rounded-xl border border-teal-100 bg-teal-50 p-4"><p className="flex items-center gap-2 text-xs font-bold text-teal-700"><FaChartLine /> Annual Operating (AMC)</p><p className="mt-2 text-xl font-black text-teal-950">{money(displayedMaintenance)}</p><p className="mt-1 text-xs text-teal-700">{maintenanceRecord ? "Matching AMC found" : "No matching AMC record"}</p></div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="flex items-center gap-2 text-xs font-bold text-slate-700"><FaCalculator /> 20-Year Total (Undiscounted)</p><p className="mt-2 text-xl font-black text-slate-900">{money(displayedTotal)}</p><p className="mt-1 text-xs text-slate-500">Investment + 20 × annual maintenance</p></div>
                    </div>

                    {!viewOnly && savedRecord && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Saved IMC record for {selectedYear}. Saving again updates this record.</p>}
                    {!viewOnly && !ready && <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><FaInfoCircle className="mt-0.5 shrink-0" /><span>ECOS and AMC must both be saved for subproject {subprojectId ?? "—"} and evaluation year {selectedYear}. Missing values are shown as dashes, not zero.</span></div>}
                    <div className="flex items-center justify-between gap-3"><h3 className="font-extrabold text-slate-900">Economic Investment and Operating Costs · Years 0–20</h3><span className="flex items-center gap-2 text-xs text-slate-500"><FaLock /> {viewOnly ? "Saved database snapshot" : "Read-only database values"}</span></div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-max min-w-full border-collapse text-sm">
                            <thead><tr className="bg-slate-100 text-slate-800"><th className="sticky left-0 z-20 min-w-[220px] border border-slate-200 bg-slate-100 px-4 py-3 text-left">Costs</th><th className="min-w-[80px] border border-slate-200 px-3 py-3">Unit</th>{columns.map((item) => <th key={item.year} className="min-w-[135px] border border-slate-200 px-3 py-3 text-center">{item.year}</th>)}</tr></thead>
                            <tbody>
                                <tr className="bg-blue-50"><th colSpan={23} className="border border-slate-200 px-4 py-2 text-left text-xs font-extrabold uppercase tracking-wider text-blue-900">Investment</th></tr>
                                {row("Total economic", "investment", "bg-white")}
                                {row("Total (Investment)", "investment", "bg-blue-50 font-bold")}
                                <tr className="bg-teal-50"><th colSpan={23} className="border border-slate-200 px-4 py-2 text-left text-xs font-extrabold uppercase tracking-wider text-teal-900">Operating</th></tr>
                                {row("Maintenance", "operating", "bg-white")}
                                {row("Total (Operating)", "operating", "bg-teal-50 font-bold")}
                                {row("Total Investment and Operating Costs", "total", "bg-slate-900 text-white font-extrabold")}
                            </tbody>
                        </table>
                    </div>
                    <p className="flex gap-2 text-xs leading-5 text-slate-500"><FaInfoCircle className="mt-0.5 shrink-0" /> The AMC database stores one first-year annual economic amount. This schedule repeats that amount in years 1–20 without inflation or periodic maintenance adjustments. Year 0 has no operating cost; years 1–20 have no additional investment cost.</p>
                    {message && <p role="status" className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
                </div>
                <footer className="flex shrink-0 flex-wrap justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:px-6">
                    <button type="button" onClick={downloadCSV} className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-5 py-3 text-sm font-bold text-teal-800 hover:bg-teal-50"><FaDownload /> Export CSV</button>
                    <div className="flex flex-wrap gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">Close</button>{!viewOnly && <button type="button" onClick={saveSnapshot} disabled={!ready || saving || Boolean(savedRecord)} className="inline-flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><FaSave /> {saving ? "Saving..." : "Save to Database"}</button>}</div>
                </footer>
            </div>  
        </div>
    );
}
