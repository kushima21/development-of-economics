
import { Head } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import {
    FaCalculator,
    FaDownload,
    FaFileInvoiceDollar,
    FaInfoCircle,
    FaPlus,
    FaRoad,
    FaSave,
    FaTimes,
    FaTrash,
    FaTools,
    FaClipboardCheck,
    FaCalendarAlt,
} from "react-icons/fa";

/* =========================================================
   CONFIGURATION
========================================================= */

const CURRENT_YEAR = new Date().getFullYear();

const DEFAULT_FACTORS = {
    equipment: "1.05",
    materials: "1.20",
    skilledLabor: "1.00",
    unskilledLabor: "0.60",
};

const COST_FIELDS = [
    { key: "equipment", label: "Equipment" },
    { key: "materials", label: "Materials" },
    { key: "skilledLabor", label: "Skilled Labor" },
    { key: "unskilledLabor", label: "Unskilled Labor" },
];

const FACTOR_FIELDS = [
    { key: "equipment", label: "Equipment Factor" },
    { key: "materials", label: "Materials Factor" },
    { key: "skilledLabor", label: "Skilled Labor Factor" },
    { key: "unskilledLabor", label: "Unskilled Labor Factor" },
];

const createActivity = (id = 1) => ({
    id,
    title: "",
    equipment: "",
    materials: "",
    skilledLabor: "",
    unskilledLabor: "",
});

const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

const numericValue = (value) => {
    if (value === "" || value === null || value === undefined) {
        return 0;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const calculateEconomicCost = (financialCost, factor) => {
    const financial = numericValue(financialCost);
    const conversion = Number(factor);

    if (
        !Number.isFinite(conversion) ||
        conversion <= 0 ||
        financial < 0
    ) {
        return 0;
    }

    return financial / conversion;
};

const calculateFinancialTotal = (activity) =>
    COST_FIELDS.reduce(
        (total, field) => total + numericValue(activity[field.key]),
        0
    );

const calculateEconomicBreakdown = (activity, factors) =>
    Object.fromEntries(
        COST_FIELDS.map((field) => [
            field.key,
            calculateEconomicCost(
                activity[field.key],
                factors[field.key]
            ),
        ])
    );

const calculateEconomicTotal = (activity, factors) =>
    Object.values(
        calculateEconomicBreakdown(activity, factors)
    ).reduce((total, amount) => total + amount, 0);

/* =========================================================
   NORMALIZE SAVED DATA
   Supports existing records and new records.
========================================================= */

function normalizeSavedActivity(activity, index) {
    const source = activity ?? {};

    return {
        id: source.id ?? source.activity_id ?? index + 1,
        title: String(
            source.title ??
                source.activity_name ??
                source.maintenance_activity ??
                ""
        ),
        equipment: String(source.equipment ?? ""),
        materials: String(source.materials ?? ""),
        skilledLabor: String(
            source.skilledLabor ??
                source.skilled_labor ??
                ""
        ),
        unskilledLabor: String(
            source.unskilledLabor ??
                source.unskilled_labor ??
                ""
        ),
    };
}

function parseArray(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    return [];
}

function normalizeFactors(savedFactors) {
    const source = savedFactors ?? {};

    return {
        equipment: String(
            source.equipment ?? DEFAULT_FACTORS.equipment
        ),
        materials: String(
            source.materials ?? DEFAULT_FACTORS.materials
        ),
        skilledLabor: String(
            source.skilledLabor ??
                source.skilled_labor ??
                DEFAULT_FACTORS.skilledLabor
        ),
        unskilledLabor: String(
            source.unskilledLabor ??
                source.unskilled_labor ??
                DEFAULT_FACTORS.unskilledLabor
        ),
    };
}

/* =========================================================
   CSV EXPORT
========================================================= */

function downloadCSV(activities, factors, evaluationYear) {
    const escapeCSV = (value) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = [
        ["MIADP - ROAD MAINTENANCE COST"],
        ["Evaluation Year", evaluationYear],
        ["Generated", new Date().toLocaleString("en-PH")],
        [],
        ["CONVERSION FACTORS"],
        ["Cost Category", "Conversion Factor"],
        ["Equipment", factors.equipment],
        ["Materials", factors.materials],
        ["Skilled Labor", factors.skilledLabor],
        ["Unskilled Labor", factors.unskilledLabor],
        [],
        [
            "No.",
            "Evaluation Year",
            "Maintenance Activity",
            "Equipment Financial Cost",
            "Materials Financial Cost",
            "Skilled Labor Financial Cost",
            "Unskilled Labor Financial Cost",
            "Total Financial Cost",
            "Equipment Economic Cost",
            "Materials Economic Cost",
            "Skilled Labor Economic Cost",
            "Unskilled Labor Economic Cost",
            "Total Economic Cost",
        ],
    ];

    activities.forEach((activity, index) => {
        const economic = calculateEconomicBreakdown(
            activity,
            factors
        );

        rows.push([
            index + 1,
            evaluationYear,
            activity.title,
            numericValue(activity.equipment).toFixed(2),
            numericValue(activity.materials).toFixed(2),
            numericValue(activity.skilledLabor).toFixed(2),
            numericValue(activity.unskilledLabor).toFixed(2),
            calculateFinancialTotal(activity).toFixed(2),
            economic.equipment.toFixed(2),
            economic.materials.toFixed(2),
            economic.skilledLabor.toFixed(2),
            economic.unskilledLabor.toFixed(2),
            calculateEconomicTotal(activity, factors).toFixed(2),
        ]);
    });

    const financialTotal = activities.reduce(
        (sum, activity) =>
            sum + calculateFinancialTotal(activity),
        0
    );

    const economicTotal = activities.reduce(
        (sum, activity) =>
            sum + calculateEconomicTotal(activity, factors),
        0
    );

    rows.push([]);
    rows.push([
        "GRAND TOTAL",
        evaluationYear,
        "",
        "",
        "",
        "",
        "",
        financialTotal.toFixed(2),
        "",
        "",
        "",
        "",
        economicTotal.toFixed(2),
    ]);

    const csv = rows
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download =
        `miadp-road-maintenance-cost-${evaluationYear || "draft"}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function CostInput({ label, value, onChange }) {
    return (
        <label className="block min-w-[125px]">
            <span className="sr-only">{label}</span>

            <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="0.00"
                aria-label={label}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-right text-sm font-semibold tabular-nums text-slate-800 outline-none transition placeholder:font-normal focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
            />
        </label>
    );
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    description,
    theme,
}) {
    const themes = {
        blue: {
            card: "border-blue-100 bg-white",
            icon: "bg-blue-50 text-blue-700",
            label: "text-blue-800",
            value: "text-slate-950",
            description: "text-slate-500",
        },
        emerald: {
            card: "border-emerald-200 bg-emerald-50/60",
            icon: "bg-emerald-100 text-emerald-800",
            label: "text-emerald-800",
            value: "text-emerald-950",
            description: "text-emerald-800",
        },
        amber: {
            card: "border-amber-200 bg-amber-50/60",
            icon: "bg-amber-100 text-amber-800",
            label: "text-amber-800",
            value: "text-amber-950",
            description: "text-amber-800",
        },
    };

    const style = themes[theme] || themes.blue;

    return (
        <div
            className={`rounded-2xl border p-4 sm:p-5 ${style.card}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p
                        className={`text-xs font-extrabold uppercase tracking-wider ${style.label}`}
                    >
                        {label}
                    </p>

                    <p
                        className={`mt-3 break-words text-xl font-black tracking-tight sm:text-2xl ${style.value}`}
                    >
                        {value}
                    </p>

                    <p className={`mt-1 text-xs ${style.description}`}>
                        {description}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
                >
                    <Icon size={18} />
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   MAIN MODAL
========================================================= */

export default function ModalRMUC({
    isOpen = true,
    onClose,
    onSave,
    evaluation_year: initialEvaluationYear = CURRENT_YEAR,
    savedAnalysis = null,
}) {
    const [evaluationYear, setEvaluationYear] = useState(
        String(initialEvaluationYear ?? CURRENT_YEAR)
    );

    const [activities, setActivities] = useState(() => [
        createActivity(1),
    ]);

    const [factors, setFactors] = useState({
        ...DEFAULT_FACTORS,
    });

    const [nextId, setNextId] = useState(2);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    /* -----------------------------------------------------
       LOAD OR RESET MODAL DATA

       savedAnalysis = null:
       Opens a blank form for a new record.

       savedAnalysis = existing record:
       Loads the saved year, factors and activities.
    ----------------------------------------------------- */

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setError("");
        setMessage("");
        setIsSaving(false);

        if (savedAnalysis) {
            const year =
                savedAnalysis.evaluation_year ??
                initialEvaluationYear ??
                CURRENT_YEAR;

            setEvaluationYear(String(year));

            const savedFactorData =
                savedAnalysis.conversion_factors ??
                savedAnalysis.conversionFactors ??
                savedAnalysis.factors ??
                {};

            setFactors(normalizeFactors(savedFactorData));

            const savedActivityData = parseArray(
                savedAnalysis.activities
            );

            const normalizedActivities = savedActivityData.length
                ? savedActivityData.map(normalizeSavedActivity)
                : [createActivity(1)];

            setActivities(normalizedActivities);

            const highestId = normalizedActivities.reduce(
                (highest, activity, index) => {
                    const id = Number(activity.id);
                    return Math.max(
                        highest,
                        Number.isFinite(id) ? id : index + 1
                    );
                },
                0
            );

            setNextId(highestId + 1);
        } else {
            setEvaluationYear(
                String(initialEvaluationYear ?? CURRENT_YEAR)
            );
            setActivities([createActivity(1)]);
            setFactors({ ...DEFAULT_FACTORS });
            setNextId(2);
        }
    }, [isOpen, savedAnalysis, initialEvaluationYear]);

    /* -----------------------------------------------------
       TOTALS
    ----------------------------------------------------- */

    const totals = useMemo(
        () =>
            activities.reduce(
                (result, activity) => {
                    const economic = calculateEconomicBreakdown(
                        activity,
                        factors
                    );

                    result.financial +=
                        calculateFinancialTotal(activity);

                    result.economic += Object.values(
                        economic
                    ).reduce((sum, amount) => sum + amount, 0);

                    COST_FIELDS.forEach((field) => {
                        result[field.key] += economic[field.key];
                    });

                    return result;
                },
                {
                    financial: 0,
                    economic: 0,
                    equipment: 0,
                    materials: 0,
                    skilledLabor: 0,
                    unskilledLabor: 0,
                }
            ),
        [activities, factors]
    );

    /* -----------------------------------------------------
       ACTIVITY HANDLERS
    ----------------------------------------------------- */

    const updateActivity = (id, field, value) => {
        setActivities((previous) =>
            previous.map((activity) =>
                activity.id === id
                    ? { ...activity, [field]: value }
                    : activity
            )
        );

        setError("");
        setMessage("");
    };

    const addActivity = () => {
        setActivities((previous) => [
            ...previous,
            createActivity(nextId),
        ]);

        setNextId((previous) => previous + 1);
        setError("");
        setMessage("");
    };

    const removeActivity = (id) => {
        if (activities.length <= 1) {
            setError(
                "At least one maintenance activity is required."
            );
            return;
        }

        setActivities((previous) =>
            previous.filter((activity) => activity.id !== id)
        );

        setError("");
        setMessage("");
    };

    const updateFactor = (field, value) => {
        setFactors((previous) => ({
            ...previous,
            [field]: value,
        }));

        setError("");
        setMessage("");
    };

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    const validateForm = () => {
        const yearText = String(evaluationYear).trim();
        const year = Number(yearText);

        if (
            yearText === "" ||
            !/^\d{4}$/.test(yearText) ||
            !Number.isInteger(year) ||
            year < 1900 ||
            year > 9999
        ) {
            return "Please enter a valid four-digit evaluation year.";
        }

        for (const field of FACTOR_FIELDS) {
            const value = String(
                factors[field.key] ?? ""
            ).trim();

            const factor = Number(value);

            if (
                value === "" ||
                !Number.isFinite(factor) ||
                factor <= 0
            ) {
                return `${field.label} must be greater than zero.`;
            }
        }

        for (
            let index = 0;
            index < activities.length;
            index += 1
        ) {
            const activity = activities[index];

            if (!activity.title.trim()) {
                return `Please enter a title for activity ${index + 1}.`;
            }

            for (const field of COST_FIELDS) {
                const value = String(
                    activity[field.key] ?? ""
                ).trim();

                if (
                    value !== "" &&
                    (!Number.isFinite(Number(value)) ||
                        Number(value) < 0)
                ) {
                    return `${field.label} cost for "${activity.title}" must be zero or greater.`;
                }
            }
        }

        return "";
    };

    /* -----------------------------------------------------
       SAVE
    ----------------------------------------------------- */

    const handleSave = async (event) => {
        event.preventDefault();

        setError("");
        setMessage("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        if (typeof onSave !== "function") {
            setError(
                "The save handler is not connected. The data has not been saved."
            );
            return;
        }

        const payload = {
            evaluation_year: Number(evaluationYear),

            conversion_factors: {
                equipment: Number(factors.equipment),
                materials: Number(factors.materials),
                skilledLabor: Number(factors.skilledLabor),
                unskilledLabor: Number(factors.unskilledLabor),
            },

            activities: activities.map((activity) => {
                const economic = calculateEconomicBreakdown(
                    activity,
                    factors
                );

                return {
                    title: activity.title.trim(),
                    equipment: numericValue(activity.equipment),
                    materials: numericValue(activity.materials),
                    skilledLabor: numericValue(
                        activity.skilledLabor
                    ),
                    unskilledLabor: numericValue(
                        activity.unskilledLabor
                    ),
                    totalFinancialCost:
                        calculateFinancialTotal(activity),
                    economicEquipmentCost: economic.equipment,
                    economicMaterialsCost: economic.materials,
                    economicSkilledLaborCost:
                        economic.skilledLabor,
                    economicUnskilledLaborCost:
                        economic.unskilledLabor,
                    totalEconomicCost: calculateEconomicTotal(
                        activity,
                        factors
                    ),
                };
            }),

            totalFinancialCost: totals.financial,
            totalEconomicCost: totals.economic,
        };

        try {
            setIsSaving(true);

            await onSave(payload);

            setMessage(
                `Road maintenance costs for ${evaluationYear} were saved successfully.`
            );
        } catch (saveError) {
            const errors = saveError?.errors;

            setError(
                saveError?.message ||
                    (errors
                        ? Object.values(errors).flat().join(" ")
                        : "Unable to save road maintenance costs. Please try again.")
            );
        } finally {
            setIsSaving(false);
        }
    };

    /* -----------------------------------------------------
       RENDER
    ----------------------------------------------------- */

    if (!isOpen) {
        return null;
    }

    return (
        <>
            <Head title="Road Maintenance Cost" />

            <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-950/75 p-2 backdrop-blur-sm sm:p-4">
                <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="rmuc-title"
                    className="flex max-h-[96dvh] w-full max-w-[1700px] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl sm:rounded-3xl"
                >
                    {/* HEADER */}
                    <header className="relative shrink-0 overflow-hidden bg-gradient-to-r from-slate-950 via-amber-950 to-orange-900 px-5 py-5 text-white sm:px-8 sm:py-6">
                        <div className="pointer-events-none absolute -right-8 -top-20 h-56 w-56 rounded-full border-[30px] border-white/5" />
                        <div className="pointer-events-none absolute bottom-0 right-36 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />

                        <div className="relative flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-100 sm:text-xs">
                                    <FaRoad />
                                    MIADP / Cost Component 03
                                </div>

                                <h1
                                    id="rmuc-title"
                                    className="mt-3 text-2xl font-black tracking-tight sm:text-3xl"
                                >
                                    Road Maintenance Cost
                                </h1>

                                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                                    Evaluate financial and economic costs
                                    for maintenance activities under MIADP
                                    infrastructure subprojects.
                                </p>

                                {savedAnalysis && (
                                    <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-200/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-amber-100">
                                        <FaClipboardCheck />
                                        Editing saved analysis
                                    </p>
                                )}
                            </div>

                            {onClose && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Close modal"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                    </header>

                    {/* FORM */}
                    <form
                        onSubmit={handleSave}
                        className="flex min-h-0 flex-1 flex-col overflow-hidden"
                    >
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                            {/* EVALUATION YEAR */}
                            <section className="border-b border-slate-200 bg-white p-4 sm:p-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                                            <FaCalendarAlt size={18} />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="rmuc-evaluation-year"
                                                className="block text-sm font-extrabold text-slate-800"
                                            >
                                                Evaluation Year
                                            </label>

                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                Enter the year covered by
                                                these maintenance cost
                                                calculations.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full sm:w-56">
                                        <input
                                            id="rmuc-evaluation-year"
                                            name="evaluation_year"
                                            type="number"
                                            min="1900"
                                            max="9999"
                                            step="1"
                                            inputMode="numeric"
                                            value={evaluationYear}
                                            onChange={(event) => {
                                                setEvaluationYear(
                                                    event.target.value
                                                );
                                                setError("");
                                                setMessage("");
                                            }}
                                            placeholder="Enter evaluation year"
                                            required
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold tabular-nums text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
                                        />

                                        <p className="mt-1.5 text-xs text-slate-500">
                                            Current year: {CURRENT_YEAR}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* SUMMARY CARDS */}
                            <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
                                <SummaryCard
                                    icon={FaFileInvoiceDollar}
                                    label="Total Financial Cost"
                                    value={formatCurrency(totals.financial)}
                                    description="Combined equipment, materials, and labor"
                                    theme="blue"
                                />

                                <SummaryCard
                                    icon={FaCalculator}
                                    label="Total Economic Cost"
                                    value={formatCurrency(totals.economic)}
                                    description="Calculated using conversion factors"
                                    theme="emerald"
                                />

                                <SummaryCard
                                    icon={FaTools}
                                    label="Maintenance Activities"
                                    value={activities.length}
                                    description={`Entries for evaluation year ${evaluationYear || "—"}`}
                                    theme="amber"
                                />
                            </div>

                            <div className="space-y-6 p-4 sm:p-6">
                                {/* CONVERSION FACTORS */}
                                <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                                    <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50/70 p-4 sm:p-5">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                                            <FaCalculator size={18} />
                                        </div>

                                        <div>
                                            <h2 className="font-extrabold text-slate-900">
                                                Economic Conversion Factors
                                            </h2>

                                            <p className="mt-1 text-sm leading-5 text-slate-600">
                                                These factors are editable.
                                                Confirm the appropriate
                                                values against your official
                                                MIADP evaluation guidelines.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
                                        {FACTOR_FIELDS.map((field) => (
                                            <label
                                                key={field.key}
                                                className="block"
                                            >
                                                <span className="mb-2 block text-sm font-bold text-slate-700">
                                                    {field.label}
                                                </span>

                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={factors[field.key]}
                                                    onChange={(event) =>
                                                        updateFactor(
                                                            field.key,
                                                            event.target.value
                                                        )
                                                    }
                                                    aria-label={field.label}
                                                    required
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold tabular-nums text-slate-900 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </section>

                                {/* FORMULA NOTE */}
                                <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                        <FaInfoCircle />
                                    </div>

                                    <div className="text-sm leading-6 text-blue-950">
                                        <p className="font-extrabold">
                                            Economic Cost = Financial Cost ÷
                                            Conversion Factor
                                        </p>

                                        <p className="mt-1 text-blue-900">
                                            Financial cost totals combine all
                                            four categories. Economic cost
                                            totals combine the four converted
                                            values for each activity.
                                        </p>
                                    </div>
                                </div>

                                {/* MAINTENANCE ACTIVITIES */}
                                <section>
                                    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                                    <FaTools />
                                                </span>

                                                <h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                                                    Maintenance Activities
                                                </h2>
                                            </div>

                                            <p className="mt-2 text-sm text-slate-500">
                                                Enter each maintenance
                                                activity for evaluation year{" "}
                                                <strong>
                                                    {evaluationYear || "—"}
                                                </strong>.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={addActivity}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-amber-800 focus:outline-none focus:ring-4 focus:ring-amber-200"
                                        >
                                            <FaPlus />
                                            Add Activity
                                        </button>
                                    </div>

                                    {/* COST TABLE */}
                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                        <div className="flex flex-col gap-1 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm font-bold text-slate-800">
                                                Activity Cost Breakdown —{" "}
                                                {evaluationYear ||
                                                    "No year entered"}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                Scroll horizontally to view
                                                all cost categories
                                            </p>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[2050px] border-collapse text-left text-sm">
                                                <thead>
                                                    <tr className="bg-slate-900 text-white">
                                                        <th
                                                            rowSpan={2}
                                                            className="sticky left-0 z-20 min-w-[270px] border-r border-white/10 bg-slate-900 px-4 py-4 font-extrabold"
                                                        >
                                                            Maintenance Activity
                                                        </th>

                                                        <th
                                                            colSpan={5}
                                                            className="border-r border-white/10 bg-blue-950 px-3 py-3 text-center text-xs font-extrabold uppercase tracking-wider"
                                                        >
                                                            Financial Costs
                                                        </th>

                                                        <th
                                                            colSpan={5}
                                                            className="bg-emerald-950 px-3 py-3 text-center text-xs font-extrabold uppercase tracking-wider"
                                                        >
                                                            Economic Costs
                                                        </th>

                                                        <th
                                                            rowSpan={2}
                                                            className="w-20 px-3 py-4 text-center font-extrabold"
                                                        >
                                                            Action
                                                        </th>
                                                    </tr>

                                                    <tr className="bg-slate-800 text-xs text-slate-200">
                                                        <th className="min-w-[155px] px-3 py-3 font-bold">
                                                            Equipment
                                                        </th>
                                                        <th className="min-w-[155px] px-3 py-3 font-bold">
                                                            Materials
                                                        </th>
                                                        <th className="min-w-[155px] px-3 py-3 font-bold">
                                                            Skilled Labor
                                                        </th>
                                                        <th className="min-w-[155px] px-3 py-3 font-bold">
                                                            Unskilled Labor
                                                        </th>
                                                        <th className="min-w-[175px] bg-blue-950 px-3 py-3 text-right font-extrabold text-white">
                                                            Total Financial
                                                        </th>
                                                        <th className="min-w-[155px] px-3 py-3 text-right font-bold">
                                                            Equipment
                                                        </th>
                                                        <th className="min-w-[155px] px-3 py-3 text-right font-bold">
                                                            Materials
                                                        </th>
                                                        <th className="min-w-[155px] px-3 py-3 text-right font-bold">
                                                            Skilled Labor
                                                        </th>
                                                        <th className="min-w-[155px] px-3 py-3 text-right font-bold">
                                                            Unskilled Labor
                                                        </th>
                                                        <th className="min-w-[175px] bg-emerald-950 px-3 py-3 text-right font-extrabold text-white">
                                                            Total Economic
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {activities.map(
                                                        (activity, index) => {
                                                            const economic =
                                                                calculateEconomicBreakdown(
                                                                    activity,
                                                                    factors
                                                                );

                                                            const financialTotal =
                                                                calculateFinancialTotal(
                                                                    activity
                                                                );

                                                            const economicTotal =
                                                                calculateEconomicTotal(
                                                                    activity,
                                                                    factors
                                                                );

                                                            return (
                                                                <tr
                                                                    key={activity.id}
                                                                    className="border-b border-slate-100 align-top transition last:border-0 hover:bg-amber-50/40"
                                                                >
                                                                    <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-4 py-4 align-top">
                                                                        <div className="mb-2 flex items-center gap-2">
                                                                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-xs font-black text-amber-900">
                                                                                {index + 1}
                                                                            </span>

                                                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                                                                Activity
                                                                            </span>
                                                                        </div>

                                                                        <input
                                                                            type="text"
                                                                            value={activity.title}
                                                                            onChange={(event) =>
                                                                                updateActivity(
                                                                                    activity.id,
                                                                                    "title",
                                                                                    event.target.value
                                                                                )
                                                                            }
                                                                            placeholder="e.g. Road grading and reshaping"
                                                                            aria-label={`Activity ${index + 1} title`}
                                                                            required
                                                                            className="w-full min-w-[230px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                                                                        />
                                                                    </td>

                                                                    {COST_FIELDS.map(
                                                                        (field) => (
                                                                            <td
                                                                                key={field.key}
                                                                                className="px-3 py-4"
                                                                            >
                                                                                <CostInput
                                                                                    label={`${field.label} financial cost for activity ${index + 1}`}
                                                                                    value={activity[field.key]}
                                                                                    onChange={(value) =>
                                                                                        updateActivity(
                                                                                            activity.id,
                                                                                            field.key,
                                                                                            value
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </td>
                                                                        )
                                                                    )}

                                                                    <td className="bg-blue-50/80 px-3 py-4 text-right">
                                                                        <span className="font-black tabular-nums text-blue-950">
                                                                            {formatCurrency(
                                                                                financialTotal
                                                                            )}
                                                                        </span>
                                                                    </td>

                                                                    {COST_FIELDS.map(
                                                                        (field) => (
                                                                            <td
                                                                                key={field.key}
                                                                                className="px-3 py-4 text-right"
                                                                            >
                                                                                <span className="font-semibold tabular-nums text-emerald-800">
                                                                                    {formatCurrency(
                                                                                        economic[field.key]
                                                                                    )}
                                                                                </span>
                                                                            </td>
                                                                        )
                                                                    )}

                                                                    <td className="bg-emerald-50/80 px-3 py-4 text-right">
                                                                        <span className="font-black tabular-nums text-emerald-950">
                                                                            {formatCurrency(
                                                                                economicTotal
                                                                            )}
                                                                        </span>
                                                                    </td>

                                                                    <td className="px-3 py-4 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeActivity(
                                                                                    activity.id
                                                                                )
                                                                            }
                                                                            title="Remove activity"
                                                                            aria-label={`Remove activity ${index + 1}`}
                                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100"
                                                                        >
                                                                            <FaTrash />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }
                                                    )}
                                                </tbody>

                                                <tfoot>
                                                    <tr className="bg-slate-900 text-white">
                                                        <td className="sticky left-0 z-10 border-r border-white/10 bg-slate-900 px-4 py-5 font-black">
                                                            GRAND TOTAL
                                                        </td>

                                                        <td
                                                            colSpan={4}
                                                            className="px-3 py-5 text-right text-xs font-bold uppercase tracking-wide text-slate-300"
                                                        >
                                                            All activities
                                                        </td>

                                                        <td className="bg-blue-950 px-3 py-5 text-right font-black tabular-nums text-white">
                                                            {formatCurrency(
                                                                totals.financial
                                                            )}
                                                        </td>

                                                        {COST_FIELDS.map(
                                                            (field) => (
                                                                <td
                                                                    key={field.key}
                                                                    className="px-3 py-5 text-right font-bold tabular-nums text-emerald-300"
                                                                >
                                                                    {formatCurrency(
                                                                        totals[field.key]
                                                                    )}
                                                                </td>
                                                            )
                                                        )}

                                                        <td className="bg-emerald-950 px-3 py-5 text-right font-black tabular-nums text-emerald-300">
                                                            {formatCurrency(
                                                                totals.economic
                                                            )}
                                                        </td>

                                                        <td />
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
                                        <FaInfoCircle className="mt-0.5 shrink-0" />

                                        <p>
                                            Financial costs are editable.
                                            Economic costs and totals are
                                            calculated automatically for
                                            evaluation year{" "}
                                            {evaluationYear || "—"}. Use
                                            horizontal scrolling to view
                                            every column on smaller screens.
                                        </p>
                                    </div>
                                </section>

                                {/* VALIDATION / STATUS */}
                                {error && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800"
                                    >
                                        <FaInfoCircle className="mt-0.5 shrink-0" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                {message && (
                                    <div
                                        role="status"
                                        className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900"
                                    >
                                        <FaClipboardCheck className="mt-0.5 shrink-0" />
                                        <p>{message}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* FIXED FOOTER */}
                        <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                            <button
                                type="button"
                                onClick={() =>
                                    downloadCSV(
                                        activities,
                                        factors,
                                        evaluationYear
                                    )
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-800 transition hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                            >
                                <FaDownload />
                                Export CSV
                            </button>

                            <div className="flex flex-col-reverse gap-2 sm:flex-row">
                                {onClose && (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-100"
                                    >
                                        <FaTimes />
                                        Cancel
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-amber-800 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <FaSave />
                                    {isSaving
                                        ? "Saving..."
                                        : savedAnalysis
                                          ? "Update Maintenance Costs"
                                          : "Save Maintenance Costs"}
                                </button>
                            </div>
                        </footer>
                    </form>
                </section>
            </div>
        </>
    );
}
