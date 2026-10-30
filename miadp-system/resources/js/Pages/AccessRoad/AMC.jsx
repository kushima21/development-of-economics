
import { useEffect, useMemo, useState } from "react";
import {
    FaTimes,
    FaDownload,
    FaSave,
    FaFileInvoiceDollar,
    FaInfoCircle,
    FaLock,
    FaCoins,
    FaCheckCircle,
    FaChartLine,
    FaCalendarAlt,
    FaRoad,
    FaCalculator,
} from "react-icons/fa";

const YEARS = Array.from({ length: 10 }, (_, index) => index + 1);
const ROAD_LENGTH = 7.9;
const PERIODIC_MAINTENANCE_RATE = 0.6;

const DEFAULT_VALUES = {
    financialUnitCost: "",
    economicUnitCost: "",
};

const num = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value) =>
    Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export default function ModalAMC({
    isOpen = true,
    onClose = () => {},
    onSave = () => {},
    initialData = {},
    savedAnalysis = null,
    subproject = {},

    // RMUC records from CostComponents
    rmucAnalyses = [],
    r_m_u_c_s = null,
    rMucs = null,
    rmucs = null,

    // Evaluation year
    evaluation_year = null,
    year_evaluation = null,
}) {
    /*
    |--------------------------------------------------------------------------
    | RMUC RECORDS
    |--------------------------------------------------------------------------
    */

    const rmucCollection =
        Array.isArray(rmucAnalyses) && rmucAnalyses.length > 0
            ? rmucAnalyses
            : r_m_u_c_s ?? rMucs ?? rmucs ?? [];

    const rmucList = Array.isArray(rmucCollection)
        ? rmucCollection
        : Array.isArray(rmucCollection?.data)
            ? rmucCollection.data
            : [];

    /*
     * savedAnalysis is the exact RMUC record selected by the eye button.
     * If it is wrapped in a record property, unwrap it.
     */

    const selectedRecord =
        savedAnalysis?.record ??
        savedAnalysis ??
        initialData?.rmuc?.record ??
        initialData?.rmuc ??
        null;

    const selectedYear = Number(
        selectedRecord?.evaluation_year ??
        selectedRecord?.year_evaluation ??
        selectedRecord?.year ??
        evaluation_year ??
        year_evaluation ??
        initialData?.evaluation_year ??
        initialData?.year_evaluation ??
        new Date().getFullYear()
    );

    const rmucRecord =
        selectedRecord ??
        rmucList.find(
            (record) =>
                Number(
                    record?.evaluation_year ??
                    record?.year_evaluation ??
                    record?.year
                ) === selectedYear
        ) ??
        {};

    /*
    |--------------------------------------------------------------------------
    | RMUC FINANCIAL AND ECONOMIC COSTS
    |--------------------------------------------------------------------------
    */

    const financialPCCP = num(
        rmucRecord?.total_financial_cost ??
        rmucRecord?.totalFinancialCost ??
        initialData?.total_financial_cost ??
        0
    );

    const economicPCCP = num(
        rmucRecord?.total_economi_cost ??
        rmucRecord?.total_economic_cost ??
        rmucRecord?.totalEconomicCost ??
        initialData?.total_economi_cost ??
        initialData?.total_economic_cost ??
        0
    );

    /*
    |--------------------------------------------------------------------------
    | EVALUATION YEAR
    |--------------------------------------------------------------------------
    */

    const evaluationYear = Number(
        rmucRecord?.evaluation_year ??
        rmucRecord?.year_evaluation ??
        rmucRecord?.year ??
        evaluation_year ??
        year_evaluation ??
        initialData?.evaluation_year ??
        initialData?.year_evaluation ??
        new Date().getFullYear()
    );

    const calendarYears = useMemo(
        () => YEARS.map((year) => evaluationYear + year - 1),
        [evaluationYear]
    );

    /*
    |--------------------------------------------------------------------------
    | FORM STATE
    |--------------------------------------------------------------------------
    */

    const [values, setValues] = useState({
        ...DEFAULT_VALUES,
        ...initialData,
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setValues({
            ...DEFAULT_VALUES,
            ...initialData,
        });
        setMessage("");
    }, [initialData, savedAnalysis]);

    /*
    |--------------------------------------------------------------------------
    | ANNUAL MAINTENANCE CALCULATIONS
    |--------------------------------------------------------------------------
    |
    | Fixed Road Length = 7.9 km
    |
    | Financial AMC = RMUC Financial Total × 7.9
    | Economic AMC  = RMUC Economic Total × 7.9
    |
    */

    const roadLength = ROAD_LENGTH;

    const financialUnitCost = financialPCCP;
    const economicUnitCost = economicPCCP;

    const estimatedFinancialCost =
        roadLength * financialUnitCost;

    const estimatedEconomicCost =
        roadLength * economicUnitCost;

    const annualFinancial = useMemo(
        () => YEARS.map(() => estimatedFinancialCost),
        [estimatedFinancialCost]
    );

    const annualEconomic = useMemo(
        () => YEARS.map(() => estimatedEconomicCost),
        [estimatedEconomicCost]
    );

    /*
    |--------------------------------------------------------------------------
    | PERIODIC MAINTENANCE
    |--------------------------------------------------------------------------
    | 60% of annual maintenance cost every sixth schedule year.
    */

    const periodicFinancial = annualFinancial.map(
        (value, index) =>
            (index + 1) % 6 === 0
                ? value * PERIODIC_MAINTENANCE_RATE
                : 0
    );

    const periodicEconomic = annualEconomic.map(
        (value, index) =>
            (index + 1) % 6 === 0
                ? value * PERIODIC_MAINTENANCE_RATE
                : 0
    );

    /*
    |--------------------------------------------------------------------------
    | TOTAL ANNUAL MAINTENANCE COST
    |--------------------------------------------------------------------------
    */

    const totalFinancial = annualFinancial.map(
        (value, index) => value + periodicFinancial[index]
    );

    const totalEconomic = annualEconomic.map(
        (value, index) => value + periodicEconomic[index]
    );

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    const save = async () => {
        setSaving(true);
        setMessage("");

        try {
            const payload = {
                ...values,

                subprojectId:
                    subproject?.subproject_id ??
                    subproject?.id ??
                    initialData?.subproject_id ??
                    null,

                subproject_id:
                    subproject?.subproject_id ??
                    subproject?.id ??
                    initialData?.subproject_id ??
                    null,

                evaluation_year: evaluationYear,
                year_evaluation: evaluationYear,

                rmuc_id:
                    rmucRecord?.rmuc_id ??
                    rmucRecord?.id ??
                    null,

                roadLength,

                total_financial_cost: financialPCCP,
                total_economi_cost: economicPCCP,

                financialUnitCost,
                economicUnitCost,

                estimatedFinancialCost,
                estimatedEconomicCost,

                annualFinancial,
                annualEconomic,

                periodicFinancial,
                periodicEconomic,

                totalFinancial,
                totalEconomic,
            };

            await onSave(payload);

            setMessage(
                "Annual maintenance cost data saved successfully."
            );
        } catch (error) {
            setMessage(
                error?.message ??
                "Unable to save annual maintenance cost data."
            );
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | CSV EXPORT
    |--------------------------------------------------------------------------
    */

    const exportCsv = () => {
        const rows = [
            ["ANNUAL MAINTENANCE COST"],
            ["Evaluation Year", evaluationYear],
            [
                "Subproject ID",
                subproject?.subproject_id ?? subproject?.id ?? "",
            ],
            [
                "RMUC ID",
                rmucRecord?.rmuc_id ?? rmucRecord?.id ?? "",
            ],
            ["Fixed Road Length Used in Calculation", `${roadLength} km`],
            [],
            ["Costs", "Unit", ...calendarYears],

            [
                "Unit Maintenance Cost - PCCP (Financial)",
                "PhP",
                ...YEARS.map(() => financialPCCP),
            ],

            [
                "Unit Maintenance Cost - PCCP (Economic)",
                "PhP",
                ...YEARS.map(() => economicPCCP),
            ],

            [
                "Estimated Annual Maintenance Cost (Financial)",
                "PhP",
                ...annualFinancial,
            ],

            [
                "Estimated Annual Maintenance Cost (Economic)",
                "PhP",
                ...annualEconomic,
            ],

            [
                "Periodic Maintenance (Financial)",
                "PhP",
                ...periodicFinancial,
            ],

            [
                "Periodic Maintenance (Economic)",
                "PhP",
                ...periodicEconomic,
            ],

            [
                "Total Annual Maintenance Cost - Financial",
                "PhP",
                ...totalFinancial,
            ],

            [
                "Total Annual Maintenance Cost - Economic",
                "PhP",
                ...totalEconomic,
            ],
        ];

        const csv = rows
            .map((row) =>
                row
                    .map(
                        (cell) =>
                            `"${String(cell ?? "").replaceAll('"', '""')}"`
                    )
                    .join(",")
            )
            .join("\r\n");

        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download =
            `annual-maintenance-cost-${evaluationYear}.csv`;

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    /*
    |--------------------------------------------------------------------------
    | WORKSHEET CELL HELPERS
    |--------------------------------------------------------------------------
    */

    const calculatedCell = (value) => (
        <div className="amc-calculated">
            <strong>{money(value)}</strong>
        </div>
    );

    const repeatedCell = (value) => (
        <div className="amc-repeated">
            <strong>{money(value)}</strong>
        </div>
    );

    const periodicCell = (value, active) => (
        <div className={`amc-periodic ${active ? "active" : ""}`}>
            {active ? (
                <strong>{money(value)}</strong>
            ) : (
                <span className="amc-no-value">—</span>
            )}
        </div>
    );

    /*
    |--------------------------------------------------------------------------
    | COMPONENT
    |--------------------------------------------------------------------------
    */

    return (
        <div
            className="amc-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="amc-title"
        >
            <style>{`
                .amc-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(15, 23, 42, .72);
                    backdrop-filter: blur(8px);
                    font-family: Inter, Arial, sans-serif;
                    color: #172033;
                }

                .amc-modal {
                    display: flex;
                    flex-direction: column;
                    width: min(1600px, 100%);
                    max-height: 95vh;
                    overflow: hidden;
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    box-shadow: 0 30px 90px rgba(0,0,0,.25);
                }

                .amc-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    padding: 22px 26px;
                    color: #fff;
                    background: linear-gradient(120deg, #0f172a, #1e40af);
                }

                .amc-headline {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .amc-head-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 52px;
                    height: 52px;
                    border-radius: 15px;
                    background: rgba(255,255,255,.13);
                    font-size: 23px;
                }

                .amc-head h2 {
                    margin: 0;
                    font-size: 21px;
                    font-weight: 800;
                    letter-spacing: -.4px;
                }

                .amc-head p {
                    margin: 6px 0 0;
                    color: #cbd5e1;
                    font-size: 12px;
                }

                .amc-close {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border: 1px solid rgba(255,255,255,.2);
                    border-radius: 11px;
                    color: white;
                    background: rgba(255,255,255,.12);
                    cursor: pointer;
                    transition: .2s ease;
                }

                .amc-close:hover {
                    background: rgba(255,255,255,.25);
                    transform: rotate(90deg);
                }

                .amc-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                    padding: 14px 24px;
                    border-bottom: 1px solid #e2e8f0;
                    background: #f8fafc;
                }

                .amc-meta,
                .amc-actions {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .amc-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    padding: 8px 12px;
                    border: 1px solid #dbe3ef;
                    border-radius: 999px;
                    color: #475569;
                    background: #fff;
                    font-size: 11px;
                    font-weight: 700;
                }

                .amc-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 10px 15px;
                    border: 1px solid #dbe3ef;
                    border-radius: 10px;
                    color: #334155;
                    background: white;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: .2s ease;
                }

                .amc-btn:hover {
                    background: #f1f5f9;
                    transform: translateY(-1px);
                }

                .amc-btn:disabled {
                    opacity: .6;
                    cursor: not-allowed;
                    transform: none;
                }

                .amc-primary {
                    border-color: #1d4ed8;
                    color: white;
                    background: #1d4ed8;
                }

                .amc-primary:hover {
                    border-color: #1e40af;
                    background: #1e40af;
                }

                .amc-body {
                    padding: 22px 24px 26px;
                    overflow: auto;
                    background: #f8fafc;
                }

                .amc-summary {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(180px, 1fr));
                    gap: 14px;
                    margin-bottom: 23px;
                }

                .amc-card {
                    position: relative;
                    overflow: hidden;
                    padding: 19px;
                    border: 1px solid #e2e8f0;
                    border-radius: 15px;
                    background: white;
                    box-shadow: 0 4px 14px rgba(15,23,42,.035);
                }

                .amc-card::after {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 4px;
                    height: 100%;
                    background: #2563eb;
                    content: "";
                }

                .amc-card-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #64748b;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: .45px;
                    text-transform: uppercase;
                }

                .amc-card-value {
                    margin-top: 12px;
                    color: #172554;
                    font-size: 23px;
                    font-weight: 800;
                    letter-spacing: -.5px;
                    overflow-wrap: anywhere;
                }

                .amc-card-note {
                    margin-top: 6px;
                    color: #94a3b8;
                    font-size: 11px;
                }

                .amc-title-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 14px;
                }

                .amc-title-row h3 {
                    margin: 0;
                    color: #0f172a;
                    font-size: 16px;
                    font-weight: 800;
                }

                .amc-title-row p {
                    margin: 5px 0 0;
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.6;
                }

                .amc-legend {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 7px;
                }

                .amc-legend span {
                    padding: 6px 9px;
                    border: 1px solid #e2e8f0;
                    border-radius: 7px;
                    font-size: 10px;
                    font-weight: 700;
                }

                .amc-green {
                    color: #166534;
                    background: #f0fdf4;
                }

                .amc-cyan {
                    color: #1d4ed8;
                    background: #eff6ff;
                }

                .amc-orange-key {
                    color: #9a3412;
                    background: #fff7ed;
                }

                .amc-table-wrap {
                    overflow: auto;
                    border: 1px solid #dbe3ef;
                    border-radius: 14px;
                    background: white;
                    box-shadow: 0 5px 18px rgba(15,23,42,.04);
                }

                .amc-table {
                    width: 100%;
                    min-width: 1380px;
                    border-collapse: separate;
                    border-spacing: 0;
                    table-layout: fixed;
                    color: #1e293b;
                    font: 12px Arial, sans-serif;
                }

                .amc-table th,
                .amc-table td {
                    padding: 0;
                    border-right: 1px solid #e2e8f0;
                    border-bottom: 1px solid #e2e8f0;
                    text-align: center;
                    vertical-align: middle;
                }

                .amc-table thead th {
                    position: sticky;
                    top: 0;
                    z-index: 3;
                    height: 46px;
                    color: #1e3a8a;
                    background: #eff6ff;
                    font-size: 12px;
                    font-weight: 800;
                }

                .amc-table .label-col {
                    width: 270px;
                    padding: 12px;
                    text-align: left;
                }

                .amc-table .unit-col {
                    width: 65px;
                }

                .amc-table .year-col {
                    width: 112px;
                }

                .amc-label,
                .amc-total-label {
                    padding: 13px 12px !important;
                    color: #334155;
                    background: #fff;
                    font-size: 12px;
                    font-weight: 700;
                    line-height: 1.5;
                    text-align: left !important;
                }

                .amc-total-label {
                    background: #f1f5f9;
                    font-weight: 800;
                }

                .amc-unit {
                    color: #64748b;
                    background: #f8fafc;
                    font-size: 11px;
                    font-weight: 700;
                }

                .amc-calculated,
                .amc-repeated,
                .amc-periodic,
                .amc-total {
                    display: flex;
                    min-height: 58px;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 10px 5px;
                    font-size: 11px;
                    line-height: 1.4;
                }

                .amc-calculated {
                    color: #1d4ed8;
                    background: #eff6ff;
                }

                .amc-repeated {
                    color: #9a3412;
                    background: #fff7ed;
                }

                .amc-calculated strong,
                .amc-repeated strong,
                .amc-periodic strong,
                .amc-total strong {
                    font-size: 11px;
                    font-weight: 800;
                }

                .amc-periodic {
                    color: #64748b;
                    background: #f8fafc;
                    min-height: 65px;
                }

                .amc-periodic.active {
                    color: #1d4ed8;
                    background: #eff6ff;
                }

                .amc-no-value {
                    color: #94a3b8;
                    font-size: 16px;
                }

                .amc-total {
                    min-height: 65px;
                    color: #075985;
                    background: #e0f2fe;
                }

                .amc-section td {
                    height: 10px;
                    background: #f1f5f9;
                }

                .amc-message {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    margin-top: 15px;
                    padding: 12px 14px;
                    border: 1px solid #bbf7d0;
                    border-radius: 10px;
                    color: #166534;
                    background: #f0fdf4;
                    font-size: 12px;
                    font-weight: 600;
                }

                .amc-message.error {
                    border-color: #fecaca;
                    color: #b91c1c;
                    background: #fef2f2;
                }

                .amc-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                    padding: 14px 24px;
                    border-top: 1px solid #e2e8f0;
                    color: #64748b;
                    background: white;
                    font-size: 11px;
                }

                @media(max-width: 760px) {
                    .amc-overlay {
                        padding: 0;
                    }

                    .amc-modal {
                        max-height: 100vh;
                        border-radius: 0;
                    }

                    .amc-head {
                        padding: 16px;
                    }

                    .amc-head h2 {
                        font-size: 17px;
                    }

                    .amc-toolbar,
                    .amc-body,
                    .amc-footer {
                        padding-left: 14px;
                        padding-right: 14px;
                    }

                    .amc-summary {
                        grid-template-columns: 1fr;
                    }

                    .amc-toolbar {
                        align-items: flex-start;
                    }

                    .amc-footer {
                        align-items: flex-start;
                        flex-direction: column;
                    }
                }
            `}</style>

            <div className="amc-modal">

                {/* HEADER */}
                <header className="amc-head">
                    <div className="amc-headline">
                        <span className="amc-head-icon">
                            <FaFileInvoiceDollar />
                        </span>

                        <div>
                            <h2 id="amc-title">
                                Annual Maintenance Cost (AMC)
                            </h2>

                            <p>
                                MIADP Access Road · Financial and Economic
                                Maintenance Projection
                            </p>
                        </div>
                    </div>

                    <button
                        className="amc-close"
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <FaTimes />
                    </button>
                </header>

                {/* TOOLBAR */}
                <div className="amc-toolbar">
                    <div className="amc-meta">
                        <span className="amc-pill">
                            <FaCalendarAlt />
                            RMUC Evaluation Year: {evaluationYear}
                        </span>

                        <span className="amc-pill">
                            <FaLock />
                            Automatically Calculated
                        </span>

                        <span className="amc-pill">
                            <FaInfoCircle />
                            Fixed Road Length: 7.9 km
                        </span>
                    </div>

                    <div className="amc-actions">
                        <button
                            className="amc-btn"
                            type="button"
                            onClick={exportCsv}
                        >
                            <FaDownload />
                            Export CSV
                        </button>

                        <button
                            className="amc-btn amc-primary"
                            type="button"
                            onClick={save}
                            disabled={saving}
                        >
                            <FaSave />
                            {saving ? "Saving..." : "Save Data"}
                        </button>
                    </div>
                </div>

                <main className="amc-body">

                    {/* SUMMARY CARDS */}
                    <div className="amc-summary">

                        <div className="amc-card">
                            <div className="amc-card-label">
                                <FaRoad />
                                Road Length
                            </div>

                            <div className="amc-card-value">
                                {roadLength.toFixed(2)} km
                            </div>

                            <div className="amc-card-note">
                                Fixed length used in AMC calculations
                            </div>
                        </div>

                        <div className="amc-card">
                            <div className="amc-card-label">
                                <FaCoins />
                                Estimated Annual Financial Cost
                            </div>

                            <div className="amc-card-value">
                                ₱{money(estimatedFinancialCost)}
                            </div>

                            <div className="amc-card-note">
                                RMUC Financial Total × 7.9 km
                            </div>
                        </div>

                        <div className="amc-card">
                            <div className="amc-card-label">
                                <FaChartLine />
                                Estimated Annual Economic Cost
                            </div>

                            <div className="amc-card-value">
                                ₱{money(estimatedEconomicCost)}
                            </div>

                            <div className="amc-card-note">
                                RMUC Economic Total × 7.9 km
                            </div>
                        </div>

                    </div>

                    {/* WORKSHEET TITLE */}
                    <div className="amc-title-row">
                        <div>
                            <h3>
                                Annual Maintenance Cost Worksheet
                            </h3>

                            <p>
                                PCCP unit maintenance costs are retrieved
                                directly from the selected RMUC record.
                                Annual maintenance values are automatically
                                calculated using the fixed 7.9 km road length.
                            </p>
                        </div>

                        <div className="amc-legend">
                            <span className="amc-green">
                                RMUC Reference
                            </span>

                            <span className="amc-cyan">
                                Calculated
                            </span>

                            <span className="amc-orange-key">
                                Unit Cost
                            </span>
                        </div>
                    </div>

                    {/* WORKSHEET TABLE */}
                    <div className="amc-table-wrap">
                        <table className="amc-table">

                            <thead>
                                <tr>
                                    <th className="label-col">
                                        Cost Description
                                    </th>

                                    <th className="unit-col">
                                        Unit
                                    </th>

                                    {calendarYears.map((year) => (
                                        <th
                                            className="year-col"
                                            key={year}
                                        >
                                            {year}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>

                                <tr className="amc-section">
                                    <td colSpan={12} />
                                </tr>

                                {/* PCCP FINANCIAL */}
                                <tr>
                                    <td className="amc-label">
                                        Unit Maintenance Cost
                                        <br />
                                        Portland Cement Concrete Pavement
                                        (PCCP) (Financial)
                                    </td>

                                    <td className="amc-unit">
                                        PhP
                                    </td>

                                    {YEARS.map((year) => (
                                        <td key={year}>
                                            {repeatedCell(financialPCCP)}
                                        </td>
                                    ))}
                                </tr>

                                {/* PCCP ECONOMIC */}
                                <tr>
                                    <td className="amc-label">
                                        Unit Maintenance Cost
                                        <br />
                                        Portland Cement Concrete Pavement
                                        (PCCP) (Economic)
                                    </td>

                                    <td className="amc-unit">
                                        PhP
                                    </td>

                                    {YEARS.map((year) => (
                                        <td key={year}>
                                            {repeatedCell(economicPCCP)}
                                        </td>
                                    ))}
                                </tr>

                                <tr className="amc-section">
                                    <td colSpan={12} />
                                </tr>

                                {/* ESTIMATED ANNUAL FINANCIAL */}
                                <tr>
                                    <td className="amc-label">
                                        Estimated Annual Maintenance Cost
                                        (Financial)
                                    </td>

                                    <td className="amc-unit">
                                        PhP
                                    </td>

                                    {YEARS.map((year, index) => (
                                        <td key={year}>
                                            {calculatedCell(
                                                annualFinancial[index]
                                            )}
                                        </td>
                                    ))}
                                </tr>

                                {/* ESTIMATED ANNUAL ECONOMIC */}
                                <tr>
                                    <td className="amc-label">
                                        Estimated Annual Maintenance Cost
                                        (Economic)
                                    </td>

                                    <td className="amc-unit">
                                        PhP
                                    </td>

                                    {YEARS.map((year, index) => (
                                        <td key={year}>
                                            {calculatedCell(
                                                annualEconomic[index]
                                            )}
                                        </td>
                                    ))}
                                </tr>

                                <tr className="amc-section">
                                    <td colSpan={12} />
                                </tr>

                                {/* PERIODIC FINANCIAL */}
                                <tr>
                                    <td className="amc-label">
                                        Periodic Maintenance (Financial)
                                        <br />
                                        <span>
                                            Computed every sixth schedule year
                                        </span>
                                    </td>

                                    <td className="amc-unit">
                                        PhP
                                    </td>

                                    {YEARS.map((year, index) => (
                                        <td key={year}>
                                            {periodicCell(
                                                periodicFinancial[index],
                                                (index + 1) % 6 === 0
                                            )}
                                        </td>
                                    ))}
                                </tr>

                                {/* PERIODIC ECONOMIC */}
                                <tr>
                                    <td className="amc-label">
                                        Periodic Maintenance (Economic)
                                        <br />
                                        <span>
                                            Computed every sixth schedule year
                                        </span>
                                    </td>

                                    <td className="amc-unit">
                                        PhP
                                    </td>

                                    {YEARS.map((year, index) => (
                                        <td key={year}>
                                            {periodicCell(
                                                periodicEconomic[index],
                                                (index + 1) % 6 === 0
                                            )}
                                        </td>
                                    ))}
                                </tr>

                                <tr className="amc-section">
                                    <td colSpan={12} />
                                </tr>

                                {/* TOTAL FINANCIAL */}
                                <tr>
                                    <td className="amc-total-label">
                                        Total Annual Maintenance Cost -
                                        Financial
                                    </td>

                                    <td className="amc-unit">
                                        PhP
                                    </td>

                                    {YEARS.map((year, index) => (
                                        <td key={year}>
                                            <div className="amc-total">
                                                <strong>
                                                    {money(
                                                        totalFinancial[index]
                                                    )}
                                                </strong>
                                            </div>
                                        </td>
                                    ))}
                                </tr>

                                {/* TOTAL ECONOMIC */}
                                <tr>
                                    <td className="amc-total-label">
                                        Total Annual Maintenance Cost -
                                        Economic
                                    </td>

                                    <td className="amc-unit">
                                        PhP
                                    </td>

                                    {YEARS.map((year, index) => (
                                        <td key={year}>
                                            <div className="amc-total">
                                                <strong>
                                                    {money(
                                                        totalEconomic[index]
                                                    )}
                                                </strong>
                                            </div>
                                        </td>
                                    ))}
                                </tr>

                            </tbody>
                        </table>
                    </div>

                    {/* CALCULATION INFORMATION */}
                    <div className="amc-message">
                        <FaCalculator />
                        <span>
                            Financial: ₱{money(financialPCCP)} × 7.9 =
                            ₱{money(estimatedFinancialCost)}
                            {" | "}
                            Economic: ₱{money(economicPCCP)} × 7.9 =
                            ₱{money(estimatedEconomicCost)}
                        </span>
                    </div>

                    {/* SAVE MESSAGE */}
                    {message && (
                        <div
                            className={`amc-message ${
                                message.startsWith("Unable") ? "error" : ""
                            }`}
                        >
                            {message.startsWith("Unable") ? (
                                <FaInfoCircle />
                            ) : (
                                <FaCheckCircle />
                            )}

                            <span>{message}</span>
                        </div>
                    )}

                </main>

                {/* FOOTER */}
                <footer className="amc-footer">
                    <span>
                        <FaInfoCircle />
                        {" "}
                        Financial and economic values are based on
                        the selected RMUC record.
                    </span>

                    <span>
                        MIADP · Access Road · Annual Maintenance Cost
                    </span>
                </footer>

            </div>
        </div>
    );
}
