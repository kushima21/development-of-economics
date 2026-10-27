
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import Layout from "../Layouts/Layout";
import ModalECOF from "../AccessRoad/ECOS";
import ModalSRC from "../AccessRoad/SRC";
import ModalRMUC from "../AccessRoad/RMUC";

import {
    FaArrowLeft,
    FaArrowRight,
    FaCheckCircle,
    FaChevronRight,
    FaHome,
    FaLayerGroup,
    FaChartLine,
    FaCalculator,
    FaClipboardList,
    FaInfoCircle,
    FaShieldAlt,
    FaRoad,
    FaTools,
    FaMoneyBillWave,
    FaDownload,
    FaTimes,
    FaSave,
    FaEye,
    FaPlus,
    FaLink,
    FaUnlink,
} from "react-icons/fa";

const currentYear = new Date().getFullYear();

/* =========================================================
   COST COMPONENT TABS
========================================================= */

const tabs = [
    {
        id: "economic-cost",
        label: "Economic Cost of Subproject",
        number: "01",
        icon: FaCalculator,
        description:
            "Financial inputs, conversion factors, and economic cost calculations.",
        color: "blue",
    },
    {
        id: "safeguard-cost",
        label: "Safeguard-Related Cost",
        number: "02",
        icon: FaShieldAlt,
        description:
            "Environmental, social safeguard, and compliance expenses.",
        color: "emerald",
    },
    {
        id: "road-maintenance",
        label: "Road Maintenance Unit Cost",
        number: "03",
        icon: FaRoad,
        description:
            "Unit cost references for maintaining MIADP-supported roads.",
        color: "amber",
    },
    {
        id: "annual-maintenance",
        label: "Annual Maintenance Cost",
        number: "04",
        icon: FaTools,
        description:
            "Recurring annual maintenance and operating costs.",
        color: "violet",
    },
    {
        id: "investment-cost",
        label: "Investment Cost",
        number: "05",
        icon: FaMoneyBillWave,
        description:
            "Investment requirements for infrastructure subprojects.",
        color: "teal",
    },
];

const colorStyles = {
    blue: {
        icon: "bg-blue-100 text-blue-700",
        active: "border-blue-600 bg-blue-50 text-blue-800",
        dot: "bg-blue-600",
    },
    emerald: {
        icon: "bg-emerald-100 text-emerald-700",
        active: "border-emerald-600 bg-emerald-50 text-emerald-800",
        dot: "bg-emerald-600",
    },
    amber: {
        icon: "bg-amber-100 text-amber-700",
        active: "border-amber-500 bg-amber-50 text-amber-800",
        dot: "bg-amber-500",
    },
    violet: {
        icon: "bg-violet-100 text-violet-700",
        active: "border-violet-600 bg-violet-50 text-violet-800",
        dot: "bg-violet-600",
    },
    teal: {
        icon: "bg-teal-100 text-teal-700",
        active: "border-teal-600 bg-teal-50 text-teal-800",
        dot: "bg-teal-600",
    },
};

/* =========================================================
   GENERIC CATEGORY TEMPLATES
========================================================= */

const csvTemplates = {
    "annual-maintenance": [
        ["Labor Cost per Year", 0],
        ["Materials Cost per Year", 0],
        ["Equipment Cost per Year", 0],
        ["Drainage Maintenance per Year", 0],
        ["Routine Road Maintenance per Year", 0],
        ["Other Annual Maintenance", 0],
    ],
    "investment-cost": [
        ["Construction Cost", 0],
        ["Land Acquisition Cost", 0],
        ["Design and Engineering Cost", 0],
        ["Equipment and Facilities", 0],
        ["Project Management Cost", 0],
        ["Other Investment Cost", 0],
    ],
};

/* =========================================================
   FORMATTERS
========================================================= */
const managementUrl = "/management";

const formatMoney = (value) => {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "—";
    }

    return `₱${number.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const formatYear = (value) => value ?? "—";

const getFinancialTotal = (analysis) =>
    analysis?.calculations?.financialTotal ??
    analysis?.total_financial_cost ??
    analysis?.totalFinancialCost ??
    null;

const getEconomicTotal = (analysis) =>
    analysis?.calculations?.economicTotal ??
    analysis?.total_economic_cost ??
    analysis?.totalEconomicCost ??
    null;

const getRecordKey = (record, index) =>
    record?.id ??
    record?.rmuc_id ??
    `${record?.evaluation_year ?? "year"}-${index}`;

/* =========================================================
   GENERIC MODAL
   Used only for Annual Maintenance and Investment Cost.
========================================================= */

function GenericCostModal({ tab, onClose }) {
    const template = csvTemplates[tab.id] ?? [];
    const Icon = tab.icon;

    const [values, setValues] = useState(() =>
        Object.fromEntries(
            template.map(([label, value]) => [label, String(value)])
        )
    );

    const [message, setMessage] = useState("");

    const updateValue = (label, value) => {
        setValues((previous) => ({
            ...previous,
            [label]: value,
        }));

        setMessage("");
    };

    const exportCSV = () => {
        const rows = [
            ["MIADP Cost Components"],
            [tab.label],
            ["Cost Parameter", "Amount / Value"],
            ...Object.entries(values),
        ];

        const csv = rows
            .map((row) =>
                row
                    .map(
                        (value) =>
                            `"${String(value ?? "").replace(/"/g, '""')}"`
                    )
                    .join(",")
            )
            .join("\r\n");

        const blob = new Blob(["\uFEFF", csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = `${tab.id}.csv`;

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const invalid = Object.values(values).some(
            (value) =>
                value.trim() === "" ||
                !Number.isFinite(Number(value)) ||
                Number(value) < 0
        );

        setMessage(
            invalid
                ? "Please enter valid non-negative numeric values."
                : "Inputs validated. Database saving is not connected for this category yet."
        );
    };

    
const handleSubmitRMUC = (payload) => {
    const subprojectId = selectedSubproject?.subproject_id;

    if (!subprojectId) {
        return Promise.reject(
            new Error("Please select a subproject before saving.")
        );
    }

    return new Promise((resolve, reject) => {
        router.post(
            `/cost-components/${encodeURIComponent(subprojectId)}/road-maintenance-cost`,
            payload,
            {
                preserveScroll: true,

                onSuccess: () => {
                    closeModal();
                    resolve();
                },

                onError: (errors) => {
                    reject(
                        new Error(
                            Object.values(errors ?? {}).flat().join(" ") ||
                            "Unable to save road maintenance costs."
                        )
                    );
                },
            }
        );
    });
};


    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-slate-950 via-blue-950 to-teal-900 p-6 text-white sm:p-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">
                            MIADP · Tab {tab.number}
                        </span>

                        <div className="mt-3 flex items-center gap-3">
                            <Icon className="text-2xl" />
                            <h2 className="text-2xl font-black">
                                {tab.label}
                            </h2>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-300">
                            Enter the applicable cost values below.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="rounded-xl border border-white/20 p-3 hover:bg-white/10"
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
                        {Object.entries(values).map(([label, value]) => (
                            <label key={label}>
                                <span className="mb-2 block text-sm font-semibold text-slate-700">
                                    {label}
                                </span>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={value}
                                    onChange={(event) =>
                                        updateValue(label, event.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </label>
                        ))}
                    </div>

                    {message && (
                        <p className="mx-5 mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 sm:mx-7">
                            {message}
                        </p>
                    )}

                    <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:px-7">
                        <button
                            type="button"
                            onClick={exportCSV}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
                        >
                            <FaDownload />
                            Download CSV
                        </button>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white hover:bg-blue-900"
                            >
                                <FaSave />
                                Validate Inputs
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* =========================================================
   MAIN COST COMPONENTS PAGE
========================================================= */
export default function CostComponents({
    subprojects = [],
    selectedSubproject = null,
    economicCostAnalyses = [],
    safeguardCostAnalyses = [],
    rmucAnalyses = [],
    managementUrl = null,
}) {
    const [selectedTab, setSelectedTab] = useState("economic-cost");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTab, setEditingTab] = useState(null);
    const [modalAnalysis, setModalAnalysis] = useState(null);

    const currentTab =
        tabs.find((tab) => tab.id === selectedTab) ?? tabs[0];

    const CurrentIcon = currentTab.icon;

    const savedAnalyses = Array.isArray(economicCostAnalyses)
        ? economicCostAnalyses
        : [];

    const savedSRCAnalyses = Array.isArray(safeguardCostAnalyses)
        ? safeguardCostAnalyses
        : [];

    const savedRMUCAnalyses = Array.isArray(rmucAnalyses)
        ? rmucAnalyses
        : [];

    const hasSelectedSubproject = Boolean(
        selectedSubproject?.subproject_id
    );

    const subprojectCode =
        selectedSubproject?.subproject_code ||
        `SP-${selectedSubproject?.subproject_id ?? ""}`;

    /* =====================================================
       MODAL HANDLERS
    ===================================================== */

    const closeModal = () => {
        setModalOpen(false);
        setEditingTab(null);
        setModalAnalysis(null);
    };

    const openInputForm = () => {
        if (!hasSelectedSubproject) return;

        setSelectedTab("economic-cost");
        setEditingTab(tabs[0]);
        setModalAnalysis(null);
        setModalOpen(true);
    };

    const openSavedAnalysis = (analysis) => {
        if (!hasSelectedSubproject || !analysis) return;

        setSelectedTab("economic-cost");
        setEditingTab(tabs[0]);
        setModalAnalysis(analysis);
        setModalOpen(true);
    };

    const openSavedSRCAnalysis = (analysis) => {
        if (!hasSelectedSubproject || !analysis) return;

        const tab = tabs.find((item) => item.id === "safeguard-cost");
        if (!tab) return;

        setSelectedTab(tab.id);
        setEditingTab(tab);
        setModalAnalysis(analysis);
        setModalOpen(true);
    };

    const openSavedRMUCAnalysis = (analysis) => {
        if (!hasSelectedSubproject || !analysis) return;

        const tab = tabs.find((item) => item.id === "road-maintenance");
        if (!tab) return;

        setSelectedTab(tab.id);
        setEditingTab(tab);
        setModalAnalysis(analysis);
        setModalOpen(true);
    };

    const openCostModal = (tab) => {
        if (!tab) return;

        if (
            ["economic-cost", "safeguard-cost", "road-maintenance"].includes(
                tab.id
            ) &&
            !hasSelectedSubproject
        ) {
            return;
        }

        setEditingTab(tab);
        setModalAnalysis(null);
        setModalOpen(true);
    };

    /* =====================================================
       SHARED POST HANDLER
    ===================================================== */

    const postCostPayload = (endpoint, payload, errorMessage) =>
        new Promise((resolve, reject) => {
            router.post(endpoint, payload, {
                preserveScroll: true,

                onSuccess: () => {
                    closeModal();
                    resolve();
                },

                onError: (errors) => {
                    reject(
                        new Error(
                            Object.values(errors ?? {})
                                .flat()
                                .join(" ") || errorMessage
                        )
                    );
                },
            });
        });

    /* =====================================================
       SAVE ECOS
    ===================================================== */

    const handleSubmitEconomicCost = (payload) => {
        const subprojectId = selectedSubproject?.subproject_id;

        if (!subprojectId) {
            return Promise.reject(
                new Error("Please select a subproject before saving.")
            );
        }

        return postCostPayload(
            `/cost-components/${encodeURIComponent(
                subprojectId
            )}/economic-cost`,
            payload,
            "Unable to save the economic cost analysis."
        );
    };

    /* =====================================================
       SAVE SRC
    ===================================================== */

    const handleSubmitSRC = (payload) => {
        const subprojectId = selectedSubproject?.subproject_id;

        if (!subprojectId) {
            return Promise.reject(
                new Error(
                    "Please select a subproject before saving safeguard-related costs."
                )
            );
        }

        return postCostPayload(
            `/cost-components/${encodeURIComponent(
                subprojectId
            )}/safeguard-cost`,
            payload,
            "Unable to save safeguard-related cost."
        );
    };

    /* =====================================================
       SAVE RMUC
       Confirm that this endpoint exists in routes/web.php.
    ===================================================== */

    const handleSubmitRMUC = (payload) => {
        const subprojectId = selectedSubproject?.subproject_id;

        if (!subprojectId) {
            return Promise.reject(
                new Error(
                    "Please select a subproject before saving RMUC."
                )
            );
        }

        return postCostPayload(
            `/cost-components/${encodeURIComponent(
                subprojectId
            )}/road-maintenance-cost`,
            payload,
            "Unable to save the road maintenance unit cost."
        );
    };

    /* =====================================================
       ECOS ↔ SRC MATCHING
    ===================================================== */

    const getMatchingECOS = (src) =>
        savedAnalyses.find(
            (ecos) =>
                Number(ecos.evaluation_year) ===
                Number(src.evaluation_year)
        );

    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <Layout>
            <Head title="Subproject Cost Components" />

            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
                    {/* PAGE HEADER */}
                    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-teal-900 shadow-xl">
                        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[40px] border-white/[0.04]" />

                        <div className="relative p-5 sm:p-8 lg:p-9">
                            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
{managementUrl ? (
    <Link
        href={managementUrl}
        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
    >
        <FaArrowLeft />
        Back to Subproject Management
    </Link>
) : (
    <button
        type="button"
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
    >
        <FaArrowLeft />
         Back to Subproject Management
    </button>
)}
                                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-100">
                                    <FaCheckCircle />
                                    MIADP Decision Support System
                                </span>
                            </div>

                            <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
                                <div className="max-w-3xl">
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-100">
                                        <FaLayerGroup />
                                        Infrastructure Evaluation
                                    </div>

                                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                                        Cost Components
                                    </h1>

                                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                                        Manage economic cost analysis,
                                        safeguard-related expenses, and road
                                        maintenance cost records by subproject
                                        and evaluation year.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:min-w-[300px]">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/15 text-blue-200">
                                            <FaCalculator />
                                        </div>
                                        <p className="text-2xl font-black text-white">
                                            05
                                        </p>
                                        <p className="mt-1 text-xs text-slate-300">
                                            Cost Categories
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">
                                            <FaChartLine />
                                        </div>
                                        <p className="text-2xl font-black text-white">
                                            MIADP
                                        </p>
                                        <p className="mt-1 text-xs text-slate-300">
                                            Cost Evaluation
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5 text-xs text-slate-300 sm:text-sm">
                                <FaHome className="text-emerald-300" />
                                <span>Dashboard</span>
                                <FaChevronRight className="text-slate-500" />
                                <span>Subproject Management</span>
                                <FaChevronRight className="text-slate-500" />
                                <span className="font-semibold text-white">
                                    Cost Components
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* SELECTED SUBPROJECT */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900">
                                    Selected Subproject
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Each evaluation year is stored as a
                                    separate cost record.
                                </p>
                            </div>

                            {hasSelectedSubproject ? (
                                <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                                    <FaCheckCircle />
                                    {subprojectCode}
                                </span>
                            ) : (
                                <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                                    <FaInfoCircle />
                                    No subproject selected
                                </span>
                            )}
                        </div>

                        {hasSelectedSubproject && (
                            <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Subproject Title
                                    </p>
                                    <p className="mt-1 font-bold text-slate-800">
                                        {selectedSubproject.subproject_title ||
                                            "Not provided"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Location
                                    </p>
                                    <p className="mt-1 font-semibold text-slate-700">
                                        {selectedSubproject.subproject_location ||
                                            "Not provided"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Total Project Cost
                                    </p>
                                    <p className="mt-1 font-bold text-slate-800">
                                        {formatMoney(
                                            selectedSubproject.total_project_cost
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* CATEGORY SELECTOR */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                            <h2 className="text-lg font-extrabold text-slate-900">
                                Cost Component Categories
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Choose a category to display its records
                                and available actions.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = selectedTab === tab.id;
                                const styles = colorStyles[tab.color];

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setSelectedTab(tab.id)}
                                        aria-pressed={isActive}
                                        className={`relative flex min-h-[145px] flex-col rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                                            isActive
                                                ? styles.active
                                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <span
                                                className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${
                                                    isActive
                                                        ? "bg-white shadow-sm"
                                                        : styles.icon
                                                }`}
                                            >
                                                <Icon />
                                            </span>
                                            <span className="text-xs font-black text-slate-400">
                                                {tab.number}
                                            </span>
                                        </div>

                                        <span className="mt-4 text-sm font-extrabold leading-5">
                                            {tab.label}
                                        </span>

                                        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            {isActive ? (
                                                <>
                                                    <FaCheckCircle />
                                                    Selected
                                                </>
                                            ) : (
                                                <>
                                                    Select category
                                                    <FaArrowRight />
                                                </>
                                            )}
                                        </span>

                                        {isActive && (
                                            <span
                                                className={`absolute inset-x-4 bottom-0 h-1 rounded-t-full ${styles.dot}`}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* ACTIVE CATEGORY HEADER */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:p-6">
                            <div className="flex items-start gap-4">
                                <div
                                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl ${colorStyles[currentTab.color].icon}`}
                                >
                                    <CurrentIcon />
                                </div>

                                <div>
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                                        TAB {currentTab.number}
                                    </span>
                                    <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
                                        {currentTab.label}
                                    </h2>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                        {currentTab.description}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    currentTab.id === "economic-cost"
                                        ? openInputForm()
                                        : openCostModal(currentTab)
                                }
                                disabled={
                                    [
                                        "economic-cost",
                                        "safeguard-cost",
                                        "road-maintenance",
                                    ].includes(currentTab.id) &&
                                    !hasSelectedSubproject
                                }
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FaPlus />
                                Open Input Form
                            </button>
                        </div>

                        {/* =================================================
                            ECONOMIC COST RECORDS
                        ================================================= */}
                        {currentTab.id === "economic-cost" && (
                            <div className="p-5 sm:p-6">
                                <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-slate-900">
                                            Saved Economic Cost Evaluations
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            View saved economic cost records
                                            by evaluation year.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={openInputForm}
                                        disabled={!hasSelectedSubproject}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <FaPlus />
                                        New Evaluation
                                    </button>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full min-w-[1000px] border-collapse text-left">
                                        <thead>
                                            <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                                <th className="border-b px-5 py-4">No.</th>
                                                <th className="border-b px-5 py-4">Evaluation Year</th>
                                                <th className="border-b px-5 py-4">Subproject Code</th>
                                                <th className="border-b px-5 py-4">Subproject Title</th>
                                                <th className="border-b px-5 py-4">Financial Total</th>
                                                <th className="border-b px-5 py-4">Economic Total</th>
                                                <th className="border-b px-5 py-4 text-center">Action</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">
                                            {!hasSelectedSubproject ? (
                                                <tr>
                                                    <td colSpan={7} className="px-5 py-12 text-center">
                                                        <FaInfoCircle className="mx-auto text-2xl text-amber-500" />
                                                        <p className="mt-3 font-bold">No subproject selected</p>
                                                        <p className="mt-1 text-sm text-slate-500">
                                                            Open this page from a subproject to view its evaluations.
                                                        </p>
                                                    </td>
                                                </tr>
                                            ) : savedAnalyses.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-5 py-12 text-center">
                                                        <FaClipboardList className="mx-auto text-3xl text-slate-300" />
                                                        <p className="mt-3 font-bold">No saved evaluations yet</p>
                                                        <p className="mt-1 text-sm text-slate-500">
                                                            Click New Evaluation to create the first record.
                                                        </p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                savedAnalyses.map((analysis, index) => (
                                                    <tr
                                                        key={analysis.id ?? `${analysis.evaluation_year}-${index}`}
                                                        className="transition hover:bg-blue-50/40"
                                                    >
                                                        <td className="px-5 py-4 text-sm text-slate-500">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-800">
                                                                {formatYear(analysis.evaluation_year)}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                                                                {subprojectCode}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <p className="font-bold text-slate-800">
                                                                {selectedSubproject?.subproject_title || "Untitled Subproject"}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {selectedSubproject?.subproject_location || "Location not provided"}
                                                            </p>
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold">
                                                            {formatMoney(getFinancialTotal(analysis))}
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold">
                                                            {formatMoney(getEconomicTotal(analysis))}
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <button
                                                                type="button"
                                                                title={`View evaluation for ${analysis.evaluation_year}`}
                                                                onClick={() => openSavedAnalysis(analysis)}
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                            >
                                                                <FaEye />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                                    <FaInfoCircle className="mt-0.5 shrink-0 text-blue-700" />
                                    <div className="text-xs leading-5 text-blue-900">
                                        <p className="font-bold">Evaluation record rules</p>
                                        <p className="mt-1">
                                            A different evaluation year creates a separate record.
                                            Saving the same year for the same subproject should update that year's record in the backend.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* =================================================
                            SAFEGUARD COST RECORDS
                        ================================================= */}
                        {currentTab.id === "safeguard-cost" && (
                            <div className="p-5 sm:p-6">
                                <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-slate-900">
                                            Saved Safeguard-Related Costs
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            View or update SRC records by evaluation year.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openCostModal(
                                                tabs.find((tab) => tab.id === "safeguard-cost")
                                            )
                                        }
                                        disabled={!hasSelectedSubproject}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                                    >
                                        <FaPlus />
                                        Input Safeguard Cost
                                    </button>
                                </div>

                                {!hasSelectedSubproject ? (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
                                        <FaInfoCircle className="mx-auto text-2xl text-amber-600" />
                                        <p className="mt-3 font-bold text-amber-900">
                                            No subproject selected
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="w-full min-w-[950px] border-collapse text-left">
                                            <thead>
                                                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="border-b px-5 py-4">No.</th>
                                                    <th className="border-b px-5 py-4">Evaluation Year</th>
                                                    <th className="border-b px-5 py-4">Financial Cost</th>
                                                    <th className="border-b px-5 py-4">Economic Cost</th>
                                                    <th className="border-b px-5 py-4">ECOS Link</th>
                                                    <th className="border-b px-5 py-4 text-center">Action</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-100">
                                                {savedSRCAnalyses.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-5 py-12 text-center">
                                                            <FaClipboardList className="mx-auto text-3xl text-slate-300" />
                                                            <p className="mt-3 font-bold">No safeguard cost records yet</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    savedSRCAnalyses.map((src, index) => {
                                                        const matchingECOS = getMatchingECOS(src);

                                                        return (
                                                            <tr
                                                                key={src.id ?? `${src.evaluation_year}-${index}`}
                                                                className="transition hover:bg-emerald-50/40"
                                                            >
                                                                <td className="px-5 py-4 text-sm text-slate-500">
                                                                    {index + 1}
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-800">
                                                                        {formatYear(src.evaluation_year)}
                                                                    </span>
                                                                </td>
                                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold">
                                                                    {formatMoney(src.total_financial_cost ?? src.totalFinancialCost)}
                                                                </td>
                                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold">
                                                                    {formatMoney(src.total_economic_cost ?? src.totalEconomicCost)}
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    {matchingECOS ? (
                                                                        <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                                                                            <FaLink />
                                                                            ECOS linked
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                                                                            <FaUnlink />
                                                                            No matching ECOS
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-5 py-4 text-center">
                                                                    <button
                                                                        type="button"
                                                                        title={`View SRC for ${src.evaluation_year}`}
                                                                        onClick={() => openSavedSRCAnalysis(src)}
                                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                                    >
                                                                        <FaEye />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="mt-4 flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                                    <FaInfoCircle className="mt-0.5 shrink-0 text-emerald-700" />
                                    <div className="text-xs leading-5 text-emerald-900">
                                        <p className="font-bold">SRC and ECOS relationship</p>
                                        <p className="mt-1">
                                            SRC records are matched to ECOS by evaluation year.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* =================================================
                            ROAD MAINTENANCE UNIT COST RECORDS
                        ================================================= */}
                        {currentTab.id === "road-maintenance" && (
                            <div className="p-5 sm:p-6">
                                <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-slate-900">
                                            Saved Road Maintenance Unit Costs
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Each subproject can have a separate RMUC record for each evaluation year.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openCostModal(
                                                tabs.find((tab) => tab.id === "road-maintenance")
                                            )
                                        }
                                        disabled={!hasSelectedSubproject}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <FaPlus />
                                        New RMUC Evaluation
                                    </button>
                                </div>

                                {!hasSelectedSubproject ? (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                                        Select a subproject to view or save RMUC evaluations.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="w-full min-w-[800px] border-collapse text-left">
                                            <thead>
                                                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="border-b px-5 py-4">No.</th>
                                                    <th className="border-b px-5 py-4">Evaluation Year</th>
                                                    <th className="border-b px-5 py-4">Financial Total</th>
                                                    <th className="border-b px-5 py-4">Economic Total</th>
                                                    <th className="border-b px-5 py-4 text-center">Action</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-100">
                                                {savedRMUCAnalyses.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-5 py-12 text-center">
                                                            <FaClipboardList className="mx-auto text-3xl text-slate-300" />
                                                            <p className="mt-3 font-bold text-slate-800">
                                                                No RMUC evaluations saved yet
                                                            </p>
                                                            <p className="mt-1 text-sm text-slate-500">
                                                                Click New RMUC Evaluation to create a record.
                                                            </p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    savedRMUCAnalyses.map((record, index) => (
                                                        <tr
                                                            key={getRecordKey(record, index)}
                                                            className="transition hover:bg-amber-50/40"
                                                        >
                                                            <td className="px-5 py-4 text-sm text-slate-500">
                                                                {index + 1}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-800">
                                                                    {formatYear(record.evaluation_year)}
                                                                </span>
                                                            </td>
                                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                                                                {formatMoney(getFinancialTotal(record))}
                                                            </td>
                                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                                                                {formatMoney(getEconomicTotal(record))}
                                                            </td>
                                                            <td className="px-5 py-4 text-center">
                                                                <button
                                                                    type="button"
                                                                    title={`View RMUC for ${record.evaluation_year}`}
                                                                    onClick={() => openSavedRMUCAnalysis(record)}
                                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                                                >
                                                                    <FaEye />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="mt-4 flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
                                    <FaInfoCircle className="mt-0.5 shrink-0 text-amber-700" />
                                    <div className="text-xs leading-5 text-amber-900">
                                        <p className="font-bold">RMUC evaluation records</p>
                                        <p className="mt-1">
                                            RMUC records are displayed for the selected subproject. Ensure the backend returns records filtered by that subproject.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* =================================================
                            OTHER COST CATEGORIES
                            RMUC IS EXCLUDED HERE TO AVOID DUPLICATE UI.
                        ================================================= */}
                        {(currentTab.id === "annual-maintenance" ||
                            currentTab.id === "investment-cost") && (
                            <div className="p-5 sm:p-6">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
                                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${colorStyles[currentTab.color].icon}`}
                                            >
                                                <CurrentIcon />
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-extrabold text-slate-900">
                                                    {currentTab.label}
                                                </h3>
                                                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                                                    Open this category's input form to enter cost parameters.
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => openCostModal(currentTab)}
                                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white hover:bg-blue-900"
                                        >
                                            <FaCalculator />
                                            Open Input Form
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* FOOTER */}
                    <footer className="flex flex-col justify-between gap-2 px-1 pb-3 text-xs text-slate-400 sm:flex-row sm:items-center">
                        <p>
                            MIADP Economic and Financial Decision Support System
                        </p>
                        <p className="inline-flex items-center gap-2">
                            <FaCheckCircle className="text-emerald-500" />
                            Infrastructure Cost Evaluation
                        </p>
                    </footer>
                </div>
            </div>

            {/* =========================================================
                MODALS
            ========================================================= */}
            {modalOpen && editingTab && (
                <>
                    {editingTab.id === "economic-cost" && (
                        <ModalECOF
                            key={
                                modalAnalysis
                                    ? `ecos-saved-${modalAnalysis.id ?? modalAnalysis.evaluation_year}`
                                    : `ecos-new-${selectedSubproject?.subproject_id}-${currentYear}`
                            }
                            show={modalOpen}
                            subproject={selectedSubproject}
                            savedAnalysis={modalAnalysis}
                            onSave={handleSubmitEconomicCost}
                            onClose={closeModal}
                        />
                    )}

                    {editingTab.id === "safeguard-cost" && (
                        <ModalSRC
                            key={
                                modalAnalysis
                                    ? `src-saved-${modalAnalysis.id ?? modalAnalysis.evaluation_year}`
                                    : `src-new-${selectedSubproject?.subproject_id}-${currentYear}`
                            }
                            isOpen={modalOpen}
                            subproject={selectedSubproject}
                            savedAnalysis={modalAnalysis}
                            onSave={handleSubmitSRC}
                            onClose={closeModal}
                        />
                    )}
                    
                    {editingTab.id === "road-maintenance" && (
                        <ModalRMUC
                            key={
                                modalAnalysis
                                    ? `rmuc-saved-${modalAnalysis.id ?? modalAnalysis.evaluation_year}`
                                    : `rmuc-new-${selectedSubproject?.subproject_id}-${currentYear}`
                            }
                            isOpen={modalOpen}
                            subproject={selectedSubproject}
                            savedAnalysis={modalAnalysis}
                            onClose={closeModal}
                            onSave={handleSubmitRMUC}
                            evaluation_year={
                                modalAnalysis?.evaluation_year ?? currentYear
                            }
                        />
                    )}
                

                    {(editingTab.id === "annual-maintenance" ||
                        editingTab.id === "investment-cost") && (
                        <GenericCostModal
                            key={editingTab.id}
                            tab={editingTab}
                            onClose={closeModal}
                        />
                    )}
                </>
            )}
        </Layout>
    );
}
