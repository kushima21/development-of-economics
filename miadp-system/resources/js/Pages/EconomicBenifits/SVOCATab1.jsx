import { useEffect, useMemo, useState } from "react";
import {
    FaCalendarAlt,
    FaChartBar,
    FaCheckCircle,
    FaChevronDown,
    FaChevronUp,
    FaInfoCircle,
    FaRoad,
    FaSave,
    FaTimes,
    FaTruck,
} from "react-icons/fa";

const DEFAULT_GROWTH_RATE = 4;

const VEHICLES = [
    { id: "car_van", label: "Car / Van" },
    { id: "jeepney", label: "Jeepney" },
    { id: "motorcycle", label: "Motorcycle" },
    { id: "tricycle", label: "Tricycle" },
    { id: "bus", label: "Bus" },
    { id: "truck", label: "Truck" },
];

const VEHICLE_TYPES = [
    { id: "public", label: "Public Vehicle" },
    { id: "private", label: "Private Vehicle" },
];

/*
 * Base VOC rates adjusted to 2022 prices.
 * Unit: PHP per kilometre per trip.
 */
const VOC_BASE_RATES = {
    A: {
        car_van: 15.47,
        jeepney: 13.62,
        motorcycle: 2.86,
        tricycle: 5.28,
        bus: 30.05,
        truck: 22.89,
    },
    B: {
        car_van: 25.96,
        jeepney: 24.97,
        motorcycle: 7.52,
        tricycle: 16.43,
        bus: 64.41,
        truck: 45.58,
    },
    C: {
        car_van: 17.95,
        jeepney: 16.31,
        motorcycle: 3.35,
        tricycle: 5.61,
        bus: 38.35,
        truck: 28.83,
    },
    D: {
        car_van: 20.75,
        jeepney: 19.59,
        motorcycle: 3.96,
        tricycle: 7.01,
        bus: 50.56,
        truck: 35.90,
    },
    E: {
        car_van: 33.37,
        jeepney: 35.44,
        motorcycle: 8.01,
        tricycle: 17.03,
        bus: 97.56,
        truck: 60.75,
    },
    F: {
        car_van: 71.92,
        jeepney: 70.91,
        motorcycle: 21.95,
        tricycle: 25.62,
        bus: 132.15,
        truck: 62.14,
    },
};

/*
 * Road condition improvements to good paved road (A):
 *
 * TAB6A: B - A = Very bad paved road
 * TAB6B: C - A = Good gravel road
 * TAB6C: D - A = Fair gravel road
 * TAB6D: E - A = Very bad gravel road
 * TAB6E: F - A = Bad earth road
 */
const ROAD_SURFACES = [
    {
        id: "tab6a",
        code: "TAB6A",
        label: "Very Bad Paved Road",
        description: "Very bad paved road to good paved road",
        existingCode: "B",
        formula: "B − A",
    },
    {
        id: "tab6b",
        code: "TAB6B",
        label: "Good Gravel Road",
        description: "Good gravel road to good paved road",
        existingCode: "C",
        formula: "C − A",
    },
    {
        id: "tab6c",
        code: "TAB6C",
        label: "Fair Gravel Road",
        description: "Fair gravel road to good paved road",
        existingCode: "D",
        formula: "D − A",
    },
    {
        id: "tab6d",
        code: "TAB6D",
        label: "Very Bad Gravel Road",
        description: "Very bad gravel road to good paved road",
        existingCode: "E",
        formula: "E − A",
    },
    {
        id: "tab6e",
        code: "TAB6E",
        label: "Bad Earth Road",
        description: "Bad earth road to good paved road",
        existingCode: "F",
        formula: "F − A",
    },
].map((surface) => ({
    ...surface,
    rates: Object.fromEntries(
        VEHICLES.map((vehicle) => [
            vehicle.id,
            VOC_BASE_RATES[surface.existingCode][vehicle.id] -
                VOC_BASE_RATES.A[vehicle.id],
        ]),
    ),
}));

const createTrafficData = () =>
    Object.fromEntries(
        VEHICLES.map((vehicle) => [
            vehicle.id,
            Object.fromEntries(
                VEHICLE_TYPES.map((type) => [
                    type.id,
                    {
                        day1: "",
                        day2: "",
                        day3: "",
                        tripsPerDay: "",
                        operatingDays: "",
                    },
                ]),
            ),
        ]),
    );

const createForm = () => {
    const currentYear = new Date().getFullYear();

    return {
        barangay: "",
        inputDate1: "",
        inputDate2: "",
        inputDate3: "",
        year1: String(currentYear),
        inputYear: String(currentYear),
        trafficGrowthRate: String(DEFAULT_GROWTH_RATE),
        roadLength: "",
        traffic: createTrafficData(),
    };
};

const createVOCData = () => ({
    roadLengths: Object.fromEntries(
        ROAD_SURFACES.map((surface) => [surface.id, ""]),
    ),
});

const numberValue = (value) => {
    if (value === "" || value === null || value === undefined) {
        return 0;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const positiveNumber = (value) => Math.max(0, numberValue(value));

const hasValue = (value) =>
    value !== "" && value !== null && value !== undefined;

const formatNumber = (value, decimals = 2) =>
    numberValue(value).toLocaleString("en-PH", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

const formatCurrency = (value) => `₱${formatNumber(value, 2)}`;

const inputClass =
    "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

const labelClass =
    "mb-1.5 block text-sm font-semibold text-slate-700";

const sectionCardClass =
    "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6";

const buttonClass =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2";

export default function ModalSVOTab1({
    isOpen,
    onClose,
    onSave,
    initialData = null,
}) {
    const [form, setForm] = useState(createForm);
    const [vocForm, setVocForm] = useState(createVOCData);
    const [errors, setErrors] = useState({});
    const [activeSection, setActiveSection] = useState("tab1");
    const [activeWorksheet, setActiveWorksheet] = useState(null);

    useEffect(() => {
        if (!isOpen) return;

        const defaults = createForm();
        const savedForm = initialData ?? {};
        const savedTraffic = savedForm.traffic ?? {};

        const mergedTraffic = Object.fromEntries(
            VEHICLES.map((vehicle) => [
                vehicle.id,
                Object.fromEntries(
                    VEHICLE_TYPES.map((type) => [
                        type.id,
                        {
                            ...defaults.traffic[vehicle.id][type.id],
                            ...(savedTraffic[vehicle.id]?.[type.id] ?? {}),
                        },
                    ]),
                ),
            ]),
        );

        setForm({
            ...defaults,
            ...savedForm,
            traffic: mergedTraffic,
        });

        const defaultVOC = createVOCData();
        const savedTab2 = savedForm.tab2 ?? {};

        setVocForm({
            roadLengths: {
                ...defaultVOC.roadLengths,
                ...(savedTab2.roadLengths ?? {}),
            },
        });

        setErrors({});
        setActiveSection("tab1");
        setActiveWorksheet(null);
    }, [isOpen, initialData]);

    const updateForm = (field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [field]: "",
        }));
    };

    const updateTraffic = (vehicleId, typeId, field, value) => {
        setForm((previous) => ({
            ...previous,
            traffic: {
                ...previous.traffic,
                [vehicleId]: {
                    ...previous.traffic[vehicleId],
                    [typeId]: {
                        ...previous.traffic[vehicleId][typeId],
                        [field]: value,
                    },
                },
            },
        }));

        const errorKey = `${vehicleId}.${typeId}.${field}`;

        setErrors((previous) => ({
            ...previous,
            [errorKey]: "",
        }));
    };

    const updateRoadLength = (surfaceId, value) => {
        setVocForm((previous) => ({
            ...previous,
            roadLengths: {
                ...previous.roadLengths,
                [surfaceId]: value,
            },
        }));

        setErrors((previous) => ({
            ...previous,
            [surfaceId]: "",
        }));
    };

    /*
     * Tab 1 calculations:
     *
     * Average daily traffic = (Day 1 + Day 2 + Day 3) / 3
     * Projected AADT = Average daily traffic × (1 + growth rate)^year difference
     *
     * Annual trips are calculated only when BOTH Trips per Day and
     * Operating Days per Year have been entered as positive values.
     * No default values are substituted for either field.
     */
    const trafficCalculations = useMemo(() => {
        const growthRate =
            Math.max(0, numberValue(form.trafficGrowthRate)) / 100;

        const yearDifference = Math.max(
            0,
            numberValue(form.inputYear) - numberValue(form.year1),
        );

        const vehicleRows = VEHICLES.map((vehicle) => {
            const typeResults = {};

            VEHICLE_TYPES.forEach((type) => {
                const entry =
                    form.traffic?.[vehicle.id]?.[type.id] ?? {};

                const day1 = positiveNumber(entry.day1);
                const day2 = positiveNumber(entry.day2);
                const day3 = positiveNumber(entry.day3);

                const average = (day1 + day2 + day3) / 3;

                const projectedAADT =
                    average * Math.pow(1 + growthRate, yearDifference);

                const tripsPerDay = hasValue(entry.tripsPerDay)
                    ? positiveNumber(entry.tripsPerDay)
                    : null;

                const operatingDays = hasValue(entry.operatingDays)
                    ? positiveNumber(entry.operatingDays)
                    : null;

                const annualizationComplete =
                    tripsPerDay !== null &&
                    tripsPerDay > 0 &&
                    operatingDays !== null &&
                    operatingDays > 0;

                const annualTrips = annualizationComplete
                    ? projectedAADT * tripsPerDay * operatingDays
                    : 0;

                typeResults[type.id] = {
                    day1,
                    day2,
                    day3,
                    average,
                    projectedAADT,
                    tripsPerDay,
                    operatingDays,
                    annualizationComplete,
                    annualTrips,
                };
            });

            return {
                vehicleId: vehicle.id,
                vehicle: vehicle.label,
                types: typeResults,
                combinedAADT:
                    typeResults.public.projectedAADT +
                    typeResults.private.projectedAADT,
                combinedAnnualTrips:
                    typeResults.public.annualTrips +
                    typeResults.private.annualTrips,
            };
        });

        const totals = VEHICLE_TYPES.reduce((result, type) => {
            result[type.id] = vehicleRows.reduce(
                (sum, row) => sum + row.types[type.id].annualTrips,
                0,
            );

            return result;
        }, {});

        const aadtTotals = VEHICLE_TYPES.reduce((result, type) => {
            result[type.id] = vehicleRows.reduce(
                (sum, row) => sum + row.types[type.id].projectedAADT,
                0,
            );

            return result;
        }, {});

        const annualizationInputsComplete = vehicleRows.every((row) =>
            VEHICLE_TYPES.every(
                (type) => row.types[type.id].annualizationComplete,
            ),
        );

        return {
            vehicleRows,
            totals,
            aadtTotals,
            grandTotal: totals.public + totals.private,
            combinedAADT: aadtTotals.public + aadtTotals.private,
            annualizationInputsComplete,
        };
    }, [form]);

    /*
     * Tab 2:
     *
     * Annual VOC savings =
     * incremental VOC rate × projected AADT × trips per day
     * × operating days per year × actual road length.
     *
     * If Trips per Day or Operating Days per Year is blank or zero,
     * the corresponding public/private annual trips are zero.
     */
    const roadSurfaceResults = useMemo(() => {
        const totalRoadLength = ROAD_SURFACES.reduce(
            (sum, surface) =>
                sum + positiveNumber(vocForm.roadLengths[surface.id]),
            0,
        );

        const results = ROAD_SURFACES.map((surface) => {
            const roadLength = positiveNumber(
                vocForm.roadLengths[surface.id],
            );

            const percentage =
                totalRoadLength > 0
                    ? (roadLength / totalRoadLength) * 100
                    : 0;

            const vehicleResults = VEHICLES.map((vehicle) => {
                const trafficRow = trafficCalculations.vehicleRows.find(
                    (row) => row.vehicleId === vehicle.id,
                );

                const publicTraffic = trafficRow?.types.public;
                const privateTraffic = trafficRow?.types.private;

                const publicAnnualTrips =
                    publicTraffic?.annualTrips ?? 0;

                const privateAnnualTrips =
                    privateTraffic?.annualTrips ?? 0;

                const annualTraffic =
                    publicAnnualTrips + privateAnnualTrips;

                const incrementalRate = surface.rates[vehicle.id];

                const annualSavings =
                    incrementalRate * annualTraffic * roadLength;

                return {
                    vehicleId: vehicle.id,
                    vehicle: vehicle.label,
                    incrementalRate,
                    publicAnnualTrips,
                    privateAnnualTrips,
                    annualTraffic,
                    annualSavings,
                };
            });

            const totalSavings = vehicleResults.reduce(
                (sum, vehicle) => sum + vehicle.annualSavings,
                0,
            );

            return {
                ...surface,
                roadLength,
                percentage,
                vehicleResults,
                totalSavings,
            };
        });

        const totalSavings = results.reduce(
            (sum, surface) => sum + surface.totalSavings,
            0,
        );

        const savingsByVehicle = VEHICLES.map((vehicle) => ({
            ...vehicle,
            total: results.reduce((sum, surface) => {
                const row = surface.vehicleResults.find(
                    (item) => item.vehicleId === vehicle.id,
                );

                return sum + (row?.annualSavings ?? 0);
            }, 0),
        }));

        return {
            results,
            totalRoadLength,
            totalPercentage:
                totalRoadLength > 0
                    ? results.reduce(
                          (sum, item) => sum + item.percentage,
                          0,
                      )
                    : 0,
            totalSavings,
            savingsByVehicle,
        };
    }, [vocForm, trafficCalculations]);

    const validateForm = () => {
        const nextErrors = {};

        if (!form.barangay.trim()) {
            nextErrors.barangay = "Barangay is required.";
        }

        ["inputDate1", "inputDate2", "inputDate3"].forEach((field, index) => {
            if (!form[field]) {
                nextErrors[field] = `Enter the survey date for Day ${index + 1}.`;
            }
        });

        if (!form.year1 || numberValue(form.year1) <= 0) {
            nextErrors.year1 = "Enter a valid base year.";
        }

        if (
            !form.inputYear ||
            numberValue(form.inputYear) < numberValue(form.year1)
        ) {
            nextErrors.inputYear =
                "Input Year must be the same as or later than the Base Year.";
        }

        if (
            !hasValue(form.trafficGrowthRate) ||
            numberValue(form.trafficGrowthRate) < 0
        ) {
            nextErrors.trafficGrowthRate =
                "Enter a valid non-negative traffic growth rate.";
        }

        if (numberValue(form.roadLength) < 0) {
            nextErrors.roadLength = "Road length cannot be negative.";
        }

        VEHICLES.forEach((vehicle) => {
            VEHICLE_TYPES.forEach((type) => {
                const entry = form.traffic[vehicle.id][type.id];

                ["day1", "day2", "day3"].forEach((field) => {
                    if (
                        hasValue(entry[field]) &&
                        numberValue(entry[field]) < 0
                    ) {
                        nextErrors[
                            `${vehicle.id}.${type.id}.${field}`
                        ] = "Traffic count cannot be negative.";
                    }
                });

                if (
                    hasValue(entry.tripsPerDay) &&
                    numberValue(entry.tripsPerDay) < 0
                ) {
                    nextErrors[
                        `${vehicle.id}.${type.id}.tripsPerDay`
                    ] = "Trips per day cannot be negative.";
                }

                if (
                    hasValue(entry.operatingDays) &&
                    (numberValue(entry.operatingDays) < 0 ||
                        numberValue(entry.operatingDays) > 366)
                ) {
                    nextErrors[
                        `${vehicle.id}.${type.id}.operatingDays`
                    ] = "Operating days must be between 0 and 366.";
                }
            });
        });

        ROAD_SURFACES.forEach((surface) => {
            if (numberValue(vocForm.roadLengths[surface.id]) < 0) {
                nextErrors[surface.id] =
                    "Road length cannot be negative.";
            }
        });

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!validateForm()) {
            setActiveSection("tab1");
            return;
        }

        const tab1Payload = {
            ...form,
            barangay: form.barangay.trim(),
            year1: numberValue(form.year1),
            inputYear: numberValue(form.inputYear),
            trafficGrowthRate: numberValue(form.trafficGrowthRate),
            roadLength: positiveNumber(form.roadLength),
            calculations: trafficCalculations.vehicleRows,
            totals: {
                public: trafficCalculations.totals.public,
                private: trafficCalculations.totals.private,
                combined: trafficCalculations.grandTotal,
                publicAADT: trafficCalculations.aadtTotals.public,
                privateAADT: trafficCalculations.aadtTotals.private,
                combinedAADT: trafficCalculations.combinedAADT,
            },
        };

        const tab2Payload = {
            roadLengths: Object.fromEntries(
                ROAD_SURFACES.map((surface) => [
                    surface.id,
                    positiveNumber(vocForm.roadLengths[surface.id]),
                ]),
            ),
            roadSurfaceResults: roadSurfaceResults.results.map((surface) => ({
                id: surface.id,
                code: surface.code,
                label: surface.label,
                formula: surface.formula,
                roadLength: surface.roadLength,
                percentage: surface.percentage,
                rates: surface.rates,
                vehicleResults: surface.vehicleResults,
                totalSavings: surface.totalSavings,
            })),
            totalRoadLength: roadSurfaceResults.totalRoadLength,
            totalPercentage: roadSurfaceResults.totalPercentage,
            savingsByVehicle: roadSurfaceResults.savingsByVehicle,
            totalAnnualVOCSavings: roadSurfaceResults.totalSavings,
            pricesAdjustedAsOf: 2022,
            calculationMethod:
                "Incremental VOC rate × projected AADT × trips per day × operating days per year × actual road length",
        };

        onSave?.({
            ...tab1Payload,
            benefitId: "b1",
            benefitName: "Vehicle Operating Cost Savings",
            worksheet: "Traffic Survey and VOC Savings",
            tab2: tab2Payload,
            combinedAnnualBenefit: roadSurfaceResults.totalSavings,
        });
    };

    if (!isOpen) return null;

    const renderError = (field) =>
        errors[field] ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors[field]}
            </p>
        ) : null;

    const renderTrafficInput = (vehicle, type, entry, field, label) => {
        const errorKey = `${vehicle.id}.${type.id}.${field}`;

        return (
            <div key={field}>
                <label className={labelClass}>{label}</label>
                <input
                    type="number"
                    min="0"
                    step="any"
                    value={entry[field] ?? ""}
                    onChange={(event) =>
                        updateTraffic(
                            vehicle.id,
                            type.id,
                            field,
                            event.target.value,
                        )
                    }
                    className={inputClass}
                    placeholder="Enter count"
                />
                {renderError(errorKey)}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-5">
            <div className="flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">
                {/* Header */}
                <header className="flex shrink-0 items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-teal-700 px-4 py-4 text-white sm:px-7">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="shrink-0 rounded-xl bg-white/15 p-3">
                            <FaTruck className="text-xl" />
                        </div>

                        <div className="min-w-0">
                            <h2 className="text-lg font-bold sm:text-xl">
                                Vehicle Operating Cost Savings
                            </h2>
                            <p className="mt-1 text-xs text-emerald-50 sm:text-sm">
                                Traffic survey, road conditions, and annual
                                VOC savings based on 2022 prices
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-lg p-2 transition hover:bg-white/15"
                        aria-label="Close modal"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </header>

                {/* Navigation */}
                <nav className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-7">
                    <div className="flex flex-wrap gap-2">
                        {[
                            {
                                id: "tab1",
                                label: "Tab 1 — Traffic Survey",
                                icon: <FaChartBar />,
                            },
                            {
                                id: "tab2",
                                label: "Tab 2 — VOC Savings",
                                icon: <FaRoad />,
                            },
                            {
                                id: "all",
                                label: "Show Both Sections",
                                icon: <FaCheckCircle />,
                            },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveSection(item.id)}
                                className={`${buttonClass} ${
                                    activeSection === item.id
                                        ? "bg-emerald-700 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </nav>

                <form
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">
                        {/* TAB 1 */}
                        {(activeSection === "tab1" ||
                            activeSection === "all") && (
                            <section className="mb-8 space-y-6">
                                <div className="flex items-start gap-3 border-b border-emerald-200 pb-4">
                                    <div className="rounded-xl bg-emerald-100 p-3 text-emerald-800">
                                        <FaChartBar className="text-lg" />
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">
                                            Tab 1 — Traffic Survey
                                        </h3>
                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            Record three-day traffic counts for
                                            every vehicle type, separately for
                                            public and private vehicles. Enter
                                            Trips per Day and Operating Days
                                            manually; both fields start blank.
                                        </p>
                                    </div>
                                </div>

                                {/* Project information */}
                                <div className={sectionCardClass}>
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700">
                                            <FaCalendarAlt />
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-slate-800">
                                                Project and Survey Information
                                            </h4>
                                            <p className="text-sm text-slate-500">
                                                Enter the survey details and
                                                projection assumptions.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div>
                                            <label className={labelClass}>
                                                Name of Barangay *
                                            </label>
                                            <input
                                                value={form.barangay}
                                                onChange={(event) =>
                                                    updateForm(
                                                        "barangay",
                                                        event.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                                placeholder="Enter barangay"
                                            />
                                            {renderError("barangay")}
                                        </div>

                                        {[
                                            {
                                                field: "inputDate1",
                                                label: "Survey Date — Day 1 *",
                                            },
                                            {
                                                field: "inputDate2",
                                                label: "Survey Date — Day 2 *",
                                            },
                                            {
                                                field: "inputDate3",
                                                label: "Survey Date — Day 3 *",
                                            },
                                        ].map((item) => (
                                            <div key={item.field}>
                                                <label className={labelClass}>
                                                    {item.label}
                                                </label>
                                                <input
                                                    type="date"
                                                    value={form[item.field]}
                                                    onChange={(event) =>
                                                        updateForm(
                                                            item.field,
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={inputClass}
                                                />
                                                {renderError(item.field)}
                                            </div>
                                        ))}

                                        <div>
                                            <label className={labelClass}>
                                                Base Year *
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={form.year1}
                                                onChange={(event) =>
                                                    updateForm(
                                                        "year1",
                                                        event.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                            />
                                            {renderError("year1")}
                                        </div>

                                        <div>
                                            <label className={labelClass}>
                                                Project / Input Year *
                                            </label>
                                            <input
                                                type="number"
                                                min={form.year1 || 1}
                                                value={form.inputYear}
                                                onChange={(event) =>
                                                    updateForm(
                                                        "inputYear",
                                                        event.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                            />
                                            {renderError("inputYear")}
                                        </div>

                                        <div>
                                            <label className={labelClass}>
                                                Annual Traffic Growth Rate (%)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={form.trafficGrowthRate}
                                                onChange={(event) =>
                                                    updateForm(
                                                        "trafficGrowthRate",
                                                        event.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                            />
                                            <p className="mt-1.5 text-xs text-slate-500">
                                                Default growth rate:{" "}
                                                {DEFAULT_GROWTH_RATE}%.
                                            </p>
                                            {renderError("trafficGrowthRate")}
                                        </div>

                                        <div>
                                            <label className={labelClass}>
                                                Reference Road Length (km)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={form.roadLength}
                                                onChange={(event) =>
                                                    updateForm(
                                                        "roadLength",
                                                        event.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                                placeholder="Optional reference length"
                                            />
                                            {renderError("roadLength")}
                                            <p className="mt-1.5 text-xs text-slate-500">
                                                Actual condition-specific lengths
                                                are entered in Tab 2.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Traffic inputs */}
                                <div className={sectionCardClass}>
                                    <div className="mb-5">
                                        <h4 className="font-bold text-slate-800">
                                            Traffic Volume Inputs
                                        </h4>
                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            Enter the observed counts for each
                                            survey day. Trips per Day and
                                            Operating Days per Year must be
                                            entered separately for each public
                                            and private vehicle category.
                                        </p>
                                    </div>

                                    <div className="space-y-5">
                                        {VEHICLES.map((vehicle) => (
                                            <article
                                                key={vehicle.id}
                                                className="overflow-hidden rounded-xl border border-slate-200"
                                            >
                                                <div className="flex items-center justify-between gap-3 bg-slate-100 px-4 py-3">
                                                    <h5 className="font-bold text-slate-800">
                                                        {vehicle.label}
                                                    </h5>
                                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                                        Vehicle category
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
                                                    {VEHICLE_TYPES.map((type) => {
                                                        const entry =
                                                            form.traffic[
                                                                vehicle.id
                                                            ][type.id];

                                                        const result =
                                                            trafficCalculations.vehicleRows.find(
                                                                (row) =>
                                                                    row.vehicleId ===
                                                                    vehicle.id,
                                                            ).types[type.id];

                                                        return (
                                                            <div
                                                                key={type.id}
                                                                className="rounded-xl border border-slate-200 p-4"
                                                            >
                                                                <h6 className="mb-4 font-bold text-emerald-800">
                                                                    {type.label}
                                                                </h6>

                                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                                    {renderTrafficInput(
                                                                        vehicle,
                                                                        type,
                                                                        entry,
                                                                        "day1",
                                                                        "Day 1 Count",
                                                                    )}
                                                                    {renderTrafficInput(
                                                                        vehicle,
                                                                        type,
                                                                        entry,
                                                                        "day2",
                                                                        "Day 2 Count",
                                                                    )}
                                                                    {renderTrafficInput(
                                                                        vehicle,
                                                                        type,
                                                                        entry,
                                                                        "day3",
                                                                        "Day 3 Count",
                                                                    )}
                                                                </div>

                                                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                                    <div className="rounded-lg bg-slate-50 p-3">
                                                                        <p className="text-xs font-medium text-slate-500">
                                                                            Average Daily Traffic
                                                                        </p>
                                                                        <p className="mt-1 text-xl font-bold tabular-nums text-slate-800">
                                                                            {formatNumber(
                                                                                result.average,
                                                                            )}
                                                                        </p>
                                                                    </div>

                                                                    <div className="rounded-lg bg-emerald-50 p-3">
                                                                        <p className="text-xs font-medium text-emerald-700">
                                                                            Projected AADT —{" "}
                                                                            {form.inputYear}
                                                                        </p>
                                                                        <p className="mt-1 text-xl font-bold tabular-nums text-emerald-900">
                                                                            {formatNumber(
                                                                                result.projectedAADT,
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                                    <div>
                                                                        <label className={labelClass}>
                                                                            Trips per Day *
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="any"
                                                                            value={
                                                                                entry.tripsPerDay
                                                                            }
                                                                            onChange={(event) =>
                                                                                updateTraffic(
                                                                                    vehicle.id,
                                                                                    type.id,
                                                                                    "tripsPerDay",
                                                                                    event.target.value,
                                                                                )
                                                                            }
                                                                            className={inputClass}
                                                                            placeholder="Enter trips per day"
                                                                        />
                                                                        {renderError(
                                                                            `${vehicle.id}.${type.id}.tripsPerDay`,
                                                                        )}
                                                                    </div>

                                                                    <div>
                                                                        <label className={labelClass}>
                                                                            Operating Days per Year *
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="366"
                                                                            step="1"
                                                                            value={
                                                                                entry.operatingDays
                                                                            }
                                                                            onChange={(event) =>
                                                                                updateTraffic(
                                                                                    vehicle.id,
                                                                                    type.id,
                                                                                    "operatingDays",
                                                                                    event.target.value,
                                                                                )
                                                                            }
                                                                            className={inputClass}
                                                                            placeholder="Enter operating days"
                                                                        />
                                                                        {renderError(
                                                                            `${vehicle.id}.${type.id}.operatingDays`,
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <span className="text-sm text-emerald-800">
                                                                            Projected Annual Trips
                                                                        </span>
                                                                        <span className="font-bold tabular-nums text-emerald-950">
                                                                            {formatNumber(
                                                                                result.annualTrips,
                                                                            )}
                                                                        </span>
                                                                    </div>

                                                                    {!result.annualizationComplete && (
                                                                        <p className="mt-2 text-xs leading-5 text-amber-800">
                                                                            Enter positive values for both fields to calculate annual trips and VOC savings.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </div>

                                {/* Tab 1 summary */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                                        <p className="text-sm font-medium text-blue-800">
                                            Projected Public AADT
                                        </p>
                                        <p className="mt-2 text-2xl font-bold tabular-nums text-blue-950">
                                            {formatNumber(
                                                trafficCalculations.aadtTotals.public,
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
                                        <p className="text-sm font-medium text-violet-800">
                                            Projected Private AADT
                                        </p>
                                        <p className="mt-2 text-2xl font-bold tabular-nums text-violet-950">
                                            {formatNumber(
                                                trafficCalculations.aadtTotals.private,
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-gradient-to-r from-emerald-800 to-teal-700 p-5 text-white">
                                        <p className="text-sm text-emerald-100">
                                            Total Projected Annual Trips
                                        </p>
                                        <p className="mt-2 text-2xl font-bold tabular-nums">
                                            {formatNumber(
                                                trafficCalculations.grandTotal,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* TAB 2 */}
                        {(activeSection === "tab2" ||
                            activeSection === "all") && (
                            <section className="space-y-6">
                                <div className="flex items-start gap-3 border-b border-emerald-200 pb-4">
                                    <div className="rounded-xl bg-emerald-100 p-3 text-emerald-800">
                                        <FaRoad className="text-lg" />
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">
                                            Tab 2 — Incremental VOC and Annual Savings
                                        </h3>
                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            Enter the actual road length for
                                            each existing road condition.
                                            Savings update automatically using
                                            the traffic and annualization inputs
                                            from Tab 1.
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
                                    <div className="flex items-start gap-3">
                                        <FaInfoCircle className="mt-1 shrink-0 text-blue-700" />

                                        <div className="text-sm leading-6 text-blue-950">
                                            <p className="font-bold">
                                                Annual VOC Savings Formula
                                            </p>
                                            <p className="mt-1">
                                                Incremental VOC (₱/km/trip) ×
                                                projected AADT × trips per day
                                                × operating days per year ×
                                                actual road length (km).
                                            </p>
                                            <p className="mt-2">
                                                Public and private traffic are
                                                calculated separately and then
                                                combined for each vehicle type.
                                                Blank or zero Trips per Day or
                                                Operating Days values produce
                                                zero annual trips for that
                                                category; no default is applied.
                                            </p>
                                            <p className="mt-2 font-semibold">
                                                All base VOC rates are expressed
                                                in Philippine pesos at 2022
                                                prices.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary cards */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                        <p className="text-sm font-medium text-emerald-800">
                                            Total Road Length
                                        </p>
                                        <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-950">
                                            {formatNumber(
                                                roadSurfaceResults.totalRoadLength,
                                            )}{" "}
                                            <span className="text-sm">km</span>
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                        <p className="text-sm font-medium text-blue-800">
                                            Road-Length Percentage
                                        </p>
                                        <p className="mt-2 text-2xl font-bold tabular-nums text-blue-950">
                                            {formatNumber(
                                                roadSurfaceResults.totalPercentage,
                                            )}%
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                                        <p className="text-sm font-medium text-violet-800">
                                            Projected Combined AADT
                                        </p>
                                        <p className="mt-2 text-2xl font-bold tabular-nums text-violet-950">
                                            {formatNumber(
                                                trafficCalculations.combinedAADT,
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-gradient-to-r from-emerald-800 to-teal-700 p-4 text-white">
                                        <p className="text-sm text-emerald-100">
                                            Total Annual VOC Savings
                                        </p>
                                        <p className="mt-2 text-2xl font-bold tabular-nums">
                                            {formatCurrency(
                                                roadSurfaceResults.totalSavings,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Incremental VOC rates */}
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <div className="border-b border-slate-200 bg-slate-100 px-4 py-4 sm:px-5">
                                        <h4 className="font-bold text-slate-800">
                                            Incremental Vehicle Operating Cost
                                        </h4>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Existing road-condition rate minus
                                            the good paved road rate (A).
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[850px] border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-white text-left text-xs uppercase tracking-wide text-slate-500">
                                                    <th className="px-4 py-3">
                                                        Road Condition
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        Formula
                                                    </th>
                                                    {VEHICLES.map((vehicle) => (
                                                        <th
                                                            key={vehicle.id}
                                                            className="px-4 py-3 text-right"
                                                        >
                                                            {vehicle.label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {ROAD_SURFACES.map((surface) => (
                                                    <tr
                                                        key={surface.id}
                                                        className="border-t border-slate-100 odd:bg-white even:bg-slate-50"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <p className="font-semibold text-slate-800">
                                                                {surface.label}
                                                            </p>
                                                            <p className="text-xs text-emerald-700">
                                                                {surface.code}
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-3 font-semibold text-slate-600">
                                                            {surface.formula}
                                                        </td>

                                                        {VEHICLES.map((vehicle) => (
                                                            <td
                                                                key={vehicle.id}
                                                                className="px-4 py-3 text-right tabular-nums text-slate-700"
                                                            >
                                                                {formatNumber(
                                                                    surface.rates[
                                                                        vehicle.id
                                                                    ],
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Road-condition worksheets */}
                                <div className="space-y-4">
                                    {ROAD_SURFACES.map((surface) => {
                                        const result =
                                            roadSurfaceResults.results.find(
                                                (item) =>
                                                    item.id === surface.id,
                                            );

                                        const isExpanded =
                                            activeWorksheet === surface.id;

                                        return (
                                            <article
                                                key={surface.id}
                                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                            >
                                                <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                                                    <div className="flex min-w-0 items-start gap-3">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-extrabold text-emerald-800">
                                                            {surface.code}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h4 className="font-bold text-slate-800">
                                                                    {surface.label}
                                                                </h4>

                                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                                    {surface.formula}
                                                                </span>
                                                            </div>

                                                            <p className="mt-1 text-sm leading-5 text-slate-500">
                                                                {surface.description}
                                                            </p>

                                                            <p className="mt-1 text-xs font-medium text-emerald-700">
                                                                Connected to Tab 1 traffic inputs
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setActiveWorksheet(
                                                                isExpanded
                                                                    ? null
                                                                    : surface.id,
                                                            )
                                                        }
                                                        className={`${buttonClass} shrink-0 ${
                                                            isExpanded
                                                                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                                : "bg-emerald-700 text-white hover:bg-emerald-800"
                                                        }`}
                                                    >
                                                        {isExpanded ? (
                                                            <>
                                                                <FaChevronUp />
                                                                Hide Details
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaChartBar />
                                                                Input Data / View Calculation
                                                                <FaChevronDown />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
                                                    <div>
                                                        <label className={labelClass}>
                                                            Actual Road Length (km)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.001"
                                                            value={
                                                                vocForm.roadLengths[
                                                                    surface.id
                                                                ]
                                                            }
                                                            onChange={(event) =>
                                                                updateRoadLength(
                                                                    surface.id,
                                                                    event.target.value,
                                                                )
                                                            }
                                                            className={inputClass}
                                                            placeholder="Enter length in km"
                                                        />
                                                        {renderError(surface.id)}
                                                    </div>

                                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                                        <p className="text-sm font-medium text-slate-500">
                                                            Road-Length Share
                                                        </p>
                                                        <p className="mt-2 text-2xl font-bold tabular-nums text-slate-800">
                                                            {formatNumber(
                                                                result.percentage,
                                                            )}%
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Of total entered road length
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                                        <p className="text-sm font-medium text-blue-800">
                                                            Projected Combined AADT
                                                        </p>
                                                        <p className="mt-2 text-2xl font-bold tabular-nums text-blue-950">
                                                            {formatNumber(
                                                                trafficCalculations.combinedAADT,
                                                            )}
                                                        </p>
                                                        <p className="mt-1 text-xs text-blue-700">
                                                            All vehicle types, public + private
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                                        <p className="text-sm font-medium text-emerald-800">
                                                            Annual VOC Savings
                                                        </p>
                                                        <p className="mt-2 text-xl font-extrabold tabular-nums text-emerald-950">
                                                            {formatCurrency(
                                                                result.totalSavings,
                                                            )}
                                                        </p>
                                                        <p className="mt-1 text-xs text-emerald-700">
                                                            Input year: {form.inputYear}
                                                        </p>
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className="border-t border-emerald-100 bg-slate-50 p-4 sm:p-5">
                                                        <div className="mb-4 flex items-start gap-3">
                                                            <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-800">
                                                                <FaChartBar />
                                                            </div>

                                                            <div>
                                                                <h5 className="font-bold text-slate-800">
                                                                    {surface.code} — Detailed Calculation
                                                                </h5>
                                                                <p className="mt-1 text-sm leading-5 text-slate-500">
                                                                    Incremental rate × public/private annual trips × actual road length.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                                            <table className="w-full min-w-[900px] border-collapse text-sm">
                                                                <thead>
                                                                    <tr className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                                                                        <th className="px-4 py-3">
                                                                            Vehicle Type
                                                                        </th>
                                                                        <th className="px-4 py-3 text-right">
                                                                            Incremental VOC (₱/km/trip)
                                                                        </th>
                                                                        <th className="px-4 py-3 text-right">
                                                                            Public Annual Trips
                                                                        </th>
                                                                        <th className="px-4 py-3 text-right">
                                                                            Private Annual Trips
                                                                        </th>
                                                                        <th className="px-4 py-3 text-right">
                                                                            Combined Annual Trips
                                                                        </th>
                                                                        <th className="px-4 py-3 text-right">
                                                                            Annual Savings (₱)
                                                                        </th>
                                                                    </tr>
                                                                </thead>

                                                                <tbody>
                                                                    {result.vehicleResults.map(
                                                                        (vehicle) => (
                                                                            <tr
                                                                                key={vehicle.vehicleId}
                                                                                className="border-t border-slate-100"
                                                                            >
                                                                                <td className="px-4 py-3 font-semibold text-slate-800">
                                                                                    {vehicle.vehicle}
                                                                                </td>

                                                                                <td className="px-4 py-3 text-right tabular-nums">
                                                                                    {formatNumber(
                                                                                        vehicle.incrementalRate,
                                                                                    )}
                                                                                </td>

                                                                                <td className="px-4 py-3 text-right tabular-nums">
                                                                                    {formatNumber(
                                                                                        vehicle.publicAnnualTrips,
                                                                                    )}
                                                                                </td>

                                                                                <td className="px-4 py-3 text-right tabular-nums">
                                                                                    {formatNumber(
                                                                                        vehicle.privateAnnualTrips,
                                                                                    )}
                                                                                </td>

                                                                                <td className="px-4 py-3 text-right tabular-nums">
                                                                                    {formatNumber(
                                                                                        vehicle.annualTraffic,
                                                                                    )}
                                                                                </td>

                                                                                <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-800">
                                                                                    {formatCurrency(
                                                                                        vehicle.annualSavings,
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        ),
                                                                    )}
                                                                </tbody>

                                                                <tfoot>
                                                                    <tr className="border-t-2 border-emerald-200 bg-emerald-50">
                                                                        <td
                                                                            colSpan={5}
                                                                            className="px-4 py-4 font-bold text-emerald-950"
                                                                        >
                                                                            TOTAL {surface.code} ANNUAL VOC SAVINGS
                                                                        </td>

                                                                        <td className="px-4 py-4 text-right font-extrabold tabular-nums text-emerald-950">
                                                                            {formatCurrency(
                                                                                result.totalSavings,
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                </tfoot>
                                                            </table>
                                                        </div>

                                                        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                                                            <p className="font-bold">
                                                                Calculation for {surface.code}
                                                            </p>
                                                            <p className="mt-1">
                                                                For each vehicle:{" "}
                                                                {surface.formula} incremental rate × combined public/private annual trips ×{" "}
                                                                {formatNumber(result.roadLength)} km.
                                                            </p>
                                                            <p className="mt-1">
                                                                Blank or zero Trips per Day or Operating Days in Tab 1 result in zero annual trips for that vehicle category until valid values are entered.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>

                                {/* Summary by road condition */}
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <div className="border-b border-slate-200 bg-slate-100 px-4 py-4 sm:px-5">
                                        <h4 className="font-bold text-slate-800">
                                            Annual VOC Savings Summary
                                        </h4>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Combined results from all five road-condition categories.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[700px] border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-white text-left text-xs uppercase tracking-wide text-slate-500">
                                                    <th className="px-4 py-3">Worksheet</th>
                                                    <th className="px-4 py-3">Road Condition</th>
                                                    <th className="px-4 py-3 text-right">Length (km)</th>
                                                    <th className="px-4 py-3 text-right">Length (%)</th>
                                                    <th className="px-4 py-3 text-right">Annual VOC Savings (₱)</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {roadSurfaceResults.results.map((surface) => (
                                                    <tr
                                                        key={surface.id}
                                                        className="border-t border-slate-100 odd:bg-white even:bg-slate-50"
                                                    >
                                                        <td className="px-4 py-3 font-bold text-emerald-800">
                                                            {surface.code}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-700">
                                                            {surface.label}
                                                        </td>
                                                        <td className="px-4 py-3 text-right tabular-nums">
                                                            {formatNumber(surface.roadLength)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right tabular-nums">
                                                            {formatNumber(surface.percentage)}%
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-800">
                                                            {formatCurrency(surface.totalSavings)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>

                                            <tfoot>
                                                <tr className="border-t-2 border-emerald-200 bg-emerald-50">
                                                    <td colSpan={2} className="px-4 py-4 font-bold text-emerald-950">
                                                        TOTAL
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-extrabold tabular-nums text-emerald-950">
                                                        {formatNumber(roadSurfaceResults.totalRoadLength)} km
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-extrabold tabular-nums text-emerald-950">
                                                        {formatNumber(roadSurfaceResults.totalPercentage)}%
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-extrabold tabular-nums text-emerald-950">
                                                        {formatCurrency(roadSurfaceResults.totalSavings)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Summary by vehicle */}
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <div className="border-b border-slate-200 bg-slate-100 px-4 py-4 sm:px-5">
                                        <h4 className="font-bold text-slate-800">
                                            Annual Savings by Vehicle Type
                                        </h4>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Savings aggregated across all five road-condition categories.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[600px] border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-white text-left text-xs uppercase tracking-wide text-slate-500">
                                                    <th className="px-4 py-3">Vehicle Type</th>
                                                    <th className="px-4 py-3 text-right">Annual VOC Savings (₱)</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {roadSurfaceResults.savingsByVehicle.map((vehicle) => (
                                                    <tr key={vehicle.id} className="border-t border-slate-100">
                                                        <td className="px-4 py-3 font-semibold text-slate-800">
                                                            {vehicle.label}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-800">
                                                            {formatCurrency(vehicle.total)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>

                                            <tfoot>
                                                <tr className="border-t-2 border-emerald-200 bg-emerald-50">
                                                    <td className="px-4 py-4 font-bold text-emerald-950">
                                                        TOTAL ANNUAL VOC SAVINGS
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-extrabold tabular-nums text-emerald-950">
                                                        {formatCurrency(roadSurfaceResults.totalSavings)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <FaInfoCircle className="mt-1 shrink-0 text-amber-700" />

                                        <div className="text-sm leading-6 text-amber-950">
                                            <p className="font-bold">
                                                Important Calculation Notes
                                            </p>
                                            <ul className="mt-2 list-disc space-y-1 pl-5">
                                                <li>
                                                    Trips per Day and Operating Days per Year have no default values.
                                                </li>
                                                <li>
                                                    Annual trips and VOC savings remain zero for a public/private vehicle category until both fields contain positive values.
                                                </li>
                                                <li>
                                                    Road-length percentages use the sum of the five entered road lengths.
                                                </li>
                                                <li>
                                                    VOC savings use the actual length entered for each matching road condition.
                                                </li>
                                                <li>
                                                    Incremental rates use the supplied base VOC table: B−A, C−A, D−A, E−A, and F−A.
                                                </li>
                                                <li>
                                                    Verify the annualization assumptions and VOC rates against the official MIADP workbook before using results in final economic analysis.
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </main>

                    {/* Footer */}
                    <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                        <p className="text-xs leading-5 text-slate-500">
                            No default trips-per-day or operating-days values
                            are applied. Review all traffic assumptions and
                            road lengths before saving.
                        </p>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                            <button
                                type="button"
                                onClick={onClose}
                                className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-100`}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className={`${buttonClass} bg-emerald-700 text-white shadow-sm hover:bg-emerald-800`}
                            >
                                <FaSave />
                                Save Traffic Survey and VOC Savings
                            </button>
                        </div>
                    </footer>
                </form>
            </div>
        </div>
    );
}