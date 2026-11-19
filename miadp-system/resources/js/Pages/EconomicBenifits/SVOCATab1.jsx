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
    { id: "public_motorcycle", categoryId: "motorcycle", label: "Motorcycle", group: "public", groupLabel: "Public Vehicle", rateKey: "motorcycle" },
    { id: "public_tricycle", categoryId: "tricycle", label: "Tricycle", group: "public", groupLabel: "Public Vehicle", rateKey: "tricycle" },
    { id: "public_other_truck", categoryId: "other_truck", label: "Other (Truck)", group: "public", groupLabel: "Public Vehicle", rateKey: "truck" },
    { id: "private_motorcycle", categoryId: "motorcycle", label: "Motorcycle", group: "private", groupLabel: "Private Vehicle", rateKey: "motorcycle" },
    { id: "private_service_vehicle", categoryId: "service_vehicle", label: "Service Vehicle (Car, Van, SUV etc.)", group: "private", groupLabel: "Private Vehicle", rateKey: "car_van" },
    { id: "private_pickup", categoryId: "pickup", label: "Pickup", group: "private", groupLabel: "Private Vehicle", rateKey: "car_van" },
    { id: "private_6wheeler", categoryId: "truck_6", label: "6-wheeler Truck", group: "private", groupLabel: "Private Vehicle", rateKey: "truck" },
    { id: "private_10wheeler", categoryId: "truck_10", label: "10-wheeler Truck", group: "private", groupLabel: "Private Vehicle", rateKey: "truck" },
];

const VEHICLE_CATEGORIES = [
    { id: "motorcycle", label: "Motorcycle", description: "Public and private motorcycles" },
    { id: "tricycle", label: "Tricycle", description: "Public tricycles" },
    { id: "other_truck", label: "Other (Truck)", description: "Public trucks" },
    { id: "service_vehicle", label: "Service Vehicle", description: "Car, van, SUV and similar" },
    { id: "pickup", label: "Pickup", description: "Private pickup vehicles" },
    { id: "truck_6", label: "6-wheeler Truck", description: "Private six-wheel trucks" },
    { id: "truck_10", label: "10-wheeler Truck", description: "Private ten-wheel trucks" },
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
    A: { car_van: 15.4748805764988, jeepney: 13.6195352894094, motorcycle: 2.85834595768313, tricycle: 5.27955826061313, bus: 30.0493019191788, truck: 22.8859761169011 },
    B: { car_van: 25.963524977696, jeepney: 24.9701277123053, motorcycle: 7.52445376277513, tricycle: 16.4273336580093, bus: 64.4050020479381, truck: 45.5771617161184 },
    C: { car_van: 17.9458097706375, jeepney: 16.313660022964, motorcycle: 3.34861854247779, tricycle: 5.61073079367953, bus: 38.350815452237, truck: 28.834725750091 },
    D: { car_van: 20.7496588569768, jeepney: 19.5857969720813, motorcycle: 3.96193250955682, tricycle: 7.01245863662057, bus: 50.5615073156771, truck: 35.9006562935267 },
    E: { car_van: 33.3660000637827, jeepney: 35.4350878591526, motorcycle: 8.01283340322695, tricycle: 17.0288926096802, bus: 97.5594939843133, truck: 60.745995853013 },
    F: { car_van: 71.9177912971014, jeepney: 70.9075892077518, motorcycle: 21.9486713599798, tricycle: 25.6206120707263, bus: 132.153197993593, truck: 62.1416807896956 },
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
        Object.keys(VOC_BASE_RATES.A).map((rateKey) => [
            rateKey,
            VOC_BASE_RATES[surface.existingCode][rateKey] -
                VOC_BASE_RATES.A[rateKey],
        ]),
    ),
}));

const getVehicleAssumptions = (vehicle) => ({
    tripsPerDay: vehicle.categoryId === "motorcycle" ? "2" : "1",
    operatingDays: ["motorcycle", "tricycle"].includes(vehicle.categoryId) ? "275" : "260",
});

const createTrafficData = () =>
    Object.fromEntries(
        VEHICLES.map((vehicle) => [
            vehicle.id,
            {
                [vehicle.group]: {
                    day1: "",
                    day2: "",
                    day3: "",
                    ...getVehicleAssumptions(vehicle),
                },
            },
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

/**
 * VOH.xlsx: Sheet1!E100:G108 (traffic survey and first benefit year).
 * F = E + (E * growthRate / tripsPerDay)
 * G = F * (1 + growthRate)
 * Subsequent benefit years = previous benefit year * (1 + growthRate).
 * For the survey base year, keep E as the unadjusted average.
 */
const projectTrafficCount = (average, growthRate, yearsAhead, tripsPerDay) => {
    if (yearsAhead <= 0) return average;
    if (tripsPerDay <= 0) return 0;
    const firstAdjusted = average + (average * growthRate) / tripsPerDay;
    return firstAdjusted * Math.pow(1 + growthRate, yearsAhead - 1);
};

const projectVOHBenefitYearTraffic = (average, growthRate, benefitYear, tripsPerDay) => {
    if (tripsPerDay <= 0) return 0;
    const firstAdjusted = average + (average * growthRate) / tripsPerDay;
    const firstBenefitYear = firstAdjusted * (1 + growthRate);
    return firstBenefitYear * Math.pow(1 + growthRate, benefitYear - 1);
};

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
    saving = false,
    readOnly = false,
}) {
    const [form, setForm] = useState(createForm);
    const [vocForm, setVocForm] = useState(createVOCData);
    const [errors, setErrors] = useState({});
    const [activeSection, setActiveSection] = useState("tab1");
    const [activeWorksheet, setActiveWorksheet] = useState(null);
    const [selectedVehicleIds, setSelectedVehicleIds] = useState(["motorcycle"]);
    const selectedVehicles = useMemo(
        () => VEHICLES.filter((vehicle) => selectedVehicleIds.includes(vehicle.categoryId)),
        [selectedVehicleIds],
    );

    const toggleVehicle = (vehicleId) => {
        setSelectedVehicleIds((current) =>
            current.includes(vehicleId)
                ? (current.length > 1 ? current.filter((id) => id !== vehicleId) : current)
                : [...current, vehicleId],
        );
    };

    useEffect(() => {
        if (!isOpen) return;

        const defaults = createForm();
        const savedForm = initialData ?? {};
        const savedTraffic = savedForm.traffic ?? {};

        const mergedTraffic = Object.fromEntries(
            VEHICLES.map((vehicle) => [
                vehicle.id,
                {
                    [vehicle.group]: {
                        ...defaults.traffic[vehicle.id][vehicle.group],
                        ...(savedTraffic[vehicle.id]?.[vehicle.group] ??
                            savedTraffic[vehicle.categoryId]?.[vehicle.group] ??
                            savedTraffic[vehicle.rateKey]?.[vehicle.group] ??
                            {}),
                    },
                },
            ]),
        );

        setForm({
            ...defaults,
            ...savedForm,
            traffic: mergedTraffic,
        });
        const savedVehicleIds = Array.isArray(savedForm.selectedVehicleIds)
            ? savedForm.selectedVehicleIds.filter((id) => VEHICLE_CATEGORIES.some((category) => category.id === id))
            : [];
        setSelectedVehicleIds(savedVehicleIds.length ? savedVehicleIds : ["motorcycle"]);

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
        const growthRate = Math.max(0, numberValue(form.trafficGrowthRate)) / 100;
        const yearDifference = Math.max(0, numberValue(form.inputYear) - numberValue(form.year1));

        const vehicleRows = selectedVehicles.map((vehicle) => {
            const entry = form.traffic?.[vehicle.id]?.[vehicle.group] ?? {};
            const day1 = positiveNumber(entry.day1);
            const day2 = positiveNumber(entry.day2);
            const day3 = positiveNumber(entry.day3);
            const average = (day1 + day2 + day3) / 3;
            const tripsPerDay = hasValue(entry.tripsPerDay) ? positiveNumber(entry.tripsPerDay) : null;
            const operatingDays = hasValue(entry.operatingDays) ? positiveNumber(entry.operatingDays) : null;
            const projectedAADT = projectTrafficCount(average, growthRate, yearDifference, tripsPerDay ?? 0);
            const annualizationComplete = tripsPerDay !== null && tripsPerDay > 0 && operatingDays !== null && operatingDays > 0;
            const annualTrips = annualizationComplete ? projectedAADT * tripsPerDay * operatingDays : 0;

            return {
                vehicleId: vehicle.id,
                categoryId: vehicle.categoryId,
                vehicle: vehicle.label,
                group: vehicle.group,
                groupLabel: vehicle.groupLabel,
                types: {
                    [vehicle.group]: {
                        day1, day2, day3, average, projectedAADT, tripsPerDay,
                        operatingDays, annualizationComplete, annualTrips,
                    },
                },
                combinedAADT: projectedAADT,
                combinedAnnualTrips: annualTrips,
            };
        });

        const totals = Object.fromEntries(VEHICLE_TYPES.map((type) => [
            type.id,
            vehicleRows.filter((row) => row.group === type.id)
                .reduce((sum, row) => sum + row.types[type.id].annualTrips, 0),
        ]));
        const aadtTotals = Object.fromEntries(VEHICLE_TYPES.map((type) => [
            type.id,
            vehicleRows.filter((row) => row.group === type.id)
                .reduce((sum, row) => sum + row.types[type.id].projectedAADT, 0),
        ]));
        const annualizationInputsComplete = vehicleRows.every((row) =>
            row.types[row.group].annualizationComplete
        );

        return {
            vehicleRows, totals, aadtTotals,
            grandTotal: totals.public + totals.private,
            combinedAADT: aadtTotals.public + aadtTotals.private,
            annualizationInputsComplete,
        };
    }, [form, selectedVehicles]);

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

            const vehicleResults = selectedVehicles.map((vehicle) => {
                const trafficRow = trafficCalculations.vehicleRows.find(
                    (row) => row.vehicleId === vehicle.id,
                );

                const groupedTraffic = trafficRow?.types[vehicle.group];
                const publicAnnualTrips = vehicle.group === "public"
                    ? (groupedTraffic?.annualTrips ?? 0)
                    : 0;
                const privateAnnualTrips = vehicle.group === "private"
                    ? (groupedTraffic?.annualTrips ?? 0)
                    : 0;
                const annualTraffic = publicAnnualTrips + privateAnnualTrips;
                const incrementalRate = surface.rates[vehicle.rateKey];

                const annualSavings =
                    incrementalRate * annualTraffic * roadLength;

                return {
                    vehicleId: vehicle.id,
                    categoryId: vehicle.categoryId,
                    group: vehicle.group,
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

        const savingsByVehicle = selectedVehicles.map((vehicle) => ({
            ...vehicle,
            total: results.reduce((sum, surface) => {
                const row = surface.vehicleResults.find(
                    (item) => item.vehicleId === vehicle.id,
                );

                return sum + (row?.annualSavings ?? 0);
            }, 0),
        }));

        // VOH.xlsx rows 172–178: weighted incremental VOC per vehicle.
        // Weight = road-condition length / total road length.
        // Sum(weight * (existing VOC - good paved VOC)) across all five conditions.
        // Weighted rate * total length is algebraically equal to the sum of
        // each road-condition difference * its own length.
        const weightedVOCByVehicle = selectedVehicles.map((vehicle) => {
            const components = results.map((surface) => ({
                surfaceId: surface.id,
                code: surface.code,
                share: totalRoadLength > 0 ? surface.roadLength / totalRoadLength : 0,
                incrementalRate: surface.rates[vehicle.rateKey],
                weightedRate: totalRoadLength > 0
                    ? (surface.roadLength / totalRoadLength) * surface.rates[vehicle.rateKey]
                    : 0,
            }));
            const trafficRow = trafficCalculations.vehicleRows.find((row) => row.vehicleId === vehicle.id);
            const weightedIncrementalVOC = components.reduce((sum, item) => sum + item.weightedRate, 0);
            return {
                vehicleId: vehicle.id,
                vehicle: vehicle.label,
                group: vehicle.group,
                components,
                weightedIncrementalVOC,
                annualTrips: trafficRow?.combinedAnnualTrips ?? 0,
                annualSavings: weightedIncrementalVOC * (trafficRow?.combinedAnnualTrips ?? 0) * totalRoadLength,
            };
        });
        const weightedAnnualSavings = weightedVOCByVehicle.reduce((sum, row) => sum + row.annualSavings, 0);

        return {
            results,
            weightedVOCByVehicle,
            weightedAnnualSavings,
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
    }, [vocForm, trafficCalculations, selectedVehicles]);

    /*
     * Tab 3 uses ONE consolidated road segment, not five copies of 7.90 km.
     * Excel E178 / C14: weighted VOC = Σ[(surface length / total length)
     *                                  × (existing VOC − good paved VOC)].
     * The 7.90 km example produces a motorcycle VOC difference ≈ 9.64
     * when Tab 2 lengths are 0, 2, 1, 1.4, and 3.5 km respectively.
     */
    const projectionResults = useMemo(() => {
        const growthRate = Math.max(0, numberValue(form.trafficGrowthRate)) / 100;
        const years = Array.from({ length: 20 }, (_, index) => index + 1);
        const roadLength = roadSurfaceResults.totalRoadLength;
        const weightedRateByVehicle = new Map(
            roadSurfaceResults.weightedVOCByVehicle.map((item) => [
                item.vehicleId,
                item.weightedIncrementalVOC,
            ]),
        );

        const types = {};
        VEHICLE_TYPES.forEach((type) => {
            const rows = selectedVehicles
                .filter((vehicle) => vehicle.group === type.id)
                .map((vehicle) => {
                    const traffic = form.traffic?.[vehicle.id]?.[vehicle.group] ?? {};
                    const survey = [traffic.day1, traffic.day2, traffic.day3].map(positiveNumber);
                    const baseAADT = survey.reduce((sum, value) => sum + value, 0) / 3;
                    const tripsPerDay = positiveNumber(traffic.tripsPerDay);
                    const operatingDays = positiveNumber(traffic.operatingDays);
                    const incrementalRate = weightedRateByVehicle.get(vehicle.id) ?? 0;

                    const annuals = years.map((year) => {
                        const projectedAADT = projectVOHBenefitYearTraffic(
                            baseAADT, growthRate, year, tripsPerDay,
                        );
                        const annualTrips = projectedAADT * tripsPerDay * operatingDays;
                        return {
                            year,
                            projectedAADT,
                            annualTrips,
                            savings: incrementalRate * annualTrips * roadLength,
                        };
                    });

                    return {
                        vehicleId: vehicle.id,
                        categoryId: vehicle.categoryId,
                        vehicle: vehicle.label,
                        group: vehicle.group,
                        baseAADT,
                        tripsPerDay,
                        operatingDays,
                        incrementalRate,
                        roadLength,
                        annuals,
                        total: annuals.reduce((sum, item) => sum + item.savings, 0),
                    };
                });

            const yearlyTotals = years.map((year, index) => ({
                year,
                savings: rows.reduce((sum, row) => sum + row.annuals[index].savings, 0),
                annualTrips: rows.reduce((sum, row) => sum + row.annuals[index].annualTrips, 0),
            }));
            types[type.id] = {
                rows,
                yearlyTotals,
                total: yearlyTotals.reduce((sum, item) => sum + item.savings, 0),
            };
        });

        // One combined workbook worksheet; the road length is counted only once.
        const surfaces = [{
            id: "weighted-total",
            code: "VOH",
            label: "Consolidated Weighted VOC Savings",
            roadLength,
            types,
            yearlyTotals: years.map((year, index) => ({
                year,
                savings: VEHICLE_TYPES.reduce(
                    (sum, type) => sum + types[type.id].yearlyTotals[index].savings, 0,
                ),
            })),
        }];

        // Laravel expects five road-surface projections. Save each condition
        // with its ACTUAL Tab 2 length, so their sum equals the consolidated
        // weighted calculation without multiplying the 7.90 km five times.
        const roadSurfaceProjections = ROAD_SURFACES.map((surface) => {
            const actualLength = positiveNumber(vocForm.roadLengths[surface.id]);
            const surfaceTypes = {};
            VEHICLE_TYPES.forEach((type) => {
                const rows = types[type.id].rows.map((combinedRow) => {
                    const vehicle = VEHICLES.find((item) => item.id === combinedRow.vehicleId);
                    const incrementalRate = surface.rates[vehicle.rateKey];
                    const annuals = combinedRow.annuals.map((annual) => ({
                        year: annual.year,
                        projectedAADT: annual.projectedAADT,
                        annualTrips: annual.annualTrips,
                        savings: incrementalRate * annual.annualTrips * actualLength,
                    }));
                    return {
                        ...combinedRow,
                        incrementalRate,
                        roadLength: actualLength,
                        annuals,
                        total: annuals.reduce((sum, annual) => sum + annual.savings, 0),
                    };
                });
                const yearlyTotals = years.map((year, index) => ({
                    year,
                    savings: rows.reduce((sum, row) => sum + row.annuals[index].savings, 0),
                    annualTrips: rows.reduce((sum, row) => sum + row.annuals[index].annualTrips, 0),
                }));
                surfaceTypes[type.id] = {
                    rows,
                    yearlyTotals,
                    total: yearlyTotals.reduce((sum, item) => sum + item.savings, 0),
                };
            });
            return {
                id: surface.id,
                code: surface.code,
                label: surface.label,
                formula: surface.formula,
                roadLength: actualLength,
                types: surfaceTypes,
                yearlyTotals: years.map((year, index) => ({
                    year,
                    savings: VEHICLE_TYPES.reduce(
                        (sum, type) => sum + surfaceTypes[type.id].yearlyTotals[index].savings,
                        0,
                    ),
                })),
            };
        });

        const yearlyTotals = years.map((year, index) => ({
            year,
            public: types.public.yearlyTotals[index].savings,
            private: types.private.yearlyTotals[index].savings,
            total: surfaces[0].yearlyTotals[index].savings,
        }));

        return {
            years,
            surfaces,
            roadSurfaceProjections,
            yearlyTotals,
            totalRoadLength: roadLength,
            weightedVOCByVehicle: roadSurfaceResults.weightedVOCByVehicle,
            grandTotal: yearlyTotals.reduce((sum, item) => sum + item.total, 0),
            totalYear1: yearlyTotals[0]?.total ?? 0,
            totalYear10: yearlyTotals[9]?.total ?? 0,
            totalYear20: yearlyTotals[19]?.total ?? 0,
            firstTenYearTotal: yearlyTotals.slice(0, 10).reduce((sum, item) => sum + item.total, 0),
        };
    }, [form, selectedVehicles, roadSurfaceResults]);

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

        selectedVehicles.forEach((vehicle) => {
            const type = { id: vehicle.group };
                const entry = form.traffic[vehicle.id][vehicle.group];

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
        if (saving || readOnly) return;

        if (!validateForm()) {
            setActiveSection("tab1");
            return;
        }

        const tab1Payload = {
            ...form,
            selectedVehicleIds,
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
            weightedVOCByVehicle: roadSurfaceResults.weightedVOCByVehicle,
            weightedAnnualSavings: roadSurfaceResults.weightedAnnualSavings,
            totalAnnualVOCSavings: roadSurfaceResults.totalSavings,
            pricesAdjustedAsOf: 2022,
            calculationMethod:
                "Incremental VOC rate × projected AADT × trips per day × operating days per year × actual road length",
        };

      const tab3Payload = {
    projectionPeriod: 20,

    totalRoadLength: projectionResults.totalRoadLength,

    weightedVOCByVehicle: projectionResults.weightedVOCByVehicle,

    trafficGrowthRate: numberValue(form.trafficGrowthRate),

    // Years 1–20
    years: Array.from({ length: 20 }, (_, index) => index + 1),

    // Complete projections per road surface
    roadSurfaceProjections: projectionResults.roadSurfaceProjections,

    // Annual savings for every year
    yearlyTotals: projectionResults.yearlyTotals,

    // Explicit year-by-year records for database storage
    yearlySavings: projectionResults.yearlyTotals.map((item) => ({
        year: item.year,
        public: Number(item.public ?? 0),
        private: Number(item.private ?? 0),
        total: Number(item.total ?? 0),
    })),

    totalYear1VOCSavings: projectionResults.totalYear1,
    totalTenYearVOCSavings: projectionResults.firstTenYearTotal,
    totalTwentyYearVOCSavings: projectionResults.grandTotal,

    calculationMethod:
        "Year 1: adjusted survey traffic × (1 + growth); Years 2–20: compound growth; savings = projected traffic × trips/day × operating days × weighted incremental VOC × total road length",
};

        onSave?.({
            ...tab1Payload,
            benefitId: "b1",
            benefitName: "Vehicle Operating Cost Savings",
            worksheet: "Traffic Survey and VOC Savings",
            tab2: tab2Payload,
            tab3: tab3Payload,
            // Annual Benefit in the database must use Tab 3, Year 1 TOTAL VOC SAVINGS.
            // Keep the existing key for compatibility with the parent Save handler.
            combinedAnnualBenefit: projectionResults.totalYear1,
            annualBenefit: projectionResults.totalYear1,
            annualSavings: projectionResults.totalYear1,
            annual_savings: Math.round((projectionResults.totalYear1 + Number.EPSILON) * 100) / 100,
            totalTwentyYearVOCSavings: projectionResults.grandTotal,
            totalTenYearVOCSavings: projectionResults.firstTenYearTotal,
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
                                id: "tab3",
                                label: "Tab 3 — 20-Year Projection",
                                icon: <FaCalendarAlt />,
                            },
                            {
                                id: "all",
                                label: "Show All Tabs",
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
                        <fieldset disabled={readOnly} className="min-w-0">
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
                                            Select the vehicle categories above, then enter the observed counts for each
                                            survey day. Trips per Day and
                                            Operating Days per Year must be
                                            entered separately for each public
                                            and private vehicle category.
                                        </p>
                                    </div>

                                    <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <h5 className="font-bold text-slate-800">Select Vehicle Categories</h5>
                                                <p className="mt-1 text-xs text-slate-600">Choose the vehicle categories included in the survey. Motorcycle includes separate Public and Private traffic inputs. Trips/day and operating-day defaults follow the Excel assumptions and remain editable. Only selected categories are included in calculations.</p>
                                            </div>
                                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800">{selectedVehicleIds.length} selected</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                                            {VEHICLE_CATEGORIES.map((category) => {
                                                const isSelected = selectedVehicleIds.includes(category.id);
                                                return (
                                                    <button
                                                        key={category.id}
                                                        type="button"
                                                        onClick={() => toggleVehicle(category.id)}
                                                        aria-pressed={isSelected}
                                                        title={category.description}
                                                        className={`rounded-lg border px-3 py-3 text-sm font-semibold transition ${isSelected ? "border-emerald-700 bg-emerald-700 text-white shadow-sm" : "border-slate-300 bg-white text-slate-700 hover:border-emerald-500 hover:bg-emerald-50"}`}
                                                    >
                                                        <span className="flex items-center justify-center gap-2">
                                                            <span className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${isSelected ? "border-white bg-white text-emerald-700" : "border-slate-400"}`}>{isSelected ? "✓" : "+"}</span>
                                                            {category.label}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {selectedVehicleIds.length === 1 && (
                                            <p className="mt-2 text-xs text-emerald-800">At least one vehicle category must remain selected.</p>
                                        )}
                                    </div>

                                    <div className="space-y-5">
                                        {selectedVehicles.map((vehicle) => (
                                            <article
                                                key={vehicle.id}
                                                className="overflow-hidden rounded-xl border border-slate-200"
                                            >
                                                <div className="flex items-center justify-between gap-3 bg-slate-100 px-4 py-3">
                                                    <div>
                                                        <h5 className="font-bold text-slate-800">{vehicle.label}</h5>
                                                        <p className="mt-0.5 text-xs text-slate-500">{vehicle.groupLabel}</p>
                                                    </div>
                                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                                        {vehicle.groupLabel}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
                                                    {[VEHICLE_TYPES.find((item) => item.id === vehicle.group)].map((type) => {
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
                                                                            Trips per Day (Excel default)
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
                                                                            Operating Days per Year (Excel default)
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
                                        <table className="w-full min-w-[2200px] border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-white text-left text-xs uppercase tracking-wide text-slate-500">
                                                    <th className="px-4 py-3">
                                                        Road Condition
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        Formula
                                                    </th>
                                                    {selectedVehicles.map((vehicle) => (
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

                                                        {selectedVehicles.map((vehicle) => (
                                                            <td
                                                                key={vehicle.id}
                                                                className="px-4 py-3 text-right tabular-nums text-slate-700"
                                                            >
                                                                {formatNumber(
                                                                    surface.rates[
                                                                        vehicle.rateKey
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

                                {/* VOH workbook weighted VOC calculation (rows 172–178) */}
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <div className="border-b border-slate-200 bg-slate-100 px-4 py-4 sm:px-5">
                                        <h4 className="font-bold text-slate-800">VOH Workbook — Weighted Incremental VOC</h4>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Each road-condition VOC difference is multiplied by its share of total road length.
                                            The weighted rates are summed, as in VOH.xlsx rows 172–178.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1000px] border-collapse text-sm">
                                            <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Vehicle / Group</th>
                                                    {ROAD_SURFACES.map((surface) => <th key={surface.id} className="px-4 py-3 text-right">{surface.code}</th>)}
                                                    <th className="px-4 py-3 text-right">Weighted VOC (₱/km/trip)</th>
                                                    <th className="px-4 py-3 text-right">Annual Savings (₱)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {roadSurfaceResults.weightedVOCByVehicle.map((vehicle) => (
                                                    <tr key={vehicle.vehicleId} className="border-t border-slate-100">
                                                        <td className="px-4 py-3 font-semibold text-slate-800">
                                                            {vehicle.vehicle} <span className="text-xs font-normal text-slate-500">({vehicle.group})</span>
                                                        </td>
                                                        {vehicle.components.map((item) => (
                                                            <td key={item.surfaceId} className="px-4 py-3 text-right tabular-nums">{formatNumber(item.weightedRate, 6)}</td>
                                                        ))}
                                                        <td className="px-4 py-3 text-right font-bold tabular-nums">{formatNumber(vehicle.weightedIncrementalVOC, 6)}</td>
                                                        <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-800">{formatCurrency(vehicle.annualSavings)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t-2 border-emerald-200 bg-emerald-50 font-bold text-emerald-950">
                                                    <td colSpan={ROAD_SURFACES.length + 2} className="px-4 py-3">TOTAL — WEIGHTED VOC METHOD</td>
                                                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(roadSurfaceResults.weightedAnnualSavings)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                    <p className="px-4 py-3 text-xs text-slate-500">
                                        Cross-check against condition-by-condition savings: {formatCurrency(roadSurfaceResults.totalSavings)}.
                                        Both totals should agree before display rounding.
                                    </p>
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
                                                    Trips per Day and Operating Days per Year start with editable workbook assumptions (2 trips for motorcycles, 1 for other vehicles; 275 or 260 operating days).
                                                </li>
                                                <li>
                                                    Annual trips and VOC savings remain zero for a public/private vehicle category if either annualization field is blank or zero.
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

                        {/* TAB 3 — 20-YEAR VOC SAVINGS PROJECTION (EXCEL-STYLE) */}
                        {(activeSection === "tab3" || activeSection === "all") && (
                            <section className="mt-8 space-y-6">
                                <div className="flex flex-col gap-3 border-b border-emerald-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-xl bg-blue-100 p-3 text-blue-800">
                                            <FaCalendarAlt className="text-lg" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">
                                                Tab 3 — 20-Year VOC Savings Projection
                                            </h3>
                                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                                Excel-style annual projection using the combined road-length-weighted VOC difference for each vehicle type.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="w-fit rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                                        20-Year Projection
                                    </span>
                                </div>

                                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                                    <p className="font-bold">How this projection works</p>
                                    <p className="mt-1">
                                        The three survey-day counts are averaged for each public/private vehicle category. The workbook's VOC benefit table starts at the second forecast column: Year 1 benefits use the first adjusted count compounded once more, and Years 2–20 continue compounding the annual growth rate. Trips per day, operating days, the road-length-weighted VOC difference from Tab 2, and the total road length are carried into the savings calculation. For the workbook example, Tab 2 lengths total 7.90 km.
                                    </p>
                                    <p className="mt-2 font-semibold">
                                        Annual VOC Savings = Projected Traffic × Trips per Day × Operating Days × Weighted VOC Difference × Total Road Length.
                                    </p>
                                    <p className="mt-1 text-xs text-blue-800">
                                        Growth rate: {formatNumber(form.trafficGrowthRate)}% per year. Workbook assumptions: motorcycles/tricycles = 275 operating days; service vehicles, pickups, and trucks = 260 days. VOC rates use the exact values in the workbook's 2022 price table.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Year 1 savings</p>
                                        <p className="mt-2 text-xl font-extrabold tabular-nums text-slate-900">{formatCurrency(projectionResults.totalYear1)}</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Year 20 savings</p>
                                        <p className="mt-2 text-xl font-extrabold tabular-nums text-slate-900">{formatCurrency(projectionResults.totalYear20)}</p>
                                    </div>
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">20-year total savings</p>
                                        <p className="mt-2 text-xl font-extrabold tabular-nums text-emerald-950">{formatCurrency(projectionResults.grandTotal)}</p>
                                    </div>
                                </div>

                                {projectionResults.surfaces.map((surface) => (
                                    <article key={surface.id} className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                                        <div className="border-b border-slate-300 bg-slate-100 px-4 py-3">
                                            <h4 className="font-bold text-slate-900">{surface.code} — {surface.label}</h4>
                                            <p className="mt-1 text-xs text-slate-600">
                                                Total road length: {formatNumber(surface.roadLength, 2)} km (from Tab 2)
                                            </p>
                                        </div>

                                        {VEHICLE_TYPES.map((type) => {
                                            const typeResult = surface.types[type.id];
                                            return (
                                                <div key={type.id} className="border-b border-slate-300 last:border-b-0">
                                                    <div className={`px-4 py-2.5 ${type.id === "public" ? "bg-lime-500" : "bg-orange-400"}`}>
                                                        <h5 className="font-bold text-slate-950">{type.label}</h5>
                                                    </div>

                                                    <div className="space-y-4 p-3 sm:p-4">
                                                        {typeResult.rows.map((row) => (
                                                            <div key={row.vehicleId} className="overflow-hidden rounded-md border border-slate-300">
                                                                <div className="border-b border-slate-300 bg-slate-50 px-3 py-2">
                                                                    <p className="font-semibold text-slate-800">{row.vehicle}</p>
                                                                </div>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full min-w-[2400px] border-collapse text-xs">
                                                                        <thead>
                                                                            <tr className="bg-slate-100 text-slate-800">
                                                                                <th className="w-[260px] border border-slate-300 px-3 py-2 text-left font-bold">Benefits</th>
                                                                                <th className="w-[90px] border border-slate-300 px-2 py-2 text-center font-bold">Unit</th>
                                                                                {projectionResults.years.map((year) => (
                                                                                    <th key={year} className="min-w-[105px] border border-slate-300 px-2 py-2 text-center font-bold">{year}</th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            <tr>
                                                                                <td className="border border-slate-200 px-3 py-2">Total number /a</td>
                                                                                <td className="border border-slate-200 px-2 py-2 text-center">unit</td>
                                                                                {row.annuals.map((annual) => (
                                                                                    <td key={annual.year} className="border border-slate-200 px-2 py-2 text-right tabular-nums">{formatNumber(annual.projectedAADT, 0)}</td>
                                                                                ))}
                                                                            </tr>
                                                                            <tr>
                                                                                <td className="border border-slate-200 px-3 py-2">Number of trips per day /b</td>
                                                                                <td className="border border-slate-200 px-2 py-2 text-center">trip/day</td>
                                                                                {row.annuals.map((annual) => (
                                                                                    <td key={annual.year} className="border border-slate-200 px-2 py-2 text-right tabular-nums">{formatNumber(row.tripsPerDay, 0)}</td>
                                                                                ))}
                                                                            </tr>
                                                                            <tr>
                                                                                <td className="border border-slate-200 px-3 py-2">Number of days in operation /c</td>
                                                                                <td className="border border-slate-200 px-2 py-2 text-center">day/year</td>
                                                                                {row.annuals.map((annual) => (
                                                                                    <td key={annual.year} className="border border-slate-200 px-2 py-2 text-right tabular-nums">{formatNumber(row.operatingDays, 0)}</td>
                                                                                ))}
                                                                            </tr>
                                                                            <tr>
                                                                                <td className="border border-slate-200 px-3 py-2">Weighted VOC Difference /d</td>
                                                                                <td className="border border-slate-200 px-2 py-2 text-center">Php</td>
                                                                                {row.annuals.map((annual) => (
                                                                                    <td key={annual.year} className="border border-slate-200 px-2 py-2 text-right tabular-nums">{formatNumber(row.incrementalRate, 6)}</td>
                                                                                ))}
                                                                            </tr>
                                                                            <tr>
                                                                                <td className="border border-slate-200 px-3 py-2">Total road length /e</td>
                                                                                <td className="border border-slate-200 px-2 py-2 text-center">km</td>
                                                                                {row.annuals.map((annual) => (
                                                                                    <td key={annual.year} className="border border-slate-200 px-2 py-2 text-right tabular-nums">{formatNumber(row.roadLength, 2)}</td>
                                                                                ))}
                                                                            </tr>
                                                                        </tbody>
                                                                        <tfoot>
                                                                            <tr className="bg-cyan-500 font-bold text-slate-950">
                                                                                <td className="border border-cyan-700 px-3 py-2 italic">Subtotal ({row.vehicle})</td>
                                                                                <td className="border border-cyan-700 px-2 py-2 text-center">Php</td>
                                                                                {row.annuals.map((annual) => (
                                                                                    <td key={annual.year} className="border border-cyan-700 px-2 py-2 text-right tabular-nums">{formatCurrency(annual.savings)}</td>
                                                                                ))}
                                                                            </tr>
                                                                        </tfoot>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        <div className="overflow-x-auto rounded-md border-2 border-cyan-600">
                                                            <table className="w-full min-w-[2400px] border-collapse text-xs">
                                                                <tbody>
                                                                    <tr className="bg-cyan-100 font-extrabold text-slate-950">
                                                                        <td className="w-[260px] border border-cyan-700 px-3 py-3">TOTAL — {type.label}</td>
                                                                        <td className="w-[90px] border border-cyan-700 px-2 py-3 text-center">Php</td>
                                                                        {typeResult.yearlyTotals.map((item) => (
                                                                            <td key={item.year} className="min-w-[115px] border border-cyan-700 px-2 py-3 text-right tabular-nums">{formatCurrency(item.savings)}</td>
                                                                        ))}
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <div className="overflow-x-auto border-t-2 border-emerald-700 bg-emerald-50">
                                            <table className="w-full min-w-[2400px] border-collapse text-xs">
                                                <tbody>
                                                    <tr className="font-extrabold text-emerald-950">
                                                        <td className="w-[260px] border border-emerald-200 px-3 py-3">TOTAL {surface.code} — PUBLIC + PRIVATE</td>
                                                        <td className="w-[90px] border border-emerald-200 px-2 py-3 text-center">Php</td>
                                                        {surface.yearlyTotals.map((item) => (
                                                            <td key={item.year} className="min-w-[115px] border border-emerald-200 px-2 py-3 text-right tabular-nums">{formatCurrency(item.savings)}</td>
                                                        ))}
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </article>
                                ))}

                                <div className="overflow-hidden rounded-xl border-2 border-emerald-300 bg-white">
                                    <div className="bg-emerald-800 px-4 py-3 text-white">
                                        <h4 className="font-bold">20-Year Consolidated VOC Savings</h4>
                                        <p className="mt-1 text-xs text-emerald-100">Total annual savings using the weighted VOC difference across all road conditions (no duplicate road-length multiplication).</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[2200px] border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="border border-slate-300 px-3 py-2 text-left">Benefits</th>
                                                    <th className="border border-slate-300 px-2 py-2">Unit</th>
                                                    {projectionResults.years.map((year) => <th key={year} className="border border-slate-300 px-2 py-2">{year}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="bg-cyan-100 font-extrabold">
                                                    <td className="border border-slate-300 px-3 py-3">TOTAL VOC SAVINGS</td>
                                                    <td className="border border-slate-300 px-2 py-3 text-center">Php</td>
                                                    {projectionResults.yearlyTotals.map((item) => <td key={item.year} className="border border-slate-300 px-2 py-3 text-right tabular-nums">{formatCurrency(item.total)}</td>)}
                                                </tr>
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-emerald-100 font-extrabold text-emerald-950">
                                                    <td colSpan={2} className="border border-emerald-300 px-3 py-3">UNDISCOUNTED 20-YEAR TOTAL</td>
                                                    <td colSpan={20} className="border border-emerald-300 px-3 py-3 text-right text-base tabular-nums">{formatCurrency(projectionResults.grandTotal)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                                    <p className="font-bold">Data interpretation and validation</p>
                                    <ul className="mt-2 list-disc space-y-1 pl-5">
                                        <li>The “Total number /a” row is the projected traffic count for each year, calculated from the three-day average in Tab 1.</li>
                                        <li>Trips per day, operating days, VOC difference, and road length are repeated across the years because these inputs remain constant unless the user changes them.</li>
                                        <li>Each vehicle subtotal uses its own weighted VOC difference. Public and private subtotals are combined once for the full road length.</li>
                                        <li>The 20-year grand total is undiscounted. Apply the approved economic discount rate in the economic analysis worksheet when present value is required.</li>
                                        <li>Check the underlying unrounded traffic counts, VOC rates, and road length against the official MIADP workbook. Display rounding can cause small differences from manually calculated sample values.</li>
                                    </ul>
                                </div>
                            </section>
                        )}
                        </fieldset>
                    </main>

                    {/* Footer */}
                    <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                        <p className="text-xs leading-5 text-slate-500">
                            Projection values update automatically from Tabs 1 and 2.
                            Review traffic assumptions, VOC rates, and road lengths before saving.
                        </p>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                            <button
                                type="button"
                                onClick={onClose}
                                className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-100`}
                            >
                                {readOnly ? "Close" : "Cancel"}
                            </button>

                            {!readOnly && <button
                                type="submit"
                                disabled={saving}
                                className={`${buttonClass} bg-emerald-700 text-white shadow-sm hover:bg-emerald-800`}
                            >
                                <FaSave />
                                {saving ? "Saving to database..." : "Save Traffic Survey, VOC Savings, and 20-Year Projection"}
                            </button>}
                        </div>
                    </footer>
                </form>
            </div>
        </div>
    );
}