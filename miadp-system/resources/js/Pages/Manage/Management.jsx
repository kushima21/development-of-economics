
import { Head, Link } from "@inertiajs/react";
import Layout from "../Layouts/Layout";

import {
    FaArrowLeft,
    FaArrowRight,
    FaBuilding,
    FaCheckCircle,
    FaChevronRight,
    FaCoins,
    FaFileAlt,
    FaHome,
    FaLayerGroup,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaChartLine,
    FaUsers,
    FaCalculator,
    FaClipboardList,
    FaInfoCircle,
} from "react-icons/fa";

const money = (value) =>
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

const sections = [
    {
        key: "beneficiaries",
        title: "Project Beneficiaries",
        subtitle: "Beneficiary records and project coverage",
        description:
            "Manage beneficiary profiles, household information, and project coverage associated with this infrastructure subproject.",
        href: "beneficiaries",
        icon: FaUsers,
        iconStyle: "bg-blue-50 text-blue-700",
        accent: "group-hover:border-blue-300",
        linkStyle: "text-blue-700 group-hover:text-blue-800",
        number: "01",
    },
    {
        key: "cost-components",
        title: "Subproject Cost Components",
        subtitle: "Cost breakdown and funding requirements",
        description:
            "Record and review the individual cost components that make up the total subproject cost.",
        href: "cost-components",
        icon: FaCoins,
        iconStyle: "bg-amber-50 text-amber-700",
        accent: "group-hover:border-amber-300",
        linkStyle: "text-amber-700 group-hover:text-amber-800",
        number: "02",
    },
    {
        key: "economic-benefits",
        title: "Economic Benefits of the Subproject",
        subtitle: "Quantifiable benefits and savings",
        description:
            "Organize expected economic benefits, including vehicle operating cost savings, hauling savings, and travel time savings.",
        href: "economic-benefits",
        icon: FaChartLine,
        iconStyle: "bg-emerald-50 text-emerald-700",
        accent: "group-hover:border-emerald-300",
        linkStyle: "text-emerald-700 group-hover:text-emerald-800",
        number: "03",
    },
    {
        key: "economic-analysis",
        title: "Economic Analysis of Subproject",
        subtitle: "Economic indicators and evaluation",
        description:
            "Review economic performance using project costs, projected benefits, and applicable evaluation indicators.",
        href: "economic-analysis",
        icon: FaCalculator,
        iconStyle: "bg-violet-50 text-violet-700",
        accent: "group-hover:border-violet-300",
        linkStyle: "text-violet-700 group-hover:text-violet-800",
        number: "04",
    },
];

const statusStyles = {
    Draft: "bg-slate-100 text-slate-700 ring-slate-200",
    Submitted: "bg-amber-50 text-amber-700 ring-amber-200",
    Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};

function StatusBadge({ status }) {
    const value = displayValue(status, "Draft");

    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${
                statusStyles[value] || statusStyles.Draft
            }`}
        >
            {value}
        </span>
    );
}

function DetailItem({ label, value, icon: Icon }) {
    return (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                {Icon && (
                    <Icon className="shrink-0 text-emerald-600" />
                )}
                <span>{label}</span>
            </div>

            <p className="mt-2 break-words text-sm font-bold text-slate-800">
                {displayValue(value)}
            </p>
        </div>
    );
}


function SectionCard({ section, subprojectId, active }) {
    const Icon = section.icon;

    const href =
        section.key === "beneficiaries"
            ? `/project-beneficiaries?subproject_id=${encodeURIComponent(
                  subprojectId
              )}`
            : section.key === "cost-components"
            ? `/cost-components/${encodeURIComponent(subprojectId)}`
            : `/management/${encodeURIComponent(subprojectId)}/${section.href}`;

    return (
        <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={`group flex h-full min-w-0 flex-col rounded-2xl border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-6 ${
                active
                    ? "border-emerald-400 ring-2 ring-emerald-100"
                    : `border-slate-200 ${section.accent}`
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className={`rounded-2xl p-3.5 ${section.iconStyle}`}>
                    <Icon className="text-xl" />
                </div>

                <span className="text-xs font-black tracking-widest text-slate-300">
                    {section.number}
                </span>
            </div>

            <div className="mt-5">
                <h3 className="break-words text-lg font-extrabold leading-6 text-slate-900">
                    {section.title}
                </h3>

                <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    {section.subtitle}
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                    {section.description}
                </p>
            </div>

            <div
                className={`mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 ${section.linkStyle}`}
            >
                <span className="text-sm font-extrabold">
                    {active ? "Current section" : "Open section"}
                </span>

                <FaArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" />
            </div>
        </Link>
    );
}


function Breadcrumbs({ selectedSection }) {
    return (
        <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-sm"
        >
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 font-semibold text-slate-500 transition hover:bg-white hover:text-emerald-700"
            >
                <FaHome className="text-xs" />
                Home
            </Link>

            <FaChevronRight className="text-[10px] text-slate-300" />

            <span className="px-2 py-1.5 text-slate-500">
                MIADP Management
            </span>

            <FaChevronRight className="text-[10px] text-slate-300" />

            <span className="px-2 py-1.5 text-slate-500">
                Subprojects
            </span>

            {selectedSection && (
                <>
                    <FaChevronRight className="text-[10px] text-slate-300" />

                    <span className="rounded-lg bg-emerald-50 px-3 py-1.5 font-bold text-emerald-800 ring-1 ring-emerald-100">
                        {selectedSection.title}
                    </span>
                </>
            )}
        </nav>
    );
}

function FinancingCard({ label, amount, style }) {
    return (
        <div className={`rounded-xl border bg-white p-4 ${style}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </p>

            <p className="mt-2 break-words text-lg font-black text-slate-900 sm:text-xl">
                {money(amount)}
            </p>
        </div>
    );
}

export default function Management({
    subproject = null,
    section = "",
}) {
    const selectedSection = sections.find(
        (item) => item.key === section
    );

    const projectId = subproject?.subproject_id;

    const totalCost =
        Number(subproject?.total_project_cost) || 0;

    const worldBank =
        subproject?.world_bank_share != null
            ? Number(subproject.world_bank_share) || 0
            : Math.round(totalCost * 0.8 * 100) / 100;

    const gop =
        subproject?.gop_share != null
            ? Number(subproject.gop_share) || 0
            : Math.round(totalCost * 0.1 * 100) / 100;

    const lgu =
        subproject?.lgu_share != null
            ? Number(subproject.lgu_share) || 0
            : Math.round(
                  (totalCost - worldBank - gop) * 100
              ) / 100;

    const projectTitle = displayValue(
        subproject?.subproject_title,
        "Untitled Subproject"
    );

    return (
        <Layout>
            <Head
                title={
                    selectedSection
                        ? selectedSection.title
                        : "Subproject Management Workspace"
                }
            />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
                <div className="mx-auto max-w-[1440px] space-y-6">
                    <Breadcrumbs selectedSection={selectedSection} />

                    {/* Workspace header */}
<header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-800 to-teal-900 p-6 text-white shadow-xl sm:p-8">
    <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />

                        <div className="pointer-events-none absolute -bottom-28 right-1/4 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

                        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-100">
                                    <FaLayerGroup />
                                    MIADP · Project Management
                                </div>

                                <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                                    {selectedSection
                                        ? selectedSection.title
                                        : "Subproject Management Workspace"}
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80 sm:text-base">
                                    {selectedSection
                                        ? selectedSection.description
                                        : "Manage project beneficiaries, cost components, economic benefits, and economic analysis from one organized workspace."}
                                </p>
                            </div>

                            <Link
                                href="/subproject"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-emerald-900 shadow-lg transition hover:bg-emerald-50"
                            >
                                <FaArrowLeft />
                                Back to Subprojects
                            </Link>
                        </div>
                    </header>

                    {/* Empty state */}
                    {!subproject && (
                        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
                            <div className="flex items-start gap-3">
                                <FaInfoCircle className="mt-1 shrink-0 text-amber-600" />

                                <div className="min-w-0">
                                    <h2 className="font-extrabold text-amber-900">
                                        Select a subproject first
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-amber-800">
                                        Open Subprojects and select View
                                        Details on a project to access its
                                        management workspace.
                                    </p>

                                    <Link
                                        href="/subproject"
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-800"
                                    >
                                        Browse Subprojects
                                        <FaArrowRight />
                                    </Link>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Selected subproject */}
                    {subproject && (
                        <>
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 p-5 sm:p-6">
                                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                        <div className="flex min-w-0 items-start gap-4">
                                            <div className="shrink-0 rounded-2xl bg-emerald-50 p-3.5 text-emerald-700">
                                                <FaBuilding className="text-2xl" />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                                                    Selected Subproject
                                                </p>

                                                <h2 className="mt-2 break-words text-xl font-black text-slate-900 sm:text-2xl">
                                                    {projectTitle}
                                                </h2>

                                                <p className="mt-2 text-sm text-slate-500">
                                                    Project Code:{" "}
                                                    <span className="font-bold text-slate-700">
                                                        {displayValue(
                                                            subproject.subproject_code,
                                                            projectId
                                                                ? `SP-${projectId}`
                                                                : "Not assigned"
                                                        )}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <StatusBadge
                                            status={subproject.status}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4 sm:p-6">
                                    <DetailItem
                                        label="Project Location"
                                        value={subproject.subproject_location}
                                        icon={FaMapMarkerAlt}
                                    />

                                    <DetailItem
                                        label="Project Proponent"
                                        value={subproject.subproject_proponent}
                                        icon={FaUsers}
                                    />

                                    <DetailItem
                                        label="Subject Category"
                                        value={subproject.subject_category}
                                        icon={FaClipboardList}
                                    />

                                    <DetailItem
                                        label="Project Scale / Dimension"
                                        value={subproject.project_scale_dimension}
                                        icon={FaFileAlt}
                                    />
                                </div>

                                {/* Financing */}
                                <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6">
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="rounded-xl bg-white p-2.5 text-emerald-700 shadow-sm">
                                            <FaMoneyBillWave />
                                        </div>

                                        <div>
                                            <h3 className="font-extrabold text-slate-900">
                                                Project Cost and Financing
                                            </h3>

                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                Financing allocations for this
                                                subproject.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        <FinancingCard
                                            label="Total Project Cost"
                                            amount={totalCost}
                                            style="border-emerald-100"
                                        />

                                        <FinancingCard
                                            label="World Bank Share · 80%"
                                            amount={worldBank}
                                            style="border-blue-100"
                                        />

                                        <FinancingCard
                                            label="GoP Share · 10%"
                                            amount={gop}
                                            style="border-amber-100"
                                        />

                                        <FinancingCard
                                            label="LGU Share · Balance"
                                            amount={lgu}
                                            style="border-violet-100"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Management sections */}
                            <section className="space-y-5">
                                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                                            <FaCheckCircle />
                                            Project Workspace
                                        </div>

                                        <h2 className="mt-2 text-xl font-black text-slate-900 sm:text-2xl">
                                            Subproject Management Sections
                                        </h2>

                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                            Choose a section to manage or
                                            evaluate information for this
                                            specific subproject.
                                        </p>
                                    </div>

                                    <span className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                                        {sections.length} management sections
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {sections.map((item) => (
                                        <SectionCard
                                            key={item.key}
                                            section={item}
                                            subprojectId={projectId}
                                            active={section === item.key}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Selected section information */}
                            {selectedSection && (
                                <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`shrink-0 rounded-xl p-3 ${selectedSection.iconStyle}`}
                                        >
                                            <selectedSection.icon className="text-xl" />
                                        </div>

                                        <div className="min-w-0">
                                            <h2 className="text-lg font-extrabold text-slate-900">
                                                {selectedSection.title}
                                            </h2>

                                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                                Selected subproject:{" "}
                                                <span className="font-bold text-slate-700">
                                                    {projectTitle}
                                                </span>
                                            </p>

                                            <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
                                                {selectedSection.description}
                                            </p>

                                            <p className="mt-3 text-xs leading-5 text-slate-400">
                                                This workspace identifies the
                                                selected section. Its
                                                data-entry forms, database
                                                records, and calculations must
                                                be handled by the corresponding
                                                module and controller.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
}
