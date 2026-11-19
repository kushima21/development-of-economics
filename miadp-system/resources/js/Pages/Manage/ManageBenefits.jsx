import { Head, Link, router } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../Layouts/Layout";

import ModalSVOTab1 from "../EconomicBenifits/SVOCATab1";
import ModalSVOTab2 from "../EconomicBenifits/SVOCATab2";
import ModalSOH from "../EconomicBenifits/SOH";
import ModalSIH from "../EconomicBenifits/SIH";
import ModalTTS from "../EconomicBenifits/TTS";
import ModalSTL from "../EconomicBenifits/STL";
import ModalNGA from "../EconomicBenifits/NGA"; 

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
    FaEye,
    FaFileAlt,
    FaLayerGroup,
    FaMapMarkerAlt,
    FaPlus,
    FaRoad,
    FaSeedling,
    FaTimes,
    FaTrash,
    FaTruck,
} from "react-icons/fa";

// Read the CSRF token rendered by Laravel in resources/views/app.blade.php.
function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

// =====================================================
// BENEFIT CATEGORIES AND WORKSHEETS
// =====================================================

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
            {
                id: "b1t1",
                label: "Tab 1",
                title: "Vehicle Operating Cost — Tab 1",
            },
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
            {
                id: "b2t1",
                label: "Tab 1",
                title: "Output Hauling — Tab 1",
            },
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
        ],
    },
];

// =====================================================
// CSV CONFIGURATION
// =====================================================

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

// =====================================================
// HELPERS
// =====================================================

const money = (value) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const number = (value) =>
    new Intl.NumberFormat("en-PH", {
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
        (total, record) =>
            total +
            Number(
                record.annualBenefit ??
                    record.annual_savings ??
                    record.annualSavings ??
                    0
            ),
        0
    );
}

function formatLabel(value) {
    return String(value)
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// =====================================================
// REUSABLE SUMMARY CARD
// =====================================================

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

// =====================================================
// MAIN PAGE
// =====================================================

export default function ManageBenefits({ subproject = null }) {
    const [activeGroupId, setActiveGroupId] = useState("benefit1");
    const [activeTabId, setActiveTabId] = useState("b1t1");

    const [showInputModal, setShowInputModal] = useState(false);
    const [savingSOH, setSavingSOH] = useState(false);
    const [savingSIH, setSavingSIH] = useState(false);
    const [loadingSIH, setLoadingSIH] = useState(false);
    const [savingSVOC, setSavingSVOC] = useState(false);
    const [loadingSVOC, setLoadingSVOC] = useState(false);
    const [editingSVOC, setEditingSVOC] = useState(null);
    const [viewingSVOCRecord, setViewingSVOCRecord] = useState(null);
    const [loadingSOH, setLoadingSOH] = useState(false);
    const [savingTTS, setSavingTTS] = useState(false);
    const [loadingTTS, setLoadingTTS] = useState(false);
    const [savingSTL, setSavingSTL] = useState(false);
    const [loadingSTL, setLoadingSTL] = useState(false);
    const [editingSTL, setEditingSTL] = useState(null);
    const [viewingSTLRecord, setViewingSTLRecord] = useState(null);
    const [editingTTS, setEditingTTS] = useState(null);
    const [viewingTTSRecord, setViewingTTSRecord] = useState(null);

    const [savingNGA, setSavingNGA] = useState(false);
    const [loadingNGA, setLoadingNGA] = useState(false);
    const [editingNGA, setEditingNGA] = useState(null);
    const [viewingNGARecord, setViewingNGARecord] = useState(null);
    const [benefitData, setBenefitData] = useState({});
    const [viewingSOHRecord, setViewingSOHRecord] = useState(null);
    const [viewingSIHRecord, setViewingSIHRecord] = useState(null);
    const [editingSIH, setEditingSIH] = useState(null);
    const [editingSOH, setEditingSOH] = useState(null);

const subprojectId = subproject?.subproject_id ?? subproject?.id ?? null;

const svocUrl =
    subprojectId == null
        ? null
        : `/subprojects/${encodeURIComponent(subprojectId)}/economic-benefits/svoc`;

    const subprojectName =
        subproject?.subproject_name ??
        subproject?.subproject_title ??
        subproject?.name ??
        subproject?.project_name ??
        "Infrastructure Subproject";

    // =================================================
    // LOAD SOH FROM DATABASE
    // =================================================

    const loadSOHRecord = useCallback(async () => {
        if (!subprojectId) {
            setBenefitData((previous) => ({
                ...previous,
                b2t1: [],
            }));
            return;
        }

        setLoadingSOH(true);

        try {
            const response = await fetch(
                `/subprojects/${encodeURIComponent(
                    subprojectId
                )}/economic-benefits/soh`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                    credentials: "same-origin",
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Unable to retrieve SOH data. HTTP ${response.status}`
                );
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.message || "Unable to retrieve SOH data."
                );
            }

            if (!result.data) {
                setBenefitData((previous) => ({
                    ...previous,
                    b2t1: [],
                }));

                setViewingSOHRecord(null);
                return;
            }

            const savedData = result.data || {};
            const savedAnnualSavings = Number(
                result.annual_savings ??
                    savedData.annual_savings ??
                    0
            );

            const record = {
                ...savedData,

                id: result.soh_id ?? `soh-${subprojectId}`,
                soh_id: result.soh_id ?? null,

                benefitId: "benefit2",
                benefitName: "Savings in Output Hauling",
                worksheet: "Output Hauling — Tab 1",
                indicator: "Output Hauling Savings",

                annualBenefit: savedAnnualSavings,
                annual_savings: savedAnnualSavings,

                savedAt:
                    result.updated_at ??
                    result.created_at ??
                    null,

                // Keep the original complete database JSON.
                sohData: savedData,
            };

            // One database record per subproject.
            setBenefitData((previous) => ({
                ...previous,
                b2t1: [record],
            }));
        } catch (error) {
            console.error("SOH loading error:", error);
            alert(
                error.message ||
                    "Unable to load saved SOH data. Please refresh the page."
            );
        } finally {
            setLoadingSOH(false);
        }
    }, [subprojectId]);

    useEffect(() => {
        loadSOHRecord();
    }, [loadSOHRecord]);

    // Load saved SIH worksheet from Laravel.
    const sihUrl = subprojectId == null ? null : `/subprojects/${encodeURIComponent(subprojectId)}/economic-benefits/sih`;

    const loadSIHRecord = useCallback(async () => {
        if (!sihUrl) {
            setBenefitData(previous => ({ ...previous, b3t1: [] }));
            return;
        }
        setLoadingSIH(true);
        try {
            const response = await fetch(sihUrl, {
                credentials: "same-origin",
                headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Unable to load SIH data.");
            const data = result.data;
            setBenefitData(previous => ({
                ...previous,
                b3t1: data ? [{
                    ...data,
                    id: result.sih_id,
                    sih_id: result.sih_id,
                    benefitId: "benefit3",
                    benefitName: "Savings in Input Hauling",
                    worksheet: "Input Hauling — Tab 1",
                    annualBenefit: Number(result.annual_savings ?? data.annual_benefit ?? 0),
                    annual_savings: Number(result.annual_savings ?? 0),
                    savedAt: result.updated_at ?? result.created_at,
                    sihData: data,
                }] : [],
            }));
        } catch (error) {
            console.error("SIH loading error:", error);
            alert(error.message);
        } finally {
            setLoadingSIH(false);
        }
    }, [sihUrl]);

    useEffect(() => { loadSIHRecord(); }, [loadSIHRecord]);

    const saveSIHData = async (payload) => {
        if (!sihUrl || savingSIH) return;
        setSavingSIH(true);
        try {
            const csrf = getCsrfToken();
            if (!csrf) throw new Error("CSRF token missing.");
            const editingId = editingSIH?.sih_id;
            const response = await fetch(editingId ? `${sihUrl}/${encodeURIComponent(editingId)}` : sihUrl, {
                method: editingId ? "PUT" : "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN": csrf,
                },
                body: JSON.stringify({ data: payload }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                const firstError = Object.values(result.errors || {}).flat()[0];
                throw new Error(firstError || result.message || "Unable to save SIH data.");
            }
            await loadSIHRecord();
            setShowInputModal(false);
            setEditingSIH(null);
            setViewingSIHRecord(null);
            setActiveGroupId("benefit3");
            setActiveTabId("b3t1");
        } catch (error) {
            console.error("SIH save error:", error);
            alert(error.message);
        } finally {
            setSavingSIH(false);
        }
    };

    // NGA: one worksheet per subproject, loaded from Laravel.
    const ngaUrl = subprojectId == null ? null : `/subprojects/${encodeURIComponent(subprojectId)}/economic-benefits/nga`;

    const loadNGARecord = useCallback(async () => {
        if (!ngaUrl) { setBenefitData(prev => ({ ...prev, b6t1: [] })); return; }
        setLoadingNGA(true);
        try {
            const response = await fetch(ngaUrl, { credentials: "same-origin", headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Unable to load NGA data.");
            const data = result.data;
            setBenefitData(prev => ({ ...prev, b6t1: data ? [{
                ...data, id: result.nga_id ?? `nga-${subprojectId}`, nga_id: result.nga_id,
                benefitId: "benefit6", benefitName: "New Agricultural Area",
                worksheet: "New Agricultural Area — Tab 1",
                annualBenefit: Number(result.annual_savings ?? data.calculated?.annualSavings ?? 0),
                annual_savings: Number(result.annual_savings ?? 0),
                twenty_year_savings: Number(result.twenty_year_savings ?? 0),
                savedAt: result.updated_at ?? result.created_at, ngaData: data,
            }] : [] }));
        } catch (error) { console.error("NGA loading error:", error); alert(error.message); }
        finally { setLoadingNGA(false); }
    }, [ngaUrl, subprojectId]);

    useEffect(() => { loadNGARecord(); }, [loadNGARecord]);

    const saveNGAData = async (payload) => {
        if (!ngaUrl || savingNGA) throw new Error("NGA is unavailable or already saving.");
        setSavingNGA(true);
        try {
            const csrf = getCsrfToken();
            if (!csrf) throw new Error("CSRF token missing.");
            const editingId = editingNGA?.nga_id;
            const response = await fetch(editingId ? `${ngaUrl}/${encodeURIComponent(editingId)}` : ngaUrl, {
                method: editingId ? "PUT" : "POST", credentials: "same-origin",
                headers: { "Content-Type": "application/json", Accept: "application/json", "X-Requested-With": "XMLHttpRequest", "X-CSRF-TOKEN": csrf },
                body: JSON.stringify({ data: payload }),
            });
            if (response.status === 419) throw new Error("Session expired. Refresh the page.");
            const result = await response.json();
            if (!response.ok || !result.success) {
                const firstError = Object.values(result.errors || {}).flat()[0];
                throw new Error(firstError || result.message || "Unable to save NGA data.");
            }
            await loadNGARecord();
            setShowInputModal(false); setEditingNGA(null); setViewingNGARecord(null);
            setActiveGroupId("benefit6"); setActiveTabId("b6t1");
        } catch (error) { console.error("NGA save error:", error); throw error; }
        finally { setSavingNGA(false); }
    };

    const openNGAEdit = (record) => {
        setViewingNGARecord(null); setEditingNGA(record);
        setActiveGroupId("benefit6"); setActiveTabId("b6t1"); setShowInputModal(true);
    };

    // TTS: load, save, edit and delete one worksheet per subproject.
    const ttsUrl = subprojectId == null ? null : `/subprojects/${encodeURIComponent(subprojectId)}/economic-benefits/tts`;

    const loadTTSRecord = useCallback(async () => {
        if (!ttsUrl) {
            setBenefitData(previous => ({ ...previous, b4t1: [] }));
            return;
        }
        setLoadingTTS(true);
        try {
            const response = await fetch(ttsUrl, {
                credentials: "same-origin",
                headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Unable to load TTS data.");
            const data = result.data;
            setBenefitData(previous => ({
                ...previous,
                b4t1: data ? [{
                    ...data,
                    id: result.tts_id,
                    tts_id: result.tts_id,
                    benefitId: "benefit4",
                    benefitName: "Travel Time Savings",
                    worksheet: "Travel Time Savings — Tab 1",
                    annualBenefit: Number(result.annual_savings ?? data.projections?.annualBenefit ?? 0),
                    annual_savings: Number(result.annual_savings ?? 0),
                    twenty_year_savings: Number(result.twenty_year_savings ?? 0),
                    savedAt: result.updated_at ?? result.created_at,
                    ttsData: data,
                }] : [],
            }));
        } catch (error) {
            console.error("TTS loading error:", error);
            alert(error.message);
        } finally {
            setLoadingTTS(false);
        }
    }, [ttsUrl]);

    useEffect(() => { loadTTSRecord(); }, [loadTTSRecord]);

    const saveTTSData = async (payload) => {
        if (!ttsUrl || savingTTS) return;
        setSavingTTS(true);
        try {
            const csrf = getCsrfToken();
            if (!csrf) throw new Error("CSRF token missing.");
            const editingId = editingTTS?.tts_id;
            const response = await fetch(editingId ? `${ttsUrl}/${encodeURIComponent(editingId)}` : ttsUrl, {
                method: editingId ? "PUT" : "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN": csrf,
                },
                body: JSON.stringify({ data: payload }),
            });
            if (response.status === 419) throw new Error("Session expired. Refresh the page.");
            const result = await response.json();
            if (!response.ok || !result.success) {
                const firstError = Object.values(result.errors || {}).flat()[0];
                throw new Error(firstError || result.message || "Unable to save TTS data.");
            }
            await loadTTSRecord();
            setShowInputModal(false);
            setEditingTTS(null);
            setViewingTTSRecord(null);
            setActiveGroupId("benefit4");
            setActiveTabId("b4t1");
        } catch (error) {
            console.error("TTS save error:", error);
            alert(error.message);
        } finally {
            setSavingTTS(false);
        }
    };

    const saveTTS = async (payload) => {
    const url = `/subprojects/${subprojectId}/economic-benefits/tts`;

    const response = await axios.post(url, {
        data: payload,
    });

    await loadTTSRecord();

    return response.data;
};

    // STL: one saved worksheet per subproject.
    const stlUrl = subprojectId == null ? null : `/subprojects/${encodeURIComponent(subprojectId)}/economic-benefits/stl`;

    const loadSTLRecord = useCallback(async () => {
        if (!stlUrl) {
            setBenefitData(previous => ({ ...previous, b5t1: [] }));
            return;
        }
        setLoadingSTL(true);
        try {
            const response = await fetch(stlUrl, {
                credentials: "same-origin",
                headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Unable to load STL data.");
            const data = result.data;
            setBenefitData(previous => ({
                ...previous,
                b5t1: data ? [{
                    ...data,
                    id: result.stl_id ?? `stl-${subprojectId}`,
                    stl_id: result.stl_id,
                    benefitId: "benefit5",
                    benefitName: "Savings in Transport Losses",
                    worksheet: "Transport Losses — Tab 1",
                    annualBenefit: Number(result.annual_savings ?? data.annual_benefit ?? 0),
                    annual_savings: Number(result.annual_savings ?? data.annual_benefit ?? 0),
                    twenty_year_savings: Number(result.twenty_year_savings ?? data.twenty_year_savings ?? 0),
                    stlData: data,
                }] : [],
            }));
        } catch (error) {
            console.error("STL loading error:", error);
            alert(error.message);
        } finally {
            setLoadingSTL(false);
        }
    }, [stlUrl, subprojectId]);

    useEffect(() => { loadSTLRecord(); }, [loadSTLRecord]);

    const saveSTLData = async (payload) => {
        if (!stlUrl || savingSTL) return;
        setSavingSTL(true);
        try {
            const csrf = getCsrfToken();
            if (!csrf) throw new Error("CSRF token missing.");
            const editingId = editingSTL?.stl_id;
            const response = await fetch(editingId ? `${stlUrl}/${encodeURIComponent(editingId)}` : stlUrl, {
                method: editingId ? "PUT" : "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN": csrf,
                },
                body: JSON.stringify({ data: payload }),
            });
            if (response.status === 419) throw new Error("Session expired. Refresh the page.");
            const result = await response.json();
            if (!response.ok || !result.success) {
                const firstError = Object.values(result.errors || {}).flat()[0];
                throw new Error(firstError || result.message || "Unable to save STL data.");
            }
            await loadSTLRecord();
            setShowInputModal(false);
            setEditingSTL(null);
            setViewingSTLRecord(null);
            setActiveGroupId("benefit5");
            setActiveTabId("b5t1");
        } catch (error) {
            console.error("STL save error:", error);
            alert(error.message);
            throw error;
        } finally {
            setSavingSTL(false);
        }
    };

    const openSTLEdit = (record) => {
        setViewingSTLRecord(null);
        setEditingSTL(record);
        setActiveGroupId("benefit5");
        setActiveTabId("b5t1");
        setShowInputModal(true);
    };

    const openTTSEdit = (record) => {
        setViewingTTSRecord(null);
        setEditingTTS(record);
        setActiveGroupId("benefit4");
        setActiveTabId("b4t1");
        setShowInputModal(true);
    };

    // SVOC records are always loaded from the database, never just local state.

    const loadSVOCRecords = useCallback(async () => {
        if (!svocUrl) {
            setBenefitData((previous) => ({ ...previous, b1t1: [] }));
            return;
        }
        setLoadingSVOC(true);
        try {
            const response = await fetch(svocUrl, {
                headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
                credentials: "same-origin",
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Unable to load SVOC records.");
            setBenefitData((previous) => ({
                ...previous,
                b1t1: (result.data || []).map((item) => ({
                    ...item.data,
                    id: item.id,
                    svoc_id: item.id,
                    annualBenefit: Number(item.annual_savings || 0),
                    benefitId: "benefit1",
                    benefitName: "Vehicle Operating Cost Savings",
                    worksheet: "Vehicle Operating Cost — Tab 1",
                    savedAt: item.updated_at || item.created_at,
                    svocData: item.data,
                })),
            }));
        } catch (error) {
            console.error("SVOC load error:", error);
            alert(error.message);
        } finally {
            setLoadingSVOC(false);
        }
    }, [svocUrl]);

    useEffect(() => { loadSVOCRecords(); }, [loadSVOCRecords]);

    const saveSVOCData = async (payload) => {
        if (!svocUrl || savingSVOC) return;
        setSavingSVOC(true);
        try {
            const csrf = getCsrfToken();
            if (!csrf) {
                throw new Error('CSRF token missing. Add the csrf-token meta tag to your Inertia Blade layout.');
            }
            const editingId = editingSVOC?.svoc_id;
            const response = await fetch(editingId ? `${svocUrl}/${encodeURIComponent(editingId)}` : svocUrl, {
                method: editingId ? "PUT" : "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN": csrf,
                },
                body: JSON.stringify({ data: payload }),
            });
            if (response.status === 419) {
                throw new Error('CSRF token mismatch (419). Refresh the page and sign in again if needed.');
            }
            const result = await response.json();
            if (!response.ok || !result.success) {
                const firstError = Object.values(result.errors || {}).flat()[0];
                throw new Error(firstError || result.message || "Unable to save SVOC data.");
            }
            await loadSVOCRecords();
            setShowInputModal(false);
            setEditingSVOC(null);
            setActiveGroupId("benefit1");
            setActiveTabId("b1t1");
        } catch (error) {
            console.error("SVOC save error:", error);
            alert(error.message);
        } finally {
            setSavingSVOC(false);
        }
    };

   
const deleteSVOCRecord = async (record) => {
    if (!svocUrl || !record?.svoc_id) return;

    try {
        const csrfToken = getCsrfToken();

        if (!csrfToken) {
            throw new Error("CSRF token is missing.");
        }

        const response = await fetch(
            `${svocUrl}/${encodeURIComponent(record.svoc_id)}`,
            {
                method: "DELETE",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN": csrfToken,
                },
            }
        );

        if (response.status === 419) {
            throw new Error(
                "Your session has expired. Refresh the page."
            );
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Unable to delete SVOC record."
            );
        }

        setViewingSVOCRecord(null);

        await loadSVOCRecords();

    } catch (error) {
        console.error("SVOC delete error:", error);
        alert(error.message);
    }
};


    // =================================================
    // ACTIVE CATEGORY AND WORKSHEET
    // =================================================

    const activeGroup =
        BENEFIT_GROUPS.find((group) => group.id === activeGroupId) ??
        BENEFIT_GROUPS[0];

    const activeTab =
        activeGroup.tabs.find((tab) => tab.id === activeTabId) ??
        activeGroup.tabs[0];

    const currentRecords = benefitData[activeTab.id] || [];
    const ActiveIcon = activeGroup.icon;

    const isVehicleCostTab1 =
        activeGroup.id === "benefit1" &&
        activeTab.id === "b1t1";

    const isOutputHauling = activeGroup.id === "benefit2";
    const isInputHauling = activeGroup.id === "benefit3";
    const isTravelTimeSavings = activeGroup.id === "benefit4";
    const isTransportLosses = activeGroup.id === "benefit5";
    const isNewAgriculturalArea = activeGroup.id === "benefit6";

    const ModalComponent = isVehicleCostTab1
        ? ModalSVOTab1
        : ModalSVOTab2;

    // =================================================
    // SUMMARY DATA
    // =================================================

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

    const groupRecords = useMemo(
        () =>
            activeGroup.tabs.flatMap((tab) =>
                (benefitData[tab.id] || []).map((record) => ({
                    ...record,
                    benefitName: activeGroup.name,
                    worksheet: tab.title,
                }))
            ),
        [activeGroup, benefitData]
    );

    const groupRecordCount = groupRecords.length;
    const groupBenefitTotal = getBenefitTotal(groupRecords);

    // =================================================
    // SAVE NORMAL WORKSHEET DATA
    // =================================================

    const saveInputData = (formData) => {
        const record = {
            ...formData,
            id: `${activeTab.id}-${Date.now()}`,
            benefitId: activeGroup.id,
            benefitName: activeGroup.name,
            worksheet: activeTab.title,
            savedAt: new Date().toISOString(),
            ...(activeGroup.id === "benefit3" ? {annualBenefit: formData.annual_benefit, sihData: formData} : {}),
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

    // =================================================
    // SAVE SOH TO DATABASE
    // =================================================

    const saveSOHData = async (payload) => {
        if (!subprojectId || savingSOH) return;
        setSavingSOH(true);
        try {
            const csrf = getCsrfToken();
            if (!csrf) throw new Error("CSRF token missing.");
            const response = await fetch(
                `/subprojects/${encodeURIComponent(subprojectId)}/economic-benefits/soh${editingSOH?.soh_id ? `/${encodeURIComponent(editingSOH.soh_id)}` : ""}`,
                {
                    method: editingSOH?.soh_id ? "PUT" : "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                        "X-CSRF-TOKEN": csrf,
                    },
                    body: JSON.stringify({ data: payload }),
                }
            );
            const result = await response.json();
            if (!response.ok || !result.success) {
                const firstError = Object.values(result.errors || {}).flat()[0];
                throw new Error(firstError || result.message || "Unable to save SOH data.");
            }
            await loadSOHRecord();
            setShowInputModal(false);
            setEditingSOH(null);
            setViewingSOHRecord(null);
            setActiveGroupId("benefit2");
            setActiveTabId("b2t1");
        } catch (error) {
            console.error("SOH save error:", error);
            alert(error.message);
        } finally {
            setSavingSOH(false);
        }
    };

    const openSOHEdit = (record) => {
        setViewingSOHRecord(null);
        setEditingSOH(record);
        setActiveGroupId("benefit2");
        setActiveTabId("b2t1");
        setShowInputModal(true);
    };

    // =================================================
    // DELETE RECORD
    // =================================================

    const deleteRecord = (tabId, recordId) => {
        const record = (benefitData[tabId] || []).find(
            (item) => String(item.id) === String(recordId)
        );

        if (!record) return;

        if (!window.confirm("Delete this saved input record?")) {
            return;
        }

        const isSOHRecord =
            record.benefitId === "benefit2" ||
            Boolean(record.sohData) ||
            tabId === "b2t1";

        // SOH must be deleted from the database.
        if (isSOHRecord) {
            if (!subprojectId) {
                alert("Subproject ID is missing. Cannot delete SOH data.");
                return;
            }

            void (async () => {
                try {
                    const response = await fetch(
                        `/subprojects/${encodeURIComponent(subprojectId)}/economic-benefits/soh`,
                        {
                            method: "DELETE",
                            credentials: "same-origin",
                            headers: {
                                Accept: "application/json",
                                "X-Requested-With": "XMLHttpRequest",
                                "X-CSRF-TOKEN": getCsrfToken(),
                            },
                        }
                    );
                    const result = await response.json();
                    if (!response.ok || !result.success) {
                        throw new Error(result.message || "Unable to delete SOH data.");
                    }
                    setViewingSOHRecord(null);
                    await loadSOHRecord();
                } catch (error) {
                    console.error("SOH delete error:", error);
                    alert(error.message);
                }
            })();

            return;
        }

        if (tabId === "b1t1" && record.svoc_id) {
            void deleteSVOCRecord(record);
            return;
        }

        if (tabId === "b4t1" && record.tts_id) {
            if (!ttsUrl) return;
            void (async () => {
                try {
                    const response = await fetch(ttsUrl, {
                        method: "DELETE",
                        credentials: "same-origin",
                        headers: {
                            Accept: "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                            "X-CSRF-TOKEN": getCsrfToken(),
                        },
                    });
                    const result = await response.json();
                    if (!response.ok || !result.success) throw new Error(result.message || "Unable to delete TTS data.");
                    setViewingTTSRecord(null);
                    setEditingTTS(null);
                    await loadTTSRecord();
                } catch (error) {
                    console.error("TTS delete error:", error);
                    alert(error.message);
                }
            })();
            return;
        }

        if (tabId === "b6t1" && record.nga_id) {
            if (!ngaUrl) return;
            void (async () => {
                try {
                    const response = await fetch(ngaUrl, { method: "DELETE", credentials: "same-origin",
                        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest", "X-CSRF-TOKEN": getCsrfToken() } });
                    const result = await response.json();
                    if (!response.ok || !result.success) throw new Error(result.message || "Unable to delete NGA data.");
                    setViewingNGARecord(null); setEditingNGA(null); await loadNGARecord();
                } catch (error) { console.error("NGA delete error:", error); alert(error.message); }
            })();
            return;
        }

        if (tabId === "b5t1" && record.stl_id) {
            if (!stlUrl) return;
            void (async () => {
                try {
                    const response = await fetch(stlUrl, {
                        method: "DELETE",
                        credentials: "same-origin",
                        headers: {
                            Accept: "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                            "X-CSRF-TOKEN": getCsrfToken(),
                        },
                    });
                    const result = await response.json();
                    if (!response.ok || !result.success) throw new Error(result.message || "Unable to delete STL data.");
                    setViewingSTLRecord(null);
                    setEditingSTL(null);
                    await loadSTLRecord();
                } catch (error) {
                    console.error("STL delete error:", error);
                    alert(error.message);
                }
            })();
            return;
        }

        if (tabId === "b3t1" && record.sih_id) {
            if (!sihUrl) return;
            void (async () => {
                try {
                    const response = await fetch(sihUrl, {
                        method: "DELETE",
                        credentials: "same-origin",
                        headers: {
                            Accept: "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                            "X-CSRF-TOKEN": getCsrfToken(),
                        },
                    });
                    const result = await response.json();
                    if (!response.ok || !result.success) throw new Error(result.message || "Unable to delete SIH data.");
                    setViewingSIHRecord(null);
                    await loadSIHRecord();
                } catch (error) {
                    console.error("SIH delete error:", error);
                    alert(error.message);
                }
            })();
            return;
        }

        // Other worksheet records are still managed locally.
        setBenefitData((previous) => ({
            ...previous,
            [tabId]: (previous[tabId] || []).filter(
                (item) => String(item.id) !== String(recordId)
            ),
        }));

        if (viewingSOHRecord?.id === recordId) {
            setViewingSOHRecord(null);
        }
    };

    // =================================================
    // CATEGORY / WORKSHEET NAVIGATION
    // =================================================

    const selectGroup = (group) => {
        setActiveGroupId(group.id);
        setActiveTabId(group.tabs[0].id);
        setShowInputModal(false);
        setEditingSVOC(null);
        setEditingSOH(null);
        setEditingSIH(null);
        setEditingTTS(null);
        setEditingSTL(null);
        setEditingNGA(null);
    };

    const selectTab = (tab) => {
        setActiveTabId(tab.id);
        setShowInputModal(false);
        setEditingSVOC(null);
        setEditingSOH(null);
        setEditingSIH(null);
        setEditingTTS(null);
        setEditingSTL(null);
        setEditingNGA(null);
    };

    // =================================================
    // CSV EXPORT
    // =================================================

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
            record.annualBenefit ??
                record.annual_savings ??
                record.annualSavings ??
                0,
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
        ? `/subproject/${encodeURIComponent(subprojectId)}/management`
        : "/subproject";

    // =================================================
    // RENDER
    // =================================================

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
                                    title="Back to subproject management"
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
                                        Manage, organize and review economic benefit worksheets for infrastructure subprojects.
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
                                Select a category to view its individual worksheets and saved records.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {BENEFIT_GROUPS.map((group) => {
                                const Icon = group.icon;
                                const isActive = group.id === activeGroupId;
                                const count = getRecordCount(
                                    group,
                                    benefitData
                                );

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

                                        {isOutputHauling && (
                                            <p className="mt-2 text-xs font-semibold text-emerald-700">
                                                Dedicated worksheet: Saving Output Hauling (SOH)
                                            </p>
                                        )}
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

                        {/* WORKSHEET CONTENT */}

                        <div className="p-5 sm:p-8">
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
                                            Enter and manage records for this worksheet. Data is separated by category and worksheet.
                                        </p>

                                        {isVehicleCostTab1 && (
                                            <p className="mt-2 text-xs font-semibold text-blue-700">
                                                Dedicated form: Vehicle Operating Cost Tab 1
                                            </p>
                                        )}

                                        {isOutputHauling && (
                                            <p className="mt-2 text-xs font-semibold text-emerald-700">
                                                Click Input Data to open the SOH worksheet.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => { setEditingSVOC(null); setEditingSOH(null); setEditingSIH(null); setEditingTTS(null); setEditingSTL(null); setEditingNGA(null); setShowInputModal(true); }}
                                    disabled={
                                        savingSOH ||
                                        savingSTL ||
                                         savingNGA ||
                                         savingSIH ||
                                         (isTravelTimeSavings && (loadingTTS || (benefitData.b4t1 || []).length > 0)) ||
                                         (isTransportLosses && (loadingSTL || (benefitData.b5t1 || []).length > 0)) ||
                                         (isNewAgriculturalArea && (loadingNGA || (benefitData.b6t1 || []).length > 0)) ||
                                         (isInputHauling && (loadingSIH || (benefitData.b3t1 || []).length > 0)) ||
                                        (isOutputHauling && (loadingSOH || (benefitData.b2t1 || []).length > 0)) ||
                                        (isVehicleCostTab1 && loadingSVOC)
                                    }
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <FaPlus />
                                    {isOutputHauling && (benefitData.b2t1 || []).length > 0 ? "SOH Already Saved — Use Edit" : isInputHauling && (benefitData.b3t1 || []).length > 0 ? "SIH Already Saved — Use Edit" : isTravelTimeSavings && (benefitData.b4t1 || []).length > 0 ? "TTS Already Saved — Use Edit" : isTransportLosses && (benefitData.b5t1 || []).length > 0 ? "STL Already Saved — Use Edit" : isNewAgriculturalArea && (benefitData.b6t1 || []).length > 0 ? "NGA Already Saved — Use Edit" : "Input Data"}
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
                                    value={money(
                                        getBenefitTotal(currentRecords)
                                    )}
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

                                {isOutputHauling &&
                                    activeTab.id === "b2t1" &&
                                    loadingSOH && (
                                        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-10 text-center">
                                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700" />
                                            <p className="mt-4 font-bold text-blue-800">
                                                Loading Saved SOH Data...
                                            </p>
                                            <p className="mt-1 text-sm text-blue-600">
                                                Retrieving the worksheet from the database.
                                            </p>
                                        </div>
                                    )}

                                {!(
                                    isOutputHauling &&
                                    activeTab.id === "b2t1" &&
                                    loadingSOH
                                ) &&
                                    currentRecords.length === 0 && (
                                        <div className="rounded-2xl border-2 border-dashed border-slate-200 px-5 py-12 text-center">
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                                <FaDatabase size={22} />
                                            </div>

                                            <h5 className="mt-4 font-bold text-slate-800">
                                                No input data yet
                                            </h5>

                                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                                Select Input Data to add the first record for {activeTab.title}.
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowInputModal(true)
                                                }
                                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
                                            >
                                                <FaPlus />
                                                Input First Record
                                            </button>
                                        </div>
                                    )}

                                {currentRecords.length > 0 && (
                                    <div className="space-y-3">
                                        {currentRecords.map(
                                            (record, index) => {
                                                const isSOHRecord =
                                                    record.benefitId ===
                                                        "benefit2" ||
                                                    Boolean(record.sohData) ||
                                                    Boolean(
                                                        record.barangays &&
                                                            record.haulingData
                                                    );

                                                return (
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
                                                                        {record.barangay ||
                                                                            record.benefit_category ||
                                                                            record.crop ||
                                                                            (isSOHRecord
                                                                                ? "Saving Output Hauling Record"
                                                                                : "Saved Input Record")}
                                                                    </h5>

                                                                    <p className="mt-1 break-words text-sm font-medium text-slate-600">
                                                                        {record.indicator ||
                                                                            record.worksheet ||
                                                                            activeTab.title}
                                                                    </p>

                                                                    <p className="mt-1 text-xs text-slate-400">
                                                                        {activeGroup.name}
                                                                    </p>

                                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                                                                            <FaCalendarAlt />
                                                                            {record.year1 ||
                                                                                record.inputYear ||
                                                                                "20-year projection"}
                                                                        </span>

                                                                        {record.savedAt && (
                                                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                                                                                <FaClock />
                                                                                {new Date(
                                                                                    record.savedAt
                                                                                ).toLocaleDateString(
                                                                                    "en-PH"
                                                                                )}
                                                                            </span>
                                                                        )}

                                                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                                                                            <FaMapMarkerAlt />
                                                                            {record.unit ||
                                                                                `${
                                                                                    record.barangays
                                                                                        ?.length ??
                                                                                    0
                                                                                } Barangay(s)`}
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
                                                                        {money(
                                                                            record.annualBenefit ??
                                                                                record.annual_savings ??
                                                                                record.annualSavings ??
                                                                                0
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                <div className="flex shrink-0 items-center gap-1">
                                                                    {(isSOHRecord || Boolean(record.svocData) || Boolean(record.sihData) || Boolean(record.ttsData) || Boolean(record.stlData) || Boolean(record.ngaData)) && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                record.svocData ? setViewingSVOCRecord(record) : record.sihData ? setViewingSIHRecord(record) : record.ttsData ? setViewingTTSRecord(record) : record.stlData ? setViewingSTLRecord(record) : record.ngaData ? setViewingNGARecord(record) : setViewingSOHRecord(record)
                                                                            }
                                                                            title={record.svocData ? "View saved SVOC input data" : "View saved SOH input data"}
                                                                            aria-label={`View ${record.svocData ? "SVOC" : "SOH"} record ${
                                                                                index +
                                                                                1
                                                                            }`}
                                                                            className="flex h-10 w-10 items-center justify-center rounded-xl text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
                                                                        >
                                                                            <FaEye />
                                                                        </button>
                                                                    )}

                                                                                                                                         {record.ngaData && (<button type="button" title="Edit NGA" className="rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50" onClick={() => openNGAEdit(record)}>Edit</button>)}
                                                                     {record.stlData && (
                                                                         <button type="button" title="Edit STL" className="rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50" onClick={() => openSTLEdit(record)}>Edit</button>
                                                                     )}
{record.ttsData && (
                                                                        <button type="button" title="Edit TTS" className="rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50" onClick={() => openTTSEdit(record)}>Edit</button>
                                                                    )}
                                                                    {record.sihData && (
                                                                        <button type="button" title="Edit SIH" className="rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50" onClick={() => { setEditingSIH(record); setShowInputModal(true); }}>Edit</button>
                                                                    )}
                                                                    {isSOHRecord && (
                                                                        <button type="button" title="Edit SOH"
                                                                            className="rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
                                                                            onClick={() => openSOHEdit(record)}>Edit</button>
                                                                    )}
                                                                    {record.svocData && (
                                                                        <button type="button" title="Edit SVOC"
                                                                            className="rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
                                                                            onClick={() => { setEditingSVOC(record); setShowInputModal(true); }}>Edit</button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            deleteRecord(
                                                                                activeTab.id,
                                                                                record.id
                                                                            )
                                                                        }
                                                                        title="Delete saved record"
                                                                        aria-label={`Delete record ${
                                                                            index +
                                                                            1
                                                                        }`}
                                                                        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                                    >
                                                                        <FaTrash />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )}
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
                                    {totalRecords} record(s) loaded or saved across all categories.
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
                                    SVOC, SOH, SIH, TTS, STL, and NGA records are saved and retrieved from the Laravel database. Other worksheets are currently maintained in page state.
                                </p>
                            </div>
                        </div>

                        <span className="text-xs font-semibold text-slate-400">
                            Economic and Financial Decision Support System
                        </span>
                    </footer>
                </main>
            </div>

            {/* INPUT MODALS */}

            {showInputModal && (
                <>
                    {isOutputHauling ? (
                        <ModalSOH
                            key={`soh-edit-${editingSOH?.soh_id ?? "new"}`}
                            isOpen={showInputModal}
                            initialData={editingSOH?.sohData ?? null}
                            onClose={() => { setShowInputModal(false); setEditingSOH(null); }}
                            onSave={saveSOHData}
                            saving={savingSOH}
                            subprojectId={subprojectId}
                            subprojectName={subprojectName}
                        />
                    ) : isInputHauling ? (
                        <ModalSIH key={`sih-${editingSIH?.id ?? "new"}`} isOpen={true} initialData={editingSIH?.sihData ?? null} sohData={benefitData.b2t1?.[0]?.sohData ?? null} onClose={() => {setShowInputModal(false);setEditingSIH(null);}} onSave={saveSIHData} saving={savingSIH} />
                    ) : isNewAgriculturalArea ? (
                        <ModalNGA key={`nga-${editingNGA?.nga_id ?? "new"}`} subproject={subproject}
                            initialData={editingNGA?.ngaData ?? null}
                            sohData={benefitData.b2t1?.[0]?.sohData ?? null}
                            onClose={() => { setShowInputModal(false); setEditingNGA(null); }}
                            onSave={saveNGAData} saving={savingNGA} />
                    ) : isTransportLosses ? (
                        <ModalSTL
                            key={`stl-${editingSTL?.stl_id ?? "new"}`}
                            subproject={subproject}
                            initialData={editingSTL?.stlData ?? null}
                            onClose={() => { setShowInputModal(false); setEditingSTL(null); }}
                            onSave={saveSTLData}
                            saving={savingSTL}
                            sohData={benefitData.b2t1?.[0]?.sohData ?? null}
                        />
                    ) : isTravelTimeSavings ? (
                        <ModalTTS
                            key={`tts-${editingTTS?.tts_id ?? "new"}`}
                            initialData={editingTTS?.ttsData ?? null}
                            onClose={() => { setShowInputModal(false); setEditingTTS(null); }}
                            onSave={saveTTSData}
                            saving={savingTTS}
                        />
                    ) : (
                        <ModalComponent
                            isOpen={showInputModal}
                            onClose={() => setShowInputModal(false)}
                            onSave={isVehicleCostTab1 ? saveSVOCData : saveInputData}
                            initialData={isVehicleCostTab1 ? (editingSVOC?.svocData ?? null) : null}
                            saving={isVehicleCostTab1 ? savingSVOC : false}
                            title={activeTab.title}
                            subprojectName={subprojectName}
                            subprojectId={subprojectId}
                        />
                    )}
                </>
            )}

            {viewingNGARecord && (
                <ModalNGA key={`nga-view-${viewingNGARecord.nga_id}`} subproject={subproject}
                    initialData={viewingNGARecord.ngaData} readOnly={true}
                    sohData={benefitData.b2t1?.[0]?.sohData ?? null}
                    onClose={() => setViewingNGARecord(null)}
                    onEdit={() => openNGAEdit(viewingNGARecord)} />
            )}
            {viewingSVOCRecord && (
                <ModalSVOTab1
                    isOpen={true}
                    readOnly={true}
                    initialData={viewingSVOCRecord.svocData}
                    onClose={() => setViewingSVOCRecord(null)}
                />
            )}
                         {viewingSTLRecord && (
                 <ModalSTL
                     key={`stl-view-${viewingSTLRecord.stl_id}`}
                     subproject={subproject}
                     initialData={viewingSTLRecord.stlData}
                     readOnly={true}
                     onClose={() => setViewingSTLRecord(null)}
                     onEdit={() => openSTLEdit(viewingSTLRecord)}
                     sohData={benefitData.b2t1?.[0]?.sohData ?? null}
                 />
             )}
{viewingTTSRecord && (
                <ModalTTS
                    key={`tts-view-${viewingTTSRecord.tts_id}`}
                    readOnly={true}
                    initialData={viewingTTSRecord.ttsData}
                    onClose={() => setViewingTTSRecord(null)}
                    onEdit={() => openTTSEdit(viewingTTSRecord)}
                />
            )}
            {viewingSIHRecord && <ModalSIH isOpen={true} readOnly={true} initialData={viewingSIHRecord.sihData} sohData={benefitData.b2t1?.[0]?.sohData ?? null} onClose={() => setViewingSIHRecord(null)} onEdit={() => {setEditingSIH(viewingSIHRecord);setViewingSIHRecord(null);setShowInputModal(true);}} />}
            {/* Eye icon: exact original SOH worksheet in read-only mode. */}
            {viewingSOHRecord && (
                <ModalSOH
                    key={`soh-view-${viewingSOHRecord.soh_id ?? viewingSOHRecord.id}`}
                    isOpen={true}
                    readOnly={true}
                    initialData={viewingSOHRecord.sohData}
                    onEdit={() => openSOHEdit(viewingSOHRecord)}
                    onClose={() => setViewingSOHRecord(null)}
                />
            )}
        </Layout>
    );
}