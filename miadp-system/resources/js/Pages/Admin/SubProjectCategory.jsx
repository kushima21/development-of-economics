import { Head, router, useForm, usePage } from "@inertiajs/react";
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
    FaChevronRight,
    FaHome,
    FaBuilding,
    FaAlignLeft,
} from "react-icons/fa";

const emptyForm = {
    name: "",
    description: "",
    information: "",
    status: "Active",
};

const statusStyles = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Inactive: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function SubProjectCategory() {
    const {
        categories = [],
        filters = { search: "", status: "All" },
        summary = { total: 0, active: 0, inactive: 0 },
        flash = {},
    } = usePage().props;

    const [search, setSearch] = useState(filters.search ?? "");
    const [statusFilter, setStatusFilter] = useState(filters.status ?? "All");
    const [modal, setModal] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [notice, setNotice] = useState("");

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        clearErrors,
        reset,
    } = useForm(emptyForm);

    useEffect(() => {
        setSearch(filters.search ?? "");
        setStatusFilter(filters.status ?? "All");
    }, [filters.search, filters.status]);

    useEffect(() => {
        if (!flash.success && !flash.error) return;
        setNotice(flash.error || flash.success);
        const timer = window.setTimeout(() => setNotice(""), 4500);
        return () => window.clearTimeout(timer);
    }, [flash.success, flash.error]);

    const closeModal = () => {
        setModal(null);
        setSelectedCategory(null);
        reset();
        clearErrors();
    };

    const openAddModal = () => {
        reset();
        clearErrors();
        setSelectedCategory(null);
        setModal("add");
    };

    const openEditModal = (category) => {
        reset();
        clearErrors();
        setSelectedCategory(category);
        setData({
            name: category.name ?? "",
            description: category.description ?? "",
            information: category.information ?? "",
            status: category.status ?? "Active",
        });
        setModal("edit");
    };

    const openViewModal = (category) => {
        setSelectedCategory(category);
        setModal("view");
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setData(name, value);
        if (errors[name]) clearErrors(name);
    };

    const handleSearch = (event) => {
        event.preventDefault();
        router.get(
            "/subprojectcategory",
            { search: search.trim(), status: statusFilter },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("All");
        router.get("/subprojectcategory", {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        clearErrors();
        const options = {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        };
        if (modal === "edit" && selectedCategory) {
            put(`/subprojectcategory/${selectedCategory.id}`, options);
        } else {
            post("/subprojectcategory", options);
        }
    };

    const handleDelete = (category) => {
        if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) return;
        router.delete(`/subprojectcategory/${category.id}`, { preserveScroll: true });
    };

    return (
        <Layout>
            <Head title="Subproject Categories" />

            <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
                <div className="mx-auto max-w-[1440px] space-y-6">
                    {/* Breadcrumb navigation */}
                    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
                        <a href="/" className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 font-medium text-slate-500 transition hover:bg-white hover:text-emerald-700">
                            <FaHome className="text-emerald-600" /> Home
                        </a>
                        <FaChevronRight className="text-[10px] text-slate-300" />
                        <span className="inline-flex items-center gap-2 px-1 py-1.5 text-slate-500">
                            <FaBuilding className="text-slate-400" /> MIADP Management
                        </span>
                        <FaChevronRight className="text-[10px] text-slate-300" />
                        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 font-bold text-emerald-800" aria-current="page">
                            Subproject Categories
                        </span>
                    </nav>

                    {/* Page hero */}
                    <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-5 py-7 shadow-xl shadow-emerald-950/10 sm:px-8 sm:py-9">
                        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[28px] border-white/5" />
                        <div className="pointer-events-none absolute -bottom-28 right-32 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
                        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-50">
                                    <FaLayerGroup /> MIADP Reference Data
                                </div>
                                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                                    Subproject Categories
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80 sm:text-base">
                                    Manage the main categories used to organize MIADP infrastructure subprojects and keep reference records consistent.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2.5 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-emerald-900 shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-white/30"
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 transition group-hover:bg-emerald-200"><FaPlus /></span>
                                Add Category
                            </button>
                        </div>
                        <div className="relative mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-xs font-medium text-emerald-50/75">
                            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Reference data management</span>
                            <span className="hidden h-1 w-1 rounded-full bg-white/40 sm:block" />
                            <span>Create, review, and maintain category records</span>
                        </div>
                    </section>

                    {/* Flash notification */}
                    {notice && (
                        <div role="status" className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${flash.error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                            {flash.error ? <FaExclamationCircle className="mt-0.5 shrink-0" /> : <FaCheckCircle className="mt-0.5 shrink-0" />}
                            <p className="flex-1">{notice}</p>
                            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification" className="rounded-lg p-1.5 transition hover:bg-white/70"><FaTimes /></button>
                        </div>
                    )}

                    {/* Summary cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <SummaryCard title="Total Categories" value={summary.total ?? categories.length} description="All registered categories" icon={<FaLayerGroup />} iconClass="bg-blue-50 text-blue-600" />
                        <SummaryCard title="Active Categories" value={summary.active ?? 0} description="Available for use" icon={<FaCheckCircle />} iconClass="bg-emerald-50 text-emerald-600" />
                        <SummaryCard title="Inactive Categories" value={summary.inactive ?? 0} description="Currently unavailable" icon={<FaBan />} iconClass="bg-amber-50 text-amber-600" />
                    </div>

                    {/* Records panel */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]">
                        <div className="border-b border-slate-100 px-5 py-6 sm:px-6">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-bold text-slate-900">Category Records</h2>
                                <p className="text-sm text-slate-500">Search, filter, view, and maintain category information.</p>
                            </div>
                            <form onSubmit={handleSearch} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <div className="relative sm:col-span-2 lg:col-span-3">
                                    <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search category name, description, information..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
                                </div>
                                <div className="relative">
                                    <FaFilter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10">
                                        <option value="All">All Statuses</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                                    <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"><FaSearch /> Search</button>
                                    <button type="button" onClick={resetFilters} title="Reset filters" aria-label="Reset filters" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"><FaSyncAlt /><span className="sm:hidden lg:inline">Reset</span></button>
                                </div>
                            </form>
                        </div>

                        <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <p>Showing <strong className="text-slate-800">{categories.length}</strong> matching {categories.length === 1 ? "category" : "categories"}</p>
                            <p>Types are managed separately in the Type of Subproject module.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[950px] text-left">
                                <thead className="bg-slate-50/95">
                                    <tr className="border-b border-slate-200">
                                        <th className="w-16 px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">#</th>
                                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Category Name</th>
                                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
                                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Information</th>
                                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                        <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {categories.length > 0 ? categories.map((category, index) => (
                                        <tr key={category.id} className="transition-colors duration-150 hover:bg-emerald-50/40">
                                            <td className="px-5 py-5 text-sm font-medium text-slate-400">{index + 1}</td>
                                            <td className="px-5 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><FaRoad /></div>
                                                    <div className="min-w-0"><p className="font-bold text-slate-800">{category.name}</p><p className="mt-1 text-xs text-slate-400">Category ID: {category.id}</p></div>
                                                </div>
                                            </td>
                                            <td className="max-w-xs px-5 py-5 text-sm leading-5 text-slate-600"><p className="line-clamp-3">{category.description || "No description provided."}</p></td>
                                            <td className="max-w-xs px-5 py-5 text-sm leading-5 text-slate-500"><p className="line-clamp-3">{category.information || "—"}</p></td>
                                            <td className="px-5 py-5"><StatusBadge status={category.status} /></td>
                                            <td className="px-5 py-5"><div className="flex items-center justify-end gap-1.5">
                                                <ActionButton title="View category" onClick={() => openViewModal(category)} className="text-blue-600 hover:bg-blue-50"><FaEye /></ActionButton>
                                                <ActionButton title="Edit category" onClick={() => openEditModal(category)} className="text-amber-600 hover:bg-amber-50"><FaEdit /></ActionButton>
                                                <ActionButton title="Delete category" onClick={() => handleDelete(category)} className="text-rose-600 hover:bg-rose-50"><FaTrash /></ActionButton>
                                            </div></td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={6} className="px-5 py-16 text-center">
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><FaLayerGroup className="text-2xl" /></div>
                                            <h3 className="mt-4 font-bold text-slate-800">No categories found</h3>
                                            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Try changing your search or filters, or add your first category.</p>
                                            <button type="button" onClick={openAddModal} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"><FaPlus /> Add Category</button>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <span>MIADP Infrastructure Subproject Management</span>
                            <span>Total registered categories: <strong className="text-slate-700">{summary.total ?? categories.length}</strong></span>
                        </div>
                    </section>
                </div>
            </main>

            {/* Add / Edit modal */}
            {(modal === "add" || modal === "edit") && (
                <Modal title={modal === "add" ? "Add Subproject Category" : "Edit Subproject Category"} subtitle={modal === "add" ? "Enter the information for the new category." : "Update the selected category details."} onClose={closeModal}>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-5 px-5 py-5 sm:px-6">
                            <div>
                                <label htmlFor="category-name" className="mb-2 block text-sm font-bold text-slate-700">Category Name <span className="text-rose-500">*</span></label>
                                <input id="category-name" name="name" type="text" value={data.name} onChange={handleChange} maxLength={255} required placeholder="e.g. Access Road" className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 ${errors.name ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-emerald-500"}`} />
                                <FieldError message={errors.name} />
                            </div>
                            <div>
                                <label htmlFor="category-description" className="mb-2 block text-sm font-bold text-slate-700">Description <span className="text-rose-500">*</span></label>
                                <textarea id="category-description" name="description" value={data.description} onChange={handleChange} rows={3} required maxLength={5000} placeholder="Provide a brief description of this category..." className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 ${errors.description ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-emerald-500"}`} />
                                <FieldError message={errors.description} />
                            </div>
                            <div>
                                <label htmlFor="category-information" className="mb-2 block text-sm font-bold text-slate-700">Additional Information <span className="text-rose-500">*</span></label>
                                <textarea id="category-information" name="information" value={data.information} onChange={handleChange} rows={4} required maxLength={20000} placeholder="Enter scope, coverage, guidelines, or other relevant information..." className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 ${errors.information ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-emerald-500"}`} />
                                <FieldError message={errors.information} />
                            </div>
                            <div>
                                <label htmlFor="category-status" className="mb-2 block text-sm font-bold text-slate-700">Status <span className="text-rose-500">*</span></label>
                                <select id="category-status" name="status" value={data.status} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10">
                                    <option value="Active">Active</option><option value="Inactive">Inactive</option>
                                </select>
                                <FieldError message={errors.status} />
                            </div>
                            <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                                <FaInfoCircle className="mt-1 shrink-0" />
                                <p>Categories define the parent grouping for types managed in the <strong>Type of Subproject</strong> module. For example, an Access Road category may contain Farm-to-Market Road or Bridge types, depending on your program's classification.</p>
                            </div>
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                            <button type="button" onClick={closeModal} disabled={processing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"><FaTimes /> Cancel</button>
                            <button type="submit" disabled={processing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60">
                                {processing ? <FaSyncAlt className="animate-spin" /> : <FaSave />}{processing ? "Saving..." : modal === "add" ? "Save Category" : "Update Category"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* View modal */}
            {modal === "view" && selectedCategory && (
                <Modal title="Category Details" subtitle="Review the complete information for this category." onClose={closeModal}>
                    <div className="space-y-5 px-5 py-5 sm:px-6">
                        <div className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-xl text-white shadow-lg shadow-emerald-600/20"><FaRoad /></div>
                            <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Subproject Category</p><h3 className="mt-1 break-words text-xl font-extrabold text-slate-900">{selectedCategory.name}</h3><p className="mt-2 text-sm text-slate-500">Category ID: {selectedCategory.id}</p></div>
                            <StatusBadge status={selectedCategory.status} />
                        </div>
                        <DetailField label="Description" value={selectedCategory.description} icon={<FaAlignLeft />} />
                        <DetailField label="Additional Information" value={selectedCategory.information} icon={<FaInfoCircle />} />
                        <div className="rounded-xl border border-slate-200 p-4">
                            <h4 className="text-sm font-bold text-slate-800">Related Types</h4>
                            <p className="mt-2 text-sm leading-6 text-slate-500">Manage the specific infrastructure types associated with this category in the Type of Subproject module. Example types depend on your official MIADP classification.</p>
                        </div>
                    </div>
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <button type="button" onClick={closeModal} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100"><FaTimes /> Close</button>
                        <button type="button" onClick={() => openEditModal(selectedCategory)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"><FaEdit /> Edit Category</button>
                    </div>
                </Modal>
            )}
        </Layout>
    );
}

function SummaryCard({ title, value, description, icon, iconClass }) {
    return (
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-950/[0.05]">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-500">{title}</p><p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{Number(value ?? 0).toLocaleString()}</p><p className="mt-2 text-xs text-slate-400">{description}</p></div><div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg transition group-hover:scale-105 ${iconClass}`}>{icon}</div></div>
        </div>
    );
}

function StatusBadge({ status }) {
    const active = status === "Active";
    return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${statusStyles[status] || statusStyles.Inactive}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />{status || "Unknown"}</span>;
}

function ActionButton({ title, onClick, className = "", children }) {
    return <button type="button" title={title} aria-label={title} onClick={onClick} className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent transition duration-150 hover:border-current/10 focus:outline-none focus:ring-4 focus:ring-slate-200 ${className}`}>{children}</button>;
}

function FieldError({ message }) {
    if (!message) return null;
    return <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-rose-600"><FaExclamationCircle className="mt-0.5 shrink-0" /><span>{message}</span></p>;
}

function DetailField({ label, value, icon }) {
    return <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{icon && <span className="text-emerald-600">{icon}</span>}{label}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{value || "No information provided."}</p></div>;
}

function Modal({ title, subtitle, onClose, children }) {
    useEffect(() => {
        const handleKeyDown = (event) => { if (event.key === "Escape") onClose(); };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-md sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <div role="dialog" aria-modal="true" aria-labelledby="category-modal-title" className="my-auto flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20 sm:rounded-3xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50/50 px-5 py-5 sm:px-6"><div><h2 id="category-modal-title" className="text-lg font-extrabold text-slate-900 sm:text-xl">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</p></div><button type="button" onClick={onClose} aria-label="Close modal" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200"><FaTimes /></button></div>
                <div className="overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}
