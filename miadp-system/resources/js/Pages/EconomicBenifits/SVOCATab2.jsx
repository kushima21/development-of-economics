
import { useEffect, useMemo, useState } from "react";
import {
    FaCalendarAlt,
    FaInfoCircle,
    FaMapMarkerAlt,
    FaRoad,
    FaSave,
    FaTimes,
    FaTruck,
    FaCoins,
} from "react-icons/fa";

const VEHICLES = [
    { key: "car", label: "Car / Van" },
    { key: "jeepney", label: "Jeepney" },
    { key: "motorcycle", label: "Motorcycle" },
    { key: "tricycle", label: "Tricycle" },
    { key: "bus", label: "Bus" },
    { key: "truck", label: "Truck" },
];

const SURFACES = [
    {
        key: "A",
        label: "Good paved road",
        group: "Paved",
        costs: { car: 15.47, jeepney: 13.62, motorcycle: 2.86, tricycle: 5.28, bus: 30.05, truck: 22.89 },
    },
    {
        key: "B",
        label: "Very bad paved road",
        group: "Paved",
        costs: { car: 25.96, jeepney: 24.97, motorcycle: 7.52, tricycle: 16.43, bus: 64.41, truck: 45.58 },
    },
    {
        key: "C",
        label: "Good gravel road",
        group: "Gravel",
        costs: { car: 17.95, jeepney: 16.31, motorcycle: 3.35, tricycle: 5.61, bus: 38.35, truck: 28.83 },
    },
    {
        key: "D",
        label: "Fair gravel road",
        group: "Gravel",
        costs: { car: 20.75, jeepney: 19.59, motorcycle: 3.96, tricycle: 7.01, bus: 50.56, truck: 35.90 },
    },
    {
        key: "E",
        label: "Very bad gravel road",
        group: "Gravel",
        costs: { car: 33.33, jeepney: 35.44, motorcycle: 8.01, tricycle: 17.03, bus: 97.56, truck: 60.75 },
    },
    {
        key: "F",
        label: "Bad earth road",
        group: "Earth",
        costs: { car: 71.92, jeepney: 70.91, motorcycle: 21.95, tricycle: 25.62, bus: 132.15, truck: 62.14 },
    },
];

const COMPARISONS = [
    { key: "B", code: "TAB6A", label: "Paved (B − A)", surface: "Very bad paved road" },
    { key: "C", code: "TAB6B", label: "Gravel − Paved (C − A)", surface: "Good gravel road" },
    { key: "D", code: "TAB6C", label: "Gravel − Paved (D − A)", surface: "Fair gravel road" },
    { key: "E", code: "TAB6D", label: "Gravel − Paved (E − A)", surface: "Very bad gravel road" },
    { key: "F", code: "TAB6E", label: "Earth − Paved (F − A)", surface: "Bad earth road" },
];

const currentYear = new Date().getFullYear();

const initialForm = () => ({
    barangay: "",
    inputDate1: "",
    inputDate2: "",
    inputDate3: "",
    year1: String(currentYear),
    inputYear: String(currentYear + 1),
    indicator: "Vehicle Operating Cost Savings",
    unit: "PHP",
    withoutProject: "",
    withProject: "",
    annualQuantity: "",
    unitValue: "",
    roadLengths: { B: "", C: "", D: "", E: "", F: "" },
    traffic: {
        car: "",
        jeepney: "",
        motorcycle: "",
        tricycle: "",
        bus: "",
        truck: "",
    },
});

const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const money = (value) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const number = (value) => Number(value) || 0;

const findSurface = (key) => SURFACES.find((surface) => surface.key === key);

export default function ModalSVOTab2({
    isOpen = false,
    onClose,
    onSave,
    title = "Vehicle Operating Cost — Tab 2",
    subprojectName = "Infrastructure Subproject",
}) {
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!isOpen) return;

        setForm(initialForm());
        setErrors({});
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") onClose?.();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const costDifferences = useMemo(() => {
        const baseline = findSurface("A");

        return COMPARISONS.map((comparison) => {
            const surface = findSurface(comparison.key);
            const differences = {};

            VEHICLES.forEach((vehicle) => {
                differences[vehicle.key] =
                    surface.costs[vehicle.key] - baseline.costs[vehicle.key];
            });

            return { ...comparison, differences };
        });
    }, []);

    const results = useMemo(() => {
        const bySurface = {};
        let grandTotal = 0;

        COMPARISONS.forEach((comparison) => {
            const roadLength = number(form.roadLengths[comparison.key]);
            let rowTotal = 0;
            const vehicleTotals = {};

            VEHICLES.forEach((vehicle) => {
                const difference =
                    costDifferences.find((item) => item.key === comparison.key)
                        ?.differences[vehicle.key] || 0;

                // Difference in VOC (PHP/km/trip) × traffic × road length (km).
                const amount =
                    difference *
                    number(form.traffic[vehicle.key]) *
                    roadLength;

                vehicleTotals[vehicle.key] = amount;
                rowTotal += amount;
            });

            bySurface[comparison.key] = {
                roadLength,
                vehicleTotals,
                total: rowTotal,
            };

            grandTotal += rowTotal;
        });

        return { bySurface, grandTotal };
    }, [form.roadLengths, form.traffic, costDifferences]);

    if (!isOpen) return null;

    const updateField = (field, value) => {
        setForm((previous) => ({ ...previous, [field]: value }));
        setErrors((previous) => ({ ...previous, [field]: "" }));
    };

    const updateNested = (section, field, value) => {
        setForm((previous) => ({
            ...previous,
            [section]: { ...previous[section], [field]: value },
        }));

        setErrors((previous) => ({
            ...previous,
            [`${section}.${field}`]: "",
        }));
    };

    const validate = () => {
        const next = {};

        if (!form.barangay.trim()) {
            next.barangay = "Enter the name of the barangay.";
        }

        if (!form.inputDate1) {
            next.inputDate1 = "Select the first input date.";
        }

        if (!form.year1 || !form.inputYear) {
            next.inputYear = "Complete both year fields.";
        } else if (Number(form.inputYear) !== Number(form.year1) + 1) {
            next.inputYear = "Input Year must equal Year 1 plus one.";
        }

        Object.entries(form.roadLengths).forEach(([key, value]) => {
            if (value === "" || !Number.isFinite(Number(value)) || Number(value) < 0) {
                next[`roadLengths.${key}`] = "Enter a length of 0 or more.";
            }
        });

        Object.entries(form.traffic).forEach(([key, value]) => {
            if (value === "" || !Number.isFinite(Number(value)) || Number(value) < 0) {
                next[`traffic.${key}`] = "Enter traffic of 0 or more.";
            }
        });

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!validate()) return;

        onSave?.({
            barangay: form.barangay.trim(),
            inputDate1: form.inputDate1,
            inputDate2: form.inputDate2,
            inputDate3: form.inputDate3,
            year1: form.year1,
            inputYear: form.inputYear,
            indicator: form.indicator,
            unit: form.unit,
            withoutProject: number(form.withoutProject),
            withProject: number(form.withProject),
            annualQuantity: results.grandTotal,
            unitValue: 1,
            annualBenefit: results.grandTotal,
            roadLengths: form.roadLengths,
            traffic: form.traffic,
            costDifferences,
            vehicleTotals: results.bySurface,
            calculationMethod:
                "VOC difference (PHP/km/trip) × entered traffic × road length (km)",
        });
    };

    const thClass =
        "border border-slate-300 bg-slate-100 px-3 py-2 text-left text-xs font-extrabold uppercase tracking-wide text-slate-700";
    const tdClass = "border border-slate-300 px-3 py-2 text-sm text-slate-700";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-2 backdrop-blur-sm sm:p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose?.();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="svoc-tab2-title"
                className="my-auto w-full max-w-[1500px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <header className="bg-gradient-to-r from-blue-900 to-indigo-800 px-5 py-5 text-white sm:px-7">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                                <FaTruck size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
                                    MIADP · Benefit 1 · Worksheet Tab 2
                                </p>
                                <h2 id="svoc-tab2-title" className="mt-1 text-xl font-extrabold sm:text-2xl">
                                    {title}
                                </h2>
                                <p className="mt-1 text-sm text-blue-100">
                                    Road-surface comparison and incremental vehicle operating cost calculation
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} aria-label="Close modal" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/15">
                            <FaTimes />
                        </button>
                    </div>
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 p-3 text-sm">
                        <FaMapMarkerAlt className="shrink-0" />
                        <span className="font-semibold">{subprojectName}</span>
                    </div>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className="max-h-[72vh] space-y-6 overflow-y-auto p-4 sm:p-6">
                        {/* PROJECT DETAILS */}
                        <section className="rounded-xl border border-slate-200 p-4">
                            <div className="mb-4 flex items-center gap-2 font-extrabold text-slate-900">
                                <FaMapMarkerAlt className="text-blue-700" />
                                Project and Worksheet Details
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                                    Name of Barangay *
                                    <input className={`${inputClass} mt-1.5`} value={form.barangay} onChange={(e) => updateField("barangay", e.target.value)} placeholder="Enter barangay name" />
                                    {errors.barangay && <span className="mt-1 block text-xs text-red-600">{errors.barangay}</span>}
                                </label>
                                {[
                                    ["inputDate1", "Input Date 1"],
                                    ["inputDate2", "Input Date 2"],
                                    ["inputDate3", "Input Date 3"],
                                ].map(([field, label]) => (
                                    <label key={field} className="text-sm font-semibold text-slate-700">
                                        {label}{field === "inputDate1" ? " *" : ""}
                                        <input type="date" className={`${inputClass} mt-1.5`} value={form[field]} onChange={(e) => updateField(field, e.target.value)} />
                                        {errors[field] && <span className="mt-1 block text-xs text-red-600">{errors[field]}</span>}
                                    </label>
                                ))}
                                <label className="text-sm font-semibold text-slate-700">
                                    Year 1 *
                                    <input type="number" className={`${inputClass} mt-1.5`} value={form.year1} onChange={(e) => updateField("year1", e.target.value)} />
                                </label>
                                <label className="text-sm font-semibold text-slate-700">
                                    Input Year (Year 1 + 1) *
                                    <input type="number" className={`${inputClass} mt-1.5`} value={form.inputYear} onChange={(e) => updateField("inputYear", e.target.value)} />
                                    {errors.inputYear && <span className="mt-1 block text-xs text-red-600">{errors.inputYear}</span>}
                                </label>
                            </div>
                        </section>

                        {/* ROAD LENGTHS */}
                        <section className="overflow-hidden rounded-xl border border-slate-200">
                            <div className="border-b border-slate-200 bg-slate-50 p-4">
                                <h3 className="flex items-center gap-2 font-extrabold text-slate-900">
                                    <FaRoad className="text-blue-700" />
                                    Road Surface Condition and Actual Road Length
                                </h3>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Enter the road length in kilometres for each surface-condition comparison linked to TAB6A–TAB6E.
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] border-collapse">
                                    <thead>
                                        <tr>
                                            <th className={thClass}>Surface condition</th>
                                            <th className={thClass}>Worksheet reference</th>
                                            <th className={thClass}>Length (km)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {COMPARISONS.map((item) => (
                                            <tr key={item.key}>
                                                <td className={tdClass}>
                                                    <p className="font-bold text-slate-800">{item.label}</p>
                                                    <p className="mt-0.5 text-xs text-slate-500">{item.surface}</p>
                                                </td>
                                                <td className={`${tdClass} font-bold text-blue-700`}>{item.code}</td>
                                                <td className={tdClass}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="any"
                                                        className={inputClass}
                                                        value={form.roadLengths[item.key]}
                                                        onChange={(e) => updateNested("roadLengths", item.key, e.target.value)}
                                                        placeholder="Enter length in km"
                                                    />
                                                    {errors[`roadLengths.${item.key}`] && <p className="mt-1 text-xs text-red-600">{errors[`roadLengths.${item.key}`]}</p>}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-sky-100 font-extrabold">
                                            <td colSpan="2" className={`${tdClass} text-right`}>TOTAL ROAD LENGTH</td>
                                            <td className={`${tdClass} text-blue-900`}>
                                                {Object.values(form.roadLengths).reduce((sum, value) => sum + number(value), 0).toLocaleString("en-PH", { maximumFractionDigits: 3 })} km
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* OFFICIAL VOC TABLE */}
                        <section className="overflow-hidden rounded-xl border border-slate-200">
                            <div className="border-b border-slate-200 bg-slate-50 p-4">
                                <h3 className="font-extrabold text-slate-900">
                                    Incremental Vehicle Operating Cost (PHP/km/trip)
                                </h3>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Reference values from the supplied worksheet. The comparison rows below are calculated against Good Paved Road (A).
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1050px] border-collapse">
                                    <thead>
                                        <tr>
                                            <th className={thClass}>Surface condition</th>
                                            {VEHICLES.map((vehicle) => <th key={vehicle.key} className={`${thClass} text-right`}>{vehicle.label}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SURFACES.map((surface) => (
                                            <tr key={surface.key}>
                                                <td className={tdClass}>
                                                    <span className="font-bold">{surface.label}</span>
                                                    <span className="ml-2 text-xs text-slate-500">({surface.key})</span>
                                                </td>
                                                {VEHICLES.map((vehicle) => (
                                                    <td key={vehicle.key} className={`${tdClass} text-right tabular-nums`}>
                                                        {surface.costs[vehicle.key].toFixed(2)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* TRAFFIC INPUTS */}
                        <section className="overflow-hidden rounded-xl border border-slate-200">
                            <div className="border-b border-slate-200 bg-slate-50 p-4">
                                <h3 className="font-extrabold text-slate-900">Projected Annual Average Daily Traffic by Vehicle Type</h3>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Enter the traffic quantity for each vehicle class. The same entered traffic is used for each surface comparison.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                                {VEHICLES.map((vehicle) => (
                                    <label key={vehicle.key} className="text-sm font-semibold text-slate-700">
                                        {vehicle.label} traffic *
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            className={`${inputClass} mt-1.5`}
                                            value={form.traffic[vehicle.key]}
                                            onChange={(e) => updateNested("traffic", vehicle.key, e.target.value)}
                                            placeholder="Enter traffic quantity"
                                        />
                                        {errors[`traffic.${vehicle.key}`] && <span className="mt-1 block text-xs text-red-600">{errors[`traffic.${vehicle.key}`]}</span>}
                                    </label>
                                ))}
                            </div>
                        </section>

                        {/* COMPARISON AND CALCULATION TABLE */}
                        <section className="overflow-hidden rounded-xl border border-slate-200">
                            <div className="border-b border-slate-200 bg-slate-50 p-4">
                                <h3 className="font-extrabold text-slate-900">Calculated Incremental VOC Savings</h3>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Each cell = (surface VOC − Good Paved Road VOC) × vehicle traffic × road length.
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1100px] border-collapse">
                                    <thead>
                                        <tr>
                                            <th className={thClass}>Comparison / Link</th>
                                            {VEHICLES.map((vehicle) => <th key={vehicle.key} className={`${thClass} text-right`}>{vehicle.label}</th>)}
                                            <th className={`${thClass} text-right`}>Row Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {COMPARISONS.map((item) => {
                                            const diff = costDifferences.find((row) => row.key === item.key);
                                            const result = results.bySurface[item.key];

                                            return (
                                                <tr key={item.key}>
                                                    <td className={tdClass}>
                                                        <p className="font-bold text-slate-800">{item.label}</p>
                                                        <p className="mt-1 text-xs font-bold text-blue-700">Link to {item.code}</p>
                                                        <p className="mt-1 text-xs text-slate-500">Length: {number(form.roadLengths[item.key])} km</p>
                                                    </td>
                                                    {VEHICLES.map((vehicle) => (
                                                        <td key={vehicle.key} className={`${tdClass} text-right tabular-nums`}>
                                                            <p className="text-xs text-slate-500">{diff.differences[vehicle.key].toFixed(2)} × {number(form.traffic[vehicle.key])} × {number(form.roadLengths[item.key])}</p>
                                                            <p className="mt-1 font-bold text-slate-900">{money(result.vehicleTotals[vehicle.key])}</p>
                                                        </td>
                                                    ))}
                                                    <td className={`${tdClass} text-right font-extrabold text-emerald-700`}>
                                                        {money(result.total)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="bg-sky-100">
                                            <td className={`${tdClass} font-extrabold text-slate-900`}>TOTAL INCREMENTAL VEHICLE OPERATING COST</td>
                                            {VEHICLES.map((vehicle) => {
                                                const total = COMPARISONS.reduce((sum, item) => sum + number(results.bySurface[item.key]?.vehicleTotals[vehicle.key]), 0);
                                                return <td key={vehicle.key} className={`${tdClass} text-right font-extrabold text-blue-900`}>{money(total)}</td>;
                                            })}
                                            <td className={`${tdClass} text-right font-extrabold text-emerald-800`}>{money(results.grandTotal)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* TOTAL AND NOTES */}
                        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                    <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">Calculated worksheet total</p>
                                    <p className="mt-1 text-2xl font-extrabold text-emerald-900 sm:text-3xl">{money(results.grandTotal)}</p>
                                    <p className="mt-2 text-xs leading-5 text-emerald-800">
                                        Calculated from the entered road lengths and vehicle traffic. Confirm the intended traffic units and official methodology before using this result in the final economic analysis.
                                    </p>
                                </div>
                                <FaCoins className="hidden text-4xl text-emerald-700 sm:block" />
                            </div>
                        </section>

                        <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                            <FaInfoCircle className="mt-1 shrink-0" />
                            <p>
                                This modal stores the input in the current ManageBenefits page state. It does not save to MySQL by itself. The saved record will be assigned to Vehicle Operating Cost — Tab 2.
                            </p>
                        </div>
                    </div>

                    <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:justify-between sm:px-6">
                        <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                            <FaTimes /> Cancel
                        </button>
                        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white hover:bg-blue-800">
                            <FaSave /> Save Tab 2 Input Data
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    );
}
