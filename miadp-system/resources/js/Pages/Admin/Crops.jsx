
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import Layout from "../Layouts/Layout";

export default function Crops() {
    const { crops, filters, summary, flash, errors: pageErrors } = usePage().props;

    const [showModal, setShowModal] = useState(false);
    const [editingCrop, setEditingCrop] = useState(null);
    const [deleteCrop, setDeleteCrop] = useState(null);
    const [search, setSearch] = useState(filters?.search || "");
    const [notification, setNotification] = useState("");

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
        crop: "",
        crop_status: "Active",
    });

    useEffect(() => {
        if (flash?.success) {
            setNotification(flash.success);
            const timer = setTimeout(() => setNotification(""), 3500);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    const cropList = crops?.data || [];

    const filteredCrops = useMemo(() => {
        const term = search.toLowerCase().trim();

        if (!term) return cropList;

        return cropList.filter((item) =>
            item.crop?.toLowerCase().includes(term) ||
            item.crop_status?.toLowerCase().includes(term)
        );
    }, [cropList, search]);

    const openCreateModal = () => {
        setEditingCrop(null);
        reset();
        clearErrors();
        setData({
            crop: "",
            crop_status: "Active",
        });
        setShowModal(true);
    };

    const openEditModal = (crop) => {
        setEditingCrop(crop);
        clearErrors();

        setData({
            crop: crop.crop,
            crop_status: crop.crop_status,
        });

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCrop(null);
        reset();
        clearErrors();
    };

    const submitCrop = (e) => {
        e.preventDefault();

        if (editingCrop) {
            put(`/crops/${editingCrop.crop_id}`, {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        } else {
            post("/crops", {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = () => {
        if (!deleteCrop) return;

        router.delete(`/crops/${deleteCrop.crop_id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteCrop(null),
        });
    };

    const changePage = (url) => {
        if (url) {
            router.visit(url, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    };

    return (
        <Layout>
            <Head title="Crops Management" />

            <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

                {/* PAGE HEADER */}
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                            <span>Management</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-500">Crops</span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                            Crops Management
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Manage and monitor the list of agricultural crops.
                        </p>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98]"
                    >
                        <span className="text-lg">+</span>
                        Add New Crop
                    </button>
                </div>

                {/* SUCCESS NOTIFICATION */}
                {notification && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                            ✓
                        </span>
                        {notification}
                        <button
                            onClick={() => setNotification("")}
                            className="ml-auto text-emerald-700 hover:text-emerald-900"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* SUMMARY CARDS */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                    <SummaryCard
                        title="Total Crops"
                        value={summary?.total ?? 0}
                        description="All registered crops"
                        icon="🌾"
                        color="emerald"
                    />

                    <SummaryCard
                        title="Active Crops"
                        value={summary?.active ?? 0}
                        description="Currently available"
                        icon="🌱"
                        color="blue"
                    />

                    <SummaryCard
                        title="Inactive Crops"
                        value={summary?.inactive ?? 0}
                        description="Currently unavailable"
                        icon="🍂"
                        color="amber"
                    />

                </div>

                {/* TABLE CONTAINER */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Registered Crops
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                View and manage agricultural crop records.
                            </p>
                        </div>

                        <div className="relative w-full sm:max-w-xs">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                ⌕
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search crop or status..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <th className="px-6 py-4">#</th>
                                    <th className="px-6 py-4">Crop Name</th>
                                    <th className="px-6 py-4">Crop Status</th>
                                    <th className="px-6 py-4">Date Created</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredCrops.length > 0 ? (
                                    filteredCrops.map((crop, index) => (
                                        <tr
                                            key={crop.crop_id}
                                            className="transition hover:bg-emerald-50/40"
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-slate-400">
                                                {(crops.current_page - 1) * crops.per_page + index + 1}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                                                        🌾
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">
                                                            {crop.crop}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            Crop ID: {crop.crop_id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <StatusBadge status={crop.crop_status} />
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {crop.created_at
                                                    ? new Date(crop.created_at).toLocaleDateString("en-PH", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })
                                                    : "—"}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(crop)}
                                                        className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() => setDeleteCrop(crop)}
                                                        className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center">
                                            <div className="mb-3 text-4xl">🌱</div>
                                            <p className="font-semibold text-slate-700">
                                                No crops found
                                            </p>
                                            <p className="mt-1 text-sm text-slate-400">
                                                {search
                                                    ? "Try another search keyword."
                                                    : "Start by adding your first crop."}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row">
                        <p className="text-xs text-slate-500">
                            Showing{" "}
                            <span className="font-semibold text-slate-700">
                                {crops?.from ?? 0} - {crops?.to ?? 0}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-slate-700">
                                {crops?.total ?? 0}
                            </span>{" "}
                            records
                        </p>

                        <div className="flex flex-wrap items-center gap-1">
                            {crops?.links?.map((link, index) => (
                                <button
                                    key={index}
                                    disabled={!link.url}
                                    onClick={() => changePage(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`min-w-9 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                        link.active
                                            ? "border-emerald-600 bg-emerald-600 text-white"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    } ${!link.url ? "cursor-not-allowed opacity-40" : ""}`}
                                />
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* CREATE / EDIT MODAL */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

                        {/* MODAL HEADER */}
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
                                    🌾
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">
                                        {editingCrop ? "Edit Crop" : "Add New Crop"}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {editingCrop
                                            ? "Update crop information."
                                            : "Register a new agricultural crop."}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                ×
                            </button>
                        </div>

                        {/* MODAL FORM */}
                        <form onSubmit={submitCrop} className="space-y-5 p-6">

                            {editingCrop && (
                                <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                                    Crop ID: <span className="font-bold text-slate-700">{editingCrop.crop_id}</span>
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Crop Name <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    value={data.crop}
                                    onChange={(e) => setData("crop", e.target.value)}
                                    placeholder="Enter crop name (e.g. Rice, Corn, Coconut)"
                                    autoFocus
                                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:ring-4 focus:ring-emerald-500/10 ${
                                        errors.crop
                                            ? "border-red-400 focus:border-red-500"
                                            : "border-slate-200 focus:border-emerald-500"
                                    }`}
                                />

                                {errors.crop && (
                                    <p className="mt-2 text-xs text-red-500">
                                        {errors.crop}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Crop Status <span className="text-red-500">*</span>
                                </label>

                                <select
                                    value={data.crop_status}
                                    onChange={(e) => setData("crop_status", e.target.value)}
                                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:ring-4 focus:ring-emerald-500/10 ${
                                        errors.crop_status
                                            ? "border-red-400"
                                            : "border-slate-200 focus:border-emerald-500"
                                    }`}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>

                                {errors.crop_status && (
                                    <p className="mt-2 text-xs text-red-500">
                                        {errors.crop_status}
                                    </p>
                                )}
                            </div>

                            {/* MODAL FOOTER */}
                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={processing}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing
                                        ? "Saving..."
                                        : editingCrop
                                            ? "Update Crop"
                                            : "Save Crop"}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteCrop && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">

                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
                            🗑️
                        </div>

                        <h2 className="text-lg font-bold text-slate-800">
                            Delete Crop?
                        </h2>

                        <p className="mt-2 text-sm leading-relaxed text-slate-500">
                            Are you sure you want to delete{" "}
                            <span className="font-bold text-slate-800">
                                {deleteCrop.crop}
                            </span>
                            ? This action cannot be undone.
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setDeleteCrop(null)}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleDelete}
                                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </Layout>
    );
}

/* SUMMARY CARD */
function SummaryCard({ title, value, description, icon, color }) {
    const styles = {
        emerald: "bg-emerald-50 text-emerald-600",
        blue: "bg-blue-50 text-blue-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-800">
                        {value}
                    </h3>
                    <p className="mt-2 text-xs text-slate-400">{description}</p>
                </div>

                <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${styles[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

/* STATUS BADGE */
function StatusBadge({ status }) {
    const active = status === "Active";

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
            }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-emerald-500" : "bg-amber-500"
                }`}
            />
            {status}
        </span>
    );
}
