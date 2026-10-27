
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import Layout from "../Layouts/Layout";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaEye,
    FaTrash,
    FaTimes,
    FaLayerGroup,
    FaHome,
    FaChevronRight,
    FaUsers,
    FaUserFriends,
    FaMapMarkerAlt,
    FaSave,
    FaDownload,
    FaFilter,
    FaMars,
    FaVenus,
    FaHouseUser,
    FaExclamationCircle,
    FaClipboardList,
    FaChevronDown,
    FaArrowLeft,
} from "react-icons/fa";

const BASE_URL = "/project-beneficiaries";

const AGE_GROUPS = [
    "Under 1",
    "1 to 4",
    "5 to 9",
    "10 to 14",
    "15 to 19",
    "20 to 24",
    "25 to 29",
    "30 to 34",
    "35 to 39",
    "40 to 44",
    "45 to 49",
    "50 to 54",
    "55 to 59",
    "60 to 64",
    "65 to 69",
    "70 to 74",
    "75 to 79",
    "80 and over",
];

const SECTORS = [
    { key: "ips", label: "Number of IPs" },
    { key: "seniorCitizens", label: "Number of Senior Citizens" },
    { key: "pwd", label: "Number of PWD" },
    { key: "soloParents", label: "Number of Solo Parents" },
    { key: "laborForce", label: "Number of Labor Force" },
    { key: "ofw", label: "Number of OFW" },
    { key: "outOfSchoolYouth", label: "Number of Out of School Youth" },
    { key: "farmers", label: "Number of Farmers" },
];

const emptyCounts = () =>
    Object.fromEntries(
        AGE_GROUPS.map((_, index) => [
            `age_${index}`,
            { male: "", female: "" },
        ])
    );

const emptySectors = () =>
    Object.fromEntries(
        SECTORS.map(({ key }) => [
            key,
            { male: "", female: "" },
        ])
    );

const emptyForm = (defaultSubprojectId = "") => ({
    // Kept internally; there is no subproject selector in the UI.
    subproject_id: String(defaultSubprojectId ?? ""),
    barangay_id: "",
    barangay: "",
    purok: "",
    barangayPurokName: "",
    households: "",
    ageGroups: emptyCounts(),
    sectors: emptySectors(),
});

const normalizeCounts = (source, keys) =>
    Object.fromEntries(
        keys.map((key) => [
            key,
            {
                male: String(source?.[key]?.male ?? ""),
                female: String(source?.[key]?.female ?? ""),
            },
        ])
    );

const normalizeRecord = (record, defaultSubprojectId = "") => {
    if (!record) {
        return emptyForm(defaultSubprojectId);
    }

    return {
        subproject_id: String(
            record.subproject_id ?? defaultSubprojectId ?? ""
        ),
        barangay_id: String(record.barangay_id ?? ""),
        barangay: record.barangay ?? "",
        purok: record.purok ?? "",
        barangayPurokName:
            record.barangayPurokName ??
            record.barangay_purok_name ??
            "",
        households: String(record.households ?? ""),
        ageGroups: normalizeCounts(
            record.ageGroups ?? record.age_groups,
            AGE_GROUPS.map((_, index) => `age_${index}`)
        ),
        sectors: normalizeCounts(
            record.sectors,
            SECTORS.map((sector) => sector.key)
        ),
    };
};

const numeric = (value) =>
    Math.max(0, Number.parseInt(value, 10) || 0);

const totalMale = (items) =>
    Object.values(items || {}).reduce(
        (sum, item) => sum + numeric(item?.male),
        0
    );

const totalFemale = (items) =>
    Object.values(items || {}).reduce(
        (sum, item) => sum + numeric(item?.female),
        0
    );

const sumCounts = (items) => totalMale(items) + totalFemale(items);

const recordName = (record) =>
    record?.barangayPurokName ||
    record?.barangay_purok_name ||
    [record?.barangay, record?.purok].filter(Boolean).join(" / ") ||
    "Unnamed profile";

function StatCard({ title, value, description, icon: Icon, color }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                        {Number(value || 0).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        {description}
                    </p>
                </div>

                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}
                >
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
}

function NumberInput({ value, onChange, disabled, label }) {
    return (
        <input
            aria-label={label}
            type="number"
            min="0"
            step="1"
            disabled={disabled}
            value={value ?? ""}
            onChange={(event) => {
                const next = event.target.value;

                if (next === "" || /^\d+$/.test(next)) {
                    onChange(next);
                }
            }}
            className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 py-2 text-center text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            placeholder="0"
        />
    );
}

function BeneficiaryModal({
    initialData,
    barangays = [],
    defaultSubprojectId = "",
    viewOnly,
    onClose,
    onSave,
    processing,
    serverErrors = {},
}) {
    const [form, setForm] = useState(() =>
        normalizeRecord(initialData, defaultSubprojectId)
    );

    const [errors, setErrors] = useState({});

    const updateField = (field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const updateCount = (group, key, gender, value) => {
        setForm((previous) => ({
            ...previous,
            [group]: {
                ...previous[group],
                [key]: {
                    ...previous[group][key],
                    [gender]: value,
                },
            },
        }));
    };

    const male = totalMale(form.ageGroups);
    const female = totalFemale(form.ageGroups);
    const residents = male + female;

    const sectorMale = totalMale(form.sectors);
    const sectorFemale = totalFemale(form.sectors);

    const fieldClass =
        "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100";

    const submit = (event) => {
        event.preventDefault();

        const nextErrors = {};

        if (!form.barangay_id) {
            nextErrors.barangay_id = "Please select a barangay.";
        }

        if (!form.purok.trim()) {
            nextErrors.purok = "Purok is required.";
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        const selectedBarangay = barangays.find(
            (item) =>
                String(item.barangay_id ?? item.id) ===
                String(form.barangay_id)
        );

        onSave({
            ...form,
            barangay: selectedBarangay
                ? selectedBarangay.barangay_name ?? selectedBarangay.name
                : form.barangay,
            barangayPurokName:
                form.barangayPurokName.trim() ||
                [
                    selectedBarangay
                        ? selectedBarangay.barangay_name ??
                          selectedBarangay.name
                        : form.barangay,
                    form.purok,
                ]
                    .filter(Boolean)
                    .join(" / "),
        });
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="beneficiary-modal-title"
                className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
                <header className="shrink-0 bg-gradient-to-r from-blue-950 via-blue-800 to-teal-800 px-5 py-5 text-white sm:px-8 sm:py-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-100">
                                <FaClipboardList />
                                MIADP · Household profiling
                            </span>

                            <h2
                                id="beneficiary-modal-title"
                                className="text-xl font-extrabold sm:text-2xl"
                            >
                                {viewOnly
                                    ? "Beneficiary Profile"
                                    : initialData
                                      ? "Edit Beneficiary Profile"
                                      : "Add Beneficiary Profile"}
                            </h2>

                            <p className="mt-1 text-sm text-blue-100">
                                Barangay / Purok Household and Sector
                                Distribution
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close modal"
                            className="rounded-xl border border-white/20 bg-white/10 p-2.5 hover:bg-white/20"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </header>

                <form
                    onSubmit={submit}
                    className="min-h-0 flex-1 overflow-y-auto"
                >
                    <fieldset
                        disabled={viewOnly || processing}
                        className="space-y-6 p-4 sm:p-7"
                    >
                        <section className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                    <FaMapMarkerAlt />
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900">
                                        Barangay / Purok Information
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Identify the location covered by this
                                        profile.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <label className="text-sm font-semibold text-slate-700">
                                    Barangay{" "}
                                    <span className="text-red-500">*</span>

                                    <select
                                        className={fieldClass}
                                        value={form.barangay_id}
                                        onChange={(event) => {
                                            const id = event.target.value;

                                            const item = barangays.find(
                                                (barangay) =>
                                                    String(
                                                        barangay.barangay_id ??
                                                            barangay.id
                                                    ) === id
                                            );

                                            setForm((previous) => ({
                                                ...previous,
                                                barangay_id: id,
                                                barangay: item
                                                    ? item.barangay_name ??
                                                      item.name
                                                    : "",
                                            }));

                                            setErrors((previous) => ({
                                                ...previous,
                                                barangay_id: "",
                                            }));
                                        }}
                                    >
                                        <option value="">
                                            Select Barangay
                                        </option>

                                        {barangays.map((item) => (
                                            <option
                                                key={
                                                    item.barangay_id ?? item.id
                                                }
                                                value={
                                                    item.barangay_id ?? item.id
                                                }
                                            >
                                                {item.barangay_name ??
                                                    item.name}
                                            </option>
                                        ))}
                                    </select>

                                    {(errors.barangay_id ||
                                        serverErrors.barangay_id) && (
                                        <span className="mt-1 block text-xs text-red-600">
                                            {errors.barangay_id ||
                                                serverErrors.barangay_id}
                                        </span>
                                    )}
                                </label>

                                <label className="text-sm font-semibold text-slate-700">
                                    Purok{" "}
                                    <span className="text-red-500">*</span>

                                    <input
                                        className={fieldClass}
                                        value={form.purok}
                                        onChange={(event) => {
                                            updateField(
                                                "purok",
                                                event.target.value
                                            );

                                            setErrors((previous) => ({
                                                ...previous,
                                                purok: "",
                                            }));
                                        }}
                                        placeholder="Enter purok / sitio"
                                    />

                                    {(errors.purok || serverErrors.purok) && (
                                        <span className="mt-1 block text-xs text-red-600">
                                            {errors.purok ||
                                                serverErrors.purok}
                                        </span>
                                    )}
                                </label>

                                <label className="text-sm font-semibold text-slate-700">
                                    Name of Barangay or Purok

                                    <input
                                        className={fieldClass}
                                        value={form.barangayPurokName}
                                        onChange={(event) =>
                                            updateField(
                                                "barangayPurokName",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Optional display name"
                                    />
                                </label>

                                <label className="text-sm font-semibold text-slate-700">
                                    Number of Households

                                    <input
                                        className={fieldClass}
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={form.households}
                                        onChange={(event) => {
                                            const value =
                                                event.target.value;

                                            if (
                                                value === "" ||
                                                /^\d+$/.test(value)
                                            ) {
                                                updateField(
                                                    "households",
                                                    value
                                                );
                                            }
                                        }}
                                        placeholder="Enter household count"
                                    />

                                    {serverErrors.households && (
                                        <span className="mt-1 block text-xs text-red-600">
                                            {serverErrors.households}
                                        </span>
                                    )}
                                </label>
                            </div>
                        </section>

                        <section>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-slate-900">
                                        Household Age-Group Distribution
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Enter resident counts by age group and
                                        sex.
                                    </p>
                                </div>

                                <div className="flex gap-2 text-xs font-bold">
                                    <span className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-blue-700">
                                        <FaMars /> Male
                                    </span>

                                    <span className="flex items-center gap-1.5 rounded-lg bg-pink-50 px-3 py-2 text-pink-700">
                                        <FaVenus /> Female
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[440px] text-sm">
                                        <thead>
                                            <tr className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                                                <th className="px-4 py-3 text-left">
                                                    Age Group
                                                </th>
                                                <th className="w-32 px-3 py-3 text-center">
                                                    Male
                                                </th>
                                                <th className="w-32 px-3 py-3 text-center">
                                                    Female
                                                </th>
                                                <th className="w-24 px-3 py-3 text-center">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">
                                            {AGE_GROUPS.map(
                                                (age, index) => {
                                                    const key = `age_${index}`;
                                                    const row =
                                                        form.ageGroups[key];

                                                    return (
                                                        <tr
                                                            key={key}
                                                            className="hover:bg-slate-50"
                                                        >
                                                            <td className="px-4 py-2.5 font-medium text-slate-700">
                                                                {age}
                                                            </td>

                                                            <td className="px-2 py-1.5">
                                                                <NumberInput
                                                                    label={`${age} male`}
                                                                    value={
                                                                        row.male
                                                                    }
                                                                    disabled={
                                                                        viewOnly
                                                                    }
                                                                    onChange={(
                                                                        value
                                                                    ) =>
                                                                        updateCount(
                                                                            "ageGroups",
                                                                            key,
                                                                            "male",
                                                                            value
                                                                        )
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="px-2 py-1.5">
                                                                <NumberInput
                                                                    label={`${age} female`}
                                                                    value={
                                                                        row.female
                                                                    }
                                                                    disabled={
                                                                        viewOnly
                                                                    }
                                                                    onChange={(
                                                                        value
                                                                    ) =>
                                                                        updateCount(
                                                                            "ageGroups",
                                                                            key,
                                                                            "female",
                                                                            value
                                                                        )
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="px-3 py-2 text-center font-bold text-slate-700">
                                                                {(
                                                                    numeric(
                                                                        row.male
                                                                    ) +
                                                                    numeric(
                                                                        row.female
                                                                    )
                                                                ).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                        </tbody>

                                        <tfoot>
                                            <tr className="bg-blue-50 font-extrabold text-blue-950">
                                                <td className="px-4 py-3">
                                                    Total Residents
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    {male.toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    {female.toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    {residents.toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </section>

                        <section>
                            <div className="mb-3">
                                <h3 className="font-bold text-slate-900">
                                    Household and Beneficiary Sectors
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Record the number of people in each sector
                                    by sex.
                                </p>
                            </div>

                            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold text-slate-500">
                                        Total Residents
                                    </p>
                                    <p className="mt-1 text-2xl font-extrabold text-slate-900">
                                        {residents.toLocaleString()}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                    <p className="text-xs font-semibold text-blue-700">
                                        Male Residents
                                    </p>
                                    <p className="mt-1 text-2xl font-extrabold text-blue-900">
                                        {male.toLocaleString()}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-pink-100 bg-pink-50 p-4">
                                    <p className="text-xs font-semibold text-pink-700">
                                        Female Residents
                                    </p>
                                    <p className="mt-1 text-2xl font-extrabold text-pink-900">
                                        {female.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[440px] text-sm">
                                        <thead>
                                            <tr className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                                                <th className="px-4 py-3 text-left">
                                                    Sector / Classification
                                                </th>
                                                <th className="w-32 px-3 py-3 text-center">
                                                    Male
                                                </th>
                                                <th className="w-32 px-3 py-3 text-center">
                                                    Female
                                                </th>
                                                <th className="w-24 px-3 py-3 text-center">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">
                                            {SECTORS.map((sector) => {
                                                const row =
                                                    form.sectors[sector.key];

                                                return (
                                                    <tr
                                                        key={sector.key}
                                                        className="hover:bg-slate-50"
                                                    >
                                                        <td className="px-4 py-2.5 font-medium text-slate-700">
                                                            {sector.label}
                                                        </td>

                                                        <td className="px-2 py-1.5">
                                                            <NumberInput
                                                                label={`${sector.label} male`}
                                                                value={row.male}
                                                                disabled={
                                                                    viewOnly
                                                                }
                                                                onChange={(
                                                                    value
                                                                ) =>
                                                                    updateCount(
                                                                        "sectors",
                                                                        sector.key,
                                                                        "male",
                                                                        value
                                                                    )
                                                                }
                                                            />
                                                        </td>

                                                        <td className="px-2 py-1.5">
                                                            <NumberInput
                                                                label={`${sector.label} female`}
                                                                value={
                                                                    row.female
                                                                }
                                                                disabled={
                                                                    viewOnly
                                                                }
                                                                onChange={(
                                                                    value
                                                                ) =>
                                                                    updateCount(
                                                                        "sectors",
                                                                        sector.key,
                                                                        "female",
                                                                        value
                                                                    )
                                                                }
                                                            />
                                                        </td>

                                                        <td className="px-3 py-2 text-center font-bold text-slate-700">
                                                            {(
                                                                numeric(
                                                                    row.male
                                                                ) +
                                                                numeric(
                                                                    row.female
                                                                )
                                                            ).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>

                                        <tfoot>
                                            <tr className="bg-slate-50 font-extrabold text-slate-900">
                                                <td className="px-4 py-3">
                                                    Total Sector Entries
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    {sectorMale.toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    {sectorFemale.toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    {(
                                                        sectorMale +
                                                        sectorFemale
                                                    ).toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-amber-700">
                                <FaExclamationCircle className="mt-0.5 shrink-0" />
                                Sector totals may overlap. A resident may be
                                both an IP and a farmer, so sector entries are
                                not added to the total population.
                            </p>
                        </section>
                    </fieldset>

                    <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:justify-between sm:px-7">
                        <p className="hidden items-center text-xs text-slate-400 sm:flex">
                            <FaClipboardList className="mr-2" />
                            MIADP Household Profiling
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                            >
                                {viewOnly ? "Close" : "Cancel"}
                            </button>

                            {!viewOnly && (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <FaSave />
                                    {processing
                                        ? "Saving..."
                                        : initialData
                                          ? "Save Changes"
                                          : "Save Profile"}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ProjectBeneficiaries() {
    const {
        barangays = [],
        beneficiaryProfiles = [],
        flash = {},
        errors: serverErrors = {},
        subprojectId = null,
        filters = {},
    } = usePage().props;

    const defaultSubprojectId = String(
        subprojectId ?? filters.subproject_id ?? ""
    );

    const managementUrl = defaultSubprojectId
        ? `/management/${encodeURIComponent(defaultSubprojectId)}`
        : null;

    const [search, setSearch] = useState("");
    const [barangayFilter, setBarangayFilter] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [viewOnly, setViewOnly] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [notice, setNotice] = useState("");

    const records = Array.isArray(beneficiaryProfiles)
        ? beneficiaryProfiles
        : beneficiaryProfiles?.data ?? [];

    const filteredRecords = useMemo(() => {
        const term = search.toLowerCase().trim();

        return records.filter((record) => {
            const matchesSearch =
                !term ||
                [
                    record.barangay,
                    record.purok,
                    record.barangayPurokName,
                    record.barangay_purok_name,
                ].some((value) =>
                    String(value ?? "").toLowerCase().includes(term)
                );

            const matchesBarangay =
                barangayFilter === "all" ||
                String(record.barangay_id) === barangayFilter;

            return matchesSearch && matchesBarangay;
        });
    }, [records, search, barangayFilter]);

    const totalHouseholds = records.reduce(
        (sum, record) => sum + numeric(record.households),
        0
    );

    const totalResidents = records.reduce(
        (sum, record) =>
            sum +
            sumCounts(record.ageGroups ?? record.age_groups),
        0
    );

    const uniqueBarangays = useMemo(() => {
        const ids = new Set(
            records.map((record) => String(record.barangay_id))
        );

        return barangays.filter((item) =>
            ids.has(String(item.barangay_id ?? item.id))
        );
    }, [barangays, records]);

    const openAdd = () => {
        setSelectedRecord(null);
        setViewOnly(false);
        setModalOpen(true);
    };

    const openEdit = (record) => {
        setSelectedRecord(record);
        setViewOnly(false);
        setModalOpen(true);
    };

    const openView = (record) => {
        setSelectedRecord(record);
        setViewOnly(true);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedRecord(null);
        setViewOnly(false);
        setProcessing(false);
    };

    const saveRecord = (form) => {
        setProcessing(true);

        const editing = Boolean(selectedRecord);

        const url = editing
            ? `${BASE_URL}/${selectedRecord.id}`
            : BASE_URL;

        const method = editing ? "put" : "post";

        router[method](url, form, {
            preserveScroll: true,

            onSuccess: () => {
                closeModal();

                setNotice(
                    editing
                        ? "Beneficiary profile updated successfully."
                        : "Beneficiary profile added successfully."
                );
            },

            onError: () => {
                setProcessing(false);
            },

            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    const deleteRecord = (record) => {
        const confirmed = window.confirm(
            `Delete the profile for ${recordName(record)}? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        router.delete(`${BASE_URL}/${record.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setNotice("Beneficiary profile deleted successfully.");
            },
        });
    };

    const exportCSV = () => {
        const headers = [
            "Barangay",
            "Purok",
            "Name",
            "Households",
            "Male Residents",
            "Female Residents",
            "Total Residents",
            ...SECTORS.flatMap((sector) => [
                `${sector.label} Male`,
                `${sector.label} Female`,
            ]),
        ];

        const rows = filteredRecords.map((record) => {
            const ages = record.ageGroups ?? record.age_groups ?? {};

            return [
                record.barangay,
                record.purok,
                recordName(record),
                numeric(record.households),
                totalMale(ages),
                totalFemale(ages),
                sumCounts(ages),
                ...SECTORS.flatMap((sector) => [
                    numeric(record.sectors?.[sector.key]?.male),
                    numeric(record.sectors?.[sector.key]?.female),
                ]),
            ];
        });

        const escapeCSV = (value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`;

        const csv = [headers, ...rows]
            .map((row) => row.map(escapeCSV).join(","))
            .join("\r\n");

        const url = URL.createObjectURL(
            new Blob(["\uFEFF" + csv], {
                type: "text/csv;charset=utf-8;",
            })
        );

        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "miadp-project-beneficiaries.csv";

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(url);
    };

    return (
        <Layout>
            <Head title="Project Beneficiaries" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
                <div className="mx-auto max-w-[1440px] space-y-6">
                    <nav
                        aria-label="Breadcrumb"
                        className="flex flex-wrap items-center gap-2 text-sm"
                    >
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 font-semibold text-slate-500 hover:text-emerald-700"
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
                            Reference Data
                        </span>

                        <FaChevronRight className="text-[10px] text-slate-300" />

                        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 font-bold text-emerald-800">
                            Project Beneficiaries
                        </span>
                    </nav>

                   
<header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-800 to-teal-900 p-6 text-white shadow-xl sm:p-8">
    <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />
    <div className="pointer-events-none absolute -bottom-28 right-1/4 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

    <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
            {managementUrl && (
                <Link
                    href={managementUrl}
                    className="mb-5 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
                >
                    <FaArrowLeft />
                    Back to Subproject Management
                </Link>
            )}

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-100">
                <FaLayerGroup />
                MIADP · Project Beneficiaries
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                Project Beneficiaries
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                Manage barangay and purok household profiles, population
                distribution, and beneficiary sector information for
                MIADP infrastructure subprojects.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-blue-100">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                    <FaHouseUser />
                    Household Profiling
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                    <FaUsers />
                    Sector Distribution
                </span>
            </div>
        </div>

        <div className="relative flex shrink-0 flex-wrap gap-3">
            <button
                type="button"
                onClick={exportCSV}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
                <FaDownload />
                Export CSV
            </button>

            <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-blue-900 shadow-lg transition hover:bg-emerald-50"
            >
                <FaPlus />
                Add Beneficiary
            </button>
        </div>
    </div>
</header>


                    {(notice || flash.success || flash.error) && (
                        <div
                            role="status"
                            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
                                flash.error
                                    ? "border-red-200 bg-red-50 text-red-800"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                            }`}
                        >
                            <span>
                                {flash.error || flash.success || notice}
                            </span>

                            <button
                                type="button"
                                onClick={() => setNotice("")}
                                className="rounded-lg p-1 hover:bg-white/60"
                                aria-label="Dismiss notification"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    )}

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="Profile Records"
                            value={records.length}
                            description="Saved beneficiary profiles"
                            icon={FaClipboardList}
                            color="bg-blue-50 text-blue-700"
                        />

                        <StatCard
                            title="Households"
                            value={totalHouseholds}
                            description="Total household count entered"
                            icon={FaHouseUser}
                            color="bg-emerald-50 text-emerald-700"
                        />

                        <StatCard
                            title="Total Residents"
                            value={totalResidents}
                            description="Male and female age-group counts"
                            icon={FaUsers}
                            color="bg-violet-50 text-violet-700"
                        />

                        <StatCard
                            title="Barangays Covered"
                            value={uniqueBarangays.length}
                            description="Barangays with saved profiles"
                            icon={FaMapMarkerAlt}
                            color="bg-amber-50 text-amber-700"
                        />
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-5 sm:p-6">
                            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-900">
                                        Beneficiary Profile Records
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Search, review, and manage household
                                        profiles.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <div className="relative">
                                        <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                                        <input
                                            type="search"
                                            value={search}
                                            onChange={(event) =>
                                                setSearch(event.target.value)
                                            }
                                            placeholder="Search barangay or purok..."
                                            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-72"
                                        />
                                    </div>

                                    <div className="relative">
                                        <FaFilter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                                        <select
                                            value={barangayFilter}
                                            onChange={(event) =>
                                                setBarangayFilter(
                                                    event.target.value
                                                )
                                            }
                                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-52"
                                        >
                                            <option value="all">
                                                All Barangays
                                            </option>

                                            {uniqueBarangays.map((item) => (
                                                <option
                                                    key={
                                                        item.barangay_id ??
                                                        item.id
                                                    }
                                                    value={String(
                                                        item.barangay_id ??
                                                            item.id
                                                    )}
                                                >
                                                    {item.barangay_name ??
                                                        item.name}
                                                </option>
                                            ))}
                                        </select>

                                        <FaChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                        <th className="px-5 py-4">#</th>
                                        <th className="px-5 py-4">
                                            Barangay / Purok
                                        </th>
                                        <th className="px-5 py-4">
                                            Male Residents
                                        </th>
                                        <th className="px-5 py-4">
                                            Female Residents
                                        </th>
                                        <th className="px-5 py-4">
                                            Total Residents
                                        </th>
                                        <th className="px-5 py-4 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredRecords.map((record, index) => {
                                        const ages =
                                            record.ageGroups ??
                                            record.age_groups ??
                                            {};

                                        return (
                                            <tr
                                                key={record.id}
                                                className="transition hover:bg-slate-50/80"
                                            >
                                                <td className="px-5 py-4 font-semibold text-slate-400">
                                                    {index + 1}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                                            <FaMapMarkerAlt />
                                                        </div>

                                                        <div>
                                                            <p className="font-bold text-slate-800">
                                                                {recordName(
                                                                    record
                                                                )}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {record.barangay ||
                                                                    "No barangay"}{" "}
                                                                ·{" "}
                                                                {record.purok ||
                                                                    "No purok"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-2 font-semibold text-blue-700">
                                                        <FaMars className="text-xs" />
                                                        {totalMale(
                                                            ages
                                                        ).toLocaleString()}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-2 font-semibold text-pink-700">
                                                        <FaVenus className="text-xs" />
                                                        {totalFemale(
                                                            ages
                                                        ).toLocaleString()}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 font-extrabold text-emerald-800">
                                                        {sumCounts(
                                                            ages
                                                        ).toLocaleString()}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openView(record)
                                                            }
                                                            title="View profile"
                                                            className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                        >
                                                            <FaEye />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEdit(record)
                                                            }
                                                            title="Edit profile"
                                                            className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                                                        >
                                                            <FaEdit />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteRecord(
                                                                    record
                                                                )
                                                            }
                                                            title="Delete profile"
                                                            className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredRecords.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-6 py-16 text-center"
                                            >
                                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                                    <FaUserFriends size={26} />
                                                </div>

                                                <h3 className="mt-4 font-bold text-slate-800">
                                                    {records.length === 0
                                                        ? "No beneficiary profiles yet"
                                                        : "No matching profiles found"}
                                                </h3>

                                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                                    {records.length === 0
                                                        ? "Start by adding a barangay or purok household profile."
                                                        : "Try a different search term or change the barangay filter."}
                                                </p>

                                                {records.length === 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={openAdd}
                                                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
                                                    >
                                                        <FaPlus />
                                                        Add First Profile
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                                Showing{" "}
                                <strong className="text-slate-800">
                                    {filteredRecords.length}
                                </strong>{" "}
                                of{" "}
                                <strong className="text-slate-800">
                                    {records.length}
                                </strong>{" "}
                                profile records
                            </span>

                            <span>
                                Totals reflect the entered age-group data.
                            </span>
                        </div>
                    </section>

                    <footer className="flex flex-col gap-2 pb-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                            MIADP · Economic and Financial Decision Support
                            System
                        </span>
                        <span>Project Beneficiaries Management</span>
                    </footer>
                </div>
            </div>

{modalOpen && (
    <BeneficiaryModal
        key={`${selectedRecord?.id ?? "new"}-${viewOnly ? "view" : "edit"}`}
        initialData={selectedRecord}
        barangays={barangays}
        defaultSubprojectId={defaultSubprojectId}
        viewOnly={viewOnly}
        onClose={closeModal}
        onSave={saveRecord}
        processing={processing}
        serverErrors={serverErrors}
    />
)}

        </Layout>
    );
}
