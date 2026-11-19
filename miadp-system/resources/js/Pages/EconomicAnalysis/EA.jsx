
import { useEffect, useMemo } from "react";
import {
    FaTimes,
    FaChartLine,
    FaCoins,
    FaInfoCircle,
    FaTable,
    FaCheckCircle,
} from "react-icons/fa";

const YEARS = Array.from({ length: 21 }, (_, index) => index);

const ROWS = [
    {
        key: "voc",
        label: "Vehicle Operating Cost Savings (VOC)",
    },
    {
        key: "soh",
        label: "Savings in Output Hauling Costs (SOH)",
    },
    {
        key: "sih",
        label: "Savings in Input Hauling Costs (SIH)",
    },
    {
        key: "tts",
        label: "Savings in Travel Time for Commuters (TTS)",
    },
    {
        key: "nga",
        label: "Savings in New Cultivated Agricultural Land (NGA)",
    },
    {
        key: "stl",
        label: "Savings in Reduction of Transport Losses (STL)",
    },
];

// --------------------------------------------------
// NUMBER HELPERS
// --------------------------------------------------

const num = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === "" ||
        !Number.isFinite(Number(value))
    ) {
        return null;
    }

    return Number(value);
};

const first = (...values) =>
    values.find(
        (value) =>
            value !== undefined &&
            value !== null &&
            value !== ""
    );

const decodeData = (value) => {
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return {};
        }
    }

    return value && typeof value === "object"
        ? value
        : {};
};

// --------------------------------------------------
// FORMATTING
// --------------------------------------------------

const formatNumber = (
    value,
    decimals = 1,
    divideByThousand = true
) => {
    if (value === null || value === undefined) {
        return "—";
    }

    if (value === 0) {
        return "–";
    }

    const displayValue = divideByThousand
        ? value / 1000
        : value;

    const formatted = Math.abs(displayValue).toLocaleString(
        "en-PH",
        {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }
    );

    return value < 0
        ? `(${formatted})`
        : formatted;
};

const formatPeso = (value) => {
    if (value === null || value === undefined) {
        return "Not available";
    }

    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

// --------------------------------------------------
// YEARLY PROJECTION CONVERSION
// --------------------------------------------------

/**
 * Converts saved data into a 21-position array.
 *
 * 20 values = Years 1–20.
 * 21 values = Years 0–20.
 * Object rows can contain explicit year properties.
 */
function arrayFrom(source) {
    const result = Array(21).fill(null);

    if (typeof source === "string") {
        source = decodeData(source);
    }

    if (Array.isArray(source)) {
        if (
            source.length > 0 &&
            typeof source[0] === "object" &&
            source[0] !== null
        ) {
            source.forEach((entry, index) => {
                const explicitYear = num(
                    first(
                        entry?.year,
                        entry?.project_year,
                        entry?.year_number,
                        entry?.yearNo,
                        entry?.year_no,
                        entry?.yearNumber
                    )
                );

                const value = num(
                    first(
                        entry?.annual_savings,
                        entry?.annualSavings,
                        entry?.total_savings,
                        entry?.totalSavings,
                        entry?.total_benefit,
                        entry?.totalBenefit,
                        entry?.annual_benefit,
                        entry?.annualBenefit,
                        entry?.savings,
                        entry?.total,
                        entry?.value
                    )
                );

                const year =
                    explicitYear !== null
                        ? explicitYear
                        : source.length === 20
                            ? index + 1
                            : index;

                if (
                    Number.isInteger(year) &&
                    year >= 0 &&
                    year <= 20
                ) {
                    result[year] = value;
                }
            });

            return result;
        }

        if (source.length === 20) {
            source.forEach((value, index) => {
                result[index + 1] = num(value);
            });

            return result;
        }

        source.slice(0, 21).forEach((value, index) => {
            result[index] = num(value);
        });

        return result;
    }

    if (source && typeof source === "object") {
        for (let year = 0; year <= 20; year++) {
            result[year] = num(
                first(
                    source[year],
                    source[String(year)],
                    source[`year_${year}`],
                    source[`year${year}`],
                    source[`Year ${year}`],
                    source[`Year${year}`]
                )
            );
        }
    }

    return result;
}

function hasYearlyValues(series) {
    return series.some(
        (value, index) =>
            index >= 1 && value !== null
    );
}

// --------------------------------------------------
// PROJECTION FINDER
// --------------------------------------------------

/**
 * Finds saved yearly projections inside a record.
 */
function findProjection(data) {
    const candidates = [];

    const keys = [
        "annual_savings",
        "annualSavings",
        "yearly_savings",
        "yearlySavings",
        "yearly_benefits",
        "yearlyBenefits",
        "yearly_totals",
        "yearlyTotals",
        "annual_projections",
        "annualProjections",
        "annual_benefits",
        "annualBenefits",
        "calculated_rows",
        "calculatedRows",
        "cropCalculations",
        "projections",
        "yearlyData",
    ];

    const addCandidate = (value) => {
        if (
            value !== null &&
            value !== undefined &&
            value !== ""
        ) {
            candidates.push(value);
        }
    };

    keys.forEach((key) => {
        addCandidate(data?.[key]);
    });

    const sections = [
        "tab1",
        "tab2",
        "tab3",
        "tab4",
        "projection",
        "projections",
        "summary",
        "results",
        "calculation",
        "calculations",
    ];

    sections.forEach((section) => {
        const nested = data?.[section];

        if (
            !nested ||
            typeof nested !== "object"
        ) {
            return;
        }

        keys.forEach((key) => {
            addCandidate(nested[key]);
        });
    });

    for (const candidate of candidates) {
        const parsed = arrayFrom(candidate);

        if (hasYearlyValues(parsed)) {
            return parsed;
        }
    }

    return null;
}

// --------------------------------------------------
// BENEFIT RECORD PARSER
// --------------------------------------------------

function parseRecord(record, category = "") {
    if (!record) {
        return null;
    }

    const data = decodeData(
        record.data ?? record
    );

    if (!data || typeof data !== "object") {
        return null;
    }

    // 1. Search for saved yearly projections in JSON data.
    const projection = findProjection(data);

    if (projection) {
        return projection;
    }

    // 2. Search direct database columns.
    const directCandidates = [
        record.twenty_year_savings,
        record.annual_savings,
        record.yearly_savings,
        record.yearly_benefits,
    ];

    for (const candidate of directCandidates) {
        if (
            candidate !== null &&
            candidate !== undefined &&
            candidate !== ""
        ) {
            const parsed = arrayFrom(candidate);

            if (hasYearlyValues(parsed)) {
                return parsed;
            }
        }
    }

    // 3. A scalar annual_savings is Year 1 only
    // for categories other than SOH.
    const annual = num(
        first(
            data.annual_savings,
            data.annualSavings,
            data.total_annual_savings,
            data.totalAnnualSavings,
            data.annual_benefit,
            data.annualBenefit,
            record.annual_savings
        )
    );

    if (annual !== null) {
        const result = Array(21).fill(null);

        result[0] = 0;

        if (category === "soh") {
            // SOH fallback: repeat annual savings
            // across Years 1–20.
            for (let year = 1; year <= 20; year++) {
                result[year] = annual;
            }
        } else {
            result[1] = annual;
        }

        return result;
    }

    // 4. SOH fallback from the 20-year total.
    if (category === "soh") {
        const twentyYearTotal = num(
            record.twenty_year_savings
        );

        if (twentyYearTotal !== null) {
            const annualAmount = twentyYearTotal / 20;
            const result = Array(21).fill(null);

            result[0] = 0;

            for (let year = 1; year <= 20; year++) {
                result[year] = annualAmount;
            }

            return result;
        }
    }

    return null;
}

// --------------------------------------------------
// TABLE ROW
// --------------------------------------------------

function TableRow({
    label,
    values = [],
    unit = "",
    tone = "",
    indent = false,
    decimals = 1,
    divideByThousand = true,
}) {
    const background =
        tone === "dark"
            ? "bg-blue-950 text-white"
            : tone === "blue"
                ? "bg-blue-50 text-blue-950"
                : tone === "green"
                    ? "bg-emerald-50 text-emerald-950"
                    : "bg-white text-slate-700";

    return (
        <tr className={background}>
            <th
                scope="row"
                className={`sticky left-0 z-10 min-w-[310px] max-w-[310px] border-b border-r border-slate-200 px-5 py-3 text-left text-xs sm:text-sm ${
                    tone
                        ? "font-extrabold"
                        : "font-medium"
                } ${indent ? "pl-8" : ""} ${background}`}
            >
                {label}
            </th>

            <td className="min-w-[65px] border-b border-r border-slate-200 px-2 text-center text-xs opacity-70">
                {unit}
            </td>

            {YEARS.map((year) => (
                <td
                    key={year}
                    className="min-w-[115px] border-b border-r border-slate-200 px-3 py-3 text-right text-xs font-semibold tabular-nums sm:text-sm"
                >
                    {formatNumber(
                        values?.[year] ?? null,
                        decimals,
                        divideByThousand
                    )}
                </td>
            ))}
        </tr>
    );
}

// --------------------------------------------------
// SECTION HEADER
// --------------------------------------------------

function Section({ title, subtitle }) {
    return (
        <tr>
            <th
                colSpan={23}
                className="border-y border-slate-200 bg-slate-100 px-5 py-3 text-left"
            >
                <span className="font-extrabold text-slate-800">
                    {title}
                </span>

                {subtitle && (
                    <span className="ml-3 text-xs font-normal text-slate-500">
                        {subtitle}
                    </span>
                )}
            </th>
        </tr>
    );
}

// --------------------------------------------------
// SUMMARY CARD
// --------------------------------------------------

function SummaryCard({
    title,
    value,
    icon: Icon,
    color,
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <span className={`rounded-xl p-3 ${color}`}>
                    <Icon />
                </span>

                <span className="text-xs font-semibold text-slate-500">
                    {title}
                </span>
            </div>

            <p className="mt-3 break-all text-xl font-black tracking-tight text-slate-900">
                {formatPeso(value)}
            </p>
        </div>
    );
}

// --------------------------------------------------
// MAIN ECONOMIC ANALYSIS MODAL
// --------------------------------------------------

export default function ModalEA({
    isOpen = true,
    onClose = () => {},
    subproject = null,
    initialData = null,
    economic_benefits = [],
}) {
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.body.style.overflow =
                previousOverflow;

            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [isOpen, onClose]);

    // --------------------------------------------------
    // CALCULATIONS
    // --------------------------------------------------

    const calc = useMemo(() => {
        const source = initialData ?? {};

        const records = Array.isArray(economic_benefits)
            ? economic_benefits
            : Object.values(economic_benefits ?? {});

        // ---------------------------------------------
        // COST SERIES
        // ---------------------------------------------

        const investmentValue = num(
            first(
                source.investment,
                source.total_economic_value,
                source.economic_investment
            )
        );

        const maintenanceValue = num(
            first(
                source.maintenance,
                source.annual_maintenance
            )
        );

        const foregoneValue = num(
            first(
                source.cropProductionForegone,
                source.crop_production_foregone
            )
        );

        const investment = source.investmentYears
            ? arrayFrom(source.investmentYears)
            : YEARS.map((year) =>
                year === 0
                    ? investmentValue
                    : investmentValue === null
                        ? null
                        : 0
            );

        const maintenance = source.maintenanceYears
            ? arrayFrom(source.maintenanceYears)
            : YEARS.map((year) =>
                year === 0 ? 0 : maintenanceValue
            );

        const foregone = YEARS.map((year) => {
            if (year === 0) {
                return 0;
            }

            return foregoneValue ?? 0;
        });

        // ---------------------------------------------
        // BENEFIT SERIES
        // ---------------------------------------------

        const benefits = {};

        ROWS.forEach((row) => {
            const direct = source.benefits?.[row.key];

            if (direct !== null && direct !== undefined) {
                const directSeries = arrayFrom(direct);

                // SOH: if the controller provides only Year 1,
                // repeat that annual amount through Year 20.
                if (
                    row.key === "soh" &&
                    directSeries[1] !== null &&
                    directSeries.slice(2).every(
                        (value) => value === null
                    )
                ) {
                    for (let year = 2; year <= 20; year++) {
                        directSeries[year] = directSeries[1];
                    }
                }

                benefits[row.key] = directSeries;
                return;
            }

            const found = records.filter((record) => {
                const category = String(
                    first(
                        record.benefit_category,
                        record.category,
                        record.type,
                        record.key,
                        ""
                    )
                ).toLowerCase();

                return (
                    category === row.key ||
                    category.includes(row.key)
                );
            });

            const total = Array(21).fill(null);
            total[0] = 0;

            if (found.length > 0) {
                found.forEach((record) => {
                    const series = parseRecord(
                        record,
                        row.key
                    );

                    if (!series) {
                        return;
                    }

                    for (
                        let year = 1;
                        year <= 20;
                        year++
                    ) {
                        if (series[year] === null) {
                            continue;
                        }

                        if (total[year] === null) {
                            total[year] = 0;
                        }

                        total[year] += series[year];
                    }
                });
            }

            benefits[row.key] = total;
        });

        // ---------------------------------------------
        // TOTAL INPUTS
        // ---------------------------------------------

        const totalInputs = YEARS.map((year) => {
            const values = [
                investment[year],
                maintenance[year],
                foregone[year],
            ];

            if (
                values.some(
                    (value) => value === null
                )
            ) {
                return null;
            }

            return values.reduce(
                (sum, value) => sum + value,
                0
            );
        });

        // ---------------------------------------------
        // TOTAL BENEFITS
        // ---------------------------------------------

        const totalBenefits = YEARS.map((year) => {
            if (year === 0) {
                return 0;
            }

            const available = ROWS
                .map((row) => benefits[row.key][year])
                .filter((value) => value !== null);

            if (available.length === 0) {
                return null;
            }

            return available.reduce(
                (sum, value) => sum + value,
                0
            );
        });

        const availableBenefitCategories = YEARS.map(
            (year) =>
                ROWS.filter(
                    (row) =>
                        benefits[row.key][year] !== null
                ).length
        );

        // ---------------------------------------------
        // NET BENEFITS
        // ---------------------------------------------

        const net = YEARS.map((year) => {
            if (year === 0) {
                return totalInputs[0] === null
                    ? null
                    : -totalInputs[0];
            }

            if (
                totalInputs[year] === null ||
                totalBenefits[year] === null
            ) {
                return null;
            }

            return (
                totalBenefits[year] -
                totalInputs[year]
            );
        });

        // ---------------------------------------------
        // CUMULATIVE NET BENEFITS
        // ---------------------------------------------

        let running = 0;
        let cumulativeValid = true;

        const cumulative = net.map((value) => {
            if (value === null) {
                cumulativeValid = false;
                return null;
            }

            if (!cumulativeValid) {
                return null;
            }

            running += value;

            return running;
        });

        return {
            investment,
            maintenance,
            foregone,
            benefits,
            totalInputs,
            totalBenefits,
            availableBenefitCategories,
            net,
            cumulative,
        };
    }, [initialData, economic_benefits]);

    if (!isOpen) {
        return null;
    }

    // --------------------------------------------------
    // SUMMARY CARDS
    // --------------------------------------------------

    const cards = [
        {
            title: "Initial Economic Investment",
            value: calc.investment[0],
            icon: FaCoins,
            color: "bg-blue-50 text-blue-700",
        },
        {
            title: "Year 1 Incremental Benefits",
            value: calc.totalBenefits[1],
            icon: FaChartLine,
            color: "bg-emerald-50 text-emerald-700",
        },
        {
            title: "Year 1 Net Benefits",
            value: calc.net[1],
            icon: FaCheckCircle,
            color: "bg-indigo-50 text-indigo-700",
        },
        {
            title: "20-Year Cumulative Net",
            value: calc.cumulative[20],
            icon: FaTable,
            color: "bg-violet-50 text-violet-700",
        },
    ];

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="ea-modal-title"
                className="flex max-h-[96vh] w-full max-w-[1700px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
            >
                {/* HEADER */}
                <header className="relative shrink-0 overflow-hidden bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 px-5 py-5 text-white sm:px-8 sm:py-7">
                    <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border-[35px] border-white/5" />

                    <div className="relative flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-white/15 p-3">
                                <FaChartLine className="text-xl" />
                            </div>

                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[.2em] text-blue-200">
                                    MIADP · Economic Evaluation
                                </p>

                                <h2
                                    id="ea-modal-title"
                                    className="mt-1 text-xl font-black sm:text-2xl"
                                >
                                    Economic Analysis
                                </h2>

                                <p className="mt-1 text-sm text-blue-100/80">
                                    20-Year Economic Cost and Benefit Worksheet · Read-only
                                </p>

                                {subproject?.subproject_title && (
                                    <p className="mt-2 text-xs font-semibold text-blue-200">
                                        {subproject.subproject_title}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close economic analysis"
                            className="rounded-xl bg-white/10 p-3 hover:bg-white/20"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </header>

                {/* BODY */}
                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50">
                    {/* SUMMARY CARDS */}
                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
                        {cards.map((card) => (
                            <SummaryCard
                                key={card.title}
                                {...card}
                            />
                        ))}
                    </div>

                    {/* ECONOMIC TABLE */}
                    <div className="mx-4 mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mx-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                            <div>
                                <h3 className="font-extrabold text-slate-900">
                                    Economic Cost & Benefit Schedule
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    Figures in Php'000 except SOH, SIH, and STL · Scroll horizontally to see Years 0–20
                                </p>
                            </div>

                            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                                21 annual columns
                            </span>
                        </div>

                        <div className="max-h-[55vh] overflow-auto">
                            <table className="w-max min-w-full border-collapse text-sm">
                                <thead className="sticky top-0 z-30">
                                    <tr className="bg-slate-900 text-white">
                                        <th className="sticky left-0 z-40 min-w-[310px] bg-slate-900 px-5 py-4 text-left">
                                            Inputs / Benefits
                                        </th>

                                        <th className="min-w-[65px] border-r border-slate-700 px-2 text-center">
                                            Unit
                                        </th>

                                        {YEARS.map((year) => (
                                            <th
                                                key={year}
                                                className="min-w-[115px] border-r border-slate-700 px-3 py-4 text-right"
                                            >
                                                {year}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    <Section title="INPUTS (Php'000)" />

                                    <Section title="Investment" />

                                    <TableRow
                                        label="Total Economic Investment"
                                        unit="PHP"
                                        values={calc.investment}
                                        indent
                                    />

                                    <TableRow
                                        label="Total Investment"
                                        values={calc.investment}
                                        tone="blue"
                                    />

                                    <Section title="Operating Costs" />

                                    <TableRow
                                        label="Annual Maintenance Cost"
                                        unit="PHP"
                                        values={calc.maintenance}
                                        indent
                                    />

                                    <TableRow
                                        label="Total Operating Cost"
                                        values={calc.maintenance}
                                        tone="blue"
                                    />

                                    <Section title="Dis-benefits" />

                                    <TableRow
                                        label="Net Value of Crop Production Foregone"
                                        values={calc.foregone}
                                        indent
                                    />

                                    <TableRow
                                        label="Total Inputs"
                                        values={calc.totalInputs}
                                        tone="blue"
                                    />

                                    <Section title="INCREMENTAL BENEFITS" />

                                    {ROWS.map((row) => {
                                        // SOH, SIH, and STL use whole PHP amounts.
                                        const isWholeNumber =
                                            row.key === "soh" ||
                                            row.key === "sih" ||
                                            row.key === "stl";

                                        return (
                                            <TableRow
                                                key={row.key}
                                                label={row.label}
                                                values={calc.benefits[row.key]}
                                                indent
                                                decimals={
                                                    isWholeNumber ? 0 : 1
                                                }
                                                divideByThousand={
                                                    !isWholeNumber
                                                }
                                            />
                                        );
                                    })}

                                    <TableRow
                                        label="Total Incremental Benefits (Available Subtotal)"
                                        values={calc.totalBenefits}
                                        tone="green"
                                    />

                                    <TableRow
                                        label="Net Incremental Benefits"
                                        values={calc.net}
                                        tone="dark"
                                    />

                                    <TableRow
                                        label="Cumulative Net Benefits"
                                        values={calc.cumulative}
                                        tone="blue"
                                    />
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* INFORMATION */}
                    <div className="mx-5 mb-5 flex items-start gap-2 text-xs leading-6 text-slate-500 sm:mx-7">
                        <FaInfoCircle className="mt-0.5 shrink-0" />

                        <div>
                            <p>
                                Missing figures appear as —. Year 0 records
                                the initial investment. Years 1–20 display
                                annual maintenance costs and saved benefit
                                projections.
                            </p>

                            <p className="mt-2">
                                SOH, SIH, and STL are displayed as whole PHP
                                amounts without decimal places. Other benefit
                                categories are displayed in Php'000 with one
                                decimal place.
                            </p>

                            <p className="mt-2">
                                Total Incremental Benefits is a subtotal
                                of categories with saved values. It is not
                                a complete project total if applicable
                                benefit categories are missing.
                            </p>

                            <p className="mt-2">
                                Benefit categories available per year:{" "}
                                {calc.availableBenefitCategories[1]} of 6
                                in Year 1.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-8">
                    <span className="text-xs font-semibold text-slate-400">
                        MIADP · View-only economic analysis
                    </span>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                    >
                        Close Details
                    </button>
                </footer>
            </div>
        </div>
    );
}
