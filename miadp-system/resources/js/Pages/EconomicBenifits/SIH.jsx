import { Fragment, useMemo, useState, useEffect } from "react";
import { FaTimes, FaPlus, FaTrash, FaSeedling, FaSave } from "react-icons/fa";

const uid = () => `crop-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const newCrop = () => ({ id: uid(), crop: "", number_of_seeds: "", seed_unit: "sack", number_of_fertilizer: "", fertilizer_unit: "sack", cropping_per_year: "1", area_planted: "", current_hauling_cost: "", estimated_hauling_cost: "", seedlings_per_sack: "", years: {} });
const num = (v) => v === "" || v == null ? 0 : (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (v) => num(v).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const years = Array.from({ length: 20 }, (_, i) => i + 1);
const fieldStyle = "w-full min-w-[105px] rounded-lg border border-slate-200 px-2 py-2 text-sm focus:border-emerald-500 focus:outline-none";
const money = (n) => `₱${fmt(n)}`;
const normalize = (value) => ({ ...newCrop(), ...value, id: value?.id || uid(), years: value?.years || {} });
function sackEquivalent(value, unit, factor) {
    if (unit === "sack" || unit === "bag") return value;
    if (unit === "kg") return value / 20; // workbook note: corn/rice seeds: 20 kg per sack; confirm for other inputs
    if (unit === "g") return value / 20000;
    if (unit === "seedlings" || unit === "piece") return factor > 0 ? value / factor : 0;
    return 0; // unknown pack/liter conversions require explicit conversion
}
// SOH cropCalculations already consolidates barangays and intercropping.
// Prefer it to avoid losing intercropped area (Banana = 6.48 ha).
function cropsFromSOH(sohData) {
    const byName = new Map();
    const calculated = Array.isArray(sohData?.cropCalculations) ? sohData.cropCalculations : [];
    for (const item of calculated) {
        const name = String(item.crop || "").trim();
        if (!name) continue;
        const key = name.toLocaleLowerCase();
        const benefits = item.benefits || {};
        const hauling = item.hauling || {};
        byName.set(key, {
            ...newCrop(),
            crop: name,
            area_planted: String(num(benefits.areaPlanted ?? item.productionArea)),
            current_hauling_cost: String(num(benefits.currentHaulingCost ?? hauling.totalWOPDouble)),
            estimated_hauling_cost: String(num(benefits.estimatedHaulingCost ?? hauling.totalWPDouble)),
        });
    }
    // Fallback for older SOH records without cropCalculations.
    if (!byName.size) {
        for (const barangay of sohData?.barangays || []) {
            for (const item of barangay.crops || []) {
                const name = String(item.crop || "").trim();
                if (!name) continue;
                const key = name.toLocaleLowerCase();
                if (!byName.has(key)) byName.set(key, { ...newCrop(), crop: name, area_planted: "0" });
                byName.get(key).area_planted = String(
                    num(byName.get(key).area_planted) + num(item.existing_area)
                );
                // Intercropped area is added only when it is recorded as the same
                // crop; otherwise it belongs to the named intercropped commodity.
                const intercrop = String(item.intercropped_commodity || "").trim();
                const interArea = num(item.area_intercropped);
                if (intercrop && interArea > 0) {
                    const ikey = intercrop.toLocaleLowerCase();
                    if (!byName.has(ikey)) byName.set(ikey, { ...newCrop(), crop: intercrop, area_planted: "0" });
                    byName.get(ikey).area_planted = String(num(byName.get(ikey).area_planted) + interArea);
                }
            }
        }
        for (const [key, crop] of byName) {
            const hauling = sohData?.haulingData?.[key] || {};
            const average = obj => {
                const values = Object.values(obj || {}).filter(v => v !== null && v !== "" && Number.isFinite(Number(v)));
                return values.length ? values.reduce((a,v) => a + Number(v),0) / values.length : 0;
            };
            crop.current_hauling_cost = String(num(hauling.cost_wop_b) + average(hauling.motorized_wop));
            crop.estimated_hauling_cost = String(num(hauling.cost_wp_c) + average(hauling.motorized_wp_c));
        }
    }
    return [...byName.values()];
}
function initialSIHCrops(initialData, sohData) {
    const imported = cropsFromSOH(sohData);
    const saved = (initialData?.crops || []).map(normalize);
    if (!imported.length) return saved.length ? saved : [newCrop()];
    const savedByName = new Map(saved.map(c => [String(c.crop).trim().toLocaleLowerCase(), c]));
    const merged = imported.map(source => {
        const old = savedByName.get(source.crop.trim().toLocaleLowerCase());
        // Preserve SIH-specific fertilizer, seeds, and yearly adjustments;
        // always refresh shared crop, area and hauling values from SOH.
        return old ? {
            ...old,
            crop: source.crop,
            area_planted: source.area_planted,
            current_hauling_cost: source.current_hauling_cost,
            estimated_hauling_cost: source.estimated_hauling_cost,
        } : source;
    });
    // Do not silently delete SIH-only crops if an SOH record changes.
    const importedNames = new Set(imported.map(c => c.crop.trim().toLocaleLowerCase()));
    return [...merged, ...saved.filter(c => !importedNames.has(String(c.crop).trim().toLocaleLowerCase()))];
}

export default function ModalSIH({ isOpen = true, onClose = () => {}, onSave, initialData = null, readOnly = false, onEdit, saving = false, sohData = null }) {
    const [tab, setTab] = useState(1);
    const [crops, setCrops] = useState(() => (initialSIHCrops(initialData, sohData)));
    const [busy, setBusy] = useState(false);
    const hasSOHCrops = cropsFromSOH(sohData).length > 0;
    useEffect(() => { setCrops(initialSIHCrops(initialData, sohData)); setTab(1); }, [initialData, sohData]);
    const change = (id, key, value) => { if (!readOnly) setCrops(old => old.map(c => c.id === id ? { ...c, [key]: value } : c)); };
    const changeYear = (id, year, key, value) => { if (!readOnly) setCrops(old => old.map(c => c.id === id ? { ...c, years: { ...c.years, [year]: { ...(c.years?.[year] || {}), [key]: value } } } : c)); };
    const calculated = useMemo(() => crops.map(c => {
        const cropping = num(c.cropping_per_year);
        const seedRate = num(c.number_of_seeds) * cropping;
        const fertilizerRate = num(c.number_of_fertilizer) * cropping;
        const seedSacks = sackEquivalent(seedRate, c.seed_unit, num(c.seedlings_per_sack));
        const fertilizerSacks = sackEquivalent(fertilizerRate, c.fertilizer_unit, num(c.seedlings_per_sack));
        const totalPerHa = seedSacks + fertilizerSacks;
        const costSaving = num(c.current_hauling_cost) - num(c.estimated_hauling_cost);
        const yearly = years.map(year => {
            const overrides = c.years?.[year] || {};
            const area = overrides.area_planted === undefined ? num(c.area_planted) : num(overrides.area_planted);
            const savingsPerSack = overrides.savings_per_sack === undefined ? costSaving : num(overrides.savings_per_sack);
            const totalSacks = totalPerHa * area;
            return { year, area_planted: area, savings_per_sack: savingsPerSack, total_sacks: totalSacks, annual_savings: totalSacks * savingsPerSack };
        });
        return { ...c, total_seed_requirement: seedRate, total_fertilizer_requirement: fertilizerRate, seed_sacks_per_ha: seedSacks, fertilizer_sacks_per_ha: fertilizerSacks, total_sacks_per_ha: totalPerHa, hauling_saving_per_sack: costSaving, yearly };
    }), [crops]);
    const yearlyBenefits = years.map((year, index) => ({ year, total: calculated.reduce((sum, c) => sum + c.yearly[index].annual_savings, 0) }));
    const annualBenefit = yearlyBenefits[0].total;
    const submit = async () => { if (!onSave || readOnly || busy || saving) return; setBusy(true); try { await onSave({ benefit_category: "Savings in Input Hauling", crops: calculated, annual_benefit: annualBenefit, annual_savings: annualBenefit, yearly_benefits: yearlyBenefits }); } catch (error) { console.error(error); } finally { setBusy(false); } };
    if (!isOpen) return null;
    const heading = (label) => <th className="whitespace-nowrap border border-slate-200 bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-emerald-950">{label}</th>;
    const cell = (value, bold = false) => <td className={`whitespace-nowrap border border-slate-200 px-3 py-2 text-right text-xs ${bold ? "bg-emerald-50 font-bold text-emerald-900" : ""}`}>{fmt(value)}</td>;
    const input = (c, key, type = "number") => <input aria-label={key.replaceAll('_', ' ')} className={fieldStyle} type={type} min={type === "number" ? 0 : undefined} step="any" disabled={readOnly} value={c[key] ?? ""} onChange={e => change(c.id, key, e.target.value)} />;
    const rows = [
        ["Mineral fertilizer", "sack/ha", c => c.fertilizer_sacks_per_ha],
        ["Seeds", "sack/ha", c => c.seed_sacks_per_ha],
        ["Total number of sacks", "sack/ha", c => c.total_sacks_per_ha],
        ["Area planted", "ha", (c, i) => c.yearly[i].area_planted],
        ["Total fertilizer and seeds", "sack", (c, i) => c.yearly[i].total_sacks],
        ["Subtotal savings in hauling cost", "Php", (c, i) => c.yearly[i].annual_savings]
    ];
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm"><div className="flex max-h-[96vh] w-full max-w-[1700px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b px-6 py-4"><div><h2 className="text-xl font-bold text-slate-900">Savings in Input Hauling (SIH)</h2><p className="text-sm text-slate-500">Excel Table 5b • 20-year projections</p></div><button onClick={onClose} aria-label="Close"><FaTimes /></button></header>
        <nav className="flex gap-2 overflow-x-auto border-b px-5 py-3">{[[1,"Input Requirements"],[2,"Hauling Costs"],[3,"Yearly Inputs"],[4,"Excel SIH Output"]].map(([n,label]) => <button key={n} onClick={() => setTab(n)} className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold ${tab === n ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"}`}>Tab {n} – {label}</button>)}</nav>
        <main className="min-h-0 flex-1 overflow-auto bg-slate-50 p-5">
        {tab === 1 && <section className="rounded-xl bg-white p-4"><div className="mb-4 flex justify-between"><div><h3 className="font-bold">Agricultural Input Requirements</h3><p className="text-xs text-emerald-700">{hasSOHCrops ? "Crops and planted areas imported from saved SOH." : "No saved SOH crops found. Enter crops manually or save SOH first."}</p></div>{!readOnly && <button onClick={() => setCrops(old => [...old,newCrop()])} className="flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm text-white"><FaPlus/> Add Crop</button>}</div><div className="overflow-x-auto"><table className="w-full min-w-[1250px] border-collapse"><thead><tr>{["Crop","Seeds per ha/cropping","Seed Unit","Fertilizer per ha/cropping","Fertilizer Unit","Croppings per year","Seedlings per sack","Annual Seeds","Annual Fertilizer",""].map(heading)}</tr></thead><tbody>{calculated.map(c => <tr key={c.id}><td>{input(c,"crop","text")}</td><td>{input(c,"number_of_seeds")}</td><td><select className={fieldStyle} disabled={readOnly} value={c.seed_unit} onChange={e => change(c.id,"seed_unit",e.target.value)}>{["sack","bag","kg","g","seedlings","piece","pack","liter"].map(u => <option key={u}>{u}</option>)}</select></td><td>{input(c,"number_of_fertilizer")}</td><td><select className={fieldStyle} disabled={readOnly} value={c.fertilizer_unit} onChange={e => change(c.id,"fertilizer_unit",e.target.value)}>{["sack","bag","kg","g","liter","piece"].map(u => <option key={u}>{u}</option>)}</select></td><td>{input(c,"cropping_per_year")}</td><td>{input(c,"seedlings_per_sack")}</td>{cell(c.total_seed_requirement)}{cell(c.total_fertilizer_requirement)}<td>{!readOnly && <button disabled={crops.length === 1} onClick={() => setCrops(old => old.filter(item => item.id !== c.id))} className="p-2 text-red-600 disabled:opacity-30"><FaTrash/></button>}</td></tr>)}</tbody></table></div><p className="mt-4 text-xs text-slate-600">Enter seedling-to-sack conversion per crop (e.g., 130 or 30 where applicable). Seed quantities are converted to sack equivalents for hauling savings. The workbook specifies 20 kg/sack for corn and rice seeds; verify other unit conversions.</p></section>}
        {tab === 2 && <section className="rounded-xl bg-white p-4"><h3 className="mb-3 font-bold">A. Hauling Cost Savings per Sack</h3><div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse"><thead><tr>{["Crop","Current hauling cost (₱/sack)","Estimated hauling cost (₱/sack)","Hauling cost saving (₱/sack)"].map(heading)}</tr></thead><tbody>{calculated.map(c => <tr key={c.id}><td className="border p-3">{c.crop || "Unnamed crop"}</td><td className="border p-2">{input(c,"current_hauling_cost")}</td><td className="border p-2">{input(c,"estimated_hauling_cost")}</td>{cell(c.hauling_saving_per_sack,true)}</tr>)}</tbody></table></div></section>}
        {tab === 3 && <section className="rounded-xl bg-white p-4"><h3 className="mb-2 font-bold">Area Planted and Annual Projection</h3><p className="mb-4 text-sm text-slate-500">Set a default area in hectares for each crop. Optionally override area or savings rate for any year.</p>{calculated.map(c => <div key={c.id} className="mb-5"><div className="mb-2 flex items-center gap-3"><b>{c.crop || "Unnamed crop"}</b><span className="text-sm">Default area (ha)</span><div className="w-40">{input(c,"area_planted")}</div></div><div className="overflow-x-auto"><table className="border-collapse"><thead><tr>{["Field",...years.map(y => `Year ${y}`)].map(heading)}</tr></thead><tbody>{[["Area planted", "area_planted"],["Savings / sack", "savings_per_sack"]].map(([label,key]) => <tr key={key}><td className="border px-3 text-sm">{label}</td>{years.map(y => <td className="border p-1" key={y}><input disabled={readOnly} type="number" min="0" step="any" placeholder={key === "area_planted" ? String(num(c.area_planted)) : String(c.hauling_saving_per_sack)} className="w-24 rounded border px-2 py-1 text-sm" value={c.years?.[y]?.[key] ?? ""} onChange={e => changeYear(c.id,y,key,e.target.value)} /></td>)}</tr>)}</tbody></table></div></div>)}</section>}
        {tab === 4 && <section className="rounded-xl bg-white p-4"><h3 className="mb-2 font-bold text-emerald-950">Table 5b: Benefits – Savings in Input Hauling</h3><p className="mb-4 text-xs text-slate-500">The workbook uses fixed Year 1 hauling savings for projected years unless adjusted; the original grand total excludes one commodity subtotal. This implementation includes every entered crop.</p><div className="overflow-x-auto"><table className="min-w-max border-collapse text-xs"><thead><tr>{["Benefits","Unit",...years.map(y => y)].map(heading)}</tr></thead><tbody><tr><td colSpan={22} className="bg-emerald-200 px-3 py-2 font-bold">A. HAULING COST</td></tr>{calculated.map(c => <Fragment key={`${c.id}-hauling`}>{<tr key={`${c.id}-heading`}><td colSpan={22} className="bg-emerald-100 px-3 py-2 font-bold uppercase">{c.crop || "Unnamed crop"}</td></tr>}{[["Current hauling cost","Php/sack",c.current_hauling_cost],["Estimated hauling cost","Php/sack",c.estimated_hauling_cost],["Hauling cost saving","Php/sack",c.hauling_saving_per_sack]].map(([label,unit,val]) => <tr key={`${c.id}-${label}`}><td className="border px-3 py-2">{label}</td><td className="border px-3">{unit}</td>{years.map(y => cell(label === "Hauling cost saving" ? c.yearly[y-1].savings_per_sack : val))}</tr>)}</Fragment>)}<tr><td colSpan={22} className="bg-emerald-200 px-3 py-2 font-bold">B. AGRICULTURAL INPUTS AND SAVINGS</td></tr>{calculated.map(c => <Fragment key={`${c.id}-inputs`}><tr key={`${c.id}-section`}><td colSpan={22} className="bg-emerald-100 px-3 py-2 font-bold uppercase">{c.crop || "Unnamed crop"}</td></tr>{rows.map(([label,unit,get]) => <tr key={`${c.id}-${label}`}><td className="border px-3 py-2">{label}</td><td className="border px-3">{unit}</td>{years.map((y,i) => <td key={y} className={`border px-3 py-2 text-right ${label.startsWith("Subtotal") ? "bg-emerald-50 font-bold" : ""}`}>{fmt(get(c,i))}</td>)}</tr>)}</Fragment>)}<tr className="bg-emerald-200 font-bold"><td className="border px-3 py-3">TOTAL SAVINGS IN HAULING INPUT (ALL CROPS)</td><td className="border px-3">Php/year</td>{yearlyBenefits.map(v => cell(v.total,true))}</tr></tbody></table></div></section>}
        </main><footer className="flex items-center justify-between border-t bg-white px-6 py-4"><div className="text-sm font-bold text-emerald-800">Year 1 SIH Benefit: {money(annualBenefit)}</div><div className="flex gap-2"><button onClick={onClose} className="rounded-lg border px-4 py-2">Close</button>{readOnly ? onEdit && <button onClick={onEdit} className="rounded-lg bg-emerald-700 px-4 py-2 text-white">Edit</button> : <button disabled={!onSave || saving || busy} onClick={submit} className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-white disabled:opacity-50"><FaSave/> {saving || busy ? "Saving..." : "Save SIH"}</button>}</div></footer>
    </div></div>;
}
