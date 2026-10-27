import { Head, Link, router, useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
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
    FaBan,
    FaSyncAlt,
    FaExclamationCircle,
    FaInfoCircle,
    FaRoad,
    FaSave,
    FaFilter,
    FaBuilding,
    FaChevronDown,
    FaAlignLeft,
    FaHome,
    FaChevronRight,
} from "react-icons/fa";

export default function TypeOfSubproject({
    types = [],
    categories = [],
    filters = {},
    summary = {},
    flash = {},
}) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [statusFilter, setStatusFilter] = useState(filters.status ?? "All");
    const [categoryFilter, setCategoryFilter] = useState(
        String(filters.category_id ?? "All")
    );

    const [modal, setModal] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [notice, setNotice] = useState("");

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        subproject_id: "",
        type_subproject_name: "",
        description: "",
        information: "",
        status: "Active",
    });

    useEffect(() => {
        setSearch(filters.search ?? "");
        setStatusFilter(filters.status ?? "All");
        setCategoryFilter(String(filters.category_id ?? "All"));
    }, [filters.search, filters.status, filters.category_id]);

    useEffect(() => {
        if (flash.success) {
            setNotice(flash.success);
            const timeout = setTimeout(() => setNotice(""), 4500);
            return () => clearTimeout(timeout);
        }

        if (flash.error) {
            setNotice(flash.error);
            const timeout = setTimeout(() => setNotice(""), 4500);
            return () => clearTimeout(timeout);
        }
    }, [flash.success, flash.error]);

    const applyFilters = (event) => {
        event?.preventDefault();

        router.get(
            "/typeofsubproject",
            {
                search: search.trim(),
                status: statusFilter,
                category_id: categoryFilter,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("All");
        setCategoryFilter("All");

        router.get(
            "/typeofsubproject",
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const openCreateModal = () => {
        clearErrors();
        reset();
        setData({
            subproject_id: "",
            type_subproject_name: "",
            description: "",
            information: "",
            status: "Active",
        });
        setSelectedType(null);
        setModal("create");
    };

   const openEditModal = (type) => {
    clearErrors();
    setSelectedType(type);

    setData({
        subproject_id: String(type.subproject_id ?? ""),
        type_subproject_name: type.type_subproject_name ?? "",
        description: type.description ?? "",
        information: type.information ?? "",
        status: type.status ?? "Active",
    });

    setModal("edit");
};

    const openViewModal = (type) => {
        setSelectedType(type);
        setModal("view");
    };

    const closeModal = () => {
        setModal(null);
        setSelectedType(null);
        clearErrors();
        reset();
    };

    const submitForm = (event) => {
        event.preventDefault();

        if (modal === "edit" && selectedType) {
            put(`/typeofsubproject/${selectedType.type_of_sp_id}`, {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
            return;
        }

        post("/typeofsubproject", {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    };

    const deleteType = (type) => {
        const confirmed = window.confirm(
            `Delete "${type.type_subproject_name}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        router.delete(`/typeofsubproject/${type.type_of_sp_id}`, {
            preserveScroll: true,
        });
    };

    const selectedCategoryName = (type) =>
        type.category?.name ?? type.subproject_name ?? "Unassigned";

    return (
        <Layout>
            <Head title="Type of Subproject" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
                <div className="mx-auto max-w-[1440px] space-y-6">
                    {/* Breadcrumb navigation */}
                    <nav
                        aria-label="Breadcrumb"
                        className="flex flex-wrap items-center gap-2 text-sm"
                    >
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 font-semibold text-slate-500 transition hover:bg-white hover:text-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                        >
                            <FaHome className="text-xs" />
                            Home
                        </Link>
                        <FaChevronRight
                            aria-hidden="true"
                            className="text-[10px] text-slate-300"
                        />
                        <span className="rounded-lg px-2 py-1.5 font-medium text-slate-500">
                            MIADP Management
                        </span>
                        <FaChevronRight
                            aria-hidden="true"
                            className="text-[10px] text-slate-300"
                        />
                        <span className="rounded-lg px-2 py-1.5 font-medium text-slate-500">
                            Reference Data
                        </span>
                        <FaChevronRight
                            aria-hidden="true"
                            className="text-[10px] text-slate-300"
                        />
                        <span
                            aria-current="page"
                            className="rounded-lg bg-emerald-50 px-3 py-1.5 font-bold text-emerald-800 ring-1 ring-inset ring-emerald-100"
                        >
                            Type of Subproject
                        </span>
                    </nav>

                    {/* Page header */}
                    <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-5 py-7 shadow-xl shadow-emerald-950/10 sm:px-8 sm:py-9">
                        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[28px] border-white/5" />
                        <div className="pointer-events-none absolute -bottom-28 right-32 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
                        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="max-w-2xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-50">
                                    <FaLayerGroup />
                                    MIADP Management System
                                </div>
                                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                                    Type of Subproject
                                </h1>
                                <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/80 sm:text-base">
                                    Organize infrastructure subproject types, maintain category records, and keep your MIADP reference data accurate.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2.5 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-emerald-900 shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-white/30"
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 transition group-hover:bg-emerald-200">
                                    <FaPlus />
                                </span>
                                Add New Type
                            </button>
                        </div>
                        <div className="relative mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-xs font-medium text-emerald-50/75">
                            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Reference data management</span>
                            <span className="hidden h-1 w-1 rounded-full bg-white/40 sm:block" />
                            <span>Search, review, and update subproject types</span>
                        </div>
                    </section>

                    {/* Flash notification */}
                    {notice && (
                        <div
                            role="status"
                            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${
                                flash.error
                                    ? "border-rose-200 bg-rose-50 text-rose-800"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                            }`}
                        >
                            {flash.error ? (
                                <FaExclamationCircle className="mt-0.5 shrink-0" />
                            ) : (
                                <FaCheckCircle className="mt-0.5 shrink-0" />
                            )}
                            <p className="flex-1">{notice}</p>
                            <button
                                type="button"
                                onClick={() => setNotice("")}
                                aria-label="Dismiss notification"
                                className={`rounded-lg p-1.5 transition ${
                                    flash.error ? "hover:bg-rose-100" : "hover:bg-emerald-100"
                                }`}
                            >
                                <FaTimes />
                            </button>
                        </div>
                    )}

                    {/* Summary cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <SummaryCard
                            title="Total Types"
                            value={summary.total ?? types.length}
                            subtitle="All registered types"
                            icon={<FaLayerGroup />}
                            iconClass="bg-blue-50 text-blue-600"
                        />

                        <SummaryCard
                            title="Active Types"
                            value={summary.active ?? 0}
                            subtitle="Available for use"
                            icon={<FaCheckCircle />}
                            iconClass="bg-emerald-50 text-emerald-600"
                        />

                        <SummaryCard
                            title="Inactive Types"
                            value={summary.inactive ?? 0}
                            subtitle="Currently disabled"
                            icon={<FaBan />}
                            iconClass="bg-rose-50 text-rose-600"
                        />
                    </div>

                    {/* Main content */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]">
                        <div className="border-b border-slate-100 bg-white px-5 py-6 sm:px-6">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-bold text-slate-900">
                                    Registered Subproject Types
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Search, filter, view, or update your
                                    subproject type records.
                                </p>
                            </div>

                            {/* Filters */}
                            <form
                                onSubmit={applyFilters}
                                className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                            >
                                <div className="relative lg:col-span-2">
                                    <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search type, category, description..."
                                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                    />
                                </div>

                                <div className="relative">
                                    <FaBuilding className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        value={categoryFilter}
                                        onChange={(event) =>
                                            setCategoryFilter(event.target.value)
                                        }
                                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                    >
                                        <option value="All">
                                            All Categories
                                        </option>
                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={String(category.id)}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <FaChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                                </div>

                                <div className="relative">
                                    <FaFilter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={(event) =>
                                            setStatusFilter(event.target.value)
                                        }
                                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                    >
                                        <option value="All">All Statuses</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                    <FaChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                                </div>

                                <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4 lg:flex-row lg:justify-end">
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                                    >
                                        <FaSyncAlt />
                                        Reset Filters
                                    </button>

                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm shadow-emerald-700/20 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                                    >
                                        <FaSearch />
                                        Apply Filters
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left">
                                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                                    <tr className="border-b border-slate-200/80">
                                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Subproject Type
                                        </th>
                                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Category
                                        </th>
                                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Description
                                        </th>
                                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Status
                                        </th>
                                        <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {types.length > 0 ? (
                                        types.map((type) => (
                                            <tr
                                                key={type.type_of_sp_id}
                                                className="transition-colors duration-150 hover:bg-emerald-50/40"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                                            <FaRoad />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">
                                                                {
                                                                    type.type_subproject_name
                                                                }
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-400">
                                                                ID:{" "}
                                                                {
                                                                    type.type_of_sp_id
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                                        <FaLayerGroup />
                                                        {selectedCategoryName(type)}
                                                    </span>
                                                </td>

                                                <td className="max-w-sm px-5 py-4">
                                                    <p className="line-clamp-2 text-sm leading-5 text-slate-600">
                                                        {type.description ||
                                                            "No description provided."}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <StatusBadge
                                                        status={type.status}
                                                    />
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <IconButton
                                                            label="View details"
                                                            onClick={() =>
                                                                openViewModal(type)
                                                            }
                                                            className="text-blue-600 hover:bg-blue-50"
                                                        >
                                                            <FaEye />
                                                        </IconButton>

                                                        <IconButton
                                                            label="Edit type"
                                                            onClick={() =>
                                                                openEditModal(type)
                                                            }
                                                            className="text-amber-600 hover:bg-amber-50"
                                                        >
                                                            <FaEdit />
                                                        </IconButton>

                                                        <IconButton
                                                            label="Delete type"
                                                            onClick={() =>
                                                                deleteType(type)
                                                            }
                                                            className="text-rose-600 hover:bg-rose-50"
                                                        >
                                                            <FaTrash />
                                                        </IconButton>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-5 py-16 text-center"
                                            >
                                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                                    <FaLayerGroup className="text-2xl" />
                                                </div>
                                                <h3 className="mt-4 font-bold text-slate-800">
                                                    No subproject types found
                                                </h3>
                                                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                                                    Try changing your search or
                                                    filters, or add your first
                                                    subproject type.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={openCreateModal}
                                                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                                                >
                                                    <FaPlus />
                                                    Add Type
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                                Showing{" "}
                                <strong className="text-slate-700">
                                    {types.length}
                                </strong>{" "}
                                matching {types.length === 1 ? "record" : "records"}
                            </span>
                            <span>
                                Categories:{" "}
                                <strong className="text-slate-700">
                                    {categories.length}
                                </strong>{" "}
                                active options
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit modal */}
            {(modal === "create" || modal === "edit") && (
                <Modal
                    title={
                        modal === "create"
                            ? "Add Type of Subproject"
                            : "Edit Type of Subproject"
                    }
                    subtitle={
                        modal === "create"
                            ? "Register a new infrastructure subproject type."
                            : "Update the details of this subproject type."
                    }
                    onClose={closeModal}
                    wide
                >
                    <form onSubmit={submitForm} className="space-y-5">
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                            <div className="flex gap-3">
                                <FaInfoCircle className="mt-0.5 shrink-0 text-blue-600" />
                                <p className="text-sm leading-6 text-blue-800">
                                    Select the parent category first. The type
                                    you register will be associated with that
                                    category.
                                </p>
                            </div>
                        </div>

                        
<div>
    <label className="mb-2 block text-sm font-bold text-slate-700">
        Subproject Category <span className="text-rose-500">*</span>
    </label>

    <div className="relative">
        <FaLayerGroup className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

        <select
            value={data.subproject_id}
            onChange={(event) =>
                setData("subproject_id", event.target.value)
            }
            className={`w-full appearance-none rounded-xl border bg-white py-3 pl-10 pr-10 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 ${
                errors.subproject_id
                    ? "border-rose-400"
                    : "border-slate-200 focus:border-emerald-500"
            }`}
            required
        >
            <option value="">Select a category</option>

            {categories.map((category) => (
                <option
                    key={category.id}
                    value={String(category.id)}
                >
                    {category.name}
                </option>
            ))}
        </select>

        <FaChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
    </div>

    <FieldError message={errors.subproject_id} />

    {categories.length === 0 && (
        <p className="mt-2 text-xs text-amber-700">
            No active categories are available. Register or activate a
            category before adding a subproject type.
        </p>
    )}
</div>


                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">
                                Type of Subproject Name{" "}
                                <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <FaRoad className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={data.type_subproject_name}
                                    onChange={(event) =>
                                        setData(
                                            "type_subproject_name",
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. Farm-to-Market Road"
                                    maxLength={255}
                                    className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 ${
                                        errors.type_subproject_name
                                            ? "border-rose-400 focus:border-rose-500"
                                            : "border-slate-200 focus:border-emerald-500"
                                    }`}
                                />
                            </div>
                            <FieldError
                                message={errors.type_subproject_name}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">
                                Description{" "}
                                <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={data.description}
                                onChange={(event) =>
                                    setData("description", event.target.value)
                                }
                                placeholder="Enter a short description of this subproject type..."
                                maxLength={5000}
                                className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 ${
                                    errors.description
                                        ? "border-rose-400 focus:border-rose-500"
                                        : "border-slate-200 focus:border-emerald-500"
                                }`}
                            />
                            <FieldError message={errors.description} />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">
                                Additional Information
                            </label>
                            <textarea
                                rows={4}
                                value={data.information}
                                onChange={(event) =>
                                    setData("information", event.target.value)
                                }
                                placeholder="Enter guidelines, technical notes, or other relevant information (optional)..."
                                maxLength={20000}
                                className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 ${
                                    errors.information
                                        ? "border-rose-400 focus:border-rose-500"
                                        : "border-slate-200 focus:border-emerald-500"
                                }`}
                            />
                            <FieldError message={errors.information} />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">
                                Status <span className="text-rose-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {["Active", "Inactive"].map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setData("status", status)}
                                        className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                                            data.status === status
                                                ? status === "Active"
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/10"
                                                    : "border-rose-400 bg-rose-50 text-rose-700 ring-2 ring-rose-500/10"
                                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                        }`}
                                    >
                                        {status === "Active" ? (
                                            <FaCheckCircle />
                                        ) : (
                                            <FaBan />
                                        )}
                                        {status}
                                    </button>
                                ))}
                            </div>
                            <FieldError message={errors.status} />
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                <FaTimes />
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={processing || categories.length === 0}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? (
                                    <FaSyncAlt className="animate-spin" />
                                ) : (
                                    <FaSave />
                                )}
                                {processing
                                    ? "Saving..."
                                    : modal === "create"
                                      ? "Save Type"
                                      : "Update Type"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* View details modal */}
            {modal === "view" && selectedType && (
                <Modal
                    title="Subproject Type Details"
                    subtitle="View the registered information for this type."
                    onClose={closeModal}
                    wide
                >
                    <div className="space-y-5">
                        <div className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-xl text-white shadow-lg shadow-emerald-600/20">
                                <FaRoad />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                                    Type of Subproject
                                </p>
                                <h3 className="mt-1 break-words text-xl font-extrabold text-slate-900">
                                    {selectedType.type_subproject_name}
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    Record ID: {selectedType.type_of_sp_id}
                                </p>
                            </div>
                            <StatusBadge status={selectedType.status} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <DetailField
                                label="Subproject Category"
                                value={selectedCategoryName(selectedType)}
                                icon={<FaLayerGroup />}
                            />
                            <DetailField
                                label="Status"
                                value={selectedType.status}
                                icon={
                                    selectedType.status === "Active" ? (
                                        <FaCheckCircle />
                                    ) : (
                                        <FaBan />
                                    )
                                }
                            />
                            <DetailField
                                label="Created At"
                                value={formatDate(selectedType.created_at)}
                            />
                            <DetailField
                                label="Last Updated"
                                value={formatDate(selectedType.updated_at)}
                            />
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                <FaAlignLeft className="text-emerald-600" />
                                Description
                            </h4>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                {selectedType.description ||
                                    "No description provided."}
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                <FaInfoCircle className="text-emerald-600" />
                                Additional Information
                            </h4>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                {selectedType.information ||
                                    "No additional information provided."}
                            </p>
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                            >
                                <FaTimes />
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => openEditModal(selectedType)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                            >
                                <FaEdit />
                                Edit Type
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </Layout>
    );
}

function SummaryCard({ title, value, subtitle, icon, iconClass }) {
    return (
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-950/[0.05]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-slate-500">
                        {title}
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                        {Number(value ?? 0).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
                </div>
                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg transition group-hover:scale-105 ${iconClass}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const active = status === "Active";

    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                active
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                    : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
            }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-emerald-500" : "bg-rose-500"
                }`}
            />
            {status || "Unknown"}
        </span>
    );
}

function IconButton({ children, label, onClick, className = "" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent transition duration-150 hover:border-current/10 focus:outline-none focus:ring-4 focus:ring-slate-200 ${className}`}
        >
            {children}
        </button>
    );
}

function FieldError({ message }) {
    if (!message) return null;

    return (
        <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-rose-600">
            <FaExclamationCircle className="mt-0.5 shrink-0" />
            <span>{message}</span>
        </p>
    );
}

function DetailField({ label, value, icon }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {icon && <span className="text-emerald-600">{icon}</span>}
                {label}
            </p>
            <p className="mt-2 break-words text-sm font-bold text-slate-800">
                {value || "—"}
            </p>
        </div>
    );
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-md sm:items-center sm:p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="subproject-modal-title"
                className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20 sm:rounded-3xl ${
                    wide ? "max-w-2xl" : "max-w-lg"
                }`}
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50/50 px-5 py-5 sm:px-6">
                    <div>
                        <h2
                            id="subproject-modal-title"
                            className="text-lg font-extrabold text-slate-900 sm:text-xl"
                        >
                            {title}
                        </h2>
                        <p className="mt-1 text-sm leading-5 text-slate-500">
                            {subtitle}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="overflow-y-auto px-5 py-5 sm:px-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}