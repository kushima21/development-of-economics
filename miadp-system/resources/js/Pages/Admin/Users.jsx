
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
    FaUsers,
    FaUserShield,
    FaUserCheck,
    FaUserSlash,
    FaHome,
    FaChevronRight,
    FaBuilding,
    FaMapMarkerAlt,
    FaSave,
    FaFilter,
    FaChevronLeft,
    FaChevronRight as FaNext,
    FaEnvelope,
    FaPhone,
    FaCalendarAlt,
    FaKey,
    FaUser,
    FaCheckCircle,
    FaExclamationCircle,
    FaSyncAlt,
    FaEllipsisH,
} from "react-icons/fa";

const ROLE_OPTIONS = [
    { value: "admin", label: "Administrator", description: "System administration" },
    { value: "miadp", label: "MIADP", description: "MIADP program access" },
    { value: "lgu", label: "LGU", description: "Local government access" },
];

const EMPTY_FORM = {
    fullname: "",
    gender: "",
    birthdate: "",
    municipality_id: "",
    phonenumber: "",
    email: "",
    password: "",
    password_confirmation: "",
    roles: [],
    status: "Active",
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

function Badge({ children, color = "slate" }) {
    const styles = {
        green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        red: "bg-rose-50 text-rose-700 ring-rose-200",
        blue: "bg-blue-50 text-blue-700 ring-blue-200",
        purple: "bg-violet-50 text-violet-700 ring-violet-200",
        amber: "bg-amber-50 text-amber-700 ring-amber-200",
        slate: "bg-slate-100 text-slate-600 ring-slate-200",
    };

    return (
        <span
            className={cx(
                "inline-flex items-center rounded-full px-2.5 py-1",
                "text-[11px] font-bold ring-1 ring-inset",
                styles[color] || styles.slate
            )}
        >
            {children}
        </span>
    );
}

function Field({ label, error, required, children, className = "" }) {
    return (
        <div className={className}>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
                {label}
                {required && <span className="ml-1 text-rose-500">*</span>}
            </label>
            {children}
            {error && (
                <p className="mt-1.5 flex items-start gap-1 text-xs text-rose-600">
                    <FaExclamationCircle className="mt-0.5 shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
}

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 " +
    "text-sm text-slate-800 outline-none transition placeholder:text-slate-400 " +
    "focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

function RoleBadge({ role }) {
    const config = {
        admin: { label: "Admin", color: "purple" },
        miadp: { label: "MIADP", color: "blue" },
        lgu: { label: "LGU", color: "green" },
    };

    const item = config[role] || { label: role, color: "slate" };

    return <Badge color={item.color}>{item.label}</Badge>;
}

function StatCard({ title, value, description, icon: Icon, color }) {
    const colors = {
        green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
        blue: "bg-blue-50 text-blue-600 ring-blue-100",
        purple: "bg-violet-50 text-violet-600 ring-violet-100",
        amber: "bg-amber-50 text-amber-600 ring-amber-100",
    };

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                        {Number(value || 0).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{description}</p>
                </div>
                <div
                    className={cx(
                        "flex h-12 w-12 shrink-0 items-center justify-center",
                        "rounded-2xl ring-1 ring-inset",
                        colors[color]
                    )}
                >
                    <Icon className="text-lg" />
                </div>
            </div>
        </div>
    );
}

function UserModal({
    open,
    onClose,
    editingUser,
    municipalities,
}) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm(EMPTY_FORM);

    useEffect(() => {
        if (!open) return;

        clearErrors();

        if (editingUser) {
            setData({
                fullname: editingUser.fullname || "",
                gender: editingUser.gender || "",
                birthdate: editingUser.birthdate || "",
                municipality_id: editingUser.municipality_id
                    ? String(editingUser.municipality_id)
                    : "",
                phonenumber: editingUser.phonenumber || "",
                email: editingUser.email || "",
                password: "",
                password_confirmation: "",
                roles: editingUser.roles || [],
                status: editingUser.status || "Active",
            });
        } else {
            setData({ ...EMPTY_FORM });
        }
    }, [open, editingUser]);

    useEffect(() => {
        if (!open) return;

        const handleEscape = (event) => {
            if (event.key === "Escape" && !processing) onClose();
        };

        window.addEventListener("keydown", handleEscape);

        return () => window.removeEventListener("keydown", handleEscape);
    }, [open, processing, onClose]);

    if (!open) return null;

    const toggleRole = (role) => {
        const selected = data.roles.includes(role);

        setData(
            "roles",
            selected
                ? data.roles.filter((item) => item !== role)
                : [...data.roles, role]
        );
    };

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        };

        if (editingUser) {
            put(`/users/${editingUser.user_id}`, options);
        } else {
            post("/users", options);
        }
    };

    const passwordError = errors.password || errors.password_confirmation;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !processing) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="user-modal-title"
                className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            >
                <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 px-5 py-6 text-white sm:px-7">
                    <div className="absolute -right-8 -top-16 h-44 w-44 rounded-full bg-white/10" />
                    <div className="absolute -right-2 top-10 h-24 w-24 rounded-full bg-white/10" />

                    <div className="relative flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                                {editingUser ? (
                                    <FaEdit className="text-xl" />
                                ) : (
                                    <FaUser className="text-xl" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
                                    MIADP Management
                                </p>
                                <h2
                                    id="user-modal-title"
                                    className="mt-1 text-xl font-black sm:text-2xl"
                                >
                                    {editingUser ? "Edit User Account" : "Create User Account"}
                                </h2>
                                <p className="mt-1 text-sm text-emerald-50">
                                    {editingUser
                                        ? "Update account information, roles, and status."
                                        : "Register a user and configure their system access."}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            aria-label="Close modal"
                            className="relative rounded-xl p-2 text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 space-y-7 overflow-y-auto p-5 sm:p-7">
                        <section>
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <FaUser />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-800">
                                        Personal Information
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Basic details of the user.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field
                                    label="Full Name"
                                    required
                                    error={errors.fullname}
                                    className="sm:col-span-2"
                                >
                                    <input
                                        className={inputClass}
                                        value={data.fullname}
                                        onChange={(e) => setData("fullname", e.target.value)}
                                        placeholder="Enter full name"
                                        autoComplete="name"
                                        required
                                    />
                                </Field>

                                <Field label="Gender" error={errors.gender}>
                                    <select
                                        className={inputClass}
                                        value={data.gender}
                                        onChange={(e) => setData("gender", e.target.value)}
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </Field>

                                <Field label="Birthdate" error={errors.birthdate}>
                                    <input
                                        type="date"
                                        max={new Date().toISOString().slice(0, 10)}
                                        className={inputClass}
                                        value={data.birthdate}
                                        onChange={(e) => setData("birthdate", e.target.value)}
                                    />
                                </Field>

                                <Field
                                    label="Municipality"
                                    error={errors.municipality_id}
                                    className="sm:col-span-2"
                                >
                                    <select
                                        className={inputClass}
                                        value={data.municipality_id}
                                        onChange={(e) =>
                                            setData("municipality_id", e.target.value)
                                        }
                                    >
                                        <option value="">Select municipality</option>
                                        {municipalities.map((municipality) => (
                                            <option
                                                key={municipality.id}
                                                value={municipality.id}
                                            >
                                                {municipality.municipality}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1.5 text-xs text-slate-400">
                                        Choose the municipality associated with this account.
                                    </p>
                                </Field>

                                <Field
                                    label="Phone Number"
                                    error={errors.phonenumber}
                                >
                                    <div className="relative">
                                        <FaPhone className="absolute left-3.5 top-3.5 text-xs text-slate-400" />
                                        <input
                                            type="tel"
                                            className={`${inputClass} pl-9`}
                                            value={data.phonenumber}
                                            onChange={(e) =>
                                                setData("phonenumber", e.target.value)
                                            }
                                            placeholder="09XX XXX XXXX"
                                            autoComplete="tel"
                                        />
                                    </div>
                                </Field>

                                <Field
                                    label="Email Address"
                                    required
                                    error={errors.email}
                                >
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-3.5 top-3.5 text-xs text-slate-400" />
                                        <input
                                            type="email"
                                            className={`${inputClass} pl-9`}
                                            value={data.email}
                                            onChange={(e) => setData("email", e.target.value)}
                                            placeholder="name@example.com"
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                </Field>
                            </div>
                        </section>

                        <div className="border-t border-slate-100" />

                        <section>
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                                    <FaUserShield />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-800">
                                        Roles and Permissions
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Select one or more roles for this user.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {ROLE_OPTIONS.map((role) => {
                                    const checked = data.roles.includes(role.value);

                                    return (
                                        <label
                                            key={role.value}
                                            className={cx(
                                                "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
                                                checked
                                                    ? "border-emerald-400 bg-emerald-50/70 ring-2 ring-emerald-500/10"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleRole(role.value)}
                                                className="mt-1 h-4 w-4 rounded border-slate-300 accent-emerald-600"
                                            />
                                            <span className="min-w-0">
                                                <span className="block text-sm font-bold text-slate-800">
                                                    {role.label}
                                                </span>
                                                <span className="mt-1 block text-xs leading-5 text-slate-500">
                                                    {role.description}
                                                </span>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            {errors.roles && (
                                <p className="mt-2 text-xs text-rose-600">
                                    {errors.roles}
                                </p>
                            )}

                            {errors["roles.0"] && (
                                <p className="mt-2 text-xs text-rose-600">
                                    {errors["roles.0"]}
                                </p>
                            )}
                        </section>

                        <div className="border-t border-slate-100" />

                        <section>
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                    <FaKey />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-800">
                                        Account Security
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        {editingUser
                                            ? "Leave both password fields empty to retain the current password."
                                            : "Set a password containing at least 8 characters."}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field
                                    label={editingUser ? "New Password" : "Password"}
                                    required={!editingUser}
                                    error={errors.password}
                                >
                                    <input
                                        type="password"
                                        className={inputClass}
                                        value={data.password}
                                        onChange={(e) => setData("password", e.target.value)}
                                        placeholder={editingUser ? "Leave blank to keep current" : "Minimum 8 characters"}
                                        autoComplete="new-password"
                                        required={!editingUser}
                                        minLength={8}
                                    />
                                </Field>

                                <Field
                                    label="Confirm Password"
                                    required={!editingUser || !!data.password}
                                    error={errors.password_confirmation}
                                >
                                    <input
                                        type="password"
                                        className={inputClass}
                                        value={data.password_confirmation}
                                        onChange={(e) =>
                                            setData("password_confirmation", e.target.value)
                                        }
                                        placeholder="Re-enter password"
                                        autoComplete="new-password"
                                        required={!editingUser || !!data.password}
                                    />
                                </Field>

                                {passwordError && (
                                    <p className="text-xs text-rose-600 sm:col-span-2">
                                        {passwordError}
                                    </p>
                                )}

                                <Field label="Account Status" error={errors.status}>
                                    <select
                                        className={inputClass}
                                        value={data.status}
                                        onChange={(e) => setData("status", e.target.value)}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </Field>
                            </div>
                        </section>
                    </div>

                    <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                        <button
                            type="button"
                            disabled={processing}
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? (
                                <FaSyncAlt className="animate-spin" />
                            ) : (
                                <FaSave />
                            )}
                            {processing
                                ? "Saving..."
                                : editingUser
                                    ? "Save Changes"
                                    : "Create Account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DeleteModal({ user, onClose }) {
    const [processing, setProcessing] = useState(false);

    if (!user) return null;

    const confirmDelete = () => {
        setProcessing(true);

        router.delete(`/users/${user.user_id}`, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                    <FaTrash className="text-xl" />
                </div>

                <h3 className="mt-5 text-center text-xl font-black text-slate-900">
                    Delete User Account?
                </h3>

                <p className="mt-2 text-center text-sm leading-6 text-slate-500">
                    You are about to delete{" "}
                    <strong className="text-slate-800">{user.fullname}</strong>.
                    This action cannot be undone.
                </p>

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={confirmDelete}
                        disabled={processing}
                        className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                        {processing ? "Deleting..." : "Delete Account"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Users() {
    const { users, municipalities = [], filters = {}, summary = {}, flash = {} } =
        usePage().props;

    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);
    const [deletingUser, setDeletingUser] = useState(null);

    const [search, setSearch] = useState(filters.search || "");
    const [municipalityId, setMunicipalityId] = useState(
        String(filters.municipality_id || "")
    );
    const [role, setRole] = useState(filters.role || "");
    const [status, setStatus] = useState(filters.status || "");

    const userRows = users?.data || [];
    const pagination = users?.links || [];

    useEffect(() => {
        setSearch(filters.search || "");
        setMunicipalityId(String(filters.municipality_id || ""));
        setRole(filters.role || "");
        setStatus(filters.status || "");
    }, [filters.search, filters.municipality_id, filters.role, filters.status]);

    const applyFilters = (event) => {
        event?.preventDefault();

        router.get(
            "/users",
            {
                search,
                municipality_id: municipalityId,
                role,
                status,
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
        setMunicipalityId("");
        setRole("");
        setStatus("");

        router.get(
            "/users",
            {},
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const openCreate = () => {
        setEditingUser(null);
        setModalOpen(true);
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setModalOpen(true);
        setViewingUser(null);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingUser(null);
    };

    const hasFilters = Boolean(search || municipalityId || role || status);

    return (
        <Layout>
            <Head title="Users Management" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
                <div className="mx-auto max-w-[1500px] space-y-6">
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
                            Users
                        </span>
                    </nav>

                    {/* Page header */}
                    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-5 py-7 shadow-xl shadow-slate-900/10 sm:px-8 sm:py-9">
                        <div className="absolute -right-16 -top-28 h-80 w-80 rounded-full border-[40px] border-white/[0.04]" />
                        <div className="absolute -bottom-24 right-44 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

                        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                            <div className="max-w-2xl">
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                                    <FaCheckCircle />
                                    Reference Data Management
                                </div>

                                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                                    Users Management
                                </h1>

                                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                                    Manage MIADP accounts, assign multiple system roles,
                                    and maintain user access across municipalities.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400"
                            >
                                <FaPlus />
                                Add New User
                            </button>
                        </div>
                    </section>

                    {/* Flash messages */}
                    {(flash.success || flash.error) && (
                        <div
                            role="status"
                            className={cx(
                                "flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium",
                                flash.success
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : "border-rose-200 bg-rose-50 text-rose-800"
                            )}
                        >
                            {flash.success ? <FaCheckCircle /> : <FaExclamationCircle />}
                            <span>{flash.success || flash.error}</span>
                        </div>
                    )}

                    {/* Summary cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="Total Users"
                            value={summary.total}
                            description="Registered system accounts"
                            icon={FaUsers}
                            color="green"
                        />
                        <StatCard
                            title="Active Accounts"
                            value={summary.active}
                            description="Accounts marked active"
                            icon={FaUserCheck}
                            color="blue"
                        />
                        <StatCard
                            title="Inactive Accounts"
                            value={summary.inactive}
                            description="Accounts marked inactive"
                            icon={FaUserSlash}
                            color="amber"
                        />
                        <StatCard
                            title="Administrators"
                            value={summary.administrators}
                            description="Users assigned the admin role"
                            icon={FaUserShield}
                            color="purple"
                        />
                    </div>

                    {/* User directory */}
                    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                        <FaUsers />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900">
                                            User Directory
                                        </h2>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Search, filter, and manage registered accounts.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                {Number(users?.total || 0).toLocaleString()} records found
                            </div>
                        </div>

                        {/* Filters */}
                        <form
                            onSubmit={applyFilters}
                            className="space-y-4 border-b border-slate-100 bg-slate-50/60 p-5 sm:px-6"
                        >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-12">
                                <div className="relative sm:col-span-2 xl:col-span-4">
                                    <FaSearch className="absolute left-3.5 top-3.5 text-xs text-slate-400" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search name, email, phone..."
                                        className={`${inputClass} pl-9`}
                                    />
                                </div>

                                <div className="relative xl:col-span-3">
                                    <FaMapMarkerAlt className="absolute left-3.5 top-3.5 text-xs text-slate-400" />
                                    <select
                                        value={municipalityId}
                                        onChange={(e) => setMunicipalityId(e.target.value)}
                                        className={`${inputClass} pl-9`}
                                    >
                                        <option value="">All Municipalities</option>
                                        {municipalities.map((municipality) => (
                                            <option
                                                key={municipality.id}
                                                value={municipality.id}
                                            >
                                                {municipality.municipality}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="xl:col-span-2">
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">All Roles</option>
                                        {ROLE_OPTIONS.map((item) => (
                                            <option key={item.value} value={item.value}>
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="xl:col-span-1">
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className={inputClass}
                                        aria-label="Filter by status"
                                    >
                                        <option value="">All Status</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>

                                <div className="flex gap-2 sm:col-span-2 xl:col-span-2">
                                    <button
                                        type="submit"
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                                    >
                                        <FaFilter />
                                        Filter
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        title="Reset filters"
                                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-slate-600 transition hover:bg-slate-100"
                                    >
                                        <FaSyncAlt />
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-white">
                                        <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                                            User
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                                            Contact
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                                            Municipality
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                                            Roles
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                                            Status
                                        </th>
                                        <th className="px-5 py-4 text-right text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {userRows.map((user) => (
                                        <tr
                                            key={user.user_id}
                                            className="transition hover:bg-emerald-50/30"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-sm font-black text-emerald-800">
                                                        {(user.fullname || "U")
                                                            .trim()
                                                            .split(/\s+/)
                                                            .slice(0, 2)
                                                            .map((part) => part[0])
                                                            .join("")
                                                            .toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-800">
                                                            {user.fullname}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-400">
                                                            ID: {user.user_id}
                                                            {user.gender ? ` · ${user.gender}` : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="flex items-center gap-2 text-sm text-slate-700">
                                                    <FaEnvelope className="text-[11px] text-slate-400" />
                                                    {user.email}
                                                </p>
                                                <p className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                                                    <FaPhone className="text-[10px]" />
                                                    {user.phonenumber || "No phone number"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <FaBuilding className="text-xs text-emerald-600" />
                                                    {user.municipality || "Not assigned"}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex max-w-[230px] flex-wrap gap-1.5">
                                                    {(user.roles || []).length ? (
                                                        user.roles.map((item) => (
                                                            <RoleBadge key={item} role={item} />
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-slate-400">
                                                            No roles
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <Badge color={user.status === "Active" ? "green" : "red"}>
                                                    <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                                                    {user.status}
                                                </Badge>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingUser(user)}
                                                        title="View user"
                                                        className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(user)}
                                                        title="Edit user"
                                                        className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingUser(user)}
                                                        title="Delete user"
                                                        className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {!userRows.length && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16 text-center">
                                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                                    <FaUsers className="text-xl" />
                                                </div>
                                                <h3 className="mt-4 font-bold text-slate-800">
                                                    No users found
                                                </h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Try adjusting your filters or create a new account.
                                                </p>
                                                {hasFilters && (
                                                    <button
                                                        type="button"
                                                        onClick={resetFilters}
                                                        className="mt-4 text-sm font-bold text-emerald-700 hover:text-emerald-800"
                                                    >
                                                        Clear all filters
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <p className="text-xs font-medium text-slate-500">
                                Showing{" "}
                                <span className="font-bold text-slate-800">
                                    {users?.from || 0}–{users?.to || 0}
                                </span>{" "}
                                of{" "}
                                <span className="font-bold text-slate-800">
                                    {users?.total || 0}
                                </span>{" "}
                                users
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5">
                                {pagination.map((page, index) => {
                                    const label = page.label
                                        .replace("&laquo;", "")
                                        .replace("&raquo;", "");

                                    return (
                                        <button
                                            key={`${page.label}-${index}`}
                                            type="button"
                                            disabled={!page.url || page.active}
                                            onClick={() => {
                                                if (page.url) {
                                                    router.get(
                                                        page.url,
                                                        {},
                                                        {
                                                            preserveState: true,
                                                            preserveScroll: true,
                                                        }
                                                    );
                                                }
                                            }}
                                            className={cx(
                                                "min-w-9 rounded-xl px-3 py-2 text-xs font-bold transition",
                                                page.active
                                                    ? "bg-emerald-600 text-white shadow-sm"
                                                    : page.url
                                                        ? "border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                                                        : "cursor-not-allowed text-slate-300"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <footer className="pb-3 text-center text-xs text-slate-400">
                        MIADP Management System · User Account Administration
                    </footer>
                </div>
            </div>

            <UserModal
                open={modalOpen}
                onClose={closeModal}
                editingUser={editingUser}
                municipalities={municipalities}
            />

            <DeleteModal
                user={deletingUser}
                onClose={() => setDeletingUser(null)}
            />

            {/* User details modal */}
            {viewingUser && (
                <div
                    className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setViewingUser(null);
                    }}
                >
                    <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-start justify-between bg-gradient-to-r from-slate-950 to-emerald-900 p-6 text-white">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                                    User Profile
                                </p>
                                <h3 className="mt-2 text-xl font-black">
                                    {viewingUser.fullname}
                                </h3>
                                <p className="mt-1 text-sm text-slate-300">
                                    Account ID: {viewingUser.user_id}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingUser(null)}
                                aria-label="Close user details"
                                className="rounded-xl p-2 hover:bg-white/10"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="space-y-4 p-6">
                            {[
                                ["Email Address", viewingUser.email],
                                ["Phone Number", viewingUser.phonenumber || "Not provided"],
                                ["Gender", viewingUser.gender || "Not provided"],
                                ["Birthdate", viewingUser.birthdate || "Not provided"],
                                ["Municipality", viewingUser.municipality || "Not assigned"],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:justify-between"
                                >
                                    <span className="text-xs font-semibold text-slate-400">
                                        {label}
                                    </span>
                                    <span className="break-all text-sm font-bold text-slate-700">
                                        {value}
                                    </span>
                                </div>
                            ))}

                            <div>
                                <p className="mb-2 text-xs font-semibold text-slate-400">
                                    Assigned Roles
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {(viewingUser.roles || []).map((item) => (
                                        <RoleBadge key={item} role={item} />
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-400">
                                    Account Status
                                </span>
                                <Badge color={viewingUser.status === "Active" ? "green" : "red"}>
                                    {viewingUser.status}
                                </Badge>
                            </div>

                            <button
                                type="button"
                                onClick={() => openEdit(viewingUser)}
                                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                            >
                                <FaEdit />
                                Edit User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
