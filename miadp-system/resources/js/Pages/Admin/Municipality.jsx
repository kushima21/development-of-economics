
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import Layout from "../Layouts/Layout";

import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaEye,
    FaTrash,
    FaTimes,
    FaLayerGroup,
    FaCheckCircle,
    FaHome,
    FaChevronRight,
    FaBuilding,
    FaMapMarkerAlt,
    FaSave,
    FaFilter,
    FaChevronLeft,
    FaChevronRight as FaNext,
    FaMapMarkedAlt,
    FaGlobeAsia,
    FaHashtag,
    FaExclamationCircle,
    FaSyncAlt,
    FaPowerOff,
} from "react-icons/fa";

const emptyForm = {
    municipality: "",
    region: "",
    zipcode: "",
    status: "Active",
};

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700";

function Modal({ title, subtitle, onClose, children, size = "max-w-xl" }) {
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`my-auto w-full ${size} overflow-hidden rounded-3xl bg-white shadow-2xl`}
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-7">
                    <div>
                        <h2 className="text-xl font-extrabold tracking-tight text-slate-800">
                            {title}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {subtitle}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="max-h-[75vh] overflow-y-auto px-6 py-6 sm:px-7">
                    {children}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, description, icon: Icon, color }) {
    const styles = {
        emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        blue: "bg-blue-50 text-blue-700 ring-blue-100",
        amber: "bg-amber-50 text-amber-700 ring-amber-100",
        violet: "bg-violet-50 text-violet-700 ring-violet-100",
    };

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-800">
                        {Number(value ?? 0).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                        {description}
                    </p>
                </div>

                <div className={`rounded-2xl p-3 ring-1 ${styles[color]}`}>
                    <Icon className="text-xl" />
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const active = status === "Active";

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                active
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
            }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-emerald-500" : "bg-slate-400"
                }`}
            />
            {status}
        </span>
    );
}

export default function Municipality() {
    const { props } = usePage();

    const {
        municipalities,
        filters = {},
        regions = [],
        summary = {},
        flash = {},
    } = props;

    const records = municipalities?.data ?? [];

    const [search, setSearch] = useState(filters.search ?? "");
    const [statusFilter, setStatusFilter] = useState(
        filters.status ?? "all",
    );
    const [regionFilter, setRegionFilter] = useState(
        filters.region ?? "all",
    );

    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [notice, setNotice] = useState("");
    const [noticeType, setNoticeType] = useState("success");

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm(emptyForm);

    const closeModal = () => {
        setModal(null);
        setSelected(null);
        setDetailsLoading(false);
        reset();
        clearErrors();
    };

    const applyFilters = (overrides = {}) => {
        router.get(
            "/municipalities",
            {
                search,
                status: statusFilter,
                region: regionFilter,
                ...overrides,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search ?? "")) {
                applyFilters({ search });
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setSearch(filters.search ?? "");
        setStatusFilter(filters.status ?? "all");
        setRegionFilter(filters.region ?? "all");
    }, [filters.search, filters.status, filters.region]);

    useEffect(() => {
        if (flash.success) {
            setNotice(flash.success);
            setNoticeType("success");

            const timer = setTimeout(() => setNotice(""), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash.success]);

    const startCreate = () => {
        reset();
        clearErrors();
        setSelected(null);
        setModal("create");
    };

    const startEdit = (item) => {
        clearErrors();
        setSelected(item);

        setData({
            municipality: item.municipality ?? "",
            region: item.region ?? "",
            zipcode: item.zipcode ?? "",
            status: item.status ?? "Active",
        });

        setModal("edit");
    };

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => {
                setNoticeType("error");
                setNotice("Please review the highlighted fields.");
            },
        };

        if (modal === "edit" && selected) {
            put(`/municipalities/${selected.id}`, options);
        } else {
            post("/municipalities", options);
        }
    };

    const openDetails = async (item) => {
        setSelected(item);
        setModal("details");
        setDetailsLoading(true);

        try {
            const response = await fetch(`/municipalities/${item.id}`, {
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
                credentials: "same-origin",
            });

            if (!response.ok) {
                throw new Error("Unable to load municipality details.");
            }

            const result = await response.json();
            setSelected(result.municipality);
        } catch {
            setNoticeType("error");
            setNotice("Could not load the municipality details.");
        } finally {
            setDetailsLoading(false);
        }
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;

        router.delete(`/municipalities/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setRegionFilter("all");

        router.get(
            "/municipalities",
            { search: "", status: "all", region: "all" },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const hasFilters =
        search.trim() !== "" ||
        statusFilter !== "all" ||
        regionFilter !== "all";

    const paginationLinks = municipalities?.links ?? [];

    const currentPage = municipalities?.current_page ?? 1;
    const lastPage = municipalities?.last_page ?? 1;
    const from = municipalities?.from ?? 0;
    const to = municipalities?.to ?? 0;
    const total = municipalities?.total ?? 0;

    const errorFor = (field) =>
        errors[field] ? (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
                <FaExclamationCircle />
                {errors[field]}
            </p>
        ) : null;

    return (
        <Layout>
            <Head title="Municipality Management" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
                <div className="mx-auto max-w-[1440px] space-y-6">
                    {/* Breadcrumb */}
                    <nav
                        aria-label="Breadcrumb"
                        className="flex flex-wrap items-center gap-2 text-sm"
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
                            Reference Data
                        </span>

                        <FaChevronRight className="text-[10px] text-slate-300" />

                        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 font-bold text-emerald-800 ring-1 ring-emerald-100">
                            Municipality
                        </span>
                    </nav>

                    {/* Page heading */}
                    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-lg sm:p-8">
                        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border-[35px] border-white/5" />
                        <div className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-emerald-400/10 blur-2xl" />

                        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                            <div>
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                                    <FaLayerGroup />
                                    REFERENCE DATA MANAGEMENT
                                </div>

                                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                                    Municipality Management
                                </h1>

                                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100/80 sm:text-base">
                                    Manage municipalities, administrative
                                    regions, zipcodes, and availability status
                                    in one centralized workspace.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={startCreate}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50"
                            >
                                <FaPlus />
                                Add Municipality
                            </button>
                        </div>
                    </section>

                    {/* Notification */}
                    {notice && (
                        <div
                            role="status"
                            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
                                noticeType === "error"
                                    ? "border-rose-200 bg-rose-50 text-rose-700"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                {noticeType === "error" ? (
                                    <FaExclamationCircle />
                                ) : (
                                    <FaCheckCircle />
                                )}
                                {notice}
                            </span>

                            <button
                                type="button"
                                onClick={() => setNotice("")}
                                aria-label="Dismiss notification"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    )}

                    {/* Statistics */}
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="Total Municipalities"
                            value={summary.total}
                            description="Registered locations"
                            icon={FaBuilding}
                            color="emerald"
                        />
                        <StatCard
                            title="Active Municipalities"
                            value={summary.active}
                            description="Available for selection"
                            icon={FaCheckCircle}
                            color="blue"
                        />
                        <StatCard
                            title="Inactive Municipalities"
                            value={summary.inactive}
                            description="Currently disabled"
                            icon={FaPowerOff}
                            color="amber"
                        />
                        <StatCard
                            title="Regions Covered"
                            value={summary.regions}
                            description="Distinct registered regions"
                            icon={FaGlobeAsia}
                            color="violet"
                        />
                    </section>

                    {/* Table and filters */}
                    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-800">
                                    Municipality Directory
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Search, review, and maintain registered
                                    municipalities.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative min-w-0 sm:w-64">
                                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search municipality..."
                                        aria-label="Search municipalities"
                                        className={`${inputClass} pl-10`}
                                    />
                                </div>

                                <select
                                    value={regionFilter}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setRegionFilter(value);
                                        applyFilters({ region: value });
                                    }}
                                    aria-label="Filter by region"
                                    className={`${inputClass} sm:w-48`}
                                >
                                    <option value="all">All Regions</option>
                                    {regions.map((region) => (
                                        <option key={region} value={region}>
                                            {region}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={statusFilter}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setStatusFilter(value);
                                        applyFilters({ status: value });
                                    }}
                                    aria-label="Filter by status"
                                    className={`${inputClass} sm:w-40`}
                                >
                                    <option value="all">All Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>

                                {hasFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        title="Clear filters"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        <FaSyncAlt />
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 px-5 py-3.5 sm:px-6">
                            <p className="text-sm text-slate-500">
                                Showing{" "}
                                <span className="font-bold text-slate-800">
                                    {from}-{to}
                                </span>{" "}
                                of{" "}
                                <span className="font-bold text-slate-800">
                                    {total}
                                </span>{" "}
                                municipalities
                            </p>

                            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                                <FaFilter className="text-emerald-600" />
                                Server-side filtering
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-white">
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Municipality
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Region
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Zipcode
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {records.length > 0 ? (
                                        records.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="transition hover:bg-emerald-50/30"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                                            <FaBuilding className="text-lg" />
                                                        </div>

                                                        <div>
                                                            <p className="font-bold text-slate-800">
                                                                {item.municipality}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-400">
                                                                ID: {item.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                                                        <FaMapMarkerAlt className="text-emerald-600" />
                                                        {item.region}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                                                        <FaHashtag className="text-slate-400" />
                                                        {item.zipcode || "—"}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <StatusBadge
                                                        status={item.status}
                                                    />
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDetails(item)
                                                            }
                                                            title="View details"
                                                            aria-label={`View ${item.municipality}`}
                                                            className="rounded-xl p-2.5 text-blue-600 transition hover:bg-blue-50"
                                                        >
                                                            <FaEye />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                startEdit(item)
                                                            }
                                                            title="Edit municipality"
                                                            aria-label={`Edit ${item.municipality}`}
                                                            className="rounded-xl p-2.5 text-amber-600 transition hover:bg-amber-50"
                                                        >
                                                            <FaEdit />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDeleteTarget(
                                                                    item,
                                                                )
                                                            }
                                                            title="Delete municipality"
                                                            aria-label={`Delete ${item.municipality}`}
                                                            className="rounded-xl p-2.5 text-rose-600 transition hover:bg-rose-50"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-16 text-center"
                                            >
                                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                                    <FaBuilding className="text-2xl" />
                                                </div>

                                                <h3 className="mt-4 font-bold text-slate-700">
                                                    No municipalities found
                                                </h3>

                                                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                                                    Add a municipality or adjust
                                                    your search and filters.
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={
                                                        hasFilters
                                                            ? clearFilters
                                                            : startCreate
                                                    }
                                                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
                                                >
                                                    {hasFilters ? (
                                                        <>
                                                            <FaSyncAlt />
                                                            Clear filters
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaPlus />
                                                            Add Municipality
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <p className="text-sm text-slate-500">
                                Page{" "}
                                <span className="font-bold text-slate-800">
                                    {currentPage}
                                </span>{" "}
                                of{" "}
                                <span className="font-bold text-slate-800">
                                    {lastPage}
                                </span>
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5">
                                {paginationLinks.map((link, index) => {
                                    const isPrevious =
                                        index === 0 &&
                                        link.label.toLowerCase().includes("previous");
                                    const isNext =
                                        index === paginationLinks.length - 1 &&
                                        link.label.toLowerCase().includes("next");

                                    return (
                                        <button
                                            key={`${link.label}-${index}`}
                                            type="button"
                                            disabled={!link.url || link.active}
                                            onClick={() => {
                                                if (link.url) {
                                                    router.get(
                                                        link.url,
                                                        {},
                                                        {
                                                            preserveState: true,
                                                            preserveScroll: true,
                                                        },
                                                    );
                                                }
                                            }}
                                            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition ${
                                                link.active
                                                    ? "border-emerald-700 bg-emerald-700 text-white"
                                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            } disabled:cursor-not-allowed disabled:opacity-40`}
                                        >
                                            {isPrevious ? (
                                                <FaChevronLeft />
                                            ) : isNext ? (
                                                <FaNext />
                                            ) : (
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Create / Edit modal */}
                    {(modal === "create" || modal === "edit") && (
                        <Modal
                            title={
                                modal === "create"
                                    ? "Add Municipality"
                                    : "Edit Municipality"
                            }
                            subtitle={
                                modal === "create"
                                    ? "Enter the details for a new municipality."
                                    : "Update the municipality information below."
                            }
                            onClose={closeModal}
                        >
                            <form onSubmit={submit} className="space-y-5">
                                <div>
                                    <label className={labelClass}>
                                        Municipality Name{" "}
                                        <span className="text-rose-500">*</span>
                                    </label>

                                    <div className="relative">
                                        <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            autoFocus
                                            maxLength={150}
                                            value={data.municipality}
                                            onChange={(event) =>
                                                setData(
                                                    "municipality",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="e.g. Kapatagan"
                                            className={`${inputClass} pl-11 ${
                                                errors.municipality
                                                    ? "border-rose-400"
                                                    : ""
                                            }`}
                                        />
                                    </div>
                                    {errorFor("municipality")}
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Region{" "}
                                        <span className="text-rose-500">*</span>
                                    </label>

                                    <div className="relative">
                                        <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            maxLength={150}
                                            value={data.region}
                                            onChange={(event) =>
                                                setData(
                                                    "region",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="e.g. Northern Mindanao"
                                            className={`${inputClass} pl-11 ${
                                                errors.region
                                                    ? "border-rose-400"
                                                    : ""
                                            }`}
                                        />
                                    </div>
                                    {errorFor("region")}
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className={labelClass}>
                                            Zipcode
                                        </label>

                                        <div className="relative">
                                            <FaHashtag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                maxLength={10}
                                                value={data.zipcode}
                                                onChange={(event) =>
                                                    setData(
                                                        "zipcode",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="e.g. 9214"
                                                className={`${inputClass} pl-11`}
                                            />
                                        </div>
                                        {errorFor("zipcode")}
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            Status{" "}
                                            <span className="text-rose-500">*</span>
                                        </label>

                                        <select
                                            value={data.status}
                                            onChange={(event) =>
                                                setData(
                                                    "status",
                                                    event.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        >
                                            <option value="Active">
                                                Active
                                            </option>
                                            <option value="Inactive">
                                                Inactive
                                            </option>
                                        </select>
                                        {errorFor("status")}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                                    <div className="flex items-start gap-3">
                                        <FaMapMarkedAlt className="mt-0.5 text-emerald-700" />
                                        <div>
                                            <p className="text-sm font-bold text-emerald-900">
                                                Municipality reference record
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-emerald-800/80">
                                                Keep the municipality name
                                                consistent with other MIADP
                                                records that reference this
                                                location.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={processing}
                                        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processing ? (
                                            <FaSyncAlt className="animate-spin" />
                                        ) : (
                                            <FaSave />
                                        )}
                                        {processing
                                            ? "Saving..."
                                            : modal === "create"
                                              ? "Save Municipality"
                                              : "Update Municipality"}
                                    </button>
                                </div>
                            </form>
                        </Modal>
                    )}

                    {/* View details modal */}
                    {modal === "details" && selected && (
                        <Modal
                            title="Municipality Details"
                            subtitle="View the registered municipality information."
                            onClose={closeModal}
                        >
                            {detailsLoading ? (
                                <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
                                    <FaSyncAlt className="animate-spin text-emerald-600" />
                                    Loading details...
                                </div>
                            ) : (
                                <>
                                    <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-950 to-teal-800 p-6 text-white">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                                            <FaBuilding className="text-2xl" />
                                        </div>

                                        <h3 className="mt-4 text-2xl font-extrabold">
                                            {selected.municipality}
                                        </h3>

                                        <p className="mt-1 text-sm text-emerald-100">
                                            Municipality ID: {selected.id}
                                        </p>

                                        <div className="mt-4">
                                            <StatusBadge
                                                status={selected.status}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4">
                                            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                                <FaMapMarkerAlt />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Region
                                                </p>
                                                <p className="mt-1 font-bold text-slate-800">
                                                    {selected.region}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4">
                                            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                                                <FaHashtag />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Zipcode
                                                </p>
                                                <p className="mt-1 font-bold text-slate-800">
                                                    {selected.zipcode || "Not provided"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div className="rounded-xl bg-slate-50 p-4">
                                                <p className="text-xs text-slate-400">
                                                    Date Created
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-slate-700">
                                                    {selected.created_at
                                                        ? new Date(
                                                              selected.created_at,
                                                          ).toLocaleDateString()
                                                        : "—"}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-slate-50 p-4">
                                                <p className="text-xs text-slate-400">
                                                    Last Updated
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-slate-700">
                                                    {selected.updated_at
                                                        ? new Date(
                                                              selected.updated_at,
                                                          ).toLocaleDateString()
                                                        : "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                                        >
                                            Close
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                startEdit(selected)
                                            }
                                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
                                        >
                                            <FaEdit />
                                            Edit Record
                                        </button>
                                    </div>
                                </>
                            )}
                        </Modal>
                    )}

                    {/* Delete confirmation modal */}
                    {deleteTarget && (
                        <Modal
                            title="Delete Municipality"
                            subtitle="Confirm that you want to remove this record."
                            onClose={() => setDeleteTarget(null)}
                        >
                            <div className="text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                                    <FaTrash className="text-2xl" />
                                </div>

                                <h3 className="mt-5 text-lg font-extrabold text-slate-800">
                                    Are you sure?
                                </h3>

                                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                                    You are about to delete{" "}
                                    <strong className="text-slate-800">
                                        {deleteTarget.municipality}
                                    </strong>
                                    . This action cannot be undone.
                                </p>

                                <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDeleteTarget(null)
                                        }
                                        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={confirmDelete}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700"
                                    >
                                        <FaTrash />
                                        Confirm Delete
                                    </button>
                                </div>
                            </div>
                        </Modal>
                    )}
                </div>
            </div>
        </Layout>
    );
}
