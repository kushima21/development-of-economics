
import { Head, Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import Layout from "../Layouts/Layout";

import ModalSVOTab1 from "../EconomicBenifits/SVOCATab1";
import ModalSVOTab2 from "../EconomicBenifits/SVOCATab2";

import {
    FaArrowLeft,
    FaCalendarAlt,
    FaCheckCircle,
    FaChevronRight,
    FaClipboardList,
    FaClock,
    FaCoins,
    FaDatabase,
    FaDownload,
    FaFileAlt,
    FaLayerGroup,
    FaMapMarkerAlt,
    FaPlus,
    FaRoad,
    FaSeedling,
    FaTrash,
    FaTruck,
} from "react-icons/fa";

/* =========================================================
   BENEFIT CATEGORIES AND WORKSHEETS
========================================================= */

const BENEFIT_GROUPS = [
    {
        id: "benefit1",
        title: "Benefit 1",
        name: "Vehicle Operating Cost Savings",
        shortName: "Vehicle Operating Cost",
        description:
            "Evaluate vehicle operating cost savings resulting from improved infrastructure.",
        icon: FaTruck,
        tabs: [
            { id: "b1t1", label: "Tab 1", title: "Vehicle Operating Cost — Tab 1" },
            { id: "b1t2", label: "Tab 2", title: "Vehicle Operating Cost — Tab 2" },
            { id: "b1t3", label: "Tab 3", title: "Vehicle Operating Cost — Tab 3" },
        ],
    },
    {
        id: "benefit2",
        title: "Benefit 2",
        name: "Savings in Output Hauling",
        shortName: "Output Hauling",
        description:
            "Evaluate savings in transporting agricultural products and other outputs.",
        icon: FaRoad,
        tabs: [
            { id: "b2t1", label: "Tab 1", title: "Output Hauling — Tab 1" },
            { id: "b2t2", label: "Tab 2", title: "Output Hauling — Tab 2" },
            { id: "b2t3", label: "Tab 3", title: "Output Hauling — Tab 3" },
        ],
    },
    {
        id: "benefit3",
        title: "Benefit 3",
        name: "Savings in Input Hauling",
        shortName: "Input Hauling",
        description:
            "Evaluate savings in transporting agricultural inputs to production areas.",
        icon: FaLayerGroup,
        tabs: [
            { id: "b3t1", label: "Tab 1", title: "Input Hauling — Tab 1" },
            { id: "b3t2", label: "Tab 2", title: "Input Hauling — Tab 2" },
        ],
    },
    {
        id: "benefit4",
        title: "Benefit 4",
        name: "Travel Time Savings",
        shortName: "Travel Time Savings",
        description:
            "Record travel time reductions and the economic value of time saved.",
        icon: FaClock,
        tabs: [
            { id: "b4t1", label: "Tab 1", title: "Travel Time Savings — Tab 1" },
            { id: "b4t2", label: "Tab 2", title: "Travel Time Savings — Tab 2" },
            { id: "b4t3", label: "Tab 3", title: "Travel Time Savings — Tab 3" },
        ],
    },
    {
        id: "benefit5",
        title: "Benefit 5",
        name: "Transport Losses",
        shortName: "Transport Losses",
        description:
            "Record reductions in agricultural product losses during transportation.",
        icon: FaTruck,
        tabs: [
            { id: "b5t1", label: "Tab 1", title: "Transport Losses — Tab 1" },
            { id: "b5t2", label: "Tab 2", title: "Transport Losses — Tab 2" },
        ],
    },
    {
        id: "benefit6",
        title: "Benefit 6",
        name: "New Agricultural Area",
        shortName: "New Agricultural Area",
        description:
            "Record additional agricultural areas made accessible or productive by the subproject.",
        icon: FaSeedling,
        tabs: [
            { id: "b6t1", label: "Tab 1", title: "New Agricultural Area — Tab 1" },
            { id: "b6t2", label: "Tab 2", title: "New Agricultural Area — Tab 2" },
        ],
    },
];

const CSV_HEADERS = [
    "Subproject ID",
    "Benefit Category",
    "Worksheet",
    "Barangay",
    "Input Date 1",
    "Input Date 2",
    "Input Date 3",
    "Year 1",
    "Input Year",
    "Indicator",
    "Unit",
    "Without Project",
    "With Project",
    "Annual Quantity",
    "Unit Value (PHP)",
    "Annual Benefit (PHP)",
];

const money = (value) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const escapeCsv = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

function downloadCsv(filename, headers, rows) {
    const csv = [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getRecordCount(group, data) {
    return group.tabs.reduce(
        (total, tab) => total + (data[tab.id] || []).length,
        0
    );
}

function getBenefitTotal(records) {
    return records.reduce(
        (total, record) => total + Number(record.annualBenefit || 0),
        0
    );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ManageBenefits({ subproject = null }) {
    const [activeGroupId, setActiveGroupId] = useState("benefit1");
    const [activeTabId, setActiveTabId] = useState("b1t1");
    const [showInputModal, setShowInputModal] = useState(false);
    const [benefitData, setBenefitData] = useState({});

    const subprojectId =
        subproject?.id ?? subproject?.subproject_id ?? null;

    const subprojectName =
        subproject?.subproject_name ??
        subproject?.name ??
        subproject?.project_name ??
        "Infrastructure Subproject";

    const activeGroup =
        BENEFIT_GROUPS.find((group) => group.id === activeGroupId) ??
        BENEFIT_GROUPS[0];

    const activeTab =
        activeGroup.tabs.find((tab) => tab.id === activeTabId) ??
        activeGroup.tabs[0];

    const currentRecords = benefitData[activeTab.id] || [];

    const allRecords = useMemo(
        () =>
            BENEFIT_GROUPS.flatMap((group) =>
                group.tabs.flatMap((tab) =>
                    (benefitData[tab.id] || []).map((record) => ({
                        ...record,
                        benefitId: group.id,
                        benefitName: group.name,
                        worksheet: tab.title,
                    }))
                )
            ),
        [benefitData]
    );

    const totalRecords = allRecords.length;

    const overallBenefit = useMemo(
        () => getBenefitTotal(allRecords),
        [allRecords]
    );

    const groupRecords = activeGroup.tabs.flatMap((tab) =>
        (benefitData[tab.id] || []).map((record) => ({
            ...record,
            benefitName: activeGroup.name,
            worksheet: tab.title,
        }))
    );

    const groupRecordCount = groupRecords.length;
    const groupBenefitTotal = getBenefitTotal(groupRecords);

    /* =====================================================
       SAVE RECORD
    ===================================================== */

    const saveInputData = (formData) => {
        const record = {
            ...formData,
            id: `${activeTab.id}-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 7)}`,
            benefitId: activeGroup.id,
            benefitName: activeGroup.name,
            worksheet: activeTab.title,
            savedAt: new Date().toISOString(),
        };

        setBenefitData((previous) => ({
            ...previous,
            [activeTab.id]: [
                ...(previous[activeTab.id] || []),
                record,
            ],
        }));

        setShowInputModal(false);
    };

    /* =====================================================
       DELETE RECORD
    ===================================================== */

    const deleteRecord = (tabId, recordId) => {
        if (!window.confirm("Delete this saved input record?")) return;

        setBenefitData((previous) => ({
            ...previous,
            [tabId]: (previous[tabId] || []).filter(
                (record) => record.id !== recordId
            ),
        }));
    };

    /* =====================================================
       SELECT CATEGORY / WORKSHEET
    ===================================================== */

    const selectGroup = (group) => {
        setActiveGroupId(group.id);
        setActiveTabId(group.tabs[0].id);
        setShowInputModal(false);
    };

    const selectTab = (tab) => {
        setActiveTabId(tab.id);
        setShowInputModal(false);
    };

    /* =====================================================
       CSV EXPORTS
    ===================================================== */

    const exportRecords = (records, filename, categoryName) => {
        const rows = records.map((record) => [
            subprojectId ?? "",
            record.benefitName || categoryName || activeGroup.name,
            record.worksheet || activeTab.title,
            record.barangay,
            record.inputDate1,
            record.inputDate2,
            record.inputDate3,
            record.year1,
            record.inputYear,
            record.indicator,
            record.unit,
            record.withoutProject,
            record.withProject,
            record.annualQuantity,
            record.unitValue,
            record.annualBenefit,
        ]);

        downloadCsv(filename, CSV_HEADERS, rows);
    };

    const exportCurrentTab = () =>
        exportRecords(
            currentRecords,
            `${activeTab.id}-economic-benefits.csv`,
            activeGroup.name
        );

    const exportCurrentGroup = () =>
        exportRecords(
            groupRecords,
            `${activeGroup.id}-economic-benefits.csv`,
            activeGroup.name
        );

    const exportAllBenefits = () =>
        exportRecords(
            allRecords,
            `MIADP-${subprojectId ?? "subproject"}-economic-benefits.csv`,
            "Economic Benefits"
        );

    const backUrl = subprojectId
        ? `/management/${encodeURIComponent(subprojectId)}/economic-analysis`
        : "/subproject";

    const ActiveIcon = activeGroup.icon;

    /* =====================================================
       MODAL ROUTING
       Tab 1 -> SVOCATab1.jsx
       Tab 2 -> SVOCATab2.jsx
       Other worksheets -> existing fallback form
    ===================================================== */

    const isVehicleCostTab1 =
        activeGroup.id === "benefit1" && activeTab.id === "b1t1";

    const isVehicleCostTab2 =
        activeGroup.id === "benefit1" && activeTab.id === "b1t2";

    const ModalComponent = isVehicleCostTab2
        ? ModalSVOTab2
        : ModalSVOTab1;

    return (
        <Layout>
            <Head title={`Economic Benefits | ${subprojectName}`} />

            <div className="min-h-screen bg-slate-50 pb-10">
                {/* PAGE HEADER */}
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div className="flex min-w-0 items-start gap-4">
                                <Link
                                    href={backUrl}
                                    title="Back to economic analysis"
                                    className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                >
                                    <FaArrowLeft />
                                </Link>

                                <div className="min-w-0">
                                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-700">
                                        <span>MIADP</span>
                                        <FaChevronRight className="text-[9px]" />
                                        <span>Project Management</span>
                                        <FaChevronRight className="text-[9px]" />
                                        <span>Economic Benefits</span>
                                    </div>

                                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                                        Economic Benefits Management
                                    </h1>

                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                                        Manage, organize and review economic
                                        benefit worksheets for infrastructure
                                        subprojects.
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        {subprojectId !== null && (
                                            <span className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800">
                                                <FaFileAlt />
                                                Subproject #{subprojectId}
                                            </span>
                                        )}

                                        <span className="max-w-full truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                                            {subprojectName}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={exportAllBenefits}
                                disabled={!totalRecords}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FaDownload />
                                Export All CSV
                            </button>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-[1600px] space-y-7 px-4 pt-7 sm:px-6 lg:px-8">
                    {/* OVERALL SUMMARY */}
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <SummaryCard
                            icon={<FaLayerGroup size={20} />}
                            label="Benefit Categories"
                            value={BENEFIT_GROUPS.length}
                            iconClass="bg-blue-50 text-blue-700"
                        />

                        <SummaryCard
                            icon={<FaClipboardList size={20} />}
                            label="Total Saved Records"
                            value={totalRecords}
                            iconClass="bg-indigo-50 text-indigo-700"
                        />

                        <SummaryCard
                            icon={<FaCoins size={20} />}
                            label="Total Estimated Benefits"
                            value={money(overallBenefit)}
                            iconClass="bg-emerald-50 text-emerald-700"
                            valueClass="text-emerald-800"
                        />
                    </section>

                    {/* BENEFIT CATEGORY CARDS */}
                    <section>
                        <div className="mb-4">
                            <h2 className="text-lg font-extrabold text-slate-900">
                                Economic Benefit Categories
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                Select a category to view its individual
                                worksheets and saved records.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {BENEFIT_GROUPS.map((group) => {
                                const Icon = group.icon;
                                const isActive = group.id === activeGroupId;
                                const count = getRecordCount(group, benefitData);

                                const records = group.tabs.flatMap(
                                    (tab) => benefitData[tab.id] || []
                                );

                                const amount = getBenefitTotal(records);

                                return (
                                    <button
                                        key={group.id}
                                        type="button"
                                        onClick={() => selectGroup(group)}
                                        aria-pressed={isActive}
                                        className={`group flex h-full flex-col rounded-2xl border bg-white p-5 text-left transition duration-200 ${
                                            isActive
                                                ? "border-blue-500 shadow-md ring-2 ring-blue-100"
                                                : "border-slate-200 shadow-sm hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                                                    isActive
                                                        ? "bg-blue-700 text-white"
                                                        : "bg-blue-50 text-blue-700 group-hover:bg-blue-100"
                                                }`}
                                            >
                                                <Icon size={21} />
                                            </div>

                                            {isActive && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                                    <FaCheckCircle />
                                                    Selected
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                                            {group.title}
                                        </p>

                                        <h3 className="mt-1 text-base font-extrabold leading-6 text-slate-900">
                                            {group.shortName}
                                        </h3>

                                        <p className="mt-2 min-h-[60px] text-sm leading-5 text-slate-500">
                                            {group.description}
                                        </p>

                                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    Worksheets
                                                </p>
                                                <p className="mt-1 text-lg font-extrabold text-slate-800">
                                                    {group.tabs.length}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    Saved records
                                                </p>
                                                <p className="mt-1 text-lg font-extrabold text-blue-700">
                                                    {count}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 rounded-xl bg-slate-50 p-3">
                                            <p className="text-xs font-semibold text-slate-500">
                                                Estimated benefit total
                                            </p>
                                            <p className="mt-1 break-words text-sm font-extrabold text-emerald-700">
                                                {money(amount)}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between text-sm font-bold text-blue-700">
                                            <span>
                                                {isActive
                                                    ? "Currently viewing"
                                                    : "Open category"}
                                            </span>
                                            <FaChevronRight
                                                className={
                                                    isActive ? "rotate-90" : ""
                                                }
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* ACTIVE CATEGORY WORKSPACE */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-5 sm:p-6">
                            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                                <div className="flex min-w-0 items-start gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                        <ActiveIcon size={21} />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                                            {activeGroup.title}
                                        </p>
                                        <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                                            {activeGroup.name}
                                        </h2>
                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            {activeGroup.description}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={exportCurrentGroup}
                                    disabled={!groupRecords.length}
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <FaDownload />
                                    Export Category
                                </button>
                            </div>
                        </div>

                        {/* WORKSHEET NAVIGATION */}
                        <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6">
                            <div className="flex gap-2 overflow-x-auto py-3">
                                {activeGroup.tabs.map((tab) => {
                                    const isActive = tab.id === activeTab.id;
                                    const count = (
                                        benefitData[tab.id] || []
                                    ).length;

                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => selectTab(tab)}
                                            aria-pressed={isActive}
                                            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                                                isActive
                                                    ? "bg-blue-700 text-white shadow-sm"
                                                    : "border border-transparent bg-white text-slate-600 hover:border-slate-200 hover:text-blue-700"
                                            }`}
                                        >
                                            {tab.label}
                                            <span
                                                className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                                                    isActive
                                                        ? "bg-white/20 text-white"
                                                        : "bg-slate-100 text-slate-500"
                                                }`}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-5 sm:p-8">
                            {/* WORKSHEET TITLE AND INPUT BUTTON */}
                            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                        <FaDatabase size={23} />
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                            {activeGroup.shortName}
                                        </p>
                                        <h3 className="mt-1 text-xl font-extrabold text-slate-900">
                                            {activeTab.title}
                                        </h3>
                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                            Enter and manage records for this
                                            worksheet. Data is separated by
                                            category and worksheet.
                                        </p>

                                        {isVehicleCostTab1 && (
                                            <p className="mt-2 text-xs font-semibold text-blue-700">
                                                Dedicated form: Vehicle Operating Cost Tab 1
                                            </p>
                                        )}

                                        {isVehicleCostTab2 && (
                                            <p className="mt-2 text-xs font-semibold text-indigo-700">
                                                Dedicated form: Vehicle Operating Cost Tab 2
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowInputModal(true)}
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                >
                                    <FaPlus />
                                    Input Data
                                </button>
                            </div>

                            {/* WORKSHEET SUMMARY */}
                            <div className="mt-7 grid gap-4 sm:grid-cols-2">
                                <SummaryCard
                                    icon={<FaClipboardList />}
                                    label="Saved Input Records"
                                    value={currentRecords.length}
                                    iconClass="bg-blue-50 text-blue-700"
                                />

                                <SummaryCard
                                    icon={<FaCoins />}
                                    label="Worksheet Benefit Total"
                                    value={money(getBenefitTotal(currentRecords))}
                                    iconClass="bg-emerald-50 text-emerald-700"
                                    valueClass="text-emerald-800"
                                />
                            </div>

                            {/* SAVED RECORDS */}
                            <div className="mt-8">
                                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                    <div>
                                        <h4 className="font-extrabold text-slate-900">
                                            Saved Input Data
                                        </h4>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Records saved for {activeTab.title}.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={exportCurrentTab}
                                        disabled={!currentRecords.length}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <FaDownload />
                                        Export Worksheet
                                    </button>
                                </div>

                                {currentRecords.length === 0 ? (
                                    <div className="rounded-2xl border-2 border-dashed border-slate-200 px-5 py-12 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                            <FaDatabase size={22} />
                                        </div>
                                        <h5 className="mt-4 font-bold text-slate-800">
                                            No input data yet
                                        </h5>
                                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                            Select Input Data to add the first
                                            record for {activeTab.title}.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setShowInputModal(true)}
                                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
                                        >
                                            <FaPlus />
                                            Input First Record
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {currentRecords.map((record, index) => (
                                            <div
                                                key={record.id}
                                                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm sm:p-5"
                                            >
                                                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                                                    <div className="flex min-w-0 items-start gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-extrabold text-blue-700">
                                                            {index + 1}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <h5 className="break-words font-extrabold text-slate-900">
                                                                {record.barangay || "Unnamed Barangay"}
                                                            </h5>

                                                            <p className="mt-1 break-words text-sm font-medium text-slate-600">
                                                                {record.indicator || activeTab.title}
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-400">
                                                                {activeGroup.name}
                                                            </p>

                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                                                                    <FaCalendarAlt />
                                                                    {record.year1 || record.inputYear || "Year not specified"}
                                                                </span>

                                                                {record.inputDate1 && (
                                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                                                                        <FaCalendarAlt />
                                                                        {record.inputDate1}
                                                                    </span>
                                                                )}

                                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                                                                    <FaMapMarkerAlt />
                                                                    {record.unit || "Unit not specified"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-4 md:justify-end">
                                                        <div className="md:text-right">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                Annual Benefit
                                                            </p>
                                                            <p className="mt-1 text-lg font-extrabold text-emerald-700">
                                                                {money(record.annualBenefit)}
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteRecord(activeTab.id, record.id)
                                                            }
                                                            title="Delete saved record"
                                                            aria-label={`Delete record ${index + 1}`}
                                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* CATEGORY SUMMARY */}
                            <div className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
                                <SummaryCard
                                    icon={<FaClipboardList />}
                                    label="Records in This Category"
                                    value={groupRecordCount}
                                    iconClass="bg-blue-50 text-blue-700"
                                />

                                <SummaryCard
                                    icon={<FaCoins />}
                                    label="Category Benefit Total"
                                    value={money(groupBenefitTotal)}
                                    iconClass="bg-emerald-50 text-emerald-700"
                                    valueClass="text-emerald-800"
                                />
                            </div>

                            <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <p className="text-sm text-slate-500">
                                    {totalRecords} record(s) saved in this
                                    session across all categories.
                                </p>

                                <button
                                    type="button"
                                    onClick={exportAllBenefits}
                                    disabled={!totalRecords}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <FaDownload />
                                    Export All Records
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* FOOTER */}
                    <footer className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <FaFileAlt />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">
                                    MIADP Economic Benefits Workspace
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Current input records are held in page
                                    state and will not persist after a reload.
                                </p>
                            </div>
                        </div>

                        <span className="text-xs font-semibold text-slate-400">
                            Economic and Financial Decision Support System
                        </span>
                    </footer>
                </main>
            </div>

            {/* DEDICATED MODAL ROUTING */}
            <ModalComponent
                isOpen={showInputModal}
                onClose={() => setShowInputModal(false)}
                onSave={saveInputData}
                title={activeTab.title}
                subprojectName={subprojectName}
            />
        </Layout>
    );
}

/* =========================================================
   REUSABLE SUMMARY CARD
========================================================= */

function SummaryCard({
    icon,
    label,
    value,
    iconClass = "bg-blue-50 text-blue-700",
    valueClass = "text-slate-900",
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {label}
                    </p>
                    <p
                        className={`mt-1 break-words text-xl font-extrabold sm:text-2xl ${valueClass}`}
                    >
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}
