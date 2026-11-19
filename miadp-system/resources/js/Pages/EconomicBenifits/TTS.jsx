import { useEffect, useMemo, useState } from "react";
import {
    FaTimes,
    FaPlus,
    FaTrash,
    FaSeedling,
    FaTable,
    FaCalculator,
    FaInfoCircle,
    FaLeaf,
    FaSave,
} from "react-icons/fa";

const initialBarangays = [
    {
        id: 1,
        name: "Santo Niño",
        population2024: 1658,
        population2025: 1685,
        growth: 1.52,
        beneficiaryShare: 100,
        activePopulation: 1047,
        distance: 7.9,
        withoutMinutes: 45,
    },
    {
        id: 2,
        name: "Lintangan",
        population2024: 1049,
        population2025: 5581,
        growth: 1.52,
        beneficiaryShare: 100,
        activePopulation: 3834,
        distance: 7.9,
        withoutMinutes: 45,
    },
];

const number = (value) => Number(value) || 0;

const fmt = (value, digits = 2) =>
    Number.isFinite(Number(value))
        ? Number(value).toLocaleString("en-PH", {
              minimumFractionDigits: 0,
              maximumFractionDigits: digits,
          })
        : "—";

const money = (value) => `₱${fmt(value)}`;

const createBarangay = () => ({
    id: Date.now() + Math.random(),
    name: "",
    population2024: 0,
    population2025: 0,
    growth: 1.52,
    beneficiaryShare: 100,
    activePopulation: 0,
    distance: 7.9,
    withoutMinutes: 45,
});

export default function ModalTTS({
    onClose = () => {},
    onSave = () => {},
    onEdit,
    initialData = null,
    readOnly = false,
    saving = false,
}) {
    const [barangays, setBarangays] = useState(
        () => initialData?.barangays ?? initialBarangays
    );

    const [tab, setTab] = useState("inputs");

    const [settings, setSettings] = useState({
        populationYear1: 2024,
        populationYear2: 2025,
        startYear: 2031,
        commuterPercent: 50,
        tripsPerDay: 2,
        workingDays: 260,
        productivePercent: 50,
        laborCost: 432.5,
        economicFactor: 60,
        withSpeed: 30,
        ...initialData?.settings,
        years: 20,
    });

    useEffect(() => {
        if (initialData?.barangays) {
            setBarangays(initialData.barangays);
        }

        if (initialData?.settings) {
            setSettings((previous) => ({
                ...previous,
                ...initialData.settings,
                years: 20,
            }));
        }

        // Restore the saved 20-year projection data when editing.
        if (initialData?.projections?.years?.length === 20) {
            // Projection rows are recalculated from the saved input values.
            // This keeps the displayed results consistent with the inputs.
        }
    }, [initialData]);

    const updateSetting = (key, value) => {
        if (key === "years") return;

        setSettings((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    const updateBarangay = (id, key, value) => {
        setBarangays((rows) =>
            rows.map((row) =>
                row.id === id ? { ...row, [key]: value } : row
            )
        );
    };

    const projections = useMemo(() => {
        const startYear = Math.trunc(number(settings.startYear));
        const baseYear = Math.trunc(number(settings.populationYear2));

        // TTS always projects exactly 20 project years.
        const projectionCount = 20;

        const populationKey =
            `population${Math.trunc(number(settings.populationYear2))}`;

        const beneficiaries = barangays.map((row) => {
            const basePopulation = number(
                row[populationKey] ?? row.population2025
            );

            const projected =
                basePopulation *
                Math.pow(
                    1 + number(row.growth) / 100,
                    Math.max(0, startYear - baseYear)
                );

            const direct =
                projected * (number(row.beneficiaryShare) / 100);

            const withMinutes =
                number(settings.withSpeed) > 0
                    ? (number(row.distance) /
                          number(settings.withSpeed)) *
                      60
                    : 0;

            const savedPerTrip =
                number(row.withoutMinutes) - withMinutes;

            return {
                ...row,
                projected,
                direct,
                withMinutes,
                savedPerTrip,
            };
        });

        const basePopulation = beneficiaries.reduce(
            (sum, row) => sum + row.direct,
            0
        );

        const activeTotal = barangays.reduce(
            (sum, row) => sum + number(row.activePopulation),
            0
        );

        const activePercent =
            activeTotal > 0
                ? barangays.reduce((sum, row) => {
                      const population = number(
                          row[populationKey] ?? row.population2025
                      );
                      const active = number(row.activePopulation);

                      return (
                          sum +
                          (population > 0
                              ? (active / population) *
                                (active / activeTotal)
                              : 0)
                      );
                  }, 0)
                : 0;

        const growthRate =
            basePopulation > 0
                ? beneficiaries.reduce(
                      (sum, row) =>
                          sum +
                          (row.direct * number(row.growth)) / 100,
                      0
                  ) / basePopulation
                : 0;

        const weightedSaving =
            basePopulation > 0
                ? beneficiaries.reduce(
                      (sum, row) =>
                          sum +
                          (row.savedPerTrip * row.direct) /
                              basePopulation,
                      0
                  )
                : 0;

        const economicWage =
            (number(settings.laborCost) *
                number(settings.economicFactor)) /
            100;

        const years = Array.from(
            { length: projectionCount },
            (_, index) => {
                const population =
                    basePopulation *
                    Math.pow(1 + growthRate, index);

                const active = population * activePercent;

                const commuters =
                    active * (number(settings.commuterPercent) / 100);

                const trips =
                    commuters *
                    number(settings.tripsPerDay) *
                    number(settings.workingDays);

                const savedMinutes = trips * weightedSaving;
                const savedDays = savedMinutes / 480;

                const productiveDays =
                    savedDays *
                    (number(settings.productivePercent) / 100);

                const value = productiveDays * economicWage;

                return {
                    year: startYear + index,
                    projectYear: index + 1,
                    population,
                    active,
                    commuters,
                    trips,
                    weightedSaving,
                    savedMinutes,
                    savedDays,
                    productiveDays,
                    economicWage,
                    value,
                };
            }
        );

        return {
            beneficiaries,
            basePopulation,
            activePercent,
            growthRate,
            weightedSaving,
            years,
            annualBenefit: years[0]?.value ?? 0,
            totalValue: years.reduce(
                (sum, row) => sum + row.value,
                0
            ),
        };
    }, [barangays, settings]);

    const addBarangay = () => {
        setBarangays((rows) => [...rows, createBarangay()]);
    };

    const removeBarangay = (id) => {
        setBarangays((rows) => rows.filter((row) => row.id !== id));
    };

    const exportCSV = () => {
        const headers = [
            "Project year",
            "Calendar year",
            "Projected population",
            "Economically active",
            "Commuters",
            "Annual trips",
            "Minutes saved per trip",
            "Total minutes saved",
            "Working days saved",
            "Productive days saved",
            "Economic daily wage (PHP)",
            "Time saving value (PHP)",
        ];

        const rows = projections.years.map((row) => [
            row.projectYear,
            row.year,
            row.population,
            row.active,
            row.commuters,
            row.trips,
            row.weightedSaving,
            row.savedMinutes,
            row.savedDays,
            row.productiveDays,
            row.economicWage,
            row.value,
        ]);

        const csv = [headers, ...rows]
            .map((row) =>
                row
                    .map(
                        (cell) =>
                            `"${String(cell ?? "").replace(/"/g, '""')}"`
                    )
                    .join(",")
            )
            .join("\r\n");

        const blob = new Blob(["\uFEFF", csv], {
            type: "text/csv;charset=utf-8",
        });

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = "travel-time-savings-year-1-to-20.csv";
        anchor.click();

        URL.revokeObjectURL(url);
    };

    const saveCalculations = () => {
        const yearlySavings = projections.years.map((row) => ({
            projectYear: row.projectYear,
            year: row.year,
            value: Number(row.value.toFixed(2)),
        }));

        onSave({
            benefit_category: "Travel Time Savings",
            settings: {
                ...settings,
                years: 20,
            },
            barangays,
            projections: {
                ...projections,
                years: yearlySavings,
                annualBenefit: projections.annualBenefit,
                totalValue: projections.totalValue,
            },
            yearlySavings,
            annualBenefit: projections.annualBenefit,
            annual_benefit: projections.annualBenefit,
            annual_savings: projections.annualBenefit,
            twentyYearSavings: projections.totalValue,
            twenty_year_savings: projections.totalValue,
            year1TotalTimeSavings: projections.annualBenefit,
        });
    };

    const field = (label, key, suffix = "") => (
        <label
            key={key}
            className="block text-sm font-medium text-slate-700"
        >
            {label}

            <div className="mt-1 flex overflow-hidden rounded-lg border border-slate-300">
                <input
                    type="number"
                    step="any"
                    disabled={readOnly || key === "years"}
                    className="w-full min-w-0 px-3 py-2 outline-none focus:bg-emerald-50 disabled:bg-slate-100"
                    value={key === "years" ? 20 : settings[key]}
                    onChange={(event) =>
                        updateSetting(key, event.target.value)
                    }
                />

                {suffix && (
                    <span className="bg-slate-50 px-3 py-2 text-slate-500">
                        {suffix}
                    </span>
                )}
            </div>
        </label>
    );

    const metrics = [
        {
            label: "Population number/a",
            unit: "person",
            value: (row) => row.population,
            digits: 0,
            highlighted: true,
        },
        {
            label: "Population growth rate/b",
            unit: "%",
            value: (row) =>
                row.projectYear === 1
                    ? null
                    : projections.growthRate * 100,
            digits: 2,
            percent: true,
        },
        {
            label: "Projected population",
            unit: "person",
            value: (row) =>
                row.projectYear === 1 ? null : row.population,
            digits: 0,
        },
        {
            label: "Estimated % of ec.active population/c",
            unit: "%",
            value: () => projections.activePercent * 100,
            digits: 0,
            percent: true,
        },
        {
            label: "Estimated number of ec.active population",
            unit: "person",
            value: (row) => row.active,
            digits: 0,
        },
        {
            label: "% commuters in ec.active population/d",
            unit: "%",
            value: () => number(settings.commuterPercent),
            digits: 0,
            percent: true,
        },
        {
            label: "Estimated number of commuters",
            unit: "person",
            value: (row) => row.commuters,
            digits: 0,
        },
        {
            label: "Number of one way trips per day/e",
            unit: "trip/day",
            value: () => number(settings.tripsPerDay),
            digits: 0,
        },
        {
            label: "Number of working days/f",
            unit: "w.day",
            value: () => number(settings.workingDays),
            digits: 0,
        },
        {
            label: "Total number of trips for all commuters",
            unit: "trip",
            value: (row) => row.trips,
            digits: 2,
        },
        {
            label: "Time saving for commuters /g",
            unit: "min/trip",
            value: (row) => row.weightedSaving,
            digits: 2,
        },
        {
            label: "Total time saving in min",
            unit: "min",
            value: (row) => row.savedMinutes,
            digits: 0,
        },
        {
            label: "Total time saving in days",
            unit: "w.day",
            value: (row) => row.savedDays,
            digits: 2,
        },
        {
            label: "Share of saved time used for work /h",
            unit: "%",
            value: () => number(settings.productivePercent),
            digits: 0,
            percent: true,
        },
        {
            label: "Net total time saving in days",
            unit: "w.day",
            value: (row) => row.productiveDays,
            digits: 2,
        },
        {
            label: "Average labor cost/i",
            unit: "PhP/w.day",
            value: () => number(settings.laborCost),
            digits: 2,
        },
        {
            label: "Labor cost (economic)",
            unit: "PhP/w.day",
            value: (row) => row.economicWage,
            digits: 2,
        },
        {
            label: "Time saving value",
            unit: "PhP",
            value: (row) => row.value,
            digits: 2,
            total: true,
        },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-label="Travel Time Savings"
        >
            <div className="flex max-h-[96vh] w-full max-w-[1700px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {/* HEADER */}
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <FaSeedling className="text-xl" />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                                Travel Time Savings (TTS)
                            </h2>
                            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                Commuter travel time savings and annual
                                economic benefits
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        aria-label="Close"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* TABS */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200 px-5 py-3 sm:px-7">
                    {[
                        ["inputs", FaLeaf, "Inputs"],
                        ["results", FaTable, "Benefits Projection"],
                    ].map(([key, Icon, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                                tab === key
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            <Icon />
                            {label}
                        </button>
                    ))}
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-7">
                    {/* SUMMARY CARDS */}
                    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            [
                                "Direct beneficiaries (Year 1)",
                                fmt(projections.basePopulation),
                            ],
                            [
                                "Weighted time saved / trip",
                                `${fmt(projections.weightedSaving)} min`,
                            ],
                            [
                                "Year 1 annual benefit",
                                money(projections.annualBenefit),
                            ],
                            [
                                "Total 20-year savings",
                                money(projections.totalValue),
                            ],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="rounded-xl border border-slate-200 bg-white p-4"
                            >
                                <p className="text-xs font-medium text-slate-500">
                                    {label}
                                </p>
                                <p className="mt-2 text-xl font-bold text-emerald-700">
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* INPUTS TAB */}
                    {tab === "inputs" && (
                        <div className="space-y-5">
                            <section className="rounded-xl border border-slate-200 bg-white p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <FaCalculator className="text-emerald-600" />
                                    <h3 className="font-bold text-slate-800">
                                        Calculation assumptions
                                    </h3>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {field(
                                        "2024 population input year",
                                        "populationYear1"
                                    )}
                                    {field(
                                        "2025 population input year",
                                        "populationYear2"
                                    )}
                                    {field("Starting year", "startYear")}
                                    {field("Projection years", "years")}
                                    {field(
                                        "Commuters among active population",
                                        "commuterPercent",
                                        "%"
                                    )}
                                    {field(
                                        "One-way trips per day",
                                        "tripsPerDay"
                                    )}
                                    {field(
                                        "Working days per year",
                                        "workingDays"
                                    )}
                                    {field(
                                        "Saved time used for work",
                                        "productivePercent",
                                        "%"
                                    )}
                                    {field(
                                        "Average labor cost",
                                        "laborCost",
                                        "PHP/day"
                                    )}
                                    {field(
                                        "Economic wage factor",
                                        "economicFactor",
                                        "%"
                                    )}
                                    {field(
                                        "With-project vehicle speed",
                                        "withSpeed",
                                        "km/h"
                                    )}
                                </div>

                                <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
                                    <FaInfoCircle className="mt-0.5 shrink-0" />
                                    The projection period is fixed at 20
                                    years. Year 1 starts from the selected
                                    starting year.
                                </p>
                            </section>

                            {/* POPULATION INPUTS */}
                            <section className="rounded-xl border border-slate-200 bg-white p-5">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="font-bold text-slate-800">
                                            Population Inputs
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Enter the population of each
                                            barangay for the two input years.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={readOnly}
                                        onClick={addBarangay}
                                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <FaPlus />
                                        Add barangay
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[650px] border-collapse text-left text-sm">
                                        <thead>
                                            <tr className="bg-slate-100 text-slate-700">
                                                <th className="border border-slate-200 px-3 py-3">
                                                    Barangay
                                                </th>
                                                <th className="border border-slate-200 px-3 py-3">
                                                    {settings.populationYear1}{" "}
                                                    population
                                                </th>
                                                <th className="border border-slate-200 px-3 py-3">
                                                    {settings.populationYear2}{" "}
                                                    population
                                                </th>
                                                <th className="w-12 border border-slate-200 px-3 py-3 text-center">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {barangays.map((row) => (
                                                <tr key={row.id}>
                                                    {[
                                                        ["name", "text"],
                                                        [
                                                            "population2024",
                                                            "number",
                                                        ],
                                                        [
                                                            "population2025",
                                                            "number",
                                                        ],
                                                    ].map(([key, type]) => (
                                                        <td
                                                            key={key}
                                                            className="border border-slate-200 p-2"
                                                        >
                                                            <input
                                                                type={type}
                                                                min={
                                                                    type ===
                                                                    "number"
                                                                        ? 0
                                                                        : undefined
                                                                }
                                                                step={
                                                                    type ===
                                                                    "number"
                                                                        ? "1"
                                                                        : undefined
                                                                }
                                                                value={
                                                                    row[key] ??
                                                                    ""
                                                                }
                                                                disabled={
                                                                    readOnly
                                                                }
                                                                aria-label={`${row.name || "Barangay"} ${key}`}
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    updateBarangay(
                                                                        row.id,
                                                                        key,
                                                                        type ===
                                                                            "number"
                                                                            ? event
                                                                                  .target
                                                                                  .value
                                                                            : event
                                                                                  .target
                                                                                  .value
                                                                    )
                                                                }
                                                                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 disabled:bg-slate-100"
                                                            />
                                                        </td>
                                                    ))}

                                                    <td className="border border-slate-200 text-center">
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                readOnly
                                                            }
                                                            onClick={() =>
                                                                removeBarangay(
                                                                    row.id
                                                                )
                                                            }
                                                            className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 disabled:opacity-40"
                                                            aria-label={`Remove ${row.name}`}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}

                                            {barangays.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="border border-slate-200 px-3 py-8 text-center text-slate-500"
                                                    >
                                                        No barangays added.
                                                        Click Add barangay to
                                                        begin.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
                                    <FaInfoCircle className="mt-0.5 shrink-0" />
                                    Growth rate, active population, distance,
                                    and travel time use the existing barangay
                                    assumptions. The two population columns
                                    remain the editable population inputs.
                                </p>
                            </section>
                        </div>
                    )}

                    {/* RESULTS TAB */}
                    {tab === "results" && (
                        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h3 className="font-bold text-slate-800">
                                        Benefits — Travel Time Savings
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        20-year economic benefit projection
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={exportCSV}
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                >
                                    Export CSV
                                </button>
                            </div>

                            <p className="mb-3 text-xs text-slate-500">
                                Excel-style layout: benefit items appear in
                                rows, with project years 1–20 across the
                                columns. Scroll horizontally to view later
                                years.
                            </p>

                            <div className="max-w-full overflow-x-auto rounded-lg border border-slate-300">
                                <table className="w-max min-w-full border-collapse text-xs text-slate-900 sm:text-sm">
                                    <thead>
                                        <tr className="bg-slate-200">
                                            <th className="sticky left-0 z-20 min-w-[260px] border border-slate-300 bg-slate-200 px-3 py-2 text-left">
                                                Benefits
                                            </th>
                                            <th className="sticky left-[260px] z-20 min-w-[105px] border border-slate-300 bg-slate-200 px-2 py-2 text-center">
                                                Unit
                                            </th>

                                            {projections.years.map((row) => (
                                                <th
                                                    key={row.projectYear}
                                                    className="min-w-[125px] border border-slate-300 px-3 py-2 text-right"
                                                >
                                                    Year {row.projectYear}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {metrics.map((metric) => (
                                            <tr
                                                key={metric.label}
                                                className={
                                                    metric.total
                                                        ? "bg-emerald-50 font-bold"
                                                        : "hover:bg-slate-50"
                                                }
                                            >
                                                <td className="sticky left-0 z-10 border border-slate-300 bg-slate-200 px-3 py-2">
                                                    {metric.label}
                                                </td>

                                                <td className="sticky left-[260px] z-10 border border-slate-300 bg-slate-200 px-2 py-2 text-center">
                                                    {metric.unit}
                                                </td>

                                                {projections.years.map(
                                                    (row) => {
                                                        const value =
                                                            metric.value(row);

                                                        const highlighted =
                                                            (metric.highlighted &&
                                                                row.projectYear ===
                                                                    1) ||
                                                            (row.projectYear ===
                                                                1 &&
                                                                [
                                                                    "Estimated % of ec.active population/c",
                                                                    "% commuters in ec.active population/d",
                                                                    "Number of one way trips per day/e",
                                                                    "Number of working days/f",
                                                                    "Time saving for commuters /g",
                                                                    "Share of saved time used for work /h",
                                                                ].includes(
                                                                    metric.label
                                                                )) ||
                                                            (row.projectYear ===
                                                                2 &&
                                                                metric.label ===
                                                                    "Population growth rate/b");

                                                        return (
                                                            <td
                                                                key={
                                                                    row.projectYear
                                                                }
                                                                className={`border border-slate-300 px-3 py-2 text-right tabular-nums ${
                                                                    highlighted
                                                                        ? "bg-yellow-300"
                                                                        : "bg-slate-100"
                                                                }`}
                                                            >
                                                                {value === null
                                                                    ? ""
                                                                    : `${fmt(value, metric.digits)}${metric.percent ? "%" : ""}`}
                                                            </td>
                                                        );
                                                    }
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* YEARLY SAVINGS SUMMARY */}
                            <div className="mt-5 overflow-x-auto">
                                <h4 className="mb-3 font-bold text-slate-800">
                                    Annual TTS Savings — Year 1 to Year 20
                                </h4>

                                <table className="w-full min-w-[600px] border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-emerald-50 text-slate-700">
                                            <th className="border border-slate-200 px-3 py-2 text-left">
                                                Project Year
                                            </th>
                                            <th className="border border-slate-200 px-3 py-2 text-left">
                                                Calendar Year
                                            </th>
                                            <th className="border border-slate-200 px-3 py-2 text-right">
                                                Annual Savings
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {projections.years.map((row) => (
                                            <tr key={row.projectYear}>
                                                <td className="border border-slate-200 px-3 py-2">
                                                    Year {row.projectYear}
                                                </td>
                                                <td className="border border-slate-200 px-3 py-2">
                                                    {row.year}
                                                </td>
                                                <td className="border border-slate-200 px-3 py-2 text-right font-semibold tabular-nums">
                                                    {money(row.value)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>

                                    <tfoot>
                                        <tr className="bg-emerald-100 font-bold">
                                            <td
                                                colSpan={2}
                                                className="border border-slate-200 px-3 py-3"
                                            >
                                                Total 20-Year TTS Savings
                                            </td>
                                            <td className="border border-slate-200 px-3 py-3 text-right">
                                                {money(projections.totalValue)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </section>
                    )}
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
                    <p className="text-xs text-slate-500">
                        Values update automatically when inputs change.
                    </p>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        {readOnly ? (
                            onEdit && (
                                <button
                                    type="button"
                                    onClick={onEdit}
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                >
                                    Edit
                                </button>
                            )
                        ) : (
                            <button
                                type="button"
                                disabled={saving || barangays.length === 0}
                                onClick={saveCalculations}
                                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FaSave />
                                {saving ? "Saving..." : "Save calculations"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
