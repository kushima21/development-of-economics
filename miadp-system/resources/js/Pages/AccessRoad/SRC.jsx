
import { Head } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import {
    FaCalculator,
    FaCalendarAlt,
    FaDownload,
    FaFileInvoiceDollar,
    FaInfoCircle,
    FaSave,
    FaShieldAlt,
    FaTimes,
} from "react-icons/fa";

/* =========================================================
   SAFEGUARD-RELATED COST SECTIONS
   excludeEconomicCost: true means:
   - No conversion factor
   - No economic cost calculation
   - Financial cost is still included in the financial total
========================================================= */

const costSections = [
    {
        title: "1. Consultation Activities with Community and PAPS",
        items: [
            { id: "1.1", label: "Public Consultation / Project Orientation", factor: 1.12 },
            { id: "1.2", label: "Consultations with Direct Beneficiaries", factor: 1.12 },
        ],
    },
    {
        title: "2. CNC Application",
        items: [
            {
                id: "2.1",
                label: "Application Fee",
                excludeEconomicCost: true,
            },
            { id: "2.2", label: "Services of IEE / EIA Preparer", factor: 1.12 },
            { id: "2.3", label: "Notarization Fees / Other Operating Expenses", factor: 1.12 },
        ],
    },
    {
        title: "3. NCIP Certification",
        items: [
            { id: "3.1", label: "Work and Financial Plan", factor: 1.2 },
        ],
    },
    {
        title: "4. Right-of-Way (ROW) Acquisition",
        items: [
            { id: "4.1", label: "Parcellary Survey", factor: 1.2 },
            { id: "4.2", label: "Appraisal of Properties Affected", factor: 1.2 },
            { id: "4.3", label: "Notarization Fees / Other Operating Expenses", factor: 1.2 },
            { id: "4.4", label: "Cost for Annotation", factor: 1.2 },
            {
                id: "4.5",
                label: "Compensation for Land",
                excludeEconomicCost: true,
            },
            {
                id: "4.6",
                label: "Compensation and/or Reconstruction of Affected Structures",
                excludeEconomicCost: true,
            },
            {
                id: "4.7",
                label: "Compensation and/or Replacement of Affected Trees / Plants",
                factor: 1,
            },
            {
                id: "4.8",
                label: "Cost of Additional Assistance or Livelihood",
                excludeEconomicCost: true,
            },
        ],
    },
    {
        title: "5. Cutting of Trees",
        items: [
            {
                id: "5.1",
                label: "Tree Cutting Permit",
                excludeEconomicCost: true,
            },
            {
                id: "5.2",
                label: "Tree Replacement Plan",
                excludeEconomicCost: true,
            },
        ],
    },
    {
        title: "6. Resettlement Action Plan",
        items: [
            { id: "6", label: "Resettlement Action Plan", factor: 1.12 },
        ],
    },
    {
        title: "7. Relocation / Transfer of Utilities",
        items: [
            {
                id: "7",
                label: "Relocation / Transfer of Electric Posts and Other Utilities",
                excludeEconomicCost: true,
            },
        ],
    },
    {
        title: "8. Location and Zonal Clearances",
        items: [
            {
                id: "8",
                label: "Location and Zonal Clearances",
                excludeEconomicCost: true,
            },
        ],
    },
    {
        title: "9. Land Conversion",
        items: [
            {
                id: "9",
                label: "Land Conversion",
                excludeEconomicCost: true,
            },
        ],
    },
    {
        title: "10. Special Land Use Permit / Forest Land Use Agreement",
        items: [
            {
                id: "10.1",
                label: "Application Fee",
                excludeEconomicCost: true,
            },
            {
                id: "10.2",
                label: "Annual Fee",
                excludeEconomicCost: true,
            },
        ],
    },
    {
        title: "11. Special Use Agreement in Protected Areas",
        items: [
            {
                id: "11.1",
                label: "One-Time Development Fee",
                excludeEconomicCost: true,
            },
        ],
    },
    {
        title: "12. Water Quality / Potability Tests",
        items: [
            { id: "12", label: "Water Quality / Potability Tests", factor: 1.12 },
        ],
    },
    {
        title: "13. NWRB Water Permit",
        items: [
            {
                id: "13.1",
                label: "Application Fee",
                excludeEconomicCost: true,
            },
            {
                id: "13.2",
                label: "Processing / Direct Operating Expense",
                factor: 1.12,
            },
        ],
    },
    {
        title: "14. IP Plan",
        items: [
            {
                id: "14.1",
                label: "Cost of Plan Preparation / Direct Operating Expense",
                factor: 1.12,
            },
        ],
    },
    {
        title: "15. Biodiversity Management Plan",
        items: [
            {
                id: "15.1",
                label: "Cost of Plan Preparation / Direct Operating Expense",
                factor: 1.12,
            },
        ],
    },
    {
        title: "16. Cultural Heritage Management Plan",
        items: [
            {
                id: "16.1",
                label: "Cost of Plan Preparation / Direct Operating Expense",
                factor: 1.12,
            },
        ],
    },
    {
        title: "17. Integrated Pest Management Plan",
        items: [
            {
                id: "17.1",
                label: "Cost of Plan Preparation / Direct Operating Expense",
                factor: 1.12,
            },
        ],
    },
    {
        title: "18. Other Costs",
        items: [
            {
                id: "18",
                label: "Other Costs (Please Specify)",
                factor: 1.12,
                hasDescription: true,
            },
        ],
    },
];

const allItems = costSections.flatMap((section) => section.items);
const currentYear = new Date().getFullYear();

const hasEconomicCost = (item) => !item.excludeEconomicCost;

/* =========================================================
   INITIAL VALUES AND SAVED DATA
========================================================= */

const createInitialValues = () =>
    Object.fromEntries(
        allItems.map((item) => [
            item.id,
            {
                financialCost: "",
                ...(hasEconomicCost(item)
                    ? { conversionFactor: String(item.factor) }
                    : {}),
                description: "",
            },
        ])
    );

const normalizeSavedValues = (savedValues) => {
    const defaults = createInitialValues();

    let source = savedValues;

    if (typeof source === "string") {
        try {
            source = JSON.parse(source);
        } catch {
            return defaults;
        }
    }

    if (
        !source ||
        typeof source !== "object" ||
        Array.isArray(source)
    ) {
        return defaults;
    }

    const normalized = { ...defaults };

    allItems.forEach((item) => {
        const saved = source[item.id];

        if (!saved || typeof saved !== "object") {
            return;
        }

        normalized[item.id] = {
            financialCost:
                saved.financialCost === null ||
                saved.financialCost === undefined
                    ? ""
                    : String(saved.financialCost),

            ...(hasEconomicCost(item)
                ? {
                      conversionFactor:
                          saved.conversionFactor !== null &&
                          saved.conversionFactor !== undefined
                              ? String(saved.conversionFactor)
                              : saved.factor !== null &&
                                  saved.factor !== undefined
                                ? String(saved.factor)
                                : String(item.factor),
                  }
                : {}),

            description:
                saved.description === null ||
                saved.description === undefined
                    ? ""
                    : String(saved.description),
        };
    });

    return normalized;
};

/* =========================================================
   CALCULATION HELPERS
========================================================= */

const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

const calculateEconomicCost = (financialCost, factor) => {
    const financial =
        financialCost === "" ? 0 : Number(financialCost);
    const conversion = Number(factor);

    if (
        !Number.isFinite(financial) ||
        !Number.isFinite(conversion) ||
        conversion <= 0 ||
        financial < 0
    ) {
        return 0;
    }

    return financial / conversion;
};

/* =========================================================
   CSV EXPORT
========================================================= */

function downloadCSV(values, evaluationYear, totals) {
    const rows = [
        ["MIADP - Safeguard-Related Cost"],
        ["Evaluation Year", evaluationYear],
        [],
        [
            "Particulars",
            "Financial Cost at Year 0 (PHP)",
            "Conversion Factor",
            "Economic Cost (PHP)",
        ],
    ];

    costSections.forEach((section) => {
        rows.push([section.title, "", "", ""]);

        section.items.forEach((item) => {
            const entry = values[item.id] ?? {};
            const financial = Number(entry.financialCost) || 0;
            const included = hasEconomicCost(item);

            const factor = included
                ? Number(entry.conversionFactor)
                : "";

            const economic = included
                ? calculateEconomicCost(
                      entry.financialCost,
                      entry.conversionFactor
                  )
                : "";

            const particulars =
                `${item.id} ${item.label}` +
                (item.hasDescription && entry.description
                    ? `: ${entry.description}`
                    : "");

            rows.push([
                particulars,
                financial.toFixed(2),
                factor !== "" && Number.isFinite(factor) ? factor : "",
                economic === "" ? "" : economic.toFixed(2),
            ]);
        });
    });

    rows.push([]);
    rows.push([
        "TOTAL COST",
        totals.financial.toFixed(2),
        "",
        totals.economic.toFixed(2),
    ]);

    const escapeCSV = (value) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;

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
        `miadp-safeguard-related-cost-${evaluationYear || "year"}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ModalSRC({
    isOpen = true,
    onClose,
    onSave,
    evaluationYear: initialEvaluationYear = currentYear,
    savedAnalysis = null,
}) {
    const [values, setValues] = useState(createInitialValues);
    const [evaluationYear, setEvaluationYear] = useState(
        String(initialEvaluationYear)
    );
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    /* Load saved values when opening or switching records. */
    useEffect(() => {
        if (!isOpen) return;

        const savedRecord = savedAnalysis ?? null;

        setValues(
            normalizeSavedValues(
                savedRecord?.input_values ??
                    savedRecord?.values ??
                    null
            )
        );

        setEvaluationYear(
            String(
                savedRecord?.evaluation_year ??
                    savedRecord?.evaluationYear ??
                    initialEvaluationYear ??
                    currentYear
            )
        );

        setMessage("");
        setError("");
    }, [isOpen, savedAnalysis, initialEvaluationYear]);

    /* Calculate financial and economic totals separately. */
    const totals = useMemo(
        () =>
            allItems.reduce(
                (result, item) => {
                    const entry = values[item.id];

                    if (!entry) return result;

                    const financial =
                        entry.financialCost === ""
                            ? 0
                            : Number(entry.financialCost);

                    if (
                        Number.isFinite(financial) &&
                        financial >= 0
                    ) {
                        result.financial += financial;
                    }

                    // Excluded items never contribute to economic cost.
                    if (!hasEconomicCost(item)) {
                        return result;
                    }

                    const factor = Number(entry.conversionFactor);

                    if (
                        Number.isFinite(financial) &&
                        financial >= 0 &&
                        entry.conversionFactor !== "" &&
                        Number.isFinite(factor) &&
                        factor > 0
                    ) {
                        result.economic += financial / factor;
                    }

                    return result;
                },
                { financial: 0, economic: 0 }
            ),
        [values]
    );

    const updateItem = (id, field, value) => {
        setValues((previous) => ({
            ...previous,
            [id]: {
                ...previous[id],
                [field]: value,
            },
        }));

        setMessage("");
        setError("");
    };

    /* =====================================================
       VALIDATION AND SAVE
    ===================================================== */

    const handleSave = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        const year = Number(evaluationYear);

        if (
            evaluationYear.trim() === "" ||
            !Number.isInteger(year) ||
            year < 2000 ||
            year > 2100
        ) {
            setError(
                "Enter a valid evaluation year between 2000 and 2100."
            );
            return;
        }

        const invalidItem = allItems.find((item) => {
            const entry = values[item.id];

            if (!entry) return true;

            const financial =
                entry.financialCost.trim() === ""
                    ? 0
                    : Number(entry.financialCost);

            if (!Number.isFinite(financial) || financial < 0) {
                return true;
            }

            // Financial-only entries do not require a conversion factor.
            if (!hasEconomicCost(item)) {
                return false;
            }

            const factor = Number(entry.conversionFactor);

            return (
                entry.conversionFactor.trim() === "" ||
                !Number.isFinite(factor) ||
                factor <= 0
            );
        });

        if (invalidItem) {
            setError(
                `Check ${invalidItem.id} ${invalidItem.label}. Financial costs must be zero or greater. Items with economic costs must also have a conversion factor greater than zero.`
            );
            return;
        }

        if (!onSave) {
            setError(
                "The form is not connected to a save handler. Connect onSave to your Laravel save route."
            );
            return;
        }

        const payload = {
            evaluationYear: year,
            values,
            totalFinancialCost: Number(totals.financial.toFixed(2)),
            totalEconomicCost: Number(totals.economic.toFixed(2)),
        };

        try {
            setIsSaving(true);

            await onSave(payload);

            setMessage(
                savedAnalysis
                    ? "Safeguard-related cost update submitted successfully."
                    : "Safeguard-related cost submitted successfully."
            );
        } catch (saveError) {
            setError(
                saveError?.message ||
                    "Unable to save safeguard-related cost data. Please try again."
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <>
            <Head title="Safeguard-Related Cost" />

            <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-950/75 p-2 backdrop-blur-sm sm:p-4">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="src-title"
                    className="flex max-h-[96dvh] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
                >
                    {/* HEADER */}
                    <header className="relative shrink-0 overflow-hidden bg-gradient-to-r from-slate-950 via-blue-950 to-emerald-900 px-5 py-5 text-white sm:px-8 sm:py-7">
                        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full border-[25px] border-white/5" />

                        <div className="relative flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-100">
                                    <FaShieldAlt />
                                    MIADP · Cost Component 02
                                </span>

                                <h1
                                    id="src-title"
                                    className="mt-3 text-2xl font-black tracking-tight sm:text-3xl"
                                >
                                    Safeguard-Related Cost
                                </h1>

                                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                                    Enter safeguard, environmental, social,
                                    compliance, land acquisition, and other
                                    applicable costs for the infrastructure
                                    subproject.
                                </p>

                                {savedAnalysis && (
                                    <span className="mt-3 inline-flex rounded-full border border-amber-200/30 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-100">
                                        Viewing saved record · {evaluationYear}
                                    </span>
                                )}
                            </div>

                            {onClose && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Close safeguard cost form"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                    </header>

                    <form
                        onSubmit={handleSave}
                        className="flex min-h-0 flex-1 flex-col overflow-hidden"
                    >
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                            {/* EVALUATION YEAR */}
                            <section className="border-b border-slate-200 bg-white p-4 sm:px-6 sm:py-5">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(220px,320px)_1fr] sm:items-end">
                                    <div>
                                        <label
                                            htmlFor="src-evaluation-year"
                                            className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"
                                        >
                                            <FaCalendarAlt className="text-blue-800" />
                                            Evaluation Year
                                            <span className="text-red-600">*</span>
                                        </label>

                                        <input
                                            id="src-evaluation-year"
                                            name="evaluation_year"
                                            type="number"
                                            inputMode="numeric"
                                            min="2000"
                                            max="2100"
                                            step="1"
                                            required
                                            value={evaluationYear}
                                            onChange={(event) => {
                                                setEvaluationYear(event.target.value);
                                                setMessage("");
                                                setError("");
                                            }}
                                            placeholder="Enter evaluation year"
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                        <p className="mt-2 text-xs text-slate-500">
                                            Enter a year between 2000 and 2100.
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                                        <p className="font-bold">Record Information</p>
                                        <p className="mt-1 leading-6">
                                            The evaluation year is stored with
                                            the safeguard-related cost record
                                            for the selected subproject.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* SUMMARY CARDS */}
                            <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 sm:p-5">
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                        <FaFileInvoiceDollar className="text-blue-700" />
                                        Total Financial Cost
                                    </div>
                                    <p className="mt-2 break-words text-xl font-black text-slate-900 sm:text-2xl">
                                        {formatCurrency(totals.financial)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Year 0 · Current prices
                                    </p>
                                </div>

                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-800">
                                        <FaCalculator />
                                        Total Economic Cost
                                    </div>
                                    <p className="mt-2 break-words text-xl font-black text-emerald-950 sm:text-2xl">
                                        {formatCurrency(totals.economic)}
                                    </p>
                                    <p className="mt-1 text-xs text-emerald-800">
                                        Excludes the specified financial-only items
                                    </p>
                                </div>

                                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-800">
                                        <FaShieldAlt />
                                        Cost Particulars
                                    </div>
                                    <p className="mt-2 text-xl font-black text-blue-950 sm:text-2xl">
                                        {allItems.length}
                                    </p>
                                    <p className="mt-1 text-xs text-blue-800">
                                        Editable cost entries
                                    </p>
                                </div>
                            </div>

                            {/* MAIN CONTENT */}
                            <div className="space-y-5 p-3 sm:p-6">
                                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                                    <FaInfoCircle className="mt-0.5 shrink-0 text-blue-700" />
                                    <p className="leading-6">
                                        <strong>Calculation:</strong> For applicable
                                        items, Economic Cost = Financial Cost ÷
                                        Conversion Factor. Items marked as
                                        financial-only have no conversion factor
                                        and no economic-cost calculation. Verify
                                        the applicable factors against your
                                        official MIADP guidelines.
                                    </p>
                                </div>

                                {/* COST TABLE */}
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                                        <thead>
                                            <tr className="bg-slate-900 text-white">
                                                <th className="w-[43%] px-4 py-4 font-bold">
                                                    Particulars
                                                </th>
                                                <th className="w-[21%] px-4 py-4 font-bold">
                                                    Financial Cost at Year 0 (₱)
                                                </th>
                                                <th className="w-[15%] px-4 py-4 font-bold">
                                                    Conversion Factor
                                                </th>
                                                <th className="w-[21%] px-4 py-4 text-right font-bold">
                                                    Economic Cost (₱)
                                                </th>
                                            </tr>
                                        </thead>

                                        {costSections.map((section) => (
                                            <tbody key={section.title}>
                                                <tr className="bg-slate-100">
                                                    <td
                                                        colSpan={4}
                                                        className="border-y border-slate-200 px-4 py-3 font-extrabold text-slate-800"
                                                    >
                                                        {section.title}
                                                    </td>
                                                </tr>

                                                {section.items.map((item) => {
                                                    const included =
                                                        hasEconomicCost(item);

                                                    const entry = values[item.id] ?? {
                                                        financialCost: "",
                                                        ...(included
                                                            ? {
                                                                  conversionFactor:
                                                                      String(item.factor),
                                                              }
                                                            : {}),
                                                        description: "",
                                                    };

                                                    const economicCost = included
                                                        ? calculateEconomicCost(
                                                              entry.financialCost,
                                                              entry.conversionFactor
                                                          )
                                                        : null;

                                                    return (
                                                        <tr
                                                            key={item.id}
                                                            className="border-b border-slate-100 transition hover:bg-blue-50/40"
                                                        >
                                                            <td className="px-4 py-3">
                                                                <div className="font-semibold text-slate-700">
                                                                    <span className="mr-2 text-xs font-black text-blue-700">
                                                                        {item.id}
                                                                    </span>
                                                                    {item.label}
                                                                </div>

                                                                {item.excludeEconomicCost && (
                                                                    <span className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                                                        Financial cost only
                                                                    </span>
                                                                )}

                                                                {item.hasDescription && (
                                                                    <input
                                                                        type="text"
                                                                        value={entry.description}
                                                                        onChange={(event) =>
                                                                            updateItem(
                                                                                item.id,
                                                                                "description",
                                                                                event.target.value
                                                                            )
                                                                        }
                                                                        placeholder="Specify other cost..."
                                                                        aria-label="Description of other safeguard cost"
                                                                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                                    />
                                                                )}
                                                            </td>

                                                            {/* FINANCIAL COST: ALL ITEMS */}
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={entry.financialCost}
                                                                    onChange={(event) =>
                                                                        updateItem(
                                                                            item.id,
                                                                            "financialCost",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    placeholder="0.00"
                                                                    aria-label={`Financial cost for ${item.label}`}
                                                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-right font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                                />
                                                            </td>

                                                            {/* FACTOR: ONLY APPLICABLE ITEMS */}
                                                            <td className="px-4 py-3">
                                                                {included ? (
                                                                    <input
                                                                        type="number"
                                                                        min="0.01"
                                                                        step="0.01"
                                                                        value={entry.conversionFactor}
                                                                        onChange={(event) =>
                                                                            updateItem(
                                                                                item.id,
                                                                                "conversionFactor",
                                                                                event.target.value
                                                                            )
                                                                        }
                                                                        aria-label={`Conversion factor for ${item.label}`}
                                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-right font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                                    />
                                                                ) : (
                                                                    <span className="block text-center text-slate-400">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* ECONOMIC COST: ONLY APPLICABLE ITEMS */}
                                                            <td className="px-4 py-3 text-right">
                                                                {included ? (
                                                                    <span className="font-bold tabular-nums text-emerald-800">
                                                                        {formatCurrency(economicCost)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        ))}

                                        <tfoot>
                                            <tr className="bg-slate-900 text-white">
                                                <td className="px-4 py-5 font-black">
                                                    TOTAL COST
                                                </td>
                                                <td className="px-4 py-5 text-right font-black tabular-nums">
                                                    {formatCurrency(totals.financial)}
                                                </td>
                                                <td className="px-4 py-5 text-center text-xs text-slate-300">
                                                    —
                                                </td>
                                                <td className="px-4 py-5 text-right font-black tabular-nums text-emerald-300">
                                                    {formatCurrency(totals.economic)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {error && (
                                    <div
                                        role="alert"
                                        className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800"
                                    >
                                        <div className="flex items-start gap-2">
                                            <FaInfoCircle className="mt-0.5 shrink-0" />
                                            <p>{error}</p>
                                        </div>
                                    </div>
                                )}

                                {message && (
                                    <div
                                        role="status"
                                        className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
                                    >
                                        {message}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* FOOTER */}
                        <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                            <button
                                type="button"
                                onClick={() =>
                                    downloadCSV(values, evaluationYear, totals)
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            >
                                <FaDownload />
                                Export CSV
                            </button>

                            <div className="flex flex-col-reverse gap-2 sm:flex-row">
                                {onClose && (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={isSaving}
                                        className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <span className="inline-flex items-center justify-center gap-2">
                                            <FaTimes />
                                            Cancel
                                        </span>
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <FaSave />
                                    {isSaving ? "Saving..." : "Save Cost Inputs"}
                                </button>
                            </div>
                        </footer>
                    </form>
                </div>
            </div>
        </>
    );
}
