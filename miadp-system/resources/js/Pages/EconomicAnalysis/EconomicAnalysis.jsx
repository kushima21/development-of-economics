
import { Head, Link } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../Layouts/Layout";
import ModalEA from "../EconomicAnalysis/EA";


import {
    FaArrowLeft,
    FaArrowRight,
    FaBuilding,
    FaCalculator,
    FaChartBar,
    FaChartLine,
    FaCheckCircle,
    FaChevronRight,
    FaClipboardList,
    FaEye,
    FaFileAlt,
    FaHome,
    FaInfoCircle,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaShieldAlt,
    FaTimes,
} from "react-icons/fa";

/* ============================================================
   HELPERS
============================================================ */

const formatMoney = (value) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const displayValue = (value, fallback = "Not provided") => {
    if (value === null || value === undefined || value === "") {
        return fallback;
    }

    return value;
};

/* ============================================================
   ANALYSIS MODULE CONFIGURATION
============================================================ */

const analysisModules = [
    {
        key: "economic-analysis",
        number: "01",
        title: "Economic Analysis",
        subtitle: "Economic Performance Evaluation",
        description:
            "Evaluate the economic feasibility and performance of the selected subproject using investment costs, maintenance costs, projected economic benefits, and financial indicators.",
        icon: FaChartLine,
        theme: {
            icon: "bg-blue-50 text-blue-700",
            border: "hover:border-blue-300",
            badge: "bg-blue-50 text-blue-700",
            button: "bg-blue-700 hover:bg-blue-800",
            gradient: "from-blue-600 to-indigo-700",
        },
        features: [
            "Economic Cost and Benefit Analysis",
            "Net Present Value (NPV)",
            "Economic Internal Rate of Return (EIRR)",
            "Benefit-Cost Ratio (BCR)",
        ],
    },
    {
        key: "sensitivity-analysis",
        number: "02",
        title: "Sensitivity Analysis",
        subtitle: "Risk and Scenario Evaluation",
        description:
            "Assess how changes in project costs, economic benefits, and other assumptions may affect the economic feasibility and performance of the selected subproject.",
        icon: FaChartBar,
        theme: {
            icon: "bg-violet-50 text-violet-700",
            border: "hover:border-violet-300",
            badge: "bg-violet-50 text-violet-700",
            button: "bg-violet-700 hover:bg-violet-800",
            gradient: "from-violet-600 to-purple-700",
        },
        features: [
            "Base Case Scenario",
            "Project Cost Increase",
            "Economic Benefit Decrease",
            "Combined Cost and Benefit Changes",
        ],
    },
];

/* ============================================================
   SMALL REUSABLE COMPONENTS
============================================================ */

function InfoItem({ icon: Icon, label, value }) {
    return (
        <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                <Icon className="text-sm" />
            </div>

            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                </p>

                <p className="mt-1 break-words text-sm font-bold text-slate-800">
                    {displayValue(value)}
                </p>
            </div>
        </div>
    );
}

function Breadcrumbs({ projectId }) {
    return (
        <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-sm"
        >
            <Link
                href="/dashboard"
                className="flex items-center gap-2 font-medium text-slate-500 transition hover:text-blue-700"
            >
                <FaHome />
                Dashboard
            </Link>

            <FaChevronRight className="text-[10px] text-slate-300" />

            <Link
                href="/subproject"
                className="font-medium text-slate-500 transition hover:text-blue-700"
            >
                Subprojects
            </Link>

            <FaChevronRight className="text-[10px] text-slate-300" />

            <Link
                href={`/management/${projectId}`}
                className="font-medium text-slate-500 transition hover:text-blue-700"
            >
                Management
            </Link>

            <FaChevronRight className="text-[10px] text-slate-300" />

            <span className="font-bold text-blue-800">
                Economic Analysis
            </span>
        </nav>
    );
}

/* ============================================================
   ANALYSIS CARD
============================================================ */

function AnalysisCard({ module, onView }) {
    const Icon = module.icon;

    return (
        <article
            className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${module.theme.border}`}
        >
            <div
                className={`h-1.5 w-full bg-gradient-to-r ${module.theme.gradient}`}
            />

            <div className="flex flex-1 flex-col p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                    <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl ${module.theme.icon}`}
                    >
                        <Icon className="text-2xl" />
                    </div>

                    <span className="text-sm font-black tracking-widest text-slate-300">
                        {module.number}
                    </span>
                </div>

                <div className="mt-6">
                    <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${module.theme.badge}`}
                    >
                        {module.subtitle}
                    </span>

                    <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
                        {module.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                        {module.description}
                    </p>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                    <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                        <FaClipboardList className="text-slate-400" />
                        Analysis Components
                    </h4>

                    <div className="mt-4 space-y-3">
                        {module.features.map((feature) => (
                            <div
                                key={feature}
                                className="flex items-start gap-3"
                            >
                                <FaCheckCircle className="mt-1 shrink-0 text-emerald-500" />

                                <span className="text-sm leading-6 text-slate-600">
                                    {feature}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-7">
                    <div className="border-t border-slate-100 pt-5">
                        <button
                            type="button"
                            onClick={() => onView(module)}
                            className={`flex w-full items-center justify-center gap-3 rounded-xl px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-100 ${module.theme.button}`}
                        >
                            <FaEye className="text-base" />
                            View Details
                            <FaArrowRight className="ml-auto text-xs" />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}

/* ============================================================
   VIEW DETAILS MODAL
============================================================ */

function AnalysisDetailsModal({
    module,
    subproject,
    projectId,
    onClose,
}) {
    const Icon = module?.icon;

    useEffect(() => {
        if (!module) return;

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = previousOverflow;
        };
    }, [module, onClose]);

    if (!module) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="analysis-modal-title"
                className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
                {/* Modal Header */}
                <div
                    className={`relative shrink-0 overflow-hidden bg-gradient-to-r ${module.theme.gradient} p-6 text-white sm:p-8`}
                >
                    <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[25px] border-white/10" />

                    <div className="relative flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                                <Icon className="text-2xl" />
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                                    MIADP · Analysis Workspace
                                </p>

                                <h2
                                    id="analysis-modal-title"
                                    className="mt-2 text-xl font-black sm:text-2xl"
                                >
                                    {module.title}
                                </h2>

                                <p className="mt-2 text-sm text-white/80">
                                    {module.subtitle}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close details"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50 p-5 sm:p-7">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                                <FaBuilding />
                            </div>

                            <div>
                                <h3 className="font-extrabold text-slate-900">
                                    Selected Subproject
                                </h3>

                                <p className="text-xs text-slate-500">
                                    Project information
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <InfoItem
                                icon={FaFileAlt}
                                label="Subproject ID"
                                value={projectId}
                            />

                            <InfoItem
                                icon={FaClipboardList}
                                label="Project Code"
                                value={subproject?.subproject_code}
                            />

                            <InfoItem
                                icon={FaBuilding}
                                label="Project Title"
                                value={subproject?.subproject_title}
                            />

                            <InfoItem
                                icon={FaMapMarkerAlt}
                                label="Project Location"
                                value={subproject?.subproject_location}
                            />
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                            <FaInfoCircle className="text-blue-600" />
                            About This Analysis
                        </h3>

                        <p className="mt-3 text-sm leading-7 text-slate-600">
                            {module.description}
                        </p>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {module.features.map((feature) => (
                                <div
                                    key={feature}
                                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
                                >
                                    <FaCheckCircle className="shrink-0 text-emerald-500" />

                                    <span className="text-sm font-semibold text-slate-700">
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Future analysis integration */}
                    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center sm:p-8">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <FaCalculator className="text-xl" />
                        </div>

                        <h3 className="mt-4 text-base font-extrabold text-slate-900">
                            Analysis Data Workspace
                        </h3>

                        <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-500">
                            This section is ready for the calculation
                            tables, economic indicators, scenarios,
                            and saved database records associated
                            with this subproject.
                        </p>

                        <p className="mt-3 text-xs font-semibold text-slate-400">
                            Subproject Reference: {projectId}
                        </p>
                    </section>
                </div>

                {/* Modal Footer */}
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
                    <span className="text-xs font-semibold text-slate-400">
                        MIADP Economic Evaluation Module
                    </span>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   MAIN ECONOMIC ANALYSIS PAGE
============================================================ */

export default function EconomicAnalysis({
    subproject = null,
    economic_benefits = [],
    economic_analysis = null,
    subproject_id = null,
}) {
    const [activeModule, setActiveModule] = useState(null);

    const projectId =
        subproject?.subproject_id ??
        subproject_id ??
        null;

    const managementUrl = projectId
        ? `/management/${encodeURIComponent(projectId)}`
        : "/subproject";

    const projectTitle = useMemo(
        () =>
            displayValue(
                subproject?.subproject_title,
                "Untitled Subproject"
            ),
        [subproject?.subproject_title]
    );

    const totalProjectCost = useMemo(
        () => Number(subproject?.total_project_cost) || 0,
        [subproject?.total_project_cost]
    );

    const openDetails = useCallback((module) => {
        setActiveModule(module);
    }, []);

    const closeDetails = useCallback(() => {
        setActiveModule(null);
    }, []);

    return (
        <Layout>
            <Head title="Economic Analysis & Sensitivity Analysis" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/50 px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
                <div className="mx-auto max-w-[1440px] space-y-7">

                    {/* BREADCRUMBS */}
                    <Breadcrumbs projectId={projectId} />

                    {/* MAIN HEADER */}
                    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 p-6 text-white shadow-xl sm:p-8 lg:p-10">
                        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[40px] border-white/5" />

                        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-60 w-60 rounded-full bg-blue-400/10 blur-3xl" />

                        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                            <div className="max-w-3xl">
                                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-100">
                                    <FaShieldAlt />
                                    MIADP · Economic Evaluation
                                </div>

                                <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                                    Economic & Sensitivity Analysis
                                </h1>

                                <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100/80 sm:text-base">
                                    Evaluate the economic feasibility,
                                    expected benefits, project costs,
                                    and sensitivity of the selected
                                    infrastructure subproject through
                                    one organized analysis workspace.
                                </p>
                            </div>

                            <Link
                                href={managementUrl}
                                className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                            >
                                <FaArrowLeft />
                                Back to Subproject Management
                            </Link>
                        </div>
                    </header>

                    {/* SELECTED SUBPROJECT */}
                    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
                            <div className="flex min-w-0 items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                    <FaBuilding className="text-xl" />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                                        Selected Subproject
                                    </p>

                                    <h2 className="mt-2 break-words text-xl font-black text-slate-900 sm:text-2xl">
                                        {projectTitle}
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Project Code:{" "}
                                        <span className="font-bold text-slate-700">
                                            {displayValue(
                                                subproject?.subproject_code,
                                                projectId
                                                    ? `SP-${projectId}`
                                                    : "Not assigned"
                                            )}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                                <FaCheckCircle />
                                Analysis Workspace
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
                            <InfoItem
                                icon={FaFileAlt}
                                label="Subproject ID"
                                value={projectId}
                            />

                            <InfoItem
                                icon={FaMapMarkerAlt}
                                label="Project Location"
                                value={subproject?.subproject_location}
                            />

                            <InfoItem
                                icon={FaClipboardList}
                                label="Project Proponent"
                                value={subproject?.subproject_proponent}
                            />

                            <InfoItem
                                icon={FaMoneyBillWave}
                                label="Total Project Cost"
                                value={
                                    subproject?.total_project_cost != null
                                        ? formatMoney(totalProjectCost)
                                        : "Not provided"
                                }
                            />
                        </div>
                    </section>

                    {/* MODULE SECTION HEADING */}
                    <section className="space-y-5">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-bold text-blue-700">
                                    <FaChartLine />
                                    Economic Evaluation Workspace
                                </div>

                                <h2 className="mt-2 text-xl font-black text-slate-900 sm:text-2xl">
                                    Analysis Modules
                                </h2>

                                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                                    Select an analysis module to review
                                    its details and evaluate the selected
                                    subproject.
                                </p>
                            </div>

                            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600">
                                <FaChartBar className="text-blue-600" />
                                2 Analysis Modules
                            </span>
                        </div>

                        {/* TWO MAIN CARDS */}
                        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
                            {analysisModules.map((module) => (
                                <AnalysisCard
                                    key={module.key}
                                    module={module}
                                    onView={openDetails}
                                />
                            ))}
                        </div>
                    </section>

                    {/* INFORMATION FOOTER */}
                    <section className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                            <FaInfoCircle className="text-lg" />
                        </div>

                        <div>
                            <h3 className="text-sm font-extrabold text-blue-950">
                                About the Economic Evaluation Workspace
                            </h3>

                            <p className="mt-2 text-sm leading-7 text-blue-900/70">
                                Economic Analysis focuses on evaluating
                                project costs and benefits, while
                                Sensitivity Analysis examines how
                                changes in assumptions may affect
                                project feasibility. Both modules
                                are associated with the currently
                                selected subproject.
                            </p>
                        </div>
                    </section>
                </div>
            </div>

            {/* VIEW DETAILS MODAL */}
            {activeModule?.key === "economic-analysis" && (
                <ModalEA
                    isOpen={true}
                    onClose={closeDetails}
                    subproject={subproject}
                    initialData={economic_analysis}
                    economic_benefits={economic_benefits}
                />
            )}
            {activeModule?.key === "sensitivity-analysis" && (
                <AnalysisDetailsModal
                    module={activeModule}
                    subproject={subproject}
                    projectId={projectId}
                    onClose={closeDetails}
                />
            )}
        </Layout>
    );
}
