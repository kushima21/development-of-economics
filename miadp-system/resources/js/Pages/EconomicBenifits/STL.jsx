import { Fragment, useMemo, useState, useEffect, useCallback } from "react";
import { FaTimes, FaPlus, FaTrash, FaSeedling, FaSave } from "react-icons/fa";

// STL.xlsx: annual savings = transported volume × unit price × (WOP loss − WP loss).
// The original Excel workbook links volume to the SOH worksheet; supply it through
// subproject.soh.data or stl.data, or enter volumes manually below.
const CROPS = [
    ["Banana", 12, 50, 0.10, 0.02, 1905.12],
    ["Coconut", 45, 70, 0.01, 0, 13182.75],
    ["Corn", 14, 60, 0.01, 0, 2033.92],
    ["Ginger", 42, 60, 0.02, 0, 1044.16666666667],
    ["Camote", 14, 50, 0.10, 0.02, 174.8],
    ["Squash", 15, 50, 0.05, 0.01, 81.7],
    ["Eggplant", 15, 50, 0.05, 0.01, 65.55],
    ["Rice", 17, 60, 0.01, 0, 579.84],
    ["Rubber", 37, 30, 0.01, 0, 4250.88],
    ["Bamboo", 115, 1, 0, 0, 221.4],
];
const YEARS = Array.from({ length: 20 }, (_, i) => i + 1);
const number = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
const money = (v) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number(v));
const decimal = (v) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: 4 }).format(number(v));
const parseData = (v) => {
    if (!v) return {};
    if (typeof v === "string") { try { return JSON.parse(v) || {}; } catch { return {}; } }
    return v;
};
const initialRows = () => CROPS.map(([name, pricePerKg, kgPerUnit, wop, wp, volume]) => ({
    name, pricePerKg, kgPerUnit, wop, wp, unit: "Sack", volumes: YEARS.map(() => volume),
}));
const normalizeRows = (input) => {
    if (!Array.isArray(input) || !input.length) return initialRows();
    return input.map((c, i) => ({
        name: c.name ?? c.crop ?? `Crop ${i + 1}`,
        pricePerKg: number(c.pricePerKg ?? c.price_per_kg ?? 0),
        kgPerUnit: number(c.kgPerUnit ?? c.kg_per_unit ?? 1),
        wop: number(c.wop ?? c.withoutProjectLoss ?? 0),
        wp: number(c.wp ?? c.withProjectLoss ?? 0),
        volumes: YEARS.map((_, y) => number(c.volumes?.[y] ?? c.volume ?? 0)),
        unit: c.unit ?? "Sack", sohLinked: Boolean(c.sohLinked),
    }));
};

export default function ModalSTL({ subproject, initialData = null, onClose, onSave, onEdit, readOnly = false, saving: parentSaving = false, sohData = null }) {
    const stl = initialData ? { id: "saved", data: initialData } : null;
    const [rows, setRows] = useState(initialRows);
    const [step, setStep] = useState(1);
    const [selectedYear, setSelectedYear] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [sohSource, setSohSource] = useState(null);
    const [sohLoading, setSohLoading] = useState(false);
    const [sohNotice, setSohNotice] = useState("");

    useEffect(() => {
        const data = parseData(stl?.data ?? stl);
        if (Array.isArray(data.crops)) setRows(normalizeRows(data.crops));
        else setRows(initialRows());
    }, [initialData]);

    const update = (index, field, value) => setRows((old) => old.map((r, i) => i === index ? { ...r, [field]: field === "name" ? value : number(value) } : r));
    const updateVolume = (index, year, value) => setRows((old) => old.map((r, i) => i === index ? { ...r, volumes: r.volumes.map((v, y) => y === year ? number(value) : v) } : r));
    const updateAllVolumes = (index, value) => setRows((old) => old.map((r, i) => i === index ? { ...r, volumes: YEARS.map(() => number(value)) } : r));

    const calculated = useMemo(() => rows.map((r) => {
        const pricePerUnit = number(r.pricePerKg) * number(r.kgPerUnit);
        const reduction = number(r.wop) - number(r.wp);
        return { ...r, pricePerUnit, reduction, savings: YEARS.map((_, y) => number(r.volumes[y]) * pricePerUnit * reduction) };
    }), [rows]);
    const yearlyTotals = useMemo(() => YEARS.map((_, y) => calculated.reduce((sum, r) => sum + r.savings[y], 0)), [calculated]);
    const annualSavings = yearlyTotals[0];
    const twentyYearSavings = yearlyTotals.reduce((a, b) => a + b, 0);
    const field = "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
    const th = "whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600";
    const td = "border-b border-slate-100 px-3 py-2 text-sm";
    const invalid = rows.some((r) => !r.name.trim() || number(r.kgPerUnit) < 0 || number(r.pricePerKg) < 0 || number(r.wop) < 0 || number(r.wp) < 0 || number(r.wop) > 1 || number(r.wp) > 1 || number(r.wp) > number(r.wop) || r.volumes.some((v) => number(v) < 0));

    // SOH is saved as {data:{cropCalculations:[{crop,benefits:{marketedPackages}}],
    // productionData:{banana:{kg_per_packaging,packaging}},...}}.
    // Match crop names and convert marketed packages to STL transport units.
    const applySOH = useCallback((source, showNotice = true) => {
        const soh = parseData(source?.data ?? source);
        const calculations = Array.isArray(soh.cropCalculations) ? soh.cropCalculations : [];
        if (!calculations.length) {
            if (showNotice) setError("SOH has no cropCalculations. Save the SOH worksheet first.");
            return false;
        }
        const mapped = calculations.map((c) => {
            const key = String(c.cropKey ?? c.crop ?? "").trim().toLowerCase();
            const production = soh.productionData?.[key] ?? {};
            const packages = Number(c.benefits?.marketedPackages ?? 0);
            const kgPerPackage = Number(production.kg_per_packaging ?? 0);
            return { key, name: c.crop ?? key, packages, kgPerPackage,
                unit: production.packaging ?? "Sack" };
        }).filter((c) => c.key && Number.isFinite(c.packages) && c.packages >= 0);
        if (!mapped.length) return false;
        setRows((old) => {
            const existing = new Map(old.map((r) => [r.name.trim().toLowerCase(), r]));
            return mapped.map((c) => {
                const previous = existing.get(c.key);
                // The SOH 'marketedPackages' is already the annual marketed volume.
                // Do NOT multiply it again by cropping cycles, market %, or area.
                const kg = c.kgPerPackage > 0 ? c.kgPerPackage : (previous?.kgPerUnit ?? 1);
                return {
                    name: c.name,
                    pricePerKg: previous?.pricePerKg ?? (CROPS.find((x) => x[0].toLowerCase() === c.key)?.[1] ?? 0),
                    kgPerUnit: kg,
                    unit: c.unit,
                    wop: previous?.wop ?? (CROPS.find((x) => x[0].toLowerCase() === c.key)?.[3] ?? 0),
                    wp: previous?.wp ?? (CROPS.find((x) => x[0].toLowerCase() === c.key)?.[4] ?? 0),
                    volumes: YEARS.map(() => c.packages),
                    sohLinked: true,
                };
            });
        });
        setSohSource(soh);
        setError("");
        if (showNotice) setSuccess(`Imported ${mapped.length} SOH crop(s). Marketed packages and packaging weights are synchronized.`);
        return true;
    }, []);

    const importSOH = async () => {
        const embedded = sohData ?? subproject?.soh?.data ?? subproject?.soh ?? subproject?.SOH?.data;
        if (embedded && applySOH(embedded)) return;
        const id = subproject?.subproject_id ?? subproject?.id;
        if (!id) { setError("Missing subproject ID."); return; }
        setSohLoading(true); setError("");
        try {
            const response = await fetch(`/subprojects/${encodeURIComponent(id)}/economic-benefits/soh`, {
                headers: { Accept: "application/json" }, credentials: "same-origin",
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.message || `SOH request failed (${response.status}).`);
            if (!body.data || !applySOH(body.data)) throw new Error("No saved SOH crop calculations found for this subproject.");
        } catch (e) { setError(e.message); }
        finally { setSohLoading(false); }
    };

    useEffect(() => {
        // Only automatically import SOH into an UNSAVED STL worksheet.
        // Never overwrite a previously saved STL record without user action.
        if (stl?.id || stl?.data?.crops || stl?.crops) return;
        const embedded = sohData ?? subproject?.soh?.data ?? subproject?.soh ?? subproject?.SOH?.data;
        if (embedded) applySOH(embedded, false);
    }, [subproject?.subproject_id, subproject?.soh, sohData, stl?.id, applySOH]);

    const save = async () => {
        setError(""); setSuccess("");
        if (invalid) { setError("Check crop names, prices, volumes, and loss rates. WP loss cannot exceed WOP loss; rates must be between 0 and 1."); return; }
        const subprojectId = subproject?.subproject_id ?? subproject?.id;
        if (!subprojectId) { setError("Missing subproject ID."); return; }
        const payload = {
            data: {
                benefit_category: "Savings in Transport Losses",
                crops: rows,
                soh_linked: rows.some((r) => r.sohLinked),
                soh_reference: sohSource ? { annual_savings: sohSource.annual_savings, crop_count: sohSource.cropCalculations?.length ?? 0 } : null,
                yearly_totals: yearlyTotals,
                annual_benefit: annualSavings,
                twenty_year_savings: twentyYearSavings,
                source: "STL.xlsx (corrected crop loss mappings)",
            },
        };
        setSaving(true);
        try {
            if (typeof onSave !== "function") throw new Error("STL save handler is missing.");
            await onSave(payload.data);
            setSuccess("STL calculations saved successfully.");
        } catch (e) { setError(e.message || "Unable to save STL."); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-label="Savings in Transport Losses">
            <div className="flex max-h-[96vh] w-full max-w-[1700px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <header className="flex items-start justify-between gap-4 bg-slate-900 px-5 py-4 text-white">
                    <div><h2 className="flex items-center gap-2 text-lg font-bold"><FaSeedling className="text-emerald-400" /> Savings in Transport Losses (STL)</h2><p className="mt-1 text-xs text-slate-300">{subproject?.subproject_title ?? "Economic Benefits"} · Excel-based 20-year calculations</p></div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close"><FaTimes /></button>
                </header>
                <div className="flex flex-wrap gap-2 border-b bg-white px-5 py-3">
                    {[[1, "1. Farmgate Prices"], [2, "2. Transport Losses"], [3, "3. Crop Volumes"], [4, "4. Savings Projection"]].map(([n, label]) => <button key={n} type="button" onClick={() => setStep(n)} className={`rounded-lg px-3 py-2 text-sm font-medium ${step === n ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{label}</button>)}
                </div>
                <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                    <fieldset disabled={readOnly || saving || parentSaving} className="min-w-0">
                    <div className="mb-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-medium text-emerald-900">Year 1 Annual Benefit</p><p className="mt-1 text-2xl font-bold text-emerald-800">{money(annualSavings)}</p></div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-medium text-slate-700">20-Year Total Savings</p><p className="mt-1 text-2xl font-bold text-slate-900">{money(twentyYearSavings)}</p></div>
                    </div>
                    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                    {success && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
                    {step === 1 && <Fragment>
                        <h3 className="mb-2 text-lg font-semibold">Farmgate Prices and Transport Units</h3><p className="mb-4 text-sm text-slate-500">Excel rows 76–85. Price per transported unit = price per kg × kg per unit. Values are editable.</p>
                        <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[720px]"><thead><tr>{["Crop", "Price / kg (₱)", "kg / unit", "Price / unit (₱)", "Action"].map((v) => <th key={v} className={th}>{v}</th>)}</tr></thead><tbody>{calculated.map((r, i) => <tr key={i}><td className={td}><input className={field} value={r.name} onChange={(e) => update(i, "name", e.target.value)} /></td>{["pricePerKg", "kgPerUnit"].map((k) => <td key={k} className={td}><input aria-label={`${r.name} ${k}`} type="number" min="0" step="any" className={field} value={rows[i][k]} onChange={(e) => update(i, k, e.target.value)} /></td>)}<td className={td + " font-semibold"}>{money(r.pricePerUnit)}</td><td className={td}><button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => setRows((old) => old.filter((_, j) => i !== j))} aria-label={`Remove ${r.name}`}><FaTrash /></button></td></tr>)}</tbody></table></div>
                        <button type="button" onClick={() => setRows((old) => [...old, { name: `Crop ${old.length + 1}`, pricePerKg: 0, kgPerUnit: 1, wop: 0, wp: 0, volumes: YEARS.map(() => 0) }])} className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"><FaPlus /> Add Crop</button>
                    </Fragment>}
                    {step === 2 && <Fragment>
                        <h3 className="mb-2 text-lg font-semibold">Transport Loss Assumptions</h3><p className="mb-4 text-sm text-slate-500">Excel rows 91–100. Enter loss rates as percentages. Reduction = WOP − WP. Correct crop-by-crop mapping is used.</p>
                        <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[650px]"><thead><tr>{["Crop", "Without Project (%)", "With Project (%)", "Loss Reduction (%)"].map((v) => <th key={v} className={th}>{v}</th>)}</tr></thead><tbody>{calculated.map((r, i) => <tr key={i}><td className={td + " font-medium"}>{r.name}</td>{["wop", "wp"].map((k) => <td className={td} key={k}><input type="number" min="0" max="100" step="any" className={field} value={number(rows[i][k]) * 100} onChange={(e) => update(i, k, number(e.target.value) / 100)} /></td>)}<td className={td + " font-semibold"}>{decimal(r.reduction * 100)}%</td></tr>)}</tbody></table></div>
                    </Fragment>}
                    {step === 3 && <Fragment>
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold">Transported Harvest Volume</h3><p className="text-sm text-slate-500">Excel crop volume rows 10, 16, 22 … 64. Units must match the farmgate unit prices.</p></div><button type="button" disabled={sohLoading} onClick={importSOH} className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">{sohLoading ? "Loading SOH..." : "Sync from Saved SOH"}</button></div>
                        <label className="mb-3 flex items-center gap-2 text-sm">Projection year <select className="rounded-lg border px-3 py-2" value={selectedYear} onChange={(e) => setSelectedYear(number(e.target.value))}>{YEARS.map((y, i) => <option key={y} value={i}>Year {y}</option>)}</select></label>
                        <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[650px]"><thead><tr>{["Crop", `Year ${selectedYear + 1} Volume`, "Apply Same Volume to All 20 Years"].map((v) => <th key={v} className={th}>{v}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}><td className={td + " font-medium"}>{r.name}</td><td className={td}><input type="number" min="0" step="any" className={field} value={r.volumes[selectedYear]} onChange={(e) => updateVolume(i, selectedYear, e.target.value)} /></td><td className={td}><button type="button" className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold hover:bg-slate-200" onClick={() => updateAllVolumes(i, r.volumes[selectedYear])}>Copy this volume to all years</button></td></tr>)}</tbody></table></div>
                        <p className="mt-3 text-xs text-amber-700">SOH volume comes from benefits.marketedPackages (e.g. Banana 1905.12 sacks), and packaging weight comes from productionData.kg_per_packaging (50 kg/sack). Saved STL values are not overwritten automatically. Click Sync to refresh from SOH.</p>
                    </Fragment>}
                    {step === 4 && <Fragment>
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div><h3 className="text-lg font-semibold">Savings in Transport Losses — Benefits Worksheet</h3><p className="text-sm text-slate-500">Excel-style breakdown of volume, output price, loss reduction, and subtotal savings for every crop and year.</p></div>
                            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">20-Year Projection · Scroll horizontally</span>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-300 shadow-sm">
                            <table className="w-max min-w-full border-collapse text-xs tabular-nums">
                                <thead><tr className="bg-slate-100">
                                    <th className="sticky left-0 z-30 min-w-[270px] border border-slate-300 bg-slate-100 px-3 py-2 text-left font-bold">Benefits</th>
                                    <th className="sticky left-[270px] z-30 min-w-[95px] border border-slate-300 bg-slate-100 px-2 py-2 text-center font-medium">Unit</th>
                                    {YEARS.map((y) => <th key={y} className={`min-w-[110px] border border-slate-300 px-3 py-2 text-right font-semibold ${y === 1 ? "bg-emerald-100 text-emerald-900" : "bg-slate-100"}`}>{y}</th>)}
                                </tr></thead>
                                <tbody>
                                    {calculated.map((r, i) => <Fragment key={`${r.name}-${i}`}>
                                        <tr><td className="sticky left-0 z-20 border border-slate-300 bg-yellow-300 px-3 py-2 font-bold italic">{r.name}</td><td className="sticky left-[270px] z-20 border border-slate-300 bg-yellow-300" />{YEARS.map((y) => <td key={y} className="border border-slate-200 bg-slate-50" />)}</tr>
                                        <tr><td className="sticky left-0 z-20 border border-slate-300 bg-white px-3 py-1.5">Total volume of harvest marketed</td><td className="sticky left-[270px] z-20 border border-slate-300 bg-yellow-200 px-2 text-center">{r.unit ?? (r.kgPerUnit === 1 ? "unit" : "sack")}</td>{YEARS.map((y, j) => <td key={y} className="border border-slate-200 px-3 py-1.5 text-right">{decimal(r.volumes[j])}</td>)}</tr>
                                        <tr><td className="sticky left-0 z-20 border border-slate-300 bg-white px-3 py-1.5">Output Price of harvest marketed /b</td><td className="sticky left-[270px] z-20 border border-slate-300 bg-yellow-200 px-2 text-center">Php/{r.unit ?? "unit"}</td>{YEARS.map((y) => <td key={y} className="border border-slate-200 px-3 py-1.5 text-right">{money(r.pricePerUnit)}</td>)}</tr>
                                        <tr><td className="sticky left-0 z-20 border border-slate-300 bg-white px-3 py-1.5">Estimated reduction in transport losses /c</td><td className="sticky left-[270px] z-20 border border-slate-300 bg-yellow-200 px-2 text-center">%</td>{YEARS.map((y) => <td key={y} className="border border-slate-200 px-3 py-1.5 text-right">{decimal(r.reduction * 100)}%</td>)}</tr>
                                        <tr className="italic"><td className="sticky left-0 z-20 border border-slate-300 bg-white px-3 py-1.5">Subtotal savings in reduction of Transport losses</td><td className="sticky left-[270px] z-20 border border-slate-300 bg-white px-2 text-center">Php</td>{r.savings.map((v, j) => <td key={j} className="border border-slate-200 bg-emerald-50/40 px-3 py-1.5 text-right font-semibold">{decimal(Math.round(v))}</td>)}</tr>
                                        <tr aria-hidden="true"><td colSpan={22} className="h-3 border-x border-slate-200 bg-white" /></tr>
                                    </Fragment>)}
                                    <tr className="bg-emerald-100 font-bold"><td className="sticky left-0 z-20 border border-emerald-300 bg-emerald-100 px-3 py-3">TOTAL STL SAVINGS</td><td className="sticky left-[270px] z-20 border border-emerald-300 bg-emerald-100 px-2 text-center">Php</td>{yearlyTotals.map((v, j) => <td key={j} className="border border-emerald-300 px-3 py-3 text-right">{money(v)}</td>)}</tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">Subtotal = marketed volume × output price per unit × loss reduction. Values automatically update when you edit Steps 1–3. Year 1 TOTAL STL SAVINGS is saved as the Annual Benefit.</p>
                    </Fragment>}
                    </fieldset>
                </main>
                <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50 px-5 py-4"><div className="flex gap-2"><button type="button" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-40">Back</button><button type="button" disabled={step === 4} onClick={() => setStep((s) => Math.min(4, s + 1))} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-40">Next</button></div>{!readOnly && <button type="button" disabled={saving || parentSaving} onClick={save} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><FaSave /> {saving || parentSaving ? "Saving..." : stl?.id ? "Update STL" : "Save STL"}</button>}{readOnly && onEdit && <button type="button" onClick={onEdit} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white">Edit STL</button>}</footer>
            </div>
        </div>
    );
}
