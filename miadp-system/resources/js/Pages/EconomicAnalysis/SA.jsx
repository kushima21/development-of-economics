import { useMemo, useState } from "react";
import { FaTimes, FaFileExcel, FaPercentage, FaInfoCircle } from "react-icons/fa";

const YEARS = Array.from({ length: 21 }, (_, i) => i);
const COST_SCENARIOS = [5, 10, 15, 20, 30];
const BENEFIT_SCENARIOS = [5, 10, 15, 20, 30];

const num = (v) => {
    if (v === null || v === undefined || v === "") return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const series = (values) =>
    YEARS.map((year) => num(Array.isArray(values) ? values[year] : 0));

const money = (v) =>
    new Intl.NumberFormat("en-PH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num(v));

const pct = (v) =>
    v === null || !Number.isFinite(v) ? "N/A" : `${(v * 100).toFixed(1)}%`;

const ratio = (v) =>
    v === null || !Number.isFinite(v) ? "N/A" : v.toFixed(2);

const getBenefits = (benefits = {}) => {
    const keys = ["voc", "soh", "sih", "tts", "nga", "stl"];
    return YEARS.map((year) =>
        keys.reduce((sum, key) => sum + num(benefits?.[key]?.[year]), 0)
    );
};

const getCosts = (data = {}) => {
    const investment = series(data.investmentYears);
    const maintenance = series(data.maintenanceYears);
    return YEARS.map((year) => investment[year] + maintenance[year]);
};

const pvFuture = (values, rate) =>
    values.reduce(
        (sum, value, year) =>
            year === 0 ? sum : sum + value / Math.pow(1 + rate, year),
        0
    );

// Finds the IRR root for conventional and non-conventional cash-flow patterns.
const irr = (cashFlows) => {
    const npv = (r) =>
        cashFlows.reduce((sum, value, year) => sum + value / Math.pow(1 + r, year), 0);

    let low = -0.9999;
    let high = 10;
    let fLow = npv(low);
    let fHigh = npv(high);

    if (!Number.isFinite(fLow) || !Number.isFinite(fHigh) || fLow * fHigh > 0) {
        // Excel-like Newton iteration from a 10% initial guess.
        let rate = 0.1;
        for (let i = 0; i < 100; i++) {
            const f = npv(rate);
            const derivative = cashFlows.reduce(
                (sum, value, year) =>
                    year === 0 ? sum : sum - (year * value) / Math.pow(1 + rate, year + 1),
                0
            );
            if (!Number.isFinite(f) || !Number.isFinite(derivative) || Math.abs(derivative) < 1e-12) break;
            const next = rate - f / derivative;
            if (!Number.isFinite(next) || next <= -1 || next > 1e6) break;
            if (Math.abs(next - rate) < 1e-10) return Math.abs(npv(next)) < 0.01 ? next : null;
            rate = next;
            if (Math.abs(f) < 1e-7) return rate;
        }
        return null;
    }

    for (let i = 0; i < 250; i++) {
        const mid = (low + high) / 2;
        const fMid = npv(mid);
        if (!Number.isFinite(fMid)) return null;
        if (Math.abs(fMid) < 1e-7) return mid;
        if (fLow * fMid <= 0) {
            high = mid;
            fHigh = fMid;
        } else {
            low = mid;
            fLow = fMid;
        }
    }
    return (low + high) / 2;
};

const calculate = (benefits, costs, rate) => {
    const net = YEARS.map((year) => benefits[year] - costs[year]);
    const pvBenefits = pvFuture(benefits, rate);
    const pvCosts = costs[0] + pvFuture(costs, rate);
    const enpv = net[0] + pvFuture(net, rate);
    return {
        benefits,
        costs,
        net,
        pvBenefits,
        pvCosts,
        enpv,
        eirr: irr(net),
        bcr: pvCosts > 0 ? pvBenefits / pvCosts : null,
    };
};

const delayBenefits = (values, years) =>
    values.map((value, year) => (year > 0 && year <= years ? 0 : value));

const makeRows = (benefits, costs, rate) => {
    const benefitRows = [
        { id: "benefit-base", label: "base scenario", values: benefits, type: "benefit", base: true },
        ...BENEFIT_SCENARIOS.map((p) => ({
            id: `benefit-${p}`,
            label: `benefits -${p}%`,
            values: benefits.map((v) => v * (1 - p / 100)),
            type: "benefit",
        })),
        ...[1, 2].map((years) => ({
            id: `delay-${years}`,
            label: `benefits delayed ${years} year${years > 1 ? "s" : ""}`,
            values: delayBenefits(benefits, years),
            type: "benefit",
        })),
    ];

    const costRows = [
        { id: "cost-base", label: "base scenario", values: costs, type: "cost", base: true },
        ...COST_SCENARIOS.map((p) => ({
            id: `cost-${p}`,
            label: `costs +${p}%`,
            values: costs.map((v) => v * (1 + p / 100)),
            type: "cost",
        })),
    ];

    const netRows = [
        { id: "net-base", label: "base scenario", benefits, costs, base: true },
        ...COST_SCENARIOS.map((p) => ({
            id: `net-cost-${p}`,
            label: `costs +${p}%`,
            benefits,
            costs: costs.map((v) => v * (1 + p / 100)),
        })),
        ...BENEFIT_SCENARIOS.map((p) => ({
            id: `net-benefit-${p}`,
            label: `benefits -${p}%`,
            benefits: benefits.map((v) => v * (1 - p / 100)),
            costs,
        })),
        ...[1, 2].map((years) => ({
            id: `net-delay-${years}`,
            label: `benefits delayed ${years} year${years > 1 ? "s" : ""}`,
            benefits: delayBenefits(benefits, years),
            costs,
        })),
    ].map((row) => ({ ...row, result: calculate(row.benefits, row.costs, rate) }));

    return { benefitRows, costRows, netRows };
};

function AnnualCells({ values }) {
    return (
        <>
            {values.map((value, index) => (
                <td key={index} className="border border-slate-300 px-2 py-1 text-right tabular-nums">
                    {money(value)}
                </td>
            ))}
        </>
    );
}

function SectionTitle({ children, extra = null }) {
    return (
        <tr className="bg-slate-100">
            <td colSpan={extra ? 25 : 22} className="border border-slate-400 px-2 py-1 font-bold italic text-slate-800">
                {children}
            </td>
            {extra}
        </tr>
    );
}

export default function ModalSA({
    isOpen = false,
    onClose = () => {},
    initialData = {},
    subproject = null,
}) {
    const [discountRate, setDiscountRate] = useState(10);
    const [showNotes, setShowNotes] = useState(false);

    const benefits = useMemo(
        () => getBenefits(initialData?.benefits ?? {}),
        [initialData]
    );
    const costs = useMemo(() => getCosts(initialData ?? {}), [initialData]);

    const rate = num(discountRate) / 100;
    const rows = useMemo(() => makeRows(benefits, costs, rate), [benefits, costs, rate]);
    const hasData = benefits.some(Boolean) || costs.some(Boolean);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="sensitivity-analysis-title"
                className="flex max-h-[96vh] w-full max-w-[1800px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            >
                <header className="flex shrink-0 items-center justify-between gap-4 bg-slate-900 px-5 py-4 text-white">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                            <FaFileExcel /> MIADP · Economic Evaluation · Table 10
                        </div>
                        <h2 id="sensitivity-analysis-title" className="mt-1 text-xl font-black">
                            Sensitivity Analysis (on Costs, Benefits and Delays)
                        </h2>
                        <p className="mt-1 truncate text-xs text-slate-300">
                            {subproject?.subproject_title || subproject?.subproject_name || "Project Economic Evaluation"}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-white hover:bg-white/10">
                        <FaTimes />
                    </button>
                </header>

                <main className="flex-1 space-y-3 overflow-auto bg-white p-3 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-300 bg-slate-50 p-3">
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-500">Analysis assumptions</p>
                            <p className="text-sm text-slate-700">Projection period: Year 0–20 · Currency: PhP (000)</p>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <FaPercentage className="text-emerald-700" />
                            Discount rate
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={discountRate}
                                onChange={(event) => setDiscountRate(Math.min(100, Math.max(0, num(event.target.value))))}
                                className="w-20 border border-slate-400 bg-white px-2 py-1.5 text-right font-bold outline-none focus:border-emerald-600"
                            />
                            %
                        </label>
                    </div>

                    {!hasData && (
                        <div className="border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                            No economic analysis data found. Save the project's benefit and cost projections first.
                        </div>
                    )}

                    <div className="overflow-auto border border-slate-500">
                        <table className="min-w-[1750px] w-full border-collapse text-[11px] leading-tight">
                            <thead>
                                <tr className="bg-slate-200 text-slate-900">
                                    <th className="sticky left-0 z-20 min-w-[190px] border border-slate-500 bg-slate-200 px-2 py-2 text-left">
                                        Scenarios
                                    </th>
                                    {YEARS.map((year) => (
                                        <th key={year} className="min-w-[58px] border border-slate-400 px-2 py-2 text-center">
                                            {year}
                                        </th>
                                    ))}
                                    <th className="min-w-[90px] border border-slate-500 bg-slate-300 px-2 py-2 text-right">
                                        Present Value
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <SectionTitle>Incremental Benefits</SectionTitle>
                                {rows.benefitRows.map((row) => (
                                    <tr key={row.id} className={row.base ? "bg-emerald-50 font-bold" : "bg-white"}>
                                        <td className={`sticky left-0 z-10 border border-slate-300 px-2 py-1 ${row.base ? "bg-emerald-50 font-bold" : "bg-white"}`}>
                                            {row.label}
                                        </td>
                                        <AnnualCells values={row.values} />
                                        <td className="border border-slate-300 px-2 py-1 text-right font-bold tabular-nums">
                                            {money(pvFuture(row.values, rate))}
                                        </td>
                                    </tr>
                                ))}

                                <SectionTitle>Project Costs</SectionTitle>
                                {rows.costRows.map((row) => (
                                    <tr key={row.id} className={row.base ? "bg-rose-50 font-bold" : "bg-white"}>
                                        <td className={`sticky left-0 z-10 border border-slate-300 px-2 py-1 ${row.base ? "bg-rose-50 font-bold" : "bg-white"}`}>
                                            {row.label}
                                        </td>
                                        <AnnualCells values={row.values} />
                                        <td className="border border-slate-300 px-2 py-1 text-right font-bold tabular-nums">
                                            {money(row.values[0] + pvFuture(row.values, rate))}
                                        </td>
                                    </tr>
                                ))}

                                <tr className="bg-slate-100">
                                    <td colSpan={22} className="border border-slate-400 px-2 py-1 font-bold italic text-slate-800">
                                        Net Incremental Benefits
                                    </td>
                                    <td className="border border-slate-500 bg-slate-200 px-2 py-1 text-center font-bold">EIRR</td>
                                    <td className="border border-slate-500 bg-slate-200 px-2 py-1 text-center font-bold">ENPV</td>
                                    <td className="border border-slate-500 bg-slate-200 px-2 py-1 text-center font-bold">BCR</td>
                                </tr>
                                {rows.netRows.map((row) => (
                                    <tr key={row.id} className={row.base ? "bg-emerald-50 font-bold" : "bg-white"}>
                                        <td className={`sticky left-0 z-10 border border-slate-300 px-2 py-1 ${row.base ? "bg-emerald-50 font-bold" : "bg-white"}`}>
                                            {row.label}
                                        </td>
                                        <AnnualCells values={row.result.net} />
                                        <td className="border border-slate-300 px-2 py-1 text-right font-bold tabular-nums">
                                            {pct(row.result.eirr)}
                                        </td>
                                        <td className="border border-slate-300 px-2 py-1 text-right font-bold tabular-nums">
                                            {money(row.result.enpv)}
                                        </td>
                                        <td className="border border-slate-300 px-2 py-1 text-right font-bold tabular-nums">
                                            {ratio(row.result.bcr)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <span> a) Discount rate: <strong>{num(discountRate)}%</strong></span>
                        <span>Benefits PV excludes Year 0 · Costs PV includes Year 0 · ENPV includes Year 0 net benefits</span>
                    </div>

                    <section className="border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setShowNotes((value) => !value)}
                            className="flex w-full items-center gap-2 bg-slate-50 px-3 py-2 text-left text-sm font-bold text-slate-800 hover:bg-slate-100"
                        >
                            <FaInfoCircle className="text-emerald-700" />
                            {showNotes ? "Hide" : "Show"} calculation notes
                        </button>
                        {showNotes && (
                            <div className="space-y-2 p-3 text-xs leading-5 text-slate-700">
                                <p><strong>Benefits PV:</strong> NPV of Year 1–20 benefits. Year 0 is excluded.</p>
                                <p><strong>Costs PV:</strong> Year 0 cost plus NPV of Year 1–20 costs.</p>
                                <p><strong>ENPV:</strong> Year 0 net incremental benefit plus NPV of Year 1–20 net incremental benefits.</p>
                                <p><strong>EIRR:</strong> IRR of the complete net incremental benefit series, Year 0–20.</p>
                                <p><strong>Cost scenarios:</strong> Increase every annual cost, including Year 0. <strong>Benefit scenarios:</strong> Reduce every annual benefit. <strong>Delay scenarios:</strong> Retain Year 0 and set the first one or two benefit years to zero without shifting later values.</p>
                            </div>
                        )}
                    </section>
                </main>

                <footer className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-4 py-3">
                    <button type="button" onClick={onClose} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
                        <FaTimes className="mr-2 inline" /> Close
                    </button>
                </footer>
            </div>
        </div>
    );
}
