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
    FaSyncAlt,
    FaExclamationCircle,
    FaSave,
    FaFilter,
    FaHome,
    FaChevronRight,
    FaBuilding,
    FaMapMarkerAlt,
    FaUserTie,
    FaMoneyBillWave,
    FaFileAlt,
    FaChevronLeft,
    FaListAlt,
    FaCheck,
    FaInfoCircle,
} from "react-icons/fa";

/* =========================================================
   CONSTANTS
========================================================= */

const BASE_URL = "/subproject";

const INITIAL_DATA = {
    subproject_code: "",
    subproject_title: "",
    subproject_category_id: "",
    type_of_sp_id: "",
    subproject_location: "",
    subproject_proponent: "",
    subject_category: "",
    project_scale_dimension: "",
    total_project_cost: "",
    status: "Draft",
};

const STATUS_OPTIONS = [
    { value: "Draft", label: "Draft" },
    { value: "Submitted", label: "Submitted" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" },
];

const INPUT_CLASS =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";

const STATUS_STYLES = {
    Draft: "bg-slate-100 text-slate-700 ring-slate-200",
    Submitted: "bg-amber-50 text-amber-700 ring-amber-200",
    Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};

/* =========================================================
   HELPERS
========================================================= */

const money = (value) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const formatNumber = (value) =>
    new Intl.NumberFormat("en-PH").format(Number(value) || 0);

const getCategoryId = (type) =>
    String(
        type?.subproject_id ??
        type?.subproject_category_id ??
        type?.category?.subproject_id ??
        type?.category?.id ??
        ""
    );

const getCategoryName = (type) =>
    type?.category?.category_name ||
    type?.category?.subproject_name ||
    type?.category?.name ||
    type?.subproject?.category_name ||
    type?.subproject?.subproject_name ||
    type?.subproject_name ||
    "Unnamed Category";

const getTypeName = (type) =>
    type?.type_subproject_name || "Unnamed Type";

const getProjectType = (project, types = []) => {
    const matchingType = types.find(
        (type) =>
            String(type.type_of_sp_id) ===
            String(project?.type_of_sp_id)
    );

    return (
        matchingType ||
        project?.type_of_subproject ||
        project?.typeOfSubproject ||
        null
    );
};

const getProjectCategoryName = (project, types = []) => {
    const type = getProjectType(project, types);

    return type ? getCategoryName(type) : "Not assigned";
};

const getErrorMessage = (error) => {
    if (Array.isArray(error)) {
        return error[0] || "";
    }

    return error || "";
};

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function StatusBadge({ status }) {
    const currentStatus = status || "Draft";

    return (
        <span
            className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                STATUS_STYLES[currentStatus] || STATUS_STYLES.Draft
            }`}
        >
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
            {currentStatus}
        </span>
    );
}

function Field({ label, error, required = false, children }) {
    const errorMessage = getErrorMessage(error);

    return (
        <div className="min-w-0 space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
                {label}

                {required && (
                    <span className="ml-1 text-rose-500">*</span>
                )}
            </label>

            {children}

            {errorMessage && (
                <p className="flex items-start gap-1 text-xs leading-5 text-rose-600">
                    <FaExclamationCircle className="mt-0.5 shrink-0" />
                    <span>{errorMessage}</span>
                </p>
            )}
        </div>
    );
}

function Modal({
    title,
    subtitle,
    onClose,
    children,
    wide = false,
}) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`flex max-h-[94vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
                    wide ? "max-w-5xl" : "max-w-xl"
                }`}
            >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-7">
                    <div className="min-w-0">
                        <h2 className="text-lg font-extrabold text-slate-900">
                            {title}
                        </h2>

                        {subtitle && (
                            <p className="mt-1 text-sm leading-5 text-slate-500">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="overflow-y-auto px-5 py-5 sm:px-7">
                    {children}
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    color = "emerald",
}) {
    const colors = {
        emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        blue: "bg-blue-50 text-blue-700 ring-blue-100",
        amber: "bg-amber-50 text-amber-700 ring-amber-100",
        violet: "bg-violet-50 text-violet-700 ring-violet-100",
        rose: "bg-rose-50 text-rose-700 ring-rose-100",
    };

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                        {formatNumber(value)}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        {description}
                    </p>
                </div>

                <div
                    className={`shrink-0 rounded-xl p-3 ring-1 ${
                        colors[color] || colors.emerald
                    }`}
                >
                    <Icon className="text-xl" />
                </div>
            </div>
        </div>
    );
}

function SectionHeading({ icon: Icon, title, description }) {
    return (
        <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                <Icon />
            </div>

            <div>
                <h3 className="font-extrabold text-slate-900">
                    {title}
                </h3>

                {description && (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}

function EmptyState({ onCreate }) {
    return (
        <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-2xl text-slate-400">
                <FaLayerGroup />
            </div>

            <h3 className="mt-4 font-bold text-slate-800">
                No subprojects found
            </h3>

            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                No records match your current search. Add a subproject or
                change your search filters.
            </p>

            <button
                type="button"
                onClick={onCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
                <FaPlus />
                Add Subproject
            </button>
        </div>
    );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function SubProject({
    subprojects,
    typesOfSubproject = [],
    filters = {},
    summary = {},
}) {
    const { flash = {} } = usePage().props;

    /* ---------------- Modal state ---------------- */

    const [showForm, setShowForm] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [viewProject, setViewProject] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    /* ---------------- Filter state ---------------- */

    const [search, setSearch] = useState(filters.search || "");
    const [statusFilter, setStatusFilter] = useState(
        filters.status || ""
    );

    /* ---------------- Inertia form ---------------- */

    const form = useForm({ ...INITIAL_DATA });

    /* =====================================================
       CATEGORY OPTIONS
    ===================================================== */

    const categories = useMemo(() => {
        const uniqueCategories = new Map();

        typesOfSubproject.forEach((type) => {
            const categoryId = getCategoryId(type);

            if (!categoryId) {
                return;
            }

            uniqueCategories.set(categoryId, {
                id: categoryId,
                name: getCategoryName(type),
            });
        });

        return Array.from(uniqueCategories.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }, [typesOfSubproject]);

    /* =====================================================
       FILTER TYPES BY SELECTED CATEGORY
    ===================================================== */

    const availableTypes = useMemo(() => {
        if (!form.data.subproject_category_id) {
            return [];
        }

        return typesOfSubproject.filter(
            (type) =>
                getCategoryId(type) ===
                String(form.data.subproject_category_id)
        );
    }, [
        typesOfSubproject,
        form.data.subproject_category_id,
    ]);

    /* =====================================================
       FINANCING CALCULATIONS
    ===================================================== */

    const totalCost = Math.max(
        0,
        Number(form.data.total_project_cost) || 0
    );

    const worldBankShare = Math.round(totalCost * 0.8 * 100) / 100;
    const gopShare = Math.round(totalCost * 0.1 * 100) / 100;

    // Assign rounding differences to LGU to preserve the total.
    const lguShare =
        Math.round((totalCost - worldBankShare - gopShare) * 100) / 100;

    const allocatedTotal = worldBankShare + gopShare + lguShare;

    /* =====================================================
       CREATE PROJECT
    ===================================================== */

    const openCreate = () => {
        setSelectedProject(null);
        setViewProject(null);

        form.reset();
        form.clearErrors();
        form.setData({ ...INITIAL_DATA });

        setShowForm(true);
    };

    /* =====================================================
       EDIT PROJECT
    ===================================================== */

    const openEdit = (project) => {
        const projectType = getProjectType(
            project,
            typesOfSubproject
        );

        const categoryId = projectType
            ? getCategoryId(projectType)
            : "";

        setSelectedProject(project);
        setViewProject(null);

        form.clearErrors();

        form.setData({
            subproject_code: project.subproject_code || "",
            subproject_title: project.subproject_title || "",
            subproject_category_id: categoryId,
            type_of_sp_id: String(project.type_of_sp_id || ""),
            subproject_location: project.subproject_location || "",
            subproject_proponent: project.subproject_proponent || "",
            subject_category: project.subject_category || "",
            project_scale_dimension:
                project.project_scale_dimension || "",
            total_project_cost: project.total_project_cost ?? "",
            status: project.status || "Draft",
        });

        setShowForm(true);
    };

    /* =====================================================
       CLOSE FORM
    ===================================================== */

    const closeForm = () => {
        if (form.processing) {
            return;
        }

        setShowForm(false);
        setSelectedProject(null);
        form.clearErrors();
    };

    /* =====================================================
       CHANGE CATEGORY
    ===================================================== */

    const changeCategory = (categoryId) => {
        form.setData((previousData) => ({
            ...previousData,
            subproject_category_id: categoryId,
            type_of_sp_id: "",
        }));

        form.clearErrors("subproject_category_id");
        form.clearErrors("type_of_sp_id");
    };

    /* =====================================================
       CHANGE TYPE
    ===================================================== */

    const changeType = (typeId) => {
        form.setData("type_of_sp_id", typeId);
        form.clearErrors("type_of_sp_id");
    };

    /* =====================================================
       SAVE PROJECT
    ===================================================== */

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,

            onSuccess: () => {
                setShowForm(false);
                setSelectedProject(null);
                form.clearErrors();
            },
        };

        if (selectedProject) {
            form.put(
                `${BASE_URL}/${selectedProject.subproject_id}`,
                options
            );
        } else {
            form.post(BASE_URL, options);
        }
    };

    /* =====================================================
       APPLY SEARCH AND FILTERS
    ===================================================== */

    const applyFilters = (event) => {
        event.preventDefault();

        router.get(
            BASE_URL,
            {
                search: search.trim(),
                status: statusFilter,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    /* =====================================================
       RESET FILTERS
    ===================================================== */

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("");

        router.get(
            BASE_URL,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    /* =====================================================
       DELETE PROJECT
    ===================================================== */

    const deleteProject = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(
            `${BASE_URL}/${deleteTarget.subproject_id}`,
            {
                preserveScroll: true,

                onSuccess: () => {
                    setDeleteTarget(null);
                },
            }
        );
    };

    /* =====================================================
       DATA
    ===================================================== */

    const projects = subprojects?.data || [];
    const paginationLinks = subprojects?.links || [];

    /* =====================================================
       PAGE RENDER
    ===================================================== */

    return (
        <Layout>
            <Head title="Subproject Management" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
                <div className="mx-auto max-w-[1440px] space-y-6">

                    {/* =========================================
                        BREADCRUMB
                    ========================================= */}

                    <nav
                        aria-label="Breadcrumb"
                        className="flex flex-wrap items-center gap-2 text-sm"
                    >
                        <Link
                            href="/"
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
                            Subproject
                        </span>
                    </nav>

                    {/* =========================================
                        PAGE HEADER
                    ========================================= */}

                    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-xl sm:p-8">
                        <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />

                        <div className="pointer-events-none absolute -bottom-28 right-1/4 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

                        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-100">
                                    <FaLayerGroup />
                                    MIADP · Project Management
                                </div>

                                <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                                    Subproject Management
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80 sm:text-base">
                                    Register infrastructure subprojects,
                                    connect projects to their categories
                                    and types, and manage project costs,
                                    financing allocations, and status.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-emerald-900 shadow-lg transition hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-white/20"
                            >
                                <FaPlus />
                                Add Subproject
                            </button>
                        </div>
                    </header>

                    {/* =========================================
                        FLASH MESSAGES
                    ========================================= */}

                    {flash.success && (
                        <div
                            role="status"
                            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
                        >
                            <FaCheckCircle className="mt-0.5 shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                    )}

                    {flash.error && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700"
                        >
                            <FaExclamationCircle className="mt-0.5 shrink-0" />
                            <span>{flash.error}</span>
                        </div>
                    )}

                    {/* =========================================
                        SUMMARY CARDS
                    ========================================= */}

                    <section
                        aria-label="Subproject summary"
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                    >
                        <StatCard
                            title="Total Subprojects"
                            value={summary.total}
                            description="All registered subprojects"
                            icon={FaLayerGroup}
                            color="emerald"
                        />

                        <StatCard
                            title="Draft"
                            value={summary.draft}
                            description="Projects in preparation"
                            icon={FaFileAlt}
                            color="blue"
                        />

                        <StatCard
                            title="Submitted"
                            value={summary.submitted}
                            description="Awaiting review"
                            icon={FaListAlt}
                            color="amber"
                        />

                        <StatCard
                            title="Approved"
                            value={summary.approved}
                            description="Approved subprojects"
                            icon={FaCheckCircle}
                            color="violet"
                        />
                    </section>

                    {/* =========================================
                        REGISTERED SUBPROJECTS
                    ========================================= */}

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {/* Search and filter toolbar */}

                        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900">
                                    Registered Subprojects
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Search, inspect, update, or remove
                                    project records.
                                </p>
                            </div>

                            <form
                                onSubmit={applyFilters}
                                className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-2xl"
                            >
                                <div className="relative min-w-0 flex-1">
                                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search ID, title, location, type..."
                                        className={`${INPUT_CLASS} pl-10`}
                                    />
                                </div>

                                <div className="relative sm:w-44">
                                    <FaFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

                                    <select
                                        value={statusFilter}
                                        onChange={(event) =>
                                            setStatusFilter(event.target.value)
                                        }
                                        className={`${INPUT_CLASS} pl-8`}
                                        aria-label="Filter by status"
                                    >
                                        <option value="">
                                            All statuses
                                        </option>

                                        {STATUS_OPTIONS.map((status) => (
                                            <option
                                                key={status.value}
                                                value={status.value}
                                            >
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
                                >
                                    <FaSearch />
                                    Search
                                </button>

                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    title="Reset filters"
                                    aria-label="Reset filters"
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-slate-600 transition hover:bg-slate-50"
                                >
                                    <FaSyncAlt />
                                </button>
                            </form>
                        </div>

                        {/* Table */}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4 font-bold">
                                            Subproject
                                        </th>

                                        <th className="px-5 py-4 font-bold">
                                            Category / Type
                                        </th>

                                        <th className="px-5 py-4 font-bold">
                                            Location
                                        </th>

                                        <th className="px-5 py-4 font-bold">
                                            Proponent
                                        </th>

                                        <th className="px-5 py-4 text-right font-bold">
                                            Project Cost
                                        </th>

                                        <th className="px-5 py-4 font-bold">
                                            Status
                                        </th>

                                        <th className="px-5 py-4 text-center font-bold">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {projects.map((project) => {
                                        const type = getProjectType(
                                            project,
                                            typesOfSubproject
                                        );

                                        return (
                                            <tr
                                                key={project.subproject_id}
                                                className="transition hover:bg-emerald-50/30"
                                            >
                                                {/* Project */}

                                                <td className="px-5 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                                                            <FaBuilding />
                                                        </div>

                                                        <div className="max-w-xs">
                                                            <p className="font-bold text-slate-900">
                                                                {project.subproject_title ||
                                                                    "Untitled Subproject"}
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-400">
                                                                ID:{" "}
                                                                {project.subproject_code ||
                                                                    `SP-${project.subproject_id}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Category and type */}

                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-slate-700">
                                                        {type
                                                            ? getTypeName(type)
                                                            : "Type not assigned"}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {type
                                                            ? getCategoryName(type)
                                                            : "Category not assigned"}
                                                    </p>
                                                </td>

                                                {/* Location */}

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <FaMapMarkerAlt className="shrink-0 text-emerald-600" />

                                                        <span>
                                                            {project.subproject_location ||
                                                                "—"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Proponent */}

                                                <td className="px-5 py-4 text-slate-600">
                                                    {project.subproject_proponent ||
                                                        "—"}
                                                </td>

                                                {/* Cost */}

                                                <td className="px-5 py-4 text-right font-bold tabular-nums text-slate-900">
                                                    {money(
                                                        project.total_project_cost
                                                    )}
                                                </td>

                                                {/* Status */}

                                                <td className="px-5 py-4">
                                                    <StatusBadge
                                                        status={project.status}
                                                    />
                                                </td>

                                                {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Manage / View Subproject */}
                                                    <Link
                                                        href={`/subproject/${project.subproject_id}/management`}
                                                        title="Manage subproject"
                                                        aria-label={`Manage ${project.subproject_title || "subproject"}`}
                                                        className="rounded-lg p-2.5 text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <FaEye />
                                                    </Link>

                                                    {/* Edit Subproject */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(project)}
                                                        title="Edit subproject"
                                                        aria-label="Edit subproject"
                                                        className="rounded-lg p-2.5 text-amber-600 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    >
                                                        <FaEdit />
                                                    </button>

                                                    {/* Delete Subproject */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(project)}
                                                        title="Delete subproject"
                                                        aria-label="Delete subproject"
                                                        className="rounded-lg p-2.5 text-rose-600 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                            </tr>
                                        );
                                    })}

                                    {projects.length === 0 && (
                                        <tr>
                                            <td colSpan={7}>
                                                <EmptyState
                                                    onCreate={openCreate}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* =====================================
                            PAGINATION
                        ===================================== */}

                        {subprojects?.links && (
                            <div className="flex flex-col justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                                <p className="text-sm text-slate-500">
                                    Showing{" "}
                                    <span className="font-bold text-slate-800">
                                        {subprojects.from || 0}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-bold text-slate-800">
                                        {subprojects.to || 0}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-bold text-slate-800">
                                        {subprojects.total || 0}
                                    </span>{" "}
                                    subprojects
                                </p>

                                <div className="flex flex-wrap items-center gap-1">
                                    {paginationLinks.map((link, index) => {
                                        const label = String(link.label)
                                            .replace(/&laquo;/g, "")
                                            .replace(/&raquo;/g, "")
                                            .replace(/&amp;/g, "&")
                                            .trim();

                                        const isPrevious =
                                            /previous/i.test(label);

                                        const isNext = /next/i.test(label);

                                        return (
                                            <button
                                                key={`${index}-${label}`}
                                                type="button"
                                                disabled={
                                                    !link.url ||
                                                    link.active
                                                }
                                                aria-current={
                                                    link.active
                                                        ? "page"
                                                        : undefined
                                                }
                                                onClick={() => {
                                                    if (link.url) {
                                                        router.visit(link.url, {
                                                            preserveScroll: true,
                                                            preserveState: true,
                                                        });
                                                    }
                                                }}
                                                className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                                    link.active
                                                        ? "bg-emerald-700 text-white"
                                                        : link.url
                                                          ? "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                                                          : "cursor-not-allowed text-slate-300"
                                                }`}
                                            >
                                                {isPrevious ? (
                                                    <FaChevronLeft />
                                                ) : isNext ? (
                                                    <FaChevronRight />
                                                ) : (
                                                    label
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* =================================================
                CREATE / EDIT MODAL
            ================================================= */}

            {showForm && (
                <Modal
                    title={
                        selectedProject
                            ? "Update Subproject"
                            : "Register New Subproject"
                    }
                    subtitle="Complete the project details and review the proposed financing allocation."
                    onClose={closeForm}
                    wide
                >
                    <form onSubmit={submit} className="space-y-7">

                        {/* -------------------------------------
                            PROJECT IDENTIFICATION
                        ------------------------------------- */}

                        <section>
                            <SectionHeading
                                icon={FaBuilding}
                                title="Project Identification"
                                description="Enter the project details and select the appropriate category and type."
                            />

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                                <Field
                                    label="Subproject ID"
                                    required
                                    error={form.errors.subproject_code}
                                >
                                    <input
                                        type="text"
                                        value={form.data.subproject_code}
                                        onChange={(event) =>
                                            form.setData(
                                                "subproject_code",
                                                event.target.value
                                            )
                                        }
                                        placeholder="e.g. MIADP-SP-001"
                                        maxLength={50}
                                        className={INPUT_CLASS}
                                    />
                                </Field>

                                <Field
                                    label="Subproject Title"
                                    required
                                    error={form.errors.subproject_title}
                                >
                                    <input
                                        type="text"
                                        value={form.data.subproject_title}
                                        onChange={(event) =>
                                            form.setData(
                                                "subproject_title",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Enter the full project title"
                                        maxLength={255}
                                        className={INPUT_CLASS}
                                    />
                                </Field>

                                {/* Category */}

                                <Field
                                    label="Subproject Category"
                                    required
                                    error={
                                        form.errors.subproject_category_id
                                    }
                                >
                                    <select
                                        value={
                                            form.data.subproject_category_id
                                        }
                                        onChange={(event) =>
                                            changeCategory(
                                                event.target.value
                                            )
                                        }
                                        className={INPUT_CLASS}
                                    >
                                        <option value="">
                                            Select subproject category
                                        </option>

                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>

                                    <p className="text-xs leading-5 text-slate-400">
                                        Choose a category to display its
                                        corresponding subproject types.
                                    </p>
                                </Field>

                                {/* Type */}

                                <Field
                                    label="Type of Subproject"
                                    required
                                    error={form.errors.type_of_sp_id}
                                >
                                    <select
                                        value={form.data.type_of_sp_id}
                                        onChange={(event) =>
                                            changeType(event.target.value)
                                        }
                                        disabled={
                                            !form.data.subproject_category_id
                                        }
                                        className={INPUT_CLASS}
                                    >
                                        <option value="">
                                            {form.data.subproject_category_id
                                                ? "Select type of subproject"
                                                : "Select a category first"}
                                        </option>

                                        {availableTypes.map((type) => (
                                            <option
                                                key={type.type_of_sp_id}
                                                value={type.type_of_sp_id}
                                            >
                                                {getTypeName(type)}
                                            </option>
                                        ))}
                                    </select>

                                    {form.data.type_of_sp_id && (
                                        <p className="mt-1 text-xs font-medium text-emerald-700">
                                            <FaCheck className="mr-1 inline" />
                                            Type selected.
                                        </p>
                                    )}
                                </Field>

                                {/* Status */}

                                <Field
                                    label="Project Status"
                                    required
                                    error={form.errors.status}
                                >
                                    <select
                                        value={form.data.status}
                                        onChange={(event) =>
                                            form.setData(
                                                "status",
                                                event.target.value
                                            )
                                        }
                                        className={INPUT_CLASS}
                                    >
                                        {STATUS_OPTIONS.map((status) => (
                                            <option
                                                key={status.value}
                                                value={status.value}
                                            >
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                {/* Subject category */}

                                <Field
                                    label="Subject Category"
                                    required
                                    error={form.errors.subject_category}
                                >
                                    <input
                                        type="text"
                                        value={form.data.subject_category}
                                        onChange={(event) =>
                                            form.setData(
                                                "subject_category",
                                                event.target.value
                                            )
                                        }
                                        placeholder="e.g. Agriculture, Infrastructure, Livelihood"
                                        maxLength={150}
                                        className={INPUT_CLASS}
                                    />

                                    <p className="text-xs leading-5 text-slate-400">
                                        Enter the main sector or subject
                                        addressed by the project.
                                    </p>
                                </Field>

                                {/* Scale */}

                                <Field
                                    label="Project Scale / Dimension"
                                    error={
                                        form.errors.project_scale_dimension
                                    }
                                >
                                    <input
                                        type="text"
                                        value={
                                            form.data.project_scale_dimension
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                "project_scale_dimension",
                                                event.target.value
                                            )
                                        }
                                        placeholder="e.g. 5 km road, 20-meter bridge"
                                        maxLength={255}
                                        className={INPUT_CLASS}
                                    />
                                </Field>

                                {/* Location */}

                                <Field
                                    label="Subproject Location"
                                    required
                                    error={form.errors.subproject_location}
                                >
                                    <div className="relative">
                                        <FaMapMarkerAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />

                                        <input
                                            type="text"
                                            value={
                                                form.data.subproject_location
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    "subproject_location",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Barangay, municipality, province"
                                            maxLength={255}
                                            className={`${INPUT_CLASS} pl-10`}
                                        />
                                    </div>
                                </Field>

                                {/* Proponent */}

                                <Field
                                    label="Subproject Proponent"
                                    required
                                    error={form.errors.subproject_proponent}
                                >
                                    <div className="relative">
                                        <FaUserTie className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                                        <input
                                            type="text"
                                            value={
                                                form.data.subproject_proponent
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    "subproject_proponent",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Association, LGU, or proponent"
                                            maxLength={255}
                                            className={`${INPUT_CLASS} pl-10`}
                                        />
                                    </div>
                                </Field>
                            </div>

                            {/* Missing categories warning */}

                            {categories.length === 0 && (
                                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                                    <FaInfoCircle className="mt-1 shrink-0" />

                                    <p>
                                        No category options were received.
                                        Check that the Laravel controller
                                        loads the subproject types and their
                                        category relationship.
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* -------------------------------------
                            FINANCING
                        ------------------------------------- */}

                        <section className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
                            <SectionHeading
                                icon={FaMoneyBillWave}
                                title="Project Cost and Financing"
                                description="The proposed allocation is calculated automatically from the total project cost."
                            />

                            <Field
                                label="Total Project Cost (PHP)"
                                required
                                error={form.errors.total_project_cost}
                            >
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                                        ₱
                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.data.total_project_cost}
                                        onChange={(event) =>
                                            form.setData(
                                                "total_project_cost",
                                                event.target.value
                                            )
                                        }
                                        placeholder="0.00"
                                        className={`${INPUT_CLASS} pl-9 text-lg font-bold tabular-nums`}
                                    />
                                </div>
                            </Field>

                            {/* Allocation cards */}

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-blue-100 bg-white p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                                        World Bank · 80%
                                    </p>

                                    <p className="mt-2 break-words text-lg font-black text-slate-900">
                                        {money(worldBankShare)}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-amber-100 bg-white p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                                        GoP · 10%
                                    </p>

                                    <p className="mt-2 break-words text-lg font-black text-slate-900">
                                        {money(gopShare)}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-violet-100 bg-white p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                                        LGU · 10%
                                    </p>

                                    <p className="mt-2 break-words text-lg font-black text-slate-900">
                                        {money(lguShare)}
                                    </p>
                                </div>
                            </div>

                            {/* Total allocation */}

                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-emerald-100 pt-4">
                                <span className="text-sm font-semibold text-slate-600">
                                    Total Allocated
                                </span>

                                <span className="text-lg font-black text-emerald-800">
                                    {money(allocatedTotal)}
                                </span>
                            </div>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                These are calculated display values. Your
                                Laravel controller and database must also
                                calculate and validate the financing shares
                                if you need to save them permanently.
                            </p>
                        </section>

                        {/* -------------------------------------
                            FORM ACTIONS
                        ------------------------------------- */}

                        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={form.processing}
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {form.processing ? (
                                    <FaSyncAlt className="animate-spin" />
                                ) : (
                                    <FaSave />
                                )}

                                {form.processing
                                    ? "Saving..."
                                    : selectedProject
                                      ? "Update Subproject"
                                      : "Save Subproject"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* =================================================
                VIEW DETAILS MODAL
            ================================================= */}

            {viewProject && (
                <Modal
                    title="Subproject Details"
                    subtitle={`Record #${viewProject.subproject_id}`}
                    onClose={() => setViewProject(null)}
                    wide
                >
                    {(() => {
                        const type = getProjectType(
                            viewProject,
                            typesOfSubproject
                        );

                        const total =
                            Number(viewProject.total_project_cost) || 0;

                        const wb =
                            viewProject.world_bank_share != null
                                ? Number(viewProject.world_bank_share)
                                : Math.round(total * 0.8 * 100) / 100;

                        const government =
                            viewProject.gop_share != null
                                ? Number(viewProject.gop_share)
                                : Math.round(total * 0.1 * 100) / 100;

                        const local =
                            viewProject.lgu_share != null
                                ? Number(viewProject.lgu_share)
                                : Math.round(
                                      (total - wb - government) * 100
                                  ) / 100;

                        const details = [
                            [
                                "Subproject ID",
                                viewProject.subproject_code,
                            ],
                            [
                                "Subproject Title",
                                viewProject.subproject_title,
                            ],
                            [
                                "Subproject Category",
                                type
                                    ? getCategoryName(type)
                                    : "Not assigned",
                            ],
                            [
                                "Type of Subproject",
                                type
                                    ? getTypeName(type)
                                    : "Not assigned",
                            ],
                            [
                                "Location",
                                viewProject.subproject_location,
                            ],
                            [
                                "Proponent",
                                viewProject.subproject_proponent,
                            ],
                            [
                                "Subject Category",
                                viewProject.subject_category,
                            ],
                            [
                                "Project Scale / Dimension",
                                viewProject.project_scale_dimension,
                            ],
                        ];

                        const funding = [
                            {
                                label: "World Bank (80%)",
                                value: wb,
                                color: "bg-blue-600",
                            },
                            {
                                label: "GoP (10%)",
                                value: government,
                                color: "bg-amber-500",
                            },
                            {
                                label: "LGU (10%)",
                                value: local,
                                color: "bg-violet-600",
                            },
                        ];

                        return (
                            <div className="space-y-6">

                                {/* Project overview */}

                                <div className="flex flex-col justify-between gap-3 rounded-2xl bg-emerald-50 p-5 sm:flex-row sm:items-center">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                                            Subproject
                                        </p>

                                        <h3 className="mt-2 break-words text-xl font-black text-slate-900">
                                            {viewProject.subproject_title}
                                        </h3>

                                        <p className="mt-2 text-sm text-slate-600">
                                            ID:{" "}
                                            {viewProject.subproject_code ||
                                                `SP-${viewProject.subproject_id}`}
                                        </p>
                                    </div>

                                    <StatusBadge
                                        status={viewProject.status}
                                    />
                                </div>

                                {/* Project information */}

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {details.map(([label, value]) => (
                                        <div
                                            key={label}
                                            className="rounded-xl border border-slate-200 p-4"
                                        >
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                                {label}
                                            </p>

                                            <p className="mt-2 break-words font-semibold text-slate-800">
                                                {value || "Not provided"}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Financial breakdown */}

                                <div className="rounded-2xl border border-slate-200 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                                            <FaMoneyBillWave />
                                        </div>

                                        <div>
                                            <h3 className="font-extrabold text-slate-900">
                                                Financial Breakdown
                                            </h3>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Proposed financing allocation
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-4">
                                        {funding.map((item) => (
                                            <div key={item.label}>
                                                <div className="mb-1.5 flex flex-wrap justify-between gap-2 text-sm">
                                                    <span className="font-medium text-slate-600">
                                                        {item.label}
                                                    </span>

                                                    <span className="font-bold text-slate-900">
                                                        {money(item.value)}
                                                    </span>
                                                </div>

                                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className={`h-full rounded-full ${item.color}`}
                                                        style={{
                                                            width: `${
                                                                total > 0
                                                                    ? Math.min(
                                                                          100,
                                                                          (item.value /
                                                                              total) *
                                                                              100
                                                                      )
                                                                    : 0
                                                            }%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                        <span className="font-bold text-slate-600">
                                            Total Project Cost
                                        </span>

                                        <span className="text-xl font-black text-emerald-800">
                                            {money(total)}
                                        </span>
                                    </div>
                                </div>

                                {/* Edit action */}

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(viewProject)}
                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
                                    >
                                        <FaEdit />
                                        Edit Subproject
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </Modal>
            )}

            {/* =================================================
                DELETE CONFIRMATION MODAL
            ================================================= */}

            {deleteTarget && (
                <Modal
                    title="Delete Subproject"
                    subtitle="Please confirm this action."
                    onClose={() => setDeleteTarget(null)}
                >
                    <div className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                            <FaTrash className="text-xl" />
                        </div>

                        <h3 className="mt-4 font-extrabold text-slate-900">
                            Are you sure you want to delete this record?
                        </h3>

                        <p className="mt-2 break-words text-sm text-slate-500">
                            {deleteTarget.subproject_title}
                        </p>

                        <p className="mt-2 text-xs text-rose-600">
                            This action cannot be undone.
                        </p>

                        <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={deleteProject}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700"
                            >
                                <FaTrash />
                                Delete Subproject
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </Layout>
    );
}