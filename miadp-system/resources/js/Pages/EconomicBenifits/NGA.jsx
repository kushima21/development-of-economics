import { Fragment, useMemo, useState, useEffect } from "react";
import { FaTimes, FaPlus, FaTrash, FaSeedling, FaSave, FaChartLine, FaCoins, FaLayerGroup, FaInfoCircle, FaChevronRight } from "react-icons/fa";

const YEARS = Array.from({ length: 20 }, (_, i) => i + 1);
const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (v) => n(v).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inputClass = "w-full min-w-[100px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm font-medium text-slate-800 shadow-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100";
const cellClass = "border-b border-r border-slate-100 px-3 py-2.5 text-right text-sm tabular-nums whitespace-nowrap text-slate-700";
const rowNames = [
    [9, "Newly cultivated agr. Land /a", "ha"],
    [10, "Average production per hectare per year", "sack"],
    [11, "Total Output", "sack"],
    [12, "Output Price (farm gate) /b", "PhP/sack"],
    [13, "Output value", "PhP"],
    [14, "Land Dev. Cost/Ha /c", "PhP"],
    [15, "Production Cost/Ha /d", "PhP"],
    [16, "Marketing cost", "PhP"],
    [17, "Total Cost", "PhP"],
    [18, "Subtotal Net Benefit", "PhP"],
    [20, "Total Net Benefits", "PhP"],
];
const landRows = [
    { id: "43", label: "Land clearing and Grubbing", unit: "" },
    { id: "44", label: "Unskilled Labor", unit: "per Ha", factor: "0.6" },
    { id: "45", label: "Sowing", unit: "" },
    { id: "46", label: "Unskilled Labor", unit: "manday" },
    { id: "47", label: "Planting", unit: "" },
    { id: "48", label: "Unskilled Labor (Planting)", unit: "" },
    { id: "49", label: "Fertilizer", unit: "manday", factor: "0.6" },
];
const productionRows = [
    { id: "66", label: "Labor", unit: "" },
    { id: "67", label: "Farm Maintenance", unit: "" },
    { id: "68", label: "Fertilizer", unit: "" },
    { id: "69", label: "Fertilizer Application", unit: "manday", factor: "0.6" },
    { id: "70", label: "Harvesting", unit: "" },
    { id: "71", label: "Harvesting (Sanggi, Pakpak, Sako and Tahi)", unit: "sack", factor: "0.6" },
    { id: "72", label: "Shelling", unit: "sack", factor: "0.6" },
    { id: "73", label: "Drying", unit: "sack", factor: "0.6" },
];
const emptyYears = () => YEARS.map(() => ({ area: "", yieldPerHa: "", price: "", landCost: "", productionCost: "" }));
const initial = () => ({
    benefit_category: "Benefits of Newly Cultivated Agricultural Land",
    commodity: "Corn",
    areaSource: "",
    unit: "sack",
    years: emptyYears(),
    farmgate: { crop: "", pricePerKg: "18", kgPerUnit: "50", source: "" },
    landItems: landRows.map((r) => ({ ...r, cost: "", qty: "", factor: r.factor ?? "" })),
    productionItems: productionRows.map((r) => ({ ...r, cost: "", qty: "", factor: r.factor ?? "" })),
    cycles: "2",
    landSource: "",
    productionSource: "",
    marketingCostPerUnit: "",
    marketingCostOverride: "",
});
function calcItem(item, section) {
    const financial = n(item.cost) * n(item.qty);
    const factor = n(item.factor);
    let economic = factor ? financial / factor : 0;
    // NGA.xlsx: G46 and G45 are explicitly zero; G71/G72 use a 40%/60% split.
    if (section === "land" && (item.id === "45" || item.id === "46")) economic = 0;
    if (section === "production" && (item.id === "71" || item.id === "72")) {
        economic = factor ? ((financial * 0.4) / factor) + ((financial * 0.6 * 1.2) / factor) : 0;
    }
    return { financial, economic };
}

export default function ModalNGA({ subproject, stl, setStl, setStlId, onClose, onSave, soh, sohData, initialData, readOnly = false, onEdit, saving: parentSaving = false }) {
    const [data, setData] = useState(() => ({ ...initial(), ...(initialData?.data ?? initialData ?? {}) }));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [activeSection, setActiveSection] = useState("benefits");
    const [customLandRows, setCustomLandRows] = useState([]);
    const [customProductionRows, setCustomProductionRows] = useState([]);

    useEffect(() => {
        if (!initialData) return;
        const saved = initialData.data ?? initialData;
        setData({ ...initial(), ...saved, years: Array.isArray(saved.years) ? YEARS.map((i) => ({ ...emptyYears()[0], ...(saved.years[i - 1] ?? {}) })) : emptyYears(),
            farmgate: { ...initial().farmgate, ...(saved.farmgate ?? {}) },
            landItems: saved.landItems ?? initial().landItems,
            productionItems: saved.productionItems ?? initial().productionItems,
        });
    }, [initialData]);

    // The original worksheet links marketing cost to SOH!S213. Pass the resolved
    // value as soh.marketingCostPerUnit (or set it manually when SOH is unavailable).
    const sohRate = soh?.marketingCostPerUnit ?? soh?.data?.marketingCostPerUnit ?? sohData?.marketingCostPerUnit ?? sohData?.data?.marketingCostPerUnit;
    const marketingRate = sohRate !== undefined && sohRate !== null && sohRate !== "" ? sohRate : data.marketingCostPerUnit;
    const update = (field, value) => setData((prev) => ({ ...prev, [field]: value }));
    const updateNested = (field, key, value) => setData((prev) => ({ ...prev, [field]: { ...prev[field], [key]: value } }));
    const updateYear = (index, key, value) => setData((prev) => ({ ...prev, years: prev.years.map((y, i) => i === index ? { ...y, [key]: value } : y) }));
    const updateItem = (section, id, field, value) => {
        const key = section === "land" ? "landItems" : "productionItems";
        setData((prev) => ({ ...prev, [key]: prev[key].map((r) => r.id === id ? { ...r, [field]: value } : r) }));
    };
    const addItem = (section) => {
        const key = section === "land" ? "landItems" : "productionItems";
        setData((prev) => ({ ...prev, [key]: [...prev[key], { id: `extra-${Date.now()}-${Math.random()}`, label: "", cost: "", unit: "", qty: "", factor: "" }] }));
    };
    const removeItem = (section, id) => {
        const key = section === "land" ? "landItems" : "productionItems";
        setData((prev) => ({ ...prev, [key]: prev[key].filter((r) => r.id !== id) }));
    };

    const calculated = useMemo(() => {
        const landTotals = data.landItems.reduce((acc, r) => {
            const c = calcItem(r, "land");
            return { financial: acc.financial + c.financial, economic: acc.economic + c.economic };
        }, { financial: 0, economic: 0 });
        const productionSubtotal = data.productionItems.reduce((acc, r) => {
            const c = calcItem(r, "production");
            return { financial: acc.financial + c.financial, economic: acc.economic + c.economic };
        }, { financial: 0, economic: 0 });
        const productionTotals = { financial: productionSubtotal.financial * n(data.cycles), economic: productionSubtotal.economic * n(data.cycles) };
        const farmgatePrice = n(data.farmgate.pricePerKg) * n(data.farmgate.kgPerUnit);
        const rows = [];
        YEARS.forEach((year, index) => {
            const input = data.years[index] ?? {};
            const previous = index > 0 ? data.years[index - 1] : null;
            const area = index === 0 ? n(input.area) : (input.area === "" || input.area == null ? n(previous?.area) : n(input.area));
            const previousArea = index === 0 ? 0 : (rows[index - 1]?.area ?? 0);
            const yieldPerHa = input.yieldPerHa === "" || input.yieldPerHa == null ? 0 : n(input.yieldPerHa);
            const output = area * yieldPerHa;
            const price = input.price === "" || input.price == null ? farmgatePrice : n(input.price);
            const outputValue = output * price;
            const landCost = input.landCost === "" || input.landCost == null ? landTotals.economic : n(input.landCost);
            const productionCost = input.productionCost === "" || input.productionCost == null ? productionTotals.economic : n(input.productionCost);
            // Excel C16 = C11 * SOH!S213; D16:V16 = preceding year's marketing cost.
            const marketingCost = index === 0 ? (data.marketingCostOverride === "" ? output * n(marketingRate) : n(data.marketingCostOverride)) : rows[index - 1].marketingCost;
            // C17 = (C15+C14)*C9+C16; D17:V17 = (current area - previous area)*land cost + current area*production cost + marketing.
            const totalCost = index === 0 ? (productionCost + landCost) * area + marketingCost : (area - previousArea) * landCost + productionCost * area + marketingCost;
            const netBenefit = outputValue - totalCost;
            rows.push({ year, area, yieldPerHa, output, price, outputValue, landCost, productionCost, marketingCost, totalCost, netBenefit });
        });
        return { rows, landTotals, productionTotals, farmgatePrice, annualSavings: rows[0].netBenefit, twentyYearSavings: rows.reduce((sum, row) => sum + row.netBenefit, 0) };
    }, [data, marketingRate]);

    const field = (value, change, placeholder = "") => <input disabled={readOnly} className={inputClass} type="number" step="any" value={value ?? ""} placeholder={placeholder} onChange={(e) => change(e.target.value)} />;
    const textField = (value, change, placeholder = "") => <input disabled={readOnly} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 shadow-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100" value={value ?? ""} placeholder={placeholder} onChange={(e) => change(e.target.value)} />;
    const sectionButton = (id, label) => <button type="button" onClick={() => setActiveSection(id)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${activeSection === id ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"}`}>{label}</button>;

    const costTable = (section) => {
        const key = section === "land" ? "landItems" : "productionItems";
        const items = data[key];
        const totals = section === "land" ? calculated.landTotals : calculated.productionTotals;
        return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[1050px] border-separate border-spacing-0 text-sm">
                <thead className="bg-slate-800 text-white"><tr>{[section === "land" ? "Particulars" : "Production Cost", "Cost", "Unit", "Qty", "Total Financial Cost", "Conversion factor", "Total Economic Cost", ""].map((h, i) => <th key={i} className="border border-slate-700 p-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{items.map((r) => {
                    const result = calcItem(r, section);
                    return <tr key={r.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/40">
                        <td className="border border-slate-200 p-2 min-w-[250px]">{textField(r.label, (v) => updateItem(section, r.id, "label", v))}</td>
                        <td className={cellClass}>{field(r.cost, (v) => updateItem(section, r.id, "cost", v))}</td>
                        <td className="border border-slate-200 p-2">{textField(r.unit, (v) => updateItem(section, r.id, "unit", v))}</td>
                        <td className={cellClass}>{field(r.qty, (v) => updateItem(section, r.id, "qty", v))}</td>
                        <td className={cellClass}>{fmt(result.financial)}</td>
                        <td className={cellClass}>{field(r.factor, (v) => updateItem(section, r.id, "factor", v))}</td>
                        <td className={cellClass}>{fmt(result.economic)}</td>
                        <td className="border border-slate-200 p-2">{!readOnly && r.id.startsWith("extra-") && <button type="button" title="Remove row" onClick={() => removeItem(section, r.id)} className="text-red-600"><FaTrash /></button>}</td>
                    </tr>;
                })}
                {section === "production" && <tr className="bg-slate-100 font-semibold"><td className="border border-slate-200 p-2">No. of Cycles per year</td><td colSpan={3} className="border border-slate-200 p-2">{field(data.cycles, (v) => update("cycles", v))}</td><td className={cellClass}>{n(data.cycles)}</td><td className={cellClass}></td><td className={cellClass}>{n(data.cycles)}</td><td className={cellClass}></td></tr>}
                <tr className="bg-emerald-50 font-bold text-emerald-900"><td colSpan={4} className="border border-slate-200 p-3">{section === "land" ? "Total Land Development Cost" : "Total Production Cost"}</td><td className={cellClass}>{fmt(totals.financial)}</td><td className={cellClass}></td><td className={cellClass}>{fmt(totals.economic)}</td><td className={cellClass}></td></tr>
                </tbody>
            </table>
        </div>;
    };

    const handleSave = async () => {
        if (saving || parentSaving || readOnly) return;
        setError("");
        if (typeof onSave !== "function") { setError("Saving is not connected. Pass an onSave callback from the parent component."); return; }
        setSaving(true);
        try {
            await onSave({ ...data, marketingCostPerUnit: marketingRate, calculated: { ...calculated, annualSavings: calculated.annualSavings, twentyYearSavings: calculated.twentyYearSavings } });
        } catch (e) { setError(e?.message ?? "Unable to save NGA data."); }
        finally { setSaving(false); }
    };

    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-2 backdrop-blur-md sm:p-5" role="dialog" aria-modal="true" aria-label="NGA worksheet">
        <div className="flex max-h-[97vh] w-full max-w-[1750px] flex-col overflow-hidden rounded-[28px] border border-white/20 bg-slate-50 shadow-[0_30px_100px_rgba(2,6,23,0.45)]">
            <header className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-emerald-950 to-emerald-800 px-5 py-5 text-white sm:px-8 sm:py-6">
                <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
                <div className="relative flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="hidden rounded-2xl border border-white/15 bg-white/10 p-3 shadow-inner sm:block"><FaSeedling className="text-2xl text-emerald-300" /></div>
                        <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-200">Economic Benefits</span><span className="text-xs text-white/55">Worksheet 07 / NGA</span></div>
                            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Newly Cultivated Agricultural Land</h2>
                            <p className="mt-1 text-sm text-emerald-100/75">{subproject?.subproject_title || "Table 7 · Benefits calculation worksheet"}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close NGA modal" className="rounded-xl border border-white/15 bg-white/10 p-3 transition hover:bg-white/20"><FaTimes /></button>
                </div>
                <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                        { label: "Year 1 Net Benefit", value: calculated.annualSavings, icon: <FaCoins /> },
                        { label: "20-Year Net Benefits", value: calculated.twentyYearSavings, icon: <FaChartLine /> },
                        { label: "Projection Period", value: "20 years", icon: <FaLayerGroup />, plain: true },
                    ].map((item) => <div key={item.label} className="rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 backdrop-blur-sm"><div className="mb-1 flex items-center gap-2 text-xs font-medium text-emerald-100/75">{item.icon}{item.label}</div><div className="truncate text-xl font-bold tracking-tight">{item.plain ? item.value : `₱${fmt(item.value)}`}</div></div>)}
                </div>
            </header>
            <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 sm:px-7">
                {sectionButton("benefits", "01 · Benefits Projection")}
                {sectionButton("farmgate", "02 · Farmgate Prices")}
                {sectionButton("land", "03 · Land Development")}
                {sectionButton("production", "04 · Production Cost")}
                {sectionButton("notes", "05 · Notes & Assumptions")}
            </nav>
            <main className="min-h-0 flex-1 overflow-auto bg-slate-50/80 p-4 sm:p-7">
                {activeSection === "benefits" && <>
                    <div className="mb-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
                        <label className="space-y-2 text-sm font-semibold text-slate-700">Potential Commodity to be cultivated{textField(data.commodity, (v) => update("commodity", v))}</label>
                        <label className="space-y-2 text-sm font-semibold text-slate-700">Output unit{textField(data.unit, (v) => update("unit", v))}</label>
                        <label className="space-y-2 text-sm font-semibold text-slate-700">Marketing cost per unit (SOH!S213){field(marketingRate, (v) => update("marketingCostPerUnit", v))}</label>
                        <label className="space-y-2 text-sm font-semibold text-slate-700">Corn Potential Area / Data Source{textField(data.areaSource, (v) => update("areaSource", v))}</label>
                    </div>
                    <p className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-900">Editable: land area, production per hectare, farmgate price, land development cost and production cost. Blank prices/costs use their supporting worksheet calculations. Years 2–20 inherit the previous year's area when left blank. Other cells follow the Excel formulas.</p>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <table className="border-separate border-spacing-0 text-sm"><thead><tr className="bg-slate-800 text-white"><th className="sticky left-0 z-20 min-w-[290px] border border-slate-700 bg-emerald-800 p-3 text-left">Benefits</th><th className="sticky left-[290px] z-20 min-w-[100px] border border-slate-700 bg-emerald-800 p-3">Unit</th>{YEARS.map((y) => <th key={y} className="min-w-[130px] border border-slate-700 p-3">{y}</th>)}</tr></thead>
                            <tbody>{rowNames.map(([row, label, unit]) => <tr key={row} className={row === 20 ? "bg-emerald-100 font-bold" : row === 18 ? "bg-slate-100 font-semibold" : "odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/40"}>
                                <td className="sticky left-0 z-10 border border-slate-200 bg-inherit p-2 font-medium">{label}</td><td className="sticky left-[290px] z-10 border border-slate-200 bg-inherit p-2 text-center">{[10,11].includes(row) ? data.unit : unit}</td>
                                {calculated.rows.map((r, index) => {
                                    const editable = { 9: "area", 10: "yieldPerHa", 12: "price", 14: "landCost", 15: "productionCost" }[row];
                                    const derived = { 9: r.area, 10: r.yieldPerHa, 11: r.output, 12: r.price, 13: r.outputValue, 14: r.landCost, 15: r.productionCost, 16: r.marketingCost, 17: r.totalCost, 18: r.netBenefit, 20: r.netBenefit }[row];
                                    return <td key={index} className={cellClass}>{editable ? field(data.years[index]?.[editable] ?? "", (v) => updateYear(index, editable, v), (index > 0 && editable === "area") || ["price", "landCost", "productionCost"].includes(editable) ? fmt(derived) : "") : fmt(derived)}</td>;
                                })}
                            </tr>)}</tbody>
                        </table>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><p className="text-sm text-emerald-800">Year 1 · Total Net Benefits</p><p className="text-2xl font-bold text-emerald-800">₱{fmt(calculated.annualSavings)}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-700">Total Net Benefits · 20 Years</p><p className="text-2xl font-bold text-slate-900">₱{fmt(calculated.twentyYearSavings)}</p></div></div>
                </>}
                {activeSection === "farmgate" && <><h3 className="mb-3 text-lg font-bold">b/ Farmgate Prices</h3><div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[750px] border-collapse"><thead className="bg-slate-800 text-white"><tr>{["Type of Crop", "Farmgate Price (kg.)", "Number of kg. per unit", "Farmgate Price per Unit Hauled"].map((x) => <th key={x} className="border border-slate-700 p-3 text-left">{x}</th>)}</tr></thead><tbody><tr><td className={cellClass}>{textField(data.farmgate.crop, (v) => updateNested("farmgate", "crop", v))}</td><td className={cellClass}>{field(data.farmgate.pricePerKg, (v) => updateNested("farmgate", "pricePerKg", v))}</td><td className={cellClass}>{field(data.farmgate.kgPerUnit, (v) => updateNested("farmgate", "kgPerUnit", v))}</td><td className={cellClass}>{fmt(calculated.farmgatePrice)}</td></tr></tbody></table></div><label className="mt-4 block text-sm font-medium">Data Source{textField(data.farmgate.source, (v) => updateNested("farmgate", "source", v))}</label><p className="mt-3 text-sm text-slate-600">The farmgate price per unit is calculated as price per kilogram × kilograms per unit hauled. The crop name in the workbook is linked to SOH.</p></>}
                {activeSection === "land" && <><h3 className="mb-3 text-lg font-bold">b/ Land Development Cost</h3>{costTable("land")}{!readOnly && <button type="button" onClick={() => addItem("land")} className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"><FaPlus /> Add Particular</button>}<label className="mt-4 block text-sm font-medium">Data Source{textField(data.landSource, (v) => update("landSource", v))}</label></>}
                {activeSection === "production" && <><h3 className="mb-3 text-lg font-bold">c/ Production Cost</h3>{costTable("production")}{!readOnly && <button type="button" onClick={() => addItem("production")} className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"><FaPlus /> Add Production Cost</button>}<label className="mt-4 block text-sm font-medium">Data Source{textField(data.productionSource, (v) => update("productionSource", v))}</label></>}
                {activeSection === "notes" && <section className="space-y-4 text-sm text-slate-700"><h3 className="text-lg font-bold">Notes & Assumptions</h3><p>Commodity above can be changed based on the priority commodities found in the RIA.</p><p>Change the unit (i.e. sacks, boxes, etc.) as necessary.</p><p>For additional crops, add rows above Total Net Benefits and update the Year 1–20 total net benefit formulas accordingly. This component currently calculates one commodity, matching the populated commodity block in NGA.xlsx.</p><p>Refer to EVSA and CLUP on the validity of cultivating new agricultural areas for a specific crop.</p><p><strong>a/</strong> Estimated expansion/cultivation of new agricultural area in the RIA.</p><p><strong>b/</strong> Farmgate price depends on the unit cost used (per sack, etc.).</p><p>Land development costs vary by crop and existing conditions. Additional particulars may be added as needed.</p><p>Locally sourced agricultural materials are non-taxable. The workbook uses a 0.6 conversion factor for specified labor rows and a 40%/60% split with a 1.2 multiplier for harvesting and shelling.</p><p>Production costs vary by crop and number of cycles per year. The worksheet defaults to 2 cycles.</p></section>}
                {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            </main>
            <footer className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-8"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100">Close</button>{readOnly && onEdit && <button type="button" onClick={onEdit} className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white">Edit NGA</button>}{!readOnly && <button type="button" disabled={saving || parentSaving} onClick={handleSave} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:opacity-60"><FaSave /> {saving || parentSaving ? "Saving..." : "Save NGA"}</button>}</footer>
        </div>
    </div>;
}
