import { useMemo, useState } from "react";
import {
    FaTruck,
    FaTimes,
    FaChartBar,
    FaPlus,
    FaMapMarkerAlt,
    FaSeedling,
    FaTrash,
    FaInfoCircle,
    FaChevronDown,
    FaChevronUp,
    FaTable,
    FaBox,
    FaChartLine,
} from "react-icons/fa";

const YEARS = Array.from({ length: 20 }, (_, index) => index + 1);

const VEHICLES = [
    { key: "motorcycle", label: "Motorcycle" },
    { key: "tricycle", label: "Tricycle" },
    { key: "jeep", label: "Jeep" },
    { key: "truck", label: "Truck" },
];

const createId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value) =>
    toNumber(value).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const getCropKey = (name) => name.trim().toLowerCase();

const createCrop = () => ({
    id: createId(),
    crop: "",
    existing_area: "",
    area_intercropped: "",
    intercropped_commodity: "",
});

const createBarangay = () => ({
    id: createId(),
    barangay: "",
    crops: [createCrop()],
    expanded: true,
});

const createHaulingData = () => ({
    unit: "kg",
    cost_wop_b: "",
    cost_wp_c: "",
    motorized_wop: {
        motorcycle: "",
        tricycle: "",
        jeep: "",
        truck: "",
    },
    motorized_wp_c: {
        motorcycle: "",
        tricycle: "",
        jeep: "",
        truck: "",
    },
});

const createProductionData = () => ({
    unit: "kg",
    packaging: "Sack",
    kg_per_packaging: "",
    total_packages: "",
    cropping_per_year: "",
    percentage_market: "",
});

function NumberInput({
    value,
    onChange,
    placeholder = "0.00",
    disabled = false,
}) {
    return (
        <input
            type="number"
            min="0"
            step="any"
            value={value ?? ""}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="w-full min-w-[95px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
        />
    );
}

function TextInput({
    value,
    onChange,
    placeholder = "Enter value",
    className = "",
}) {
    return (
        <input
            type="text"
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${className}`}
        />
    );
}

function SectionHeading({ icon: Icon, title, description, count }) {
    return (
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center">
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Icon className="text-lg" />
                </div>

                <div>
                    <h3 className="text-lg font-bold text-slate-800">
                        {title}
                    </h3>

                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                        {description}
                    </p>
                </div>
            </div>

            {count !== undefined && (
                <span className="w-fit rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    {count}
                </span>
            )}
        </div>
    );
}

function SummaryCard({ label, value, description, color = "slate" }) {
    const colors = {
        slate: "border-slate-200 bg-white text-slate-800",
        green: "border-emerald-200 bg-emerald-50 text-emerald-800",
        red: "border-red-100 bg-red-50 text-red-700",
        blue: "border-blue-100 bg-blue-50 text-blue-800",
    };

    return (
        <div className={`rounded-xl border p-4 shadow-sm ${colors[color]}`}>
            <p className="text-xs font-medium opacity-75">{label}</p>
            <h4 className="mt-2 text-xl font-bold tabular-nums">{value}</h4>

            {description && (
                <p className="mt-1 text-[10px] opacity-70">{description}</p>
            )}
        </div>
    );
}

function EmptyState({ title, description, action, onAction }) {
    return (
        <div className="px-5 py-14 text-center">
            <FaSeedling className="mx-auto text-3xl text-slate-300" />

            <h4 className="mt-3 text-sm font-bold text-slate-600">
                {title}
            </h4>

            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
                {description}
            </p>

            {action && (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-4 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-800"
                >
                    {action}
                </button>
            )}
        </div>
    );
}

function CalculationGuide({ title, children }) {
    return (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
                <FaInfoCircle className="mt-0.5 shrink-0 text-blue-600" />

                <div className="text-xs leading-5 text-blue-700">
                    <h4 className="font-bold text-blue-800">{title}</h4>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                        {children}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function ModalSOH({
    onClose = () => {},
    onSave,
    saving = false,
    readOnly = false,
    initialData = null,
    onEdit = null,
}) {
    // The parent gives this component a new key for each View/Edit session.
    // This preserves saved inputs and keeps unsaved edits out of view mode.
    const [activeTab, setActiveTab] = useState("production");
    const [barangays, setBarangays] = useState(() =>
        (Array.isArray(initialData?.barangays) ? initialData.barangays : []).map((barangay) => ({
            ...barangay,
            id: barangay.id ?? createId(),
            expanded: barangay.expanded ?? true,
            crops: (Array.isArray(barangay.crops) ? barangay.crops : []).map((crop) => ({
                ...crop,
                id: crop.id ?? createId(),
            })),
        }))
    );
    const [haulingData, setHaulingData] = useState(() => initialData?.haulingData ?? {});
    const [productionData, setProductionData] = useState(() => initialData?.productionData ?? {});

    const tabs = [
        {
            id: "production",
            label: "Existing Agricultural Production Area",
            shortLabel: "Production Area",
            icon: FaChartBar,
        },
        {
            id: "tab2",
            label: "Output Hauling Cost",
            shortLabel: "Output Hauling",
            icon: FaTruck,
        },
        {
            id: "tab3",
            label: "Production and Output Marketed",
            shortLabel: "Output Marketed",
            icon: FaBox,
        },
        {
            id: "tab4",
            label: "20-Year Hauling Benefits",
            shortLabel: "20-Year Benefits",
            icon: FaChartLine,
        },
    ];

    // ==================================================
    // TAB 1 - BARANGAY FUNCTIONS
    // ==================================================

    const addBarangay = () => {
        setBarangays((previous) => [
            ...previous,
            createBarangay(),
        ]);
    };

    const updateBarangay = (id, value) => {
        setBarangays((previous) =>
            previous.map((item) =>
                item.id === id ? { ...item, barangay: value } : item
            )
        );
    };

    const removeBarangay = (id) => {
        setBarangays((previous) =>
            previous.filter((item) => item.id !== id)
        );
    };

    const toggleBarangay = (id) => {
        setBarangays((previous) =>
            previous.map((item) =>
                item.id === id
                    ? { ...item, expanded: !item.expanded }
                    : item
            )
        );
    };
    const addCrop = (barangayId) => {
        setBarangays((previous) =>
            previous.map((item) =>
                item.id === barangayId
                    ? {
                          ...item,
                          crops: [...item.crops, createCrop()],
                          expanded: true,
                      }
                    : item
            )
        );
    };

    const updateCrop = (barangayId, cropId, field, value) => {
        setBarangays((previous) =>
            previous.map((barangay) =>
                barangay.id === barangayId
                    ? {
                          ...barangay,
                          crops: barangay.crops.map((crop) =>
                              crop.id === cropId
                                  ? { ...crop, [field]: value }
                                  : crop
                          ),
                      }
                    : barangay
            )
        );
    };

    const removeCrop = (barangayId, cropId) => {
        setBarangays((previous) =>
            previous.map((barangay) =>
                barangay.id === barangayId
                    ? {
                          ...barangay,
                          crops: barangay.crops.filter(
                              (crop) => crop.id !== cropId
                          ),
                      }
                    : barangay
            )
        );
    };
    const summary = useMemo(() => {
        const allCrops = barangays.flatMap(
            (barangay) => barangay.crops
        );

        const existingArea = allCrops.reduce(
            (total, crop) => total + toNumber(crop.existing_area),
            0
        );

        const intercroppedArea = allCrops.reduce(
            (total, crop) => total + toNumber(crop.area_intercropped),
            0
        );

        return {
            barangays: barangays.length,
            crops: allCrops.length,
            existingArea,
            intercroppedArea,
            totalArea: existingArea + intercroppedArea,
        };
    }, [barangays]);

    const cropSummary = useMemo(() => {
        const grouped = {};

        barangays.forEach((barangay) => {
            barangay.crops.forEach((crop) => {
                const name = crop.crop.trim();
                if (!name) return;

                const key = getCropKey(name);

                if (!grouped[key]) {
                    grouped[key] = {
                        crop: name,
                        totalIntercroppedArea: 0,
                        totalProductionArea: 0,
                    };
                }

                const existing = toNumber(crop.existing_area);
                const intercropped = toNumber(crop.area_intercropped);

                grouped[key].totalIntercroppedArea += intercropped;
                grouped[key].totalProductionArea += existing + intercropped;
            });
        });

        return Object.values(grouped).sort((a, b) =>
            a.crop.localeCompare(b.crop)
        );
    }, [barangays]);

    const latestBarangay = barangays[barangays.length - 1];

    const cropRows = useMemo(
        () =>
            cropSummary.map((item) => ({
                crop: item.crop,
                key: getCropKey(item.crop),
                productionArea: item.totalProductionArea,
            })),
        [cropSummary]
    );

    const getHaulingRow = (key) =>
        haulingData[key] || createHaulingData();

    const updateHaulingField = (key, field, value) => {
        setHaulingData((previous) => {
            const current = previous[key] || createHaulingData();

            return {
                ...previous,
                [key]: {
                    ...current,
                    [field]: value,
                },
            };
        });
    };

    const updateVehicleCost = (key, category, vehicle, value) => {
        setHaulingData((previous) => {
            const current = previous[key] || createHaulingData();

            return {
                ...previous,
                [key]: {
                    ...current,
                    [category]: {
                        ...current[category],
                        [vehicle]: value,
                    },
                },
            };
        });
    };

    // Ignore blank inputs when calculating average.
    const getEnteredAverage = (vehicleValues) => {
        const enteredValues = Object.values(vehicleValues)
            .filter((value) => value !== "" && value !== null && value !== undefined)
            .map(toNumber);

        if (enteredValues.length === 0) return 0;

        return (
            enteredValues.reduce((total, value) => total + value, 0) /
            enteredValues.length
        );
    };

    const getHaulingCalculations = (key) => {
        const row = getHaulingRow(key);

        const manualWOP = toNumber(row.cost_wop_b);
        const manualWP = toNumber(row.cost_wp_c);

        const wopAverage = getEnteredAverage(row.motorized_wop);
        const wpAverage = getEnteredAverage(row.motorized_wp_c);

        const manualSaving = manualWOP - manualWP;

        // Retained from the original supplied formula.
        const motorizedSaving = wopAverage - wpAverage;

        const totalWOPSingle = wopAverage;
        const totalWPSingle = wpAverage;

        const totalWOPDouble = totalWOPSingle + manualWOP;
        const totalWPDouble = totalWPSingle + manualWP;

        return {
            manualWOP,
            manualWP,
            manualSaving,
            wopAverage,
            wpAverage,
            motorizedSaving,
            totalWOPSingle,
            totalWPSingle,
            totalWOPDouble,
            totalWPDouble,
        };
    };

    const haulingSummary = useMemo(() => {
        return cropRows.reduce(
            (totals, item) => {
                const result = getHaulingCalculations(item.key);

                totals.manualSaving += result.manualSaving;
                totals.motorizedSaving += result.motorizedSaving;
                totals.totalWOP += result.totalWOPDouble;
                totals.totalWP += result.totalWPDouble;

                return totals;
            },
            {
                manualSaving: 0,
                motorizedSaving: 0,
                totalWOP: 0,
                totalWP: 0,
            }
        );
    }, [cropRows, haulingData]);

    // ==================================================
    // TAB 3 - PRODUCTION AND OUTPUT MARKETED
    // ==================================================

    const getProductionRow = (key) =>
        productionData[key] || createProductionData();

    const updateProductionField = (key, field, value) => {
        setProductionData((previous) => {
            const current = previous[key] || createProductionData();

            return {
                ...previous,
                [key]: {
                    ...current,
                    [field]: value,
                },
            };
        });
    };

    const getProductionCalculations = (key) => {
        const row = getProductionRow(key);

        const kgPerPackaging = toNumber(row.kg_per_packaging);
        const totalProduction = toNumber(row.total_packages);
        const croppingPerYear = toNumber(row.cropping_per_year);

        const percentageMarket = Math.min(
            100,
            Math.max(0, toNumber(row.percentage_market))
        );

        // Production per Cropping = Kg per Packaging × Total Production.
        const productionPerCropping =
            kgPerPackaging * totalProduction;

        // Correct formula requested:
        // Total Production per Year = Total Production × Cropping per Year.
        const totalProductionPerYear =
            totalProduction * croppingPerYear;

        // Total Output Marketed = Annual Production × Market Percentage.
        const totalOutputMarketed =
            totalProductionPerYear * (percentageMarket / 100);

        // This result is already in packages/sacks.
        const totalPackagesMarketed = totalOutputMarketed;

        return {
            productionPerCropping,
            totalProductionPerYear,
            totalOutputMarketed,
            totalPackagesMarketed,
            percentageMarket,
        };
    };

    const productionSummary = useMemo(() => {
        return cropRows.reduce(
            (totals, item) => {
                const result = getProductionCalculations(item.key);

                totals.productionPerCropping += result.productionPerCropping;
                totals.totalProductionPerYear += result.totalProductionPerYear;
                totals.totalOutputMarketed += result.totalOutputMarketed;
                totals.totalPackagesMarketed += result.totalPackagesMarketed;

                return totals;
            },
            {
                productionPerCropping: 0,
                totalProductionPerYear: 0,
                totalOutputMarketed: 0,
                totalPackagesMarketed: 0,
            }
        );
    }, [cropRows, productionData]);

    // ==================================================
    // TAB 4 - 20 YEAR BENEFITS
    // ==================================================

    // Excel Section B: Tab 3 annual production is the yield per hectare.
    // Multiply by the planted area from Tab 1 before applying market share.
    const getBenefitCalculations = (key) => {
        const hauling = getHaulingCalculations(key);
        const production = getProductionCalculations(key);
        const areaPlanted = cropRows.find((item) => item.key === key)?.productionArea ?? 0;
        const productionPerHectare = production.totalProductionPerYear;
        const totalOutput = productionPerHectare * areaPlanted;
        const marketedPackages = totalOutput * (production.percentageMarket / 100);

        const currentHaulingCost = hauling.totalWOPDouble;
        const estimatedHaulingCost = hauling.totalWPDouble;
        const savingPerPackage = currentHaulingCost - estimatedHaulingCost;

        const annualCurrentCost = currentHaulingCost * marketedPackages;
        const annualEstimatedCost = estimatedHaulingCost * marketedPackages;
        const annualHaulingSaving = savingPerPackage * marketedPackages;

        return {
            currentHaulingCost,
            estimatedHaulingCost,
            savingPerPackage,
            percentageMarket: production.percentageMarket,
            marketedPackages,
            productionPerHectare,
            areaPlanted,
            totalOutput,
            annualCurrentCost,
            annualEstimatedCost,
            annualHaulingSaving,
        };
    };

const handleSaveSOH = () => {
    if (readOnly || saving || typeof onSave !== "function") {
        return;
    }

    const payload = {
        benefit_category: "Saving Output Hauling",

        // TAB 1
        barangays,

        // TAB 2
        haulingData,

        // TAB 3
        productionData,

        // TAB 4
        years: YEARS,

        // Calculated annual benefits
        annual_savings: benefitSummary.saving,
        annual_benefit: benefitSummary.saving,
        yearly_benefits: YEARS.map((year) => ({ year, annual_savings: benefitSummary.saving })),

        summary: {
            totalBarangays: summary.barangays,
            totalCrops: summary.crops,
            totalProductionArea: summary.totalArea,

            manualSaving: haulingSummary.manualSaving,
            motorizedSaving: haulingSummary.motorizedSaving,

            totalHaulingCostWOP: haulingSummary.totalWOP,
            totalHaulingCostWP: haulingSummary.totalWP,

            annualCurrentCost: benefitSummary.currentCost,
            annualEstimatedCost: benefitSummary.estimatedCost,
            annualHaulingSaving: benefitSummary.saving,
        },

        // Calculated crop details for reporting.
        cropCalculations: cropRows.map((item) => ({
            crop: item.crop,
            cropKey: item.key,

            productionArea: item.productionArea,

            hauling: getHaulingCalculations(item.key),

            production: getProductionCalculations(item.key),

            benefits: getBenefitCalculations(item.key),
        })),
    };

    onSave(payload);
};
    const benefitSummary = useMemo(() => {
        return cropRows.reduce(
            (totals, item) => {
                const result = getBenefitCalculations(item.key);

                totals.currentCost += result.annualCurrentCost;
                totals.estimatedCost += result.annualEstimatedCost;
                totals.saving += result.annualHaulingSaving;

                return totals;
            },
            {
                currentCost: 0,
                estimatedCost: 0,
                saving: 0,
            }
        );
    }, [cropRows, haulingData, productionData]);

    // ==================================================
    // NAVIGATION
    // ==================================================

    const currentTabIndex = tabs.findIndex(
        (tab) => tab.id === activeTab
    );

    const goToPreviousTab = () => {
        if (currentTabIndex > 0) {
            setActiveTab(tabs[currentTabIndex - 1].id);
        }
    };

    const goToNextTab = () => {
        if (currentTabIndex < tabs.length - 1) {
            setActiveTab(tabs[currentTabIndex + 1].id);
        }
    };

    // ==================================================
    // RENDER
    // ==================================================

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-5">
            <div className="flex max-h-[96vh] w-full max-w-[1700px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

                {/* HEADER */}
                <header className="relative shrink-0 overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-700 px-5 py-5 text-white sm:px-8">
                    <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-white/5" />

                    <div className="relative flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                                <FaTruck className="text-2xl" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-xl font-bold sm:text-2xl">
                                        Saving Output Hauling
                                    </h2>

                                    <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-2.5 py-1 text-[10px] font-bold text-emerald-100">
                                        {readOnly ? "VIEW ONLY" : initialData ? "EDIT SOH" : "SOH"}
                                    </span>
                                </div>

                                <p className="mt-1 text-xs leading-5 text-emerald-100 sm:text-sm">
                                    Agricultural production, output hauling,
                                    and 20-year economic benefit analysis.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close modal"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition hover:bg-white/15"
                        >
                            <FaTimes className="text-lg" />
                        </button>
                    </div>
                </header>

                {/* TAB NAVIGATION */}
                <div className="shrink-0 border-b border-slate-200 bg-white px-4 pt-4 sm:px-7">
                    <div className="flex gap-2 overflow-x-auto pb-3">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold transition sm:text-sm ${
                                        active
                                            ? "border-emerald-700 bg-emerald-700 text-white shadow-md"
                                            : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                                    }`}
                                >
                                    <Icon />
                                    {tab.shortLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Same original worksheet tables in all modes. Only inputs are disabled in View. */}
                <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-7">
                    <fieldset disabled={readOnly || saving} className="min-w-0 border-0 p-0">

                    {/* ==================================================
                        TAB 1 - PRODUCTION AREA
                    ================================================== */}

                    {activeTab === "production" && (
                        <div className="space-y-7">
                            <SectionHeading
                                icon={FaChartBar}
                                title="Existing Agricultural Production Area"
                                description="Record agricultural production areas for each barangay, including crops, existing areas, and intercropped commodities."
                            />

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={addBarangay}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                                >
                                    <FaMapMarkerAlt />
                                    Add Barangay
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        latestBarangay
                                            ? addCrop(latestBarangay.id)
                                            : addBarangay()
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                                >
                                    <FaPlus />
                                    Add Crops
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <SummaryCard
                                    label="Total Barangays"
                                    value={summary.barangays}
                                />
                                <SummaryCard
                                    label="Total Crop Entries"
                                    value={summary.crops}
                                />
                                <SummaryCard
                                    label="Total Intercropped Area"
                                    value={formatNumber(summary.intercroppedArea)}
                                    description="Hectares (ha)"
                                    color="blue"
                                />
                                <SummaryCard
                                    label="Total Production Area"
                                    value={formatNumber(summary.totalArea)}
                                    description="Hectares (ha)"
                                    color="green"
                                />
                            </div>

                            {barangays.length === 0 ? (
                                <section className="rounded-2xl border-2 border-dashed border-slate-300 bg-white">
                                    <EmptyState
                                        title="No Barangay Added Yet"
                                        description="Add a barangay to start entering agricultural crops and their production area information."
                                        action="Add First Barangay"
                                        onAction={addBarangay}
                                    />
                                </section>
                            ) : (
                                <div className="space-y-5">
                                    {barangays.map((barangay, index) => (
                                        <section
                                            key={barangay.id}
                                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                        >
                                            <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-100/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-sm font-bold text-white">
                                                        {index + 1}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                            Barangay Name
                                                        </label>

                                                        <TextInput
                                                            value={barangay.barangay}
                                                            onChange={(value) =>
                                                                updateBarangay(barangay.id, value)
                                                            }
                                                            placeholder="Enter barangay name"
                                                            className="max-w-md"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">
                                                        {barangay.crops.length} Crop(s)
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() => toggleBarangay(barangay.id)}
                                                        className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-100"
                                                    >
                                                        {barangay.expanded ? <FaChevronUp /> : <FaChevronDown />}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeBarangay(barangay.id)}
                                                        className="rounded-lg border border-red-100 bg-white p-2.5 text-red-500 hover:bg-red-50"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>

                                            {barangay.expanded && (
                                                <div className="p-4 sm:p-5">
                                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-800">
                                                                Agricultural Crops
                                                            </h4>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Enter the production area details for each crop.
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => addCrop(barangay.id)}
                                                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                                                        >
                                                            <FaPlus />
                                                            Add Crop
                                                        </button>
                                                    </div>

                                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                                        <table className="w-full min-w-[1050px] border-collapse text-left">
                                                            <thead>
                                                                <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                                                    <th className="border-b px-3 py-4 text-center">#</th>
                                                                    <th className="border-b px-4 py-4">Crops</th>
                                                                    <th className="border-b px-4 py-4">Existing Agricultural Area (ha)</th>
                                                                    <th className="border-b px-4 py-4">Area Intercropped (ha)</th>
                                                                    <th className="border-b px-4 py-4">Intercropped Commodity</th>
                                                                    <th className="border-b px-4 py-4">Total Production Area (ha)</th>
                                                                    <th className="border-b px-3 py-4 text-center">Action</th>
                                                                </tr>
                                                            </thead>

                                                            <tbody>
                                                                {barangay.crops.map((crop, cropIndex) => {
                                                                    const total =
                                                                        toNumber(crop.existing_area) +
                                                                        toNumber(crop.area_intercropped);

                                                                    return (
                                                                        <tr
                                                                            key={crop.id}
                                                                            className="border-b border-slate-100 hover:bg-emerald-50/40"
                                                                        >
                                                                            <td className="px-3 py-4 text-center text-xs text-slate-400">
                                                                                {cropIndex + 1}
                                                                            </td>

                                                                            <td className="px-4 py-3">
                                                                                <TextInput
                                                                                    value={crop.crop}
                                                                                    onChange={(value) =>
                                                                                        updateCrop(
                                                                                            barangay.id,
                                                                                            crop.id,
                                                                                            "crop",
                                                                                            value
                                                                                        )
                                                                                    }
                                                                                    placeholder="Enter crop name"
                                                                                />
                                                                            </td>

                                                                            <td className="px-4 py-3">
                                                                                <NumberInput
                                                                                    value={crop.existing_area}
                                                                                    onChange={(value) =>
                                                                                        updateCrop(
                                                                                            barangay.id,
                                                                                            crop.id,
                                                                                            "existing_area",
                                                                                            value
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </td>

                                                                            <td className="px-4 py-3">
                                                                                <NumberInput
                                                                                    value={crop.area_intercropped}
                                                                                    onChange={(value) =>
                                                                                        updateCrop(
                                                                                            barangay.id,
                                                                                            crop.id,
                                                                                            "area_intercropped",
                                                                                            value
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </td>

                                                                            <td className="px-4 py-3">
                                                                                <TextInput
                                                                                    value={crop.intercropped_commodity}
                                                                                    onChange={(value) =>
                                                                                        updateCrop(
                                                                                            barangay.id,
                                                                                            crop.id,
                                                                                            "intercropped_commodity",
                                                                                            value
                                                                                        )
                                                                                    }
                                                                                    placeholder="Enter commodity"
                                                                                />
                                                                            </td>

                                                                            <td className="px-4 py-3">
                                                                                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800">
                                                                                    {formatNumber(total)}
                                                                                </div>
                                                                            </td>

                                                                            <td className="px-3 py-3 text-center">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        removeCrop(barangay.id, crop.id)
                                                                                    }
                                                                                    className="rounded-lg p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                                                >
                                                                                    <FaTrash />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </section>
                                    ))}
                                </div>
                            )}

                            {/* CROP SUMMARY */}
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                                            <FaTable />
                                        </div>

                                        <div>
                                            <h3 className="text-base font-bold text-slate-800">
                                                Agricultural Crops Summary
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Consolidated crop area from all barangays.
                                            </p>
                                        </div>
                                    </div>

                                    <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                                        {cropSummary.length} Crop Type(s)
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[650px] border-collapse text-left">
                                        <thead>
                                            <tr className="bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                                                <th className="px-5 py-4 text-center">#</th>
                                                <th className="px-5 py-4">Crops</th>
                                                <th className="px-5 py-4 text-right">Total Intercropped Area (ha)</th>
                                                <th className="px-5 py-4 text-right">Total Production Area (ha)</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {cropSummary.map((item, index) => (
                                                <tr
                                                    key={getCropKey(item.crop)}
                                                    className="border-b border-slate-100 hover:bg-emerald-50/40"
                                                >
                                                    <td className="px-5 py-4 text-center text-xs text-slate-400">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                                        {item.crop}
                                                    </td>
                                                    <td className="px-5 py-4 text-right text-sm tabular-nums text-slate-600">
                                                        {formatNumber(item.totalIntercroppedArea)}
                                                    </td>
                                                    <td className="px-5 py-4 text-right text-sm font-bold tabular-nums text-emerald-800">
                                                        {formatNumber(item.totalProductionArea)}
                                                    </td>
                                                </tr>
                                            ))}

                                            {cropSummary.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-5 py-10 text-center text-sm text-slate-400">
                                                        Add crop names above to generate the summary.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>

                                        {cropSummary.length > 0 && (
                                            <tfoot>
                                                <tr className="bg-emerald-50">
                                                    <td colSpan="2" className="px-5 py-4 text-right text-xs font-bold uppercase text-emerald-800">
                                                        Grand Total
                                                    </td>
                                                    <td className="px-5 py-4 text-right text-sm font-bold text-emerald-800">
                                                        {formatNumber(summary.intercroppedArea)}
                                                    </td>
                                                    <td className="px-5 py-4 text-right text-sm font-bold text-emerald-800">
                                                        {formatNumber(summary.totalArea)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </section>

                            <CalculationGuide title="Production Area Calculation Guide">
                                <li>
                                    Total Production Area = Existing Agricultural Area + Area Intercropped.
                                </li>
                                <li>
                                    Identical crop names are consolidated across barangays.
                                </li>
                            </CalculationGuide>
                        </div>
                    )}

                    {/* ==================================================
                        TAB 2 - OUTPUT HAULING
                    ================================================== */}

                    {activeTab === "tab2" && (
                        <div className="space-y-6">
                            <SectionHeading
                                icon={FaTruck}
                                title="Output Hauling Cost from Farm to Market"
                                description="Enter the manual animal hauling and motorized hauling costs. Crop names are automatically linked to Tab 1."
                                count={`${cropRows.length} Crop(s) Linked`}
                            />

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <SummaryCard
                                    label="Manual Animal Saving"
                                    value={formatNumber(haulingSummary.manualSaving)}
                                    color="green"
                                />
                                <SummaryCard
                                    label="Motorized Hauling Saving"
                                    value={formatNumber(haulingSummary.motorizedSaving)}
                                    color="green"
                                />
                                <SummaryCard
                                    label="Total Hauling Cost WOP"
                                    value={formatNumber(haulingSummary.totalWOP)}
                                    color="red"
                                />
                                <SummaryCard
                                    label="Total Hauling Cost WP"
                                    value={formatNumber(haulingSummary.totalWP)}
                                    color="green"
                                />
                            </div>

                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-200 p-5">
                                    <h4 className="font-bold text-slate-800">
                                        Crop Hauling Cost Inputs
                                    </h4>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Average values only include vehicle fields with entered values. Blank vehicle fields are excluded.
                                    </p>
                                </div>

                                {cropRows.length === 0 ? (
                                    <EmptyState
                                        title="No Crops Available"
                                        description="Add crop names in Tab 1 first. They will automatically appear here."
                                        action="Go to Production Area"
                                        onAction={() => setActiveTab("production")}
                                    />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1900px] border-collapse text-left">
                                            <thead>
                                                <tr className="bg-slate-800 text-[10px] font-bold uppercase text-white">
                                                    <th rowSpan="2" className="border border-slate-700 px-4 py-4">Crops</th>
                                                    <th rowSpan="2" className="border border-slate-700 px-4 py-4">Units</th>
                                                    <th colSpan="3" className="border border-slate-700 px-4 py-4 text-center">Manual Animal Hauling</th>
                                                    <th colSpan="5" className="border border-slate-700 px-4 py-4 text-center">Motorized Hauling - WOP</th>
                                                    <th colSpan="5" className="border border-slate-700 px-4 py-4 text-center">Motorized Hauling - WP</th>
                                                    <th rowSpan="2" className="border border-slate-700 px-4 py-4 text-center">Saving in Motorized Hauling Cost</th>
                                                    <th colSpan="4" className="border border-slate-700 px-4 py-4 text-center">Total Hauling Cost</th>
                                                </tr>

                                                <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                                                    <th className="border px-3 py-3 text-center">Cost WOP/b</th>
                                                    <th className="border px-3 py-3 text-center">Cost WP/c</th>
                                                    <th className="border px-3 py-3 text-center">Saving</th>

                                                    {VEHICLES.map((vehicle) => (
                                                        <th key={`wop-${vehicle.key}`} className="border px-3 py-3 text-center">
                                                            {vehicle.label}
                                                        </th>
                                                    ))}

                                                    <th className="border px-3 py-3 text-center">Average WOP</th>

                                                    {VEHICLES.map((vehicle) => (
                                                        <th key={`wp-${vehicle.key}`} className="border px-3 py-3 text-center">
                                                            {vehicle.label}
                                                        </th>
                                                    ))}

                                                    <th className="border px-3 py-3 text-center">Average WP/c</th>
                                                    <th className="border px-3 py-3 text-center">WOP Single</th>
                                                    <th className="border px-3 py-3 text-center">WP Single</th>
                                                    <th className="border px-3 py-3 text-center">WOP Double</th>
                                                    <th className="border px-3 py-3 text-center">WP Double</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {cropRows.map((item) => {
                                                    const row = getHaulingRow(item.key);
                                                    const result = getHaulingCalculations(item.key);

                                                    return (
                                                        <tr key={item.key} className="border-b border-slate-100 hover:bg-emerald-50/30">
                                                            <td className="border-b px-4 py-4 text-xs font-bold text-slate-700">
                                                                {item.crop}
                                                            </td>

                                                            <td className="border-b px-3 py-3">
                                                                <TextInput
                                                                    value={row.unit}
                                                                    onChange={(value) =>
                                                                        updateHaulingField(item.key, "unit", value)
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="border-b px-3 py-3">
                                                                <NumberInput
                                                                    value={row.cost_wop_b}
                                                                    onChange={(value) =>
                                                                        updateHaulingField(item.key, "cost_wop_b", value)
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="border-b px-3 py-3">
                                                                <NumberInput
                                                                    value={row.cost_wp_c}
                                                                    onChange={(value) =>
                                                                        updateHaulingField(item.key, "cost_wp_c", value)
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="border-b bg-emerald-50/50 px-3 py-3 text-right text-xs font-bold text-emerald-700">
                                                                {formatNumber(result.manualSaving)}
                                                            </td>

                                                            {VEHICLES.map((vehicle) => (
                                                                <td key={`wop-${item.key}-${vehicle.key}`} className="border-b px-3 py-3">
                                                                    <NumberInput
                                                                        value={row.motorized_wop[vehicle.key]}
                                                                        onChange={(value) =>
                                                                            updateVehicleCost(
                                                                                item.key,
                                                                                "motorized_wop",
                                                                                vehicle.key,
                                                                                value
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                            ))}

                                                            <td className="border-b bg-slate-50 px-3 py-3 text-right text-xs font-bold text-slate-700">
                                                                {formatNumber(result.wopAverage)}
                                                            </td>

                                                            {VEHICLES.map((vehicle) => (
                                                                <td key={`wp-${item.key}-${vehicle.key}`} className="border-b px-3 py-3">
                                                                    <NumberInput
                                                                        value={row.motorized_wp_c[vehicle.key]}
                                                                        onChange={(value) =>
                                                                            updateVehicleCost(
                                                                                item.key,
                                                                                "motorized_wp_c",
                                                                                vehicle.key,
                                                                                value
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                            ))}

                                                            <td className="border-b bg-slate-50 px-3 py-3 text-right text-xs font-bold text-slate-700">
                                                                {formatNumber(result.wpAverage)}
                                                            </td>

                                                            <td className="border-b bg-emerald-50 px-3 py-3 text-right text-xs font-bold text-emerald-800">
                                                                {formatNumber(result.motorizedSaving)}
                                                            </td>

                                                            <td className="border-b px-3 py-3 text-right text-xs font-semibold text-slate-700">
                                                                {formatNumber(result.totalWOPSingle)}
                                                            </td>

                                                            <td className="border-b px-3 py-3 text-right text-xs font-semibold text-slate-700">
                                                                {formatNumber(result.totalWPSingle)}
                                                            </td>

                                                            <td className="border-b bg-red-50/50 px-3 py-3 text-right text-xs font-bold text-red-700">
                                                                {formatNumber(result.totalWOPDouble)}
                                                            </td>

                                                            <td className="border-b bg-emerald-50/50 px-3 py-3 text-right text-xs font-bold text-emerald-800">
                                                                {formatNumber(result.totalWPDouble)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>

                                            <tfoot>
                                                <tr className="bg-slate-100">
                                                    <td colSpan="2" className="border px-4 py-4 text-xs font-bold uppercase text-slate-700">
                                                        Total
                                                    </td>
                                                    <td colSpan="3" className="border px-3 py-4 text-center text-xs font-bold text-slate-600">
                                                        {formatNumber(haulingSummary.manualSaving)} Saving
                                                    </td>
                                                    <td colSpan="5" className="border px-3 py-4 text-center text-xs font-bold text-slate-600">
                                                        WOP vehicle averages
                                                    </td>
                                                    <td colSpan="5" className="border px-3 py-4 text-center text-xs font-bold text-slate-600">
                                                        WP vehicle averages
                                                    </td>
                                                    <td className="border px-3 py-4 text-right text-xs font-bold text-emerald-800">
                                                        {formatNumber(haulingSummary.motorizedSaving)}
                                                    </td>
                                                    <td colSpan="4" className="border px-3 py-4 text-center text-xs font-bold text-slate-600">
                                                        WOP: {formatNumber(haulingSummary.totalWOP)} | WP: {formatNumber(haulingSummary.totalWP)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </section>

                            <CalculationGuide title="Output Hauling Calculation Guide">
                                <li>
                                    Average WOP = Sum of entered WOP vehicle values ÷ Number of entered WOP vehicles.
                                </li>
                                <li>
                                    Average WP/c = Sum of entered WP vehicle values ÷ Number of entered WP vehicles.
                                </li>
                                <li>
                                    Blank vehicle fields are excluded from the average.
                                </li>
                                <li>
                                    Motorized Saving = Average WOP − Average WP/c.
                                </li>
                                <li>
                                    WOP Double = WOP Single + Manual Cost WOP/b.
                                </li>
                                <li>
                                    WP Double = WP Single + Manual Cost WP/c.
                                </li>
                            </CalculationGuide>
                        </div>
                    )}

                    {/* ==================================================
                        TAB 3 - PRODUCTION PER CROPPING / OUTPUT MARKETED
                    ================================================== */}

                    {activeTab === "tab3" && (
                        <div className="space-y-6">
                            <SectionHeading
                                icon={FaBox}
                                title="Production per Cropping and Output Marketed"
                                description="Enter packaging information, total production, cropping frequency, and the percentage of annual harvest marketed. Crop names are linked automatically from Tab 1."
                                count={`${cropRows.length} Crop(s) Linked`}
                            />

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <SummaryCard
                                    label="Production per Cropping"
                                    value={`${formatNumber(productionSummary.productionPerCropping)} kg`}
                                    color="blue"
                                />
                                <SummaryCard
                                    label="Total Production per Year"
                                    value={formatNumber(productionSummary.totalProductionPerYear)}
                                />
                                <SummaryCard
                                    label="Total Output Marketed"
                                    value={formatNumber(productionSummary.totalOutputMarketed)}
                                    color="green"
                                />
                                <SummaryCard
                                    label="Marketed Packages"
                                    value={formatNumber(productionSummary.totalPackagesMarketed)}
                                    description="Packages / sacks"
                                    color="green"
                                />
                            </div>

                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-200 p-5">
                                    <h4 className="font-bold text-slate-800">
                                        Crop Production and Market Output Inputs
                                    </h4>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Enter the package weight, total production per cropping, number of croppings per year, and marketed percentage.
                                    </p>
                                </div>

                                {cropRows.length === 0 ? (
                                    <EmptyState
                                        title="No Crops Available"
                                        description="Add crop names in Tab 1 first. They will automatically appear in this table."
                                        action="Go to Production Area"
                                        onAction={() => setActiveTab("production")}
                                    />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1650px] border-collapse text-left">
                                            <thead>
                                                <tr className="bg-slate-800 text-[10px] font-bold uppercase text-white">
                                                    <th rowSpan="2" className="border border-slate-700 px-4 py-4">Crops</th>
                                                    <th rowSpan="2" className="border border-slate-700 px-4 py-4">Production per Cropping</th>
                                                    <th rowSpan="2" className="border border-slate-700 px-4 py-4">Unit</th>
                                                    <th colSpan="2" className="border border-slate-700 px-4 py-4 text-center">Packaging During Hauling</th>
                                                    <th rowSpan="2" className="border border-slate-700 px-4 py-4">Total Production</th>
                                                    <th rowSpan="2" className="border border-slate-700 px-4 py-4">No. of Cropping per Year</th>
                                                    <th rowSpan="2" className="border border-slate-700 px-4 py-4">Total Production per Year</th>
                                                    <th rowSpan="2" className="border border-slate-700 px-4 py-4">% of Output Market</th>
                                                    <th rowSpan="2" className="border border-slate-700 px-4 py-4">Total Output Marketed</th>
                                                </tr>

                                                <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                                                    <th className="border px-3 py-3">Packaging Type</th>
                                                    <th className="border px-3 py-3">Kg per Packaging</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {cropRows.map((item) => {
                                                    const row = getProductionRow(item.key);
                                                    const result = getProductionCalculations(item.key);

                                                    return (
                                                        <tr key={item.key} className="border-b border-slate-100 hover:bg-emerald-50/30">
                                                            <td className="border-b px-4 py-4 text-xs font-bold text-slate-700">
                                                                {item.crop}
                                                            </td>

                                                            <td className="border-b bg-blue-50/50 px-3 py-3 text-right text-xs font-bold text-blue-800">
                                                                {formatNumber(result.productionPerCropping)}
                                                            </td>

                                                            <td className="border-b px-3 py-3">
                                                                <TextInput
                                                                    value={row.unit}
                                                                    onChange={(value) =>
                                                                        updateProductionField(item.key, "unit", value)
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="border-b px-3 py-3">
                                                                <TextInput
                                                                    value={row.packaging}
                                                                    onChange={(value) =>
                                                                        updateProductionField(item.key, "packaging", value)
                                                                    }
                                                                    placeholder="Sack"
                                                                />
                                                            </td>

                                                            <td className="border-b px-3 py-3">
                                                                <NumberInput
                                                                    value={row.kg_per_packaging}
                                                                    onChange={(value) =>
                                                                        updateProductionField(item.key, "kg_per_packaging", value)
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="border-b px-3 py-3">
                                                                <NumberInput
                                                                    value={row.total_packages}
                                                                    onChange={(value) =>
                                                                        updateProductionField(item.key, "total_packages", value)
                                                                    }
                                                                    placeholder="Total production"
                                                                />
                                                            </td>

                                                            <td className="border-b px-3 py-3">
                                                                <NumberInput
                                                                    value={row.cropping_per_year}
                                                                    onChange={(value) =>
                                                                        updateProductionField(item.key, "cropping_per_year", value)
                                                                    }
                                                                    placeholder="Croppings"
                                                                />
                                                            </td>

                                                            <td className="border-b bg-slate-50 px-3 py-3 text-right text-xs font-bold text-slate-800">
                                                                {formatNumber(result.totalProductionPerYear)}
                                                            </td>

                                                            <td className="border-b px-3 py-3">
                                                                <NumberInput
                                                                    value={row.percentage_market}
                                                                    onChange={(value) =>
                                                                        updateProductionField(
                                                                            item.key,
                                                                            "percentage_market",
                                                                            value === ""
                                                                                ? ""
                                                                                : Math.min(
                                                                                      100,
                                                                                      Math.max(0, toNumber(value))
                                                                                  ).toString()
                                                                        )
                                                                    }
                                                                    placeholder="0 - 100"
                                                                />
                                                            </td>

                                                            <td className="border-b bg-emerald-50 px-3 py-3 text-right text-xs font-bold text-emerald-800">
                                                                {formatNumber(result.totalOutputMarketed)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>

                                            <tfoot>
                                                <tr className="bg-emerald-50">
                                                    <td className="px-4 py-4 text-xs font-bold uppercase text-emerald-800">
                                                        Total
                                                    </td>

                                                    <td className="px-3 py-4 text-right text-xs font-bold text-emerald-800">
                                                        {formatNumber(productionSummary.productionPerCropping)}
                                                    </td>

                                                    <td colSpan="4" />

                                                    <td />

                                                    <td className="px-3 py-4 text-right text-xs font-bold text-emerald-800">
                                                        {formatNumber(productionSummary.totalProductionPerYear)}
                                                    </td>

                                                    <td />

                                                    <td className="px-3 py-4 text-right text-xs font-bold text-emerald-800">
                                                        {formatNumber(productionSummary.totalOutputMarketed)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </section>

                            <CalculationGuide title="Production Calculation Guide">
                                <li>
                                    Production per Cropping = Kg per Packaging × Total Production.
                                </li>
                                <li>
                                    Total Production per Year = Total Production × No. of Cropping per Year.
                                </li>
                                <li>
                                    Total Output Marketed = Total Production per Year × (% of Output Market ÷ 100).
                                </li>
                                <li>
                                    Marketed Packages = Total Output Marketed. The result is already expressed in packages/sacks.
                                </li>
                                <li>
                                    Percentage of Output Market is limited to 0–100%.
                                </li>
                            </CalculationGuide>
                        </div>
                    )}

                                         {/* ==================================================
                         TAB 4 - EXCEL-STYLE 20-YEAR HAULING BENEFITS
                     ================================================== */}
                     {activeTab === "tab4" && (
                         <div className="space-y-6">
                             <SectionHeading
                                 icon={FaChartLine}
                                 title="Table 5a: Benefits - Savings in Output Hauling"
                                 description="Excel-style 20-year worksheet. Values are linked to Tabs 1–3. Years 2–20 carry forward Year 1 values because no annual growth assumptions were provided."
                                 count="Years 1–20"
                             />
                             <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                 <SummaryCard label="Year 1 Current Hauling Cost" value={`₱ ${formatNumber(benefitSummary.currentCost)}`} color="red" />
                                 <SummaryCard label="Year 1 Estimated Hauling Cost" value={`₱ ${formatNumber(benefitSummary.estimatedCost)}`} color="blue" />
                                 <SummaryCard label="Year 1 Total SOH Benefit" value={`₱ ${formatNumber(benefitSummary.saving)}`} color="green" />
                             </div>
                             {cropRows.length === 0 ? (
                                 <section className="rounded-2xl border border-slate-200 bg-white">
                                     <EmptyState title="No Crops Available" description="Enter crops in Tab 1, hauling costs in Tab 2, and marketed production in Tab 3." action="Go to Production Area" onAction={() => setActiveTab("production")} />
                                 </section>
                             ) : (
                                 <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                     <div className="border-b border-slate-200 p-5">
                                         <h4 className="font-bold text-slate-800">20-Year Savings in Output Hauling Worksheet</h4>
                                         <p className="mt-1 text-xs text-slate-500">Scroll horizontally to see Years 1–20. The Benefits and Unit columns remain visible.</p>
                                     </div>
                                     <div className="max-h-[65vh] overflow-auto">
                                         <table className="w-max min-w-full border-collapse text-xs tabular-nums">
                                             <thead className="sticky top-0 z-30">
                                                 <tr className="bg-slate-800 text-white">
                                                     <th className="sticky left-0 z-40 min-w-[340px] border border-slate-600 bg-slate-800 px-4 py-3 text-left">Benefits</th>
                                                     <th className="sticky left-[340px] z-40 min-w-[110px] border border-slate-600 bg-slate-800 px-3 py-3 text-left">Unit</th>
                                                     {YEARS.map((year) => <th key={year} className="min-w-[125px] border border-slate-600 px-3 py-3 text-right">{year}</th>)}
                                                 </tr>
                                             </thead>
                                             <tbody>
                                                 {(() => {
                                                     const tableRows = [];
                                                     const section = (label, key) => tableRows.push(<tr key={key} className="bg-emerald-100"><td colSpan={22} className="border border-emerald-200 px-4 py-3 text-sm font-bold uppercase text-emerald-900">{label}</td></tr>);
                                                     const line = (key, label, unit, value, kind = "normal") => {
                                                         const emphasized = kind === "total";
                                                         tableRows.push(
                                                             <tr key={key} className={emphasized ? "bg-emerald-50 font-bold text-emerald-900" : "hover:bg-slate-50"}>
                                                                 <td className={`sticky left-0 z-10 border border-slate-200 px-4 py-3 ${emphasized ? "bg-emerald-50" : "bg-white"}`}>{label}</td>
                                                                 <td className={`sticky left-[340px] z-10 border border-slate-200 px-3 py-3 ${emphasized ? "bg-emerald-50" : "bg-white"}`}>{unit}</td>
                                                                 {YEARS.map((year) => <td key={year} className="border border-slate-200 px-3 py-3 text-right">{kind === "percent" ? `${formatNumber(value)}%` : formatNumber(value)}</td>)}
                                                             </tr>
                                                         );
                                                     };
                                                     section("A. Hauling Cost by Commodity", "cost-heading");
                                                     cropRows.forEach((item) => {
                                                         const b = getBenefitCalculations(item.key);
                                                         const unit = `Php/${getHaulingRow(item.key).unit || getProductionRow(item.key).packaging || "unit"}`;
                                                         section(`Hauling Cost - ${item.crop}`, `cost-${item.key}`);
                                                         line(`current-${item.key}`, "Current hauling cost /b", unit, b.currentHaulingCost);
                                                         line(`estimated-${item.key}`, "Estimated hauling cost", unit, b.estimatedHaulingCost);
                                                         line(`saving-${item.key}`, "Hauling cost saving /c", unit, b.savingPerPackage, "total");
                                                     });
                                                     section("B. Agricultural Production and Marketed Output", "production-heading");
                                                     cropRows.forEach((item) => {
                                                         const b = getBenefitCalculations(item.key);
                                                         const unit = getProductionRow(item.key).packaging || getProductionRow(item.key).unit || "unit";
                                                         section(item.crop, `production-${item.key}`);
                                                         line(`yield-${item.key}`, "Average production per hectare per year", `${unit}/ha`, b.productionPerHectare);
                                                         line(`area-${item.key}`, "Area planted", "ha", b.areaPlanted);
                                                         line(`output-${item.key}`, "Total output", unit, b.totalOutput);
                                                         line(`market-${item.key}`, "% of harvest brought to provincial road market", "%", b.percentageMarket, "percent");
                                                         line(`volume-${item.key}`, "Total volume of harvest marketed", unit, b.marketedPackages);
                                                         line(`subtotal-${item.key}`, "Subtotal savings in hauling cost", "Php", b.annualHaulingSaving, "total");
                                                     });
                                                     line("grand-total", "TOTAL SAVINGS IN HAULING OUTPUT (ALL COMMODITIES)", "Php/year", benefitSummary.saving, "total");
                                                     return tableRows;
                                                 })()}
                                             </tbody>
                                         </table>
                                     </div>
                                 </section>
                             )}
                             <CalculationGuide title="Excel Formula Reference">
                                 <li>Hauling Cost Saving = Current Hauling Cost − Estimated Hauling Cost.</li>
                                 <li>Average Production per Hectare = Tab 3 annual production rate; Total Output = Production per Hectare × Area Planted from Tab 1.</li>
                                 <li>Marketed Output = Total Output × Marketed Percentage ÷ 100.</li>
                                 <li>Subtotal SOH = Marketed Output × Hauling Cost Saving per Unit.</li>
                                 <li>Grand Total = Sum of all commodity subtotals, including newly added crops.</li>
                                 <li>Year 1 total is the Annual Benefit saved to the database. No automatic inflation or growth is assumed.</li>
                             </CalculationGuide>
                         </div>
                     )}
</fieldset>
                </main>

                {/* FOOTER */}
                <footer className="flex shrink-0 flex-col-reverse items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:px-7">
                    <p className="text-xs text-slate-400">
                        Saving Output Hauling
                        <span className="mx-2">•</span>
                        {tabs.find((tab) => tab.id === activeTab)?.label}
                    </p>

                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        {activeTab !== "production" && (
                            <button
                                type="button"
                                onClick={goToPreviousTab}
                                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
                            >
                                Previous Tab
                            </button>
                        )}

                        {activeTab !== "tab4" && (
                            <button
                                type="button"
                                onClick={goToNextTab}
                                className="w-full rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:w-auto"
                            >
                                Next Tab
                            </button>
                        )}

                        {readOnly ? (
                            typeof onEdit === "function" && (
                                <button type="button" onClick={onEdit}
                                    className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 sm:w-auto">
                                    Edit SOH Data
                                </button>
                            )
                        ) : (
                            <button type="button" onClick={handleSaveSOH} disabled={saving}
                                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                                {saving ? "Saving..." : initialData ? "Update SOH Data" : "Save SOH Data"}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
                        >
                            Close
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}
