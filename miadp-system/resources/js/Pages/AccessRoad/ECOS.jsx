
import { useEffect, useMemo, useState } from "react";
import {
    FaTimes,
    FaCalculator,
    FaDownload,
    FaSave,
    FaFileInvoiceDollar,
    FaInfoCircle,
    FaLock,
    FaCoins,
    FaArrowRight,
    FaCheckCircle,
    FaChartLine,
    FaCalendarAlt,
} from "react-icons/fa";

const FOREIGN_FACTOR = 1.2;
const UNSKILLED_FACTOR = 0.6;

const INITIAL_VALUES = {
    evaluationYear: String(new Date().getFullYear()),
    materials: "",
    equipment: "",
    subtotalLabor: "",
    ocm: "",
    contractorProfit: "",
    taxes: "",
    preEngineering: "",
    engineeringSupervision: "",
    safeguardFinancialCost: "",
    safeguardEconomicCost: "",
};

const COST_FIELDS = [
    { key: "materials", label: "Materials", code: "A" },
    { key: "equipment", label: "Equipment", code: "B" },
    { key: "subtotalLabor", label: "Subtotal Labor", code: "C" },
    { key: "ocm", label: "Other Costs of Maintenance (OCM)", code: "D" },
    { key: "contractorProfit", label: "Contractor's Profit", code: "E" },
    { key: "taxes", label: "Taxes", code: "F" },
    { key: "preEngineering", label: "Pre-engineering", code: "G" },
    {
        key: "engineeringSupervision",
        label: "Engineering Supervision",
        code: "H",
    },
    { key: "safeguardFinancialCost", label: "Safeguards Financial Cost", code: "I" },
    { key: "safeguardEconomicCost", label: "Safeguards Economic Cost", code: "I" },
];

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(toNumber(value));

const formatNumber = (value) =>
    new Intl.NumberFormat("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(toNumber(value));

const escapeCsv = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
};

function SectionHeading({ number, title, description }) {
    return (
        <div className="flex items-start gap-3 border-b border-slate-200 pb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-sm font-bold text-teal-700 ring-1 ring-teal-100">
                {number}
            </div>

            <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-800">
                    {title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    );
}

function MoneyInput({ value, onChange, label }) {
    return (
        <div className="relative min-w-32">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-slate-400">
                ₱
            </span>

            <input
                type="number"
                min="0"
                step="0.01"
                aria-label={label}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-right text-sm font-semibold tabular-nums text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-300 hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
        </div>
    );
}

function ValueCell({ value, highlight = false }) {
    return (
        <div
            className={`whitespace-nowrap text-right text-sm tabular-nums ${
                highlight
                    ? "font-bold text-teal-800"
                    : "font-medium text-slate-700"
            }`}
        >
            {formatNumber(value)}
        </div>
    );
}

function CostRow({
    code,
    label,
    description,
    financial = 0,
    economic = 0,
    input = false,
    inputValue = "",
    onInputChange,
    factor,
    indent = false,
    total = false,
    grandTotal = false,
    excluded = false,
}) {
    return (
        <tr
            className={`transition-colors ${
                grandTotal
                    ? "border-t-2 border-slate-300 bg-slate-900"
                    : total
                      ? "border-y border-slate-200 bg-slate-50"
                      : "border-b border-slate-100 hover:bg-slate-50/80"
            }`}
        >
            <td className="w-16 px-3 py-3.5 align-middle sm:px-4">
                <span
                    className={`inline-flex min-w-8 items-center justify-center rounded-md px-2 py-1 text-xs font-bold ${
                        grandTotal
                            ? "bg-white/10 text-teal-200"
                            : total
                              ? "bg-slate-200 text-slate-700"
                              : "bg-slate-100 text-slate-500"
                    }`}
                >
                    {code}
                </span>
            </td>

            <td className="min-w-56 px-3 py-3.5 sm:px-4">
                <div className={indent ? "pl-3 sm:pl-5" : ""}>
                    <div
                        className={`text-sm ${
                            grandTotal
                                ? "font-bold text-white"
                                : total
                                  ? "font-bold text-slate-800"
                                  : indent
                                    ? "font-medium text-slate-600"
                                    : "font-semibold text-slate-700"
                        }`}
                    >
                        {label}
                    </div>

                    {description && (
                        <div
                            className={`mt-1 text-xs ${
                                grandTotal
                                    ? "text-slate-300"
                                    : "text-slate-400"
                            }`}
                        >
                            {description}
                        </div>
                    )}
                </div>
            </td>

            <td className="min-w-40 px-3 py-3 sm:px-4">
                {input ? (
                    <MoneyInput
                        value={inputValue}
                        onChange={onInputChange}
                        label={label}
                    />
                ) : (
                    <ValueCell
                        value={financial}
                        highlight={total || grandTotal}
                    />
                )}
            </td>

            <td className="min-w-32 px-3 py-3 text-center">
                {factor ? (
                    <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                            grandTotal
                                ? "bg-white/10 text-teal-200"
                                : "bg-slate-100 text-slate-600"
                        }`}
                    >
                        {factor}
                    </span>
                ) : (
                    <span
                        className={
                            grandTotal ? "text-slate-500" : "text-slate-300"
                        }
                    >
                        —
                    </span>
                )}
            </td>

            <td
                className={`min-w-40 px-3 py-3 sm:px-4 ${
                    grandTotal
                        ? "bg-teal-500/10"
                        : total
                          ? "bg-teal-50/70"
                          : "bg-teal-50/30"
                }`}
            >
                {excluded ? (
                    <div className="text-right text-xs font-semibold text-amber-700">
                        Excluded
                    </div>
                ) : (
                    <ValueCell
                        value={economic}
                        highlight={total || grandTotal}
                    />
                )}
            </td>
        </tr>
    );
}

export default function ModalECOF({
    show = true,
    onClose = () => {},
    onSave,
    subproject = null,
    savedAnalysis = null,
}) {
    const [values, setValues] = useState({ ...INITIAL_VALUES });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [saveError, setSaveError] = useState("");

    // Load saved values whenever the selected subproject or saved analysis changes.
    useEffect(() => {
        const savedInputs =
            savedAnalysis?.input_values ??
            savedAnalysis?.inputValues ??
            {};

        setValues({
            ...INITIAL_VALUES,
            ...Object.fromEntries(
                Object.keys(INITIAL_VALUES).map((key) => [
                    key,
                    savedInputs[key] ??
                        (key === "safeguardFinancialCost"
                            ? savedAnalysis?.safeguardFinancialCost ??
                              savedAnalysis?.safeguard_financial_cost ??
                              subproject?.safeguardFinancialCost ??
                              subproject?.safeguard_financial_cost ??
                              ""
                            : key === "safeguardEconomicCost"
                              ? savedAnalysis?.safeguardEconomicCost ??
                                savedAnalysis?.safeguard_economic_cost ??
                                subproject?.safeguardEconomicCost ??
                                subproject?.safeguard_economic_cost ??
                                ""
                              : key === "evaluationYear"
                            ? savedAnalysis?.evaluation_year ??
                              savedInputs.evaluation_year ??
                              INITIAL_VALUES.evaluationYear
                            : INITIAL_VALUES[key]),
                ]),
            ),
            evaluationYear: String(
                savedAnalysis?.evaluation_year ??
                    savedInputs.evaluationYear ??
                    savedInputs.evaluation_year ??
                    INITIAL_VALUES.evaluationYear,
            ),
        });

        setSaveMessage("");
        setSaveError("");
    }, [subproject?.subproject_id, savedAnalysis]);

    const setNamedValue = (name, value) => {
        setValues((previous) => ({
            ...previous,
            [name]: value,
        }));

        setSaveMessage("");
        setSaveError("");
    };

    const result = useMemo(() => {
        const materials = toNumber(values.materials);
        const equipment = toNumber(values.equipment);
        const subtotalLabor = toNumber(values.subtotalLabor);
        const ocm = toNumber(values.ocm);
        const contractorProfit = toNumber(values.contractorProfit);
        const taxes = toNumber(values.taxes);
        const preEngineering = toNumber(values.preEngineering);
        const engineeringSupervision = toNumber(
            values.engineeringSupervision,
        );
        const safeguardFinancialCost = toNumber(values.safeguardFinancialCost);
        const safeguardEconomicCost = toNumber(values.safeguardEconomicCost);

        // Materials: 60% foreign and 40% locally sourced.
        const foreignMaterials = materials * 0.6;
        const localMaterials = materials * 0.4;
        const economicForeignMaterials =
            foreignMaterials * FOREIGN_FACTOR;
        const economicLocalMaterials = localMaterials;
        const economicMaterials =
            economicForeignMaterials + economicLocalMaterials;

        // Labor: 60% skilled and 40% unskilled.
        const skilledLabor = subtotalLabor * 0.6;
        const unskilledLabor = subtotalLabor * 0.4;
        const economicSkilledLabor = skilledLabor;
        const economicUnskilledLabor =
            unskilledLabor * UNSKILLED_FACTOR;
        const economicLabor =
            economicSkilledLabor + economicUnskilledLabor;

        const financialDirectCost =
            materials + equipment + subtotalLabor;

        const economicDirectCost =
            economicMaterials + equipment + economicLabor;

        const financialDirectOcmProfit =
            financialDirectCost + ocm + contractorProfit;

        const economicDirectOcmProfit =
            economicDirectCost + ocm + contractorProfit;

        const financialTotal =
            financialDirectOcmProfit +
            taxes +
            preEngineering +
            engineeringSupervision +
            safeguardFinancialCost;

        // Taxes are excluded from economic cost.
        const economicTotal =
            economicDirectOcmProfit +
            preEngineering +
            engineeringSupervision +
            safeguardEconomicCost;

        return {
            materials,
            foreignMaterials,
            localMaterials,
            economicForeignMaterials,
            economicLocalMaterials,
            economicMaterials,
            equipment,
            subtotalLabor,
            skilledLabor,
            unskilledLabor,
            economicSkilledLabor,
            economicUnskilledLabor,
            economicLabor,
            financialDirectCost,
            economicDirectCost,
            ocm,
            contractorProfit,
            financialDirectOcmProfit,
            economicDirectOcmProfit,
            taxes,
            preEngineering,
            engineeringSupervision,
            safeguardFinancialCost,
            safeguardEconomicCost,
            financialTotal,
            economicTotal,
            savings: financialTotal - economicTotal,
        };
    }, [values]);

    const hasEnteredCosts = Object.values(values).some(
        (value) =>
            value !== "" &&
            value !== null &&
            value !== undefined &&
            toNumber(value) !== 0,
    );

    const subprojectName =
        subproject?.subproject_title ??
        subproject?.subproject_name ??
        subproject?.name_of_subproject ??
        subproject?.name ??
        "MIADP Infrastructure Subproject";

    const subprojectId =
        subproject?.subproject_id ?? subproject?.id ?? null;

    const handleExport = () => {
        const rows = [
            ["MIADP Economic and Financial Cost Analysis"],
            ["Subproject", subprojectName],
            ["Subproject ID", subprojectId ?? "N/A"],
            ["Input Year", values.evaluationYear || "N/A"],
            [],
            [
                "Code",
                "Cost Component",
                "Financial Cost (PHP)",
                "Conversion Factor",
                "Economic Cost (PHP)",
            ],
            ["A", "Materials", result.materials, "", result.economicMaterials],
            [
                "A1",
                "Foreign Component",
                result.foreignMaterials,
                FOREIGN_FACTOR,
                result.economicForeignMaterials,
            ],
            [
                "A2",
                "Locally Sourced Materials",
                result.localMaterials,
                "1.00",
                result.economicLocalMaterials,
            ],
            ["B", "Equipment", result.equipment, "1.00", result.equipment],
            [
                "C",
                "Subtotal Labor",
                result.subtotalLabor,
                "",
                result.economicLabor,
            ],
            [
                "C1",
                "Skilled Labor",
                result.skilledLabor,
                "1.00",
                result.economicSkilledLabor,
            ],
            [
                "C2",
                "Unskilled Labor",
                result.unskilledLabor,
                UNSKILLED_FACTOR,
                result.economicUnskilledLabor,
            ],
            [
                "D",
                "Total Direct Cost",
                result.financialDirectCost,
                "",
                result.economicDirectCost,
            ],
            ["E", "OCM", result.ocm, "1.00", result.ocm],
            [
                "F",
                "Contractor's Profit",
                result.contractorProfit,
                "1.00",
                result.contractorProfit,
            ],
            [
                "G",
                "Direct Cost + OCM + Contractor's Profit",
                result.financialDirectOcmProfit,
                "",
                result.economicDirectOcmProfit,
            ],
            [
                "H",
                "Taxes",
                result.taxes,
                "Excluded",
                "Excluded from economic cost",
            ],
            [
                "I",
                "Pre-engineering",
                result.preEngineering,
                "1.00",
                result.preEngineering,
            ],
            [
                "J",
                "Engineering Supervision",
                result.engineeringSupervision,
                "1.00",
                result.engineeringSupervision,
            ],
            [
                "K",
                "Safeguards Cost",
                result.safeguardFinancialCost,
                "1.00",
                result.safeguardEconomicCost,
            ],
            [
                "TOTAL",
                "Total Cost",
                result.financialTotal,
                "",
                result.economicTotal,
            ],
        ];

        const csv = rows
            .map((row) => row.map(escapeCsv).join(","))
            .join("\r\n");

        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `miadp-economic-cost-${values.evaluationYear || "analysis"}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const handleSave = async () => {
        if (!values.evaluationYear) {
            setSaveError("Please enter the evaluation year.");
            return;
        }

        const year = Number(values.evaluationYear);

        if (
            !Number.isInteger(year) ||
            year < 2000 ||
            year > 2100
        ) {
            setSaveError("Please enter a valid year between 2000 and 2100.");
            return;
        }

        if (!subprojectId) {
            setSaveError("Please select a subproject before saving.");
            return;
        }

        if (typeof onSave !== "function") {
            setSaveError(
                "Saving is not connected. Please provide an onSave handler.",
            );
            return;
        }

        setIsSaving(true);
        setSaveMessage("");
        setSaveError("");

        const numericInputs = {
            materials: toNumber(values.materials),
            equipment: toNumber(values.equipment),
            subtotalLabor: toNumber(values.subtotalLabor),
            ocm: toNumber(values.ocm),
            contractorProfit: toNumber(values.contractorProfit),
            taxes: toNumber(values.taxes),
            preEngineering: toNumber(values.preEngineering),
            engineeringSupervision: toNumber(values.engineeringSupervision),
            safeguardFinancialCost: toNumber(values.safeguardFinancialCost),
            safeguardEconomicCost: toNumber(values.safeguardEconomicCost),
        };

        const payload = {
            ...numericInputs,
            evaluationYear: year,
            evaluation_year: year,
            subproject_id: subprojectId,
            foreign_factor: FOREIGN_FACTOR,
            unskilled_factor: UNSKILLED_FACTOR,
            input_values: {
                ...numericInputs,
                evaluationYear: year,
                evaluation_year: year,
            },
            calculations: result,
        };

        try {
            await onSave(payload);
            setSaveMessage("Economic cost analysis saved successfully.");
        } catch (error) {
            setSaveError(
                error?.message ||
                    "Unable to save the economic cost analysis. Please try again.",
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !isSaving
                ) {
                    onClose();
                }
            }}
        >
            <div className="flex h-full w-full max-w-7xl flex-col overflow-hidden bg-slate-50 shadow-2xl sm:h-[94vh] sm:rounded-2xl sm:border sm:border-white/20">
                {/* Header */}
                <header className="relative shrink-0 overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 px-5 py-5 text-white sm:px-8 sm:py-6">
                    <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute -right-2 -top-14 h-44 w-44 rounded-full border border-white/10" />

                    <div className="relative flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-teal-300 shadow-lg sm:h-14 sm:w-14">
                                <FaFileInvoiceDollar className="text-2xl" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full border border-teal-300/30 bg-teal-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-200">
                                        MIADP · Cost Analysis
                                    </span>
                                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                                        Tab 1
                                    </span>
                                </div>

                                <h2 className="text-lg font-bold tracking-tight sm:text-2xl">
                                    Economic &amp; Financial Cost Analysis
                                </h2>

                                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300 sm:text-sm">
                                    Review financial costs, apply economic
                                    conversion factors, and compare total
                                    project costs.
                                </p>

                                {/* Subproject information */}
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-slate-200">
                                        <FaCoins className="shrink-0 text-teal-300" />
                                        <span className="truncate">
                                            {subprojectName}
                                        </span>
                                    </span>

                                    {subprojectId !== null &&
                                        subprojectId !== undefined && (
                                            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-slate-300">
                                                ID: {subprojectId}
                                            </span>
                                        )}
                                </div>

                                {/* Input year aligned with header content */}
                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
                                    <label className="block">
                                        <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-200">
                                            <FaCalendarAlt className="text-teal-300" />
                                            Input Year
                                            <span className="text-rose-300">*</span>
                                        </span>

                                        <input
                                            type="number"
                                            min="2000"
                                            max="2100"
                                            required
                                            value={values.evaluationYear}
                                            onChange={(event) =>
                                                setNamedValue(
                                                    "evaluationYear",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Enter year"
                                            className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white outline-none transition placeholder:text-slate-400 hover:border-white/30 focus:border-teal-300 focus:ring-2 focus:ring-teal-400/20"
                                        />

                                        <span className="mt-1 block text-[10px] text-slate-400">
                                            Year covered by this cost analysis
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            aria-label="Close economic cost analysis"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </header>

                {/* Main content */}
                <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6">
                    <div className="mx-auto max-w-6xl space-y-6">
                        {/* Summary cards */}
                        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Financial Total
                                    </span>
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                        <FaCoins />
                                    </span>
                                </div>
                                <div className="mt-3 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                    {formatCurrency(result.financialTotal)}
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    Includes applicable taxes
                                </p>
                            </div>

                            <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-white to-teal-50/70 p-4 shadow-sm sm:p-5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                                        Economic Total
                                    </span>
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                                        <FaChartLine />
                                    </span>
                                </div>
                                <div className="mt-3 break-words text-xl font-bold tracking-tight text-teal-900 sm:text-2xl">
                                    {formatCurrency(result.economicTotal)}
                                </div>
                                <p className="mt-1 text-xs text-teal-800/70">
                                    Adjusted using conversion factors
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Cost Difference
                                    </span>
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                                        <FaCalculator />
                                    </span>
                                </div>
                                <div className="mt-3 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                    {formatCurrency(result.savings)}
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    Financial total minus economic total
                                </p>
                            </div>
                        </section>

                        {/* Conversion factor information */}
                        <section className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                            <div className="flex items-start gap-3">
                                <FaInfoCircle className="mt-0.5 shrink-0 text-blue-600" />
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-bold text-blue-950">
                                        Economic Conversion Assumptions
                                    </h3>
                                    <p className="mt-1 text-xs leading-5 text-blue-900/80 sm:text-sm">
                                        Materials are allocated 60% to foreign
                                        and 40% to local components. Labor is
                                        allocated 60% to skilled and 40% to
                                        unskilled labor. Economic cost excludes
                                        taxes, while other costs retain their
                                        financial values unless a conversion
                                        factor applies.
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="rounded-lg border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900">
                                            Foreign materials: ×{" "}
                                            {FOREIGN_FACTOR.toFixed(2)}
                                        </span>
                                        <span className="rounded-lg border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900">
                                            Unskilled labor: ×{" "}
                                            {UNSKILLED_FACTOR.toFixed(2)}
                                        </span>
                                        <span className="rounded-lg border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900">
                                            Taxes: excluded economically
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Financial inputs and cost breakdown */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                            <SectionHeading
                                number="01"
                                title="Financial Cost Inputs"
                                description="Enter your financial cost estimates. Economic values and totals are calculated automatically."
                            />

                            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {COST_FIELDS.slice(0, 3).map((field) => (
                                    <label key={field.key} className="block">
                                        <span className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                                            <span>{field.label}</span>
                                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                                                {field.code}
                                            </span>
                                        </span>

                                        <MoneyInput
                                            value={values[field.key]}
                                            onChange={(value) =>
                                                setNamedValue(field.key, value)
                                            }
                                            label={field.label}
                                        />
                                    </label>
                                ))}
                            </div>

                            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">
                                            Cost Breakdown
                                        </h3>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Amounts are expressed in Philippine
                                            pesos (PHP).
                                        </p>
                                    </div>

                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                                        <FaLock className="text-[9px]" />
                                        Calculated rows are read-only
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[820px] border-collapse">
                                        <thead className="sticky top-0 z-10 bg-slate-100">
                                            <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                <th className="px-3 py-3 sm:px-4">Code</th>
                                                <th className="px-3 py-3 sm:px-4">Cost Component</th>
                                                <th className="px-3 py-3 text-right sm:px-4">Financial Cost (₱)</th>
                                                <th className="px-3 py-3 text-center">Factor</th>
                                                <th className="bg-teal-50 px-3 py-3 text-right text-teal-800 sm:px-4">Economic Cost (₱)</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            <CostRow
                                                code="A"
                                                label="Materials"
                                                description="Total materials cost"
                                                financial={result.materials}
                                                economic={result.economicMaterials}
                                                input
                                                inputValue={values.materials}
                                                onInputChange={(value) => setNamedValue("materials", value)}
                                            />
                                            <CostRow
                                                code="A1"
                                                label="Foreign Component"
                                                financial={result.foreignMaterials}
                                                economic={result.economicForeignMaterials}
                                                factor="× 1.20"
                                                indent
                                            />
                                            <CostRow
                                                code="A2"
                                                label="Locally Sourced Materials"
                                                financial={result.localMaterials}
                                                economic={result.economicLocalMaterials}
                                                factor="× 1.00"
                                                indent
                                            />
                                            <CostRow
                                                code="AΣ"
                                                label="Total Materials"
                                                financial={result.materials}
                                                economic={result.economicMaterials}
                                                total
                                            />
                                            <CostRow
                                                code="B"
                                                label="Equipment"
                                                financial={result.equipment}
                                                economic={result.equipment}
                                                input
                                                inputValue={values.equipment}
                                                onInputChange={(value) => setNamedValue("equipment", value)}
                                                factor="× 1.00"
                                            />
                                            <CostRow
                                                code="C"
                                                label="Subtotal Labor"
                                                description="Total labor cost"
                                                financial={result.subtotalLabor}
                                                economic={result.economicLabor}
                                                input
                                                inputValue={values.subtotalLabor}
                                                onInputChange={(value) => setNamedValue("subtotalLabor", value)}
                                            />
                                            <CostRow
                                                code="C1"
                                                label="Skilled Labor"
                                                financial={result.skilledLabor}
                                                economic={result.economicSkilledLabor}
                                                factor="× 1.00"
                                                indent
                                            />
                                            <CostRow
                                                code="C2"
                                                label="Unskilled Labor"
                                                financial={result.unskilledLabor}
                                                economic={result.economicUnskilledLabor}
                                                factor="× 0.60"
                                                indent
                                            />
                                            <CostRow
                                                code="CΣ"
                                                label="Total Labor"
                                                financial={result.subtotalLabor}
                                                economic={result.economicLabor}
                                                total
                                            />
                                            <CostRow
                                                code="D"
                                                label="Total Direct Cost"
                                                financial={result.financialDirectCost}
                                                economic={result.economicDirectCost}
                                                total
                                            />
                                            <CostRow
                                                code="E"
                                                label="Other Costs of Maintenance (OCM)"
                                                financial={result.ocm}
                                                economic={result.ocm}
                                                input
                                                inputValue={values.ocm}
                                                onInputChange={(value) => setNamedValue("ocm", value)}
                                                factor="× 1.00"
                                            />
                                            <CostRow
                                                code="F"
                                                label="Contractor's Profit"
                                                financial={result.contractorProfit}
                                                economic={result.contractorProfit}
                                                input
                                                inputValue={values.contractorProfit}
                                                onInputChange={(value) => setNamedValue("contractorProfit", value)}
                                                factor="× 1.00"
                                            />
                                            <CostRow
                                                code="G"
                                                label="Direct Cost + OCM + Contractor's Profit"
                                                financial={result.financialDirectOcmProfit}
                                                economic={result.economicDirectOcmProfit}
                                                total
                                            />
                                            <CostRow
                                                code="H"
                                                label="Taxes"
                                                financial={result.taxes}
                                                economic={0}
                                                input
                                                inputValue={values.taxes}
                                                onInputChange={(value) => setNamedValue("taxes", value)}
                                                excluded
                                            />
                                            <CostRow
                                                code="I"
                                                label="Pre-engineering"
                                                financial={result.preEngineering}
                                                economic={result.preEngineering}
                                                input
                                                inputValue={values.preEngineering}
                                                onInputChange={(value) => setNamedValue("preEngineering", value)}
                                                factor="× 1.00"
                                            />
                                            <CostRow
                                                code="J"
                                                label="Engineering Supervision"
                                                financial={result.engineeringSupervision}
                                                economic={result.engineeringSupervision}
                                                input
                                                inputValue={values.engineeringSupervision}
                                                onInputChange={(value) => setNamedValue("engineeringSupervision", value)}
                                                factor="× 1.00"
                                            />
                                            <CostRow
                                                code="K"
                                                label="Safeguards Cost"
                                                financial={result.safeguardFinancialCost}
                                                economic={result.safeguardEconomicCost}
                                                factor="Separate values"
                                            />
                                            <CostRow
                                                code="Σ"
                                                label="TOTAL COST"
                                                description={`Final project costs for ${values.evaluationYear || "the selected year"}`}
                                                financial={result.financialTotal}
                                                economic={result.economicTotal}
                                                total
                                                grandTotal
                                            />
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <FaInfoCircle className="mt-0.5 shrink-0 text-slate-400" />
                                    <p className="text-xs leading-5 text-slate-600">
                                        Foreign materials and unskilled labor
                                        are adjusted using the conversion
                                        factors shown in the table.
                                    </p>
                                </div>

                                <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                                    <FaInfoCircle className="mt-0.5 shrink-0 text-amber-600" />
                                    <p className="text-xs leading-5 text-amber-900">
                                        Taxes are included in the financial
                                        total but excluded from the economic
                                        total.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Cost comparison */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                            <SectionHeading
                                number="02"
                                title="Cost Comparison"
                                description="Compare the resulting financial and economic costs before saving or exporting."
                            />

                            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                                        <FaCoins />
                                        Financial Project Cost
                                    </div>
                                    <div className="mt-3 break-words text-2xl font-bold text-blue-950 sm:text-3xl">
                                        {formatCurrency(result.financialTotal)}
                                    </div>
                                    <p className="mt-2 text-xs leading-5 text-blue-900/70">
                                        Includes materials, equipment, labor,
                                        OCM, contractor profit, taxes, and
                                        other project costs.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 sm:p-5">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-teal-900">
                                        <FaChartLine />
                                        Economic Project Cost
                                    </div>
                                    <div className="mt-3 break-words text-2xl font-bold text-teal-950 sm:text-3xl">
                                        {formatCurrency(result.economicTotal)}
                                    </div>
                                    <p className="mt-2 text-xs leading-5 text-teal-900/70">
                                        Reflects the specified conversion
                                        factors and excludes taxes.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Save feedback */}
                        {saveMessage && (
                            <div
                                role="status"
                                className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                            >
                                <FaCheckCircle className="mt-0.5 shrink-0" />
                                <span>{saveMessage}</span>
                            </div>
                        )}

                        {saveError && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                            >
                                {saveError}
                            </div>
                        )}

                        {!hasEnteredCosts && (
                            <p className="text-center text-xs text-slate-400">
                                Enter your cost estimates above. All totals
                                update automatically.
                            </p>
                        )}
                    </div>
                </main>

                {/* Footer actions */}
                <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-7">
                    <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                            <FaInfoCircle className="mt-0.5 shrink-0 text-slate-400" />
                            <span>
                                Year: {values.evaluationYear || "Not set"}.
                                Review all assumptions before saving.
                            </span>
                        </div>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FaTimes className="text-xs" />
                                Close
                            </button>

                            <button
                                type="button"
                                onClick={handleExport}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
                            >
                                <FaDownload className="text-xs" />
                                Export CSV
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-teal-900/15 transition hover:from-teal-800 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <FaSave className="text-xs" />
                                {isSaving ? "Saving..." : "Save Analysis"}
                                {!isSaving && (
                                    <FaArrowRight className="ml-1 text-[10px]" />
                                )}
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
