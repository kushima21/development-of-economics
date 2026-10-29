import { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";

const navigation = [
    {
        section: "MAIN MENU",
        items: [
            { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
        ],
    },
    {
        section: "PROJECT MANAGEMENT",
        items: [
            { name: "Subject Category", href: "/subprojectcategory", icon: "category" },
            { name: "Type of Subproject", href: "/typeofsubproject", icon: "layers" },
            { name: "Subprojects", href: "/subproject", icon: "building" },
        ],
    },
    {
        section: "CROPS MANAGEMENT",
        items: [
            { name: "Crops", href: "/crops", icon: "layers" },
        ],
    },
    {
        section: "LOCATION MANAGEMENT",
        items: [
            { name: "Municipality", href: "/municipalities", icon: "map" },
            { name: "Barangay", href: "/barangays", icon: "location" },
        ],
    },
    {
        section: "SYSTEM ADMINISTRATION",
        items: [
            { name: "Users", href: "/users", icon: "users" },
        ],
    },
];

const icons = {
    dashboard: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </>
    ),
    category: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
    ),
    layers: (
        <>
            <path d="m12 3 9 5-9 5-9-5 9-5Z" />
            <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
        </>
    ),
    building: (
        <>
            <rect x="3" y="7" width="18" height="14" rx="2" />
            <path d="M7 7V4h10v3M7 11h2m6 0h2M7 15h2m6 0h2M10 21v-4h4v4" />
        </>
    ),
    map: (
        <>
            <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
            <path d="M9 3v15m6-12v15" />
        </>
    ),
    location: (
        <>
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
        </>
    ),
    users: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="10" cy="7" r="4" />
            <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    logout: (
        <>
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
        </>
    ),
};

function Icon({ name, size = 20, className = "" }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {icons[name] || icons.dashboard}
        </svg>
    );
}

export default function Layout({ children, title = "Dashboard" }) {
    const { url, props } = usePage();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const user = props.auth?.user;

    const userName =
        [user?.firstname, user?.lastname]
            .filter(Boolean)
            .join(" ") ||
        user?.fullname ||
        user?.name ||
        "Administrator";

    const activeItem = navigation
        .flatMap((group) => group.items)
        .find((item) =>
            item.href === "/dashboard"
                ? url === "/dashboard" || url === "/"
                : url === item.href || url.startsWith(`${item.href}/`)
        );

    const handleLogout = () => {
        if (loggingOut) return;

        const confirmed = window.confirm(
            "Are you sure you want to log out of the MIADP System?"
        );

        if (!confirmed) return;

        setLoggingOut(true);

        router.post(
            "/logout",
            {},
            {
                onFinish: () => setLoggingOut(false),
            }
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <Head title={`${title} | MIADP System`} />

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${
                    sidebarOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0"
                }`}
            >
                {/* Logo and branding */}
                <div className="flex h-20 shrink-0 items-center gap-3 border-b border-slate-100 px-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-xl font-black text-white shadow-lg shadow-blue-200">
                        M
                    </div>

                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                            MIADP
                        </h1>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                            Decision Support System
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                        aria-label="Close navigation"
                    >
                        <Icon name="close" />
                    </button>
                </div>

                {/* Navigation links */}
                <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
                    {navigation.map((group) => (
                        <div key={group.section}>
                            <p className="mb-3 px-3 text-[10px] font-extrabold tracking-[0.16em] text-slate-400">
                                {group.section}
                            </p>

                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const active =
                                        activeItem?.href === item.href;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() =>
                                                setSidebarOpen(false)
                                            }
                                            className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                                                active
                                                    ? "bg-blue-700 text-white shadow-md shadow-blue-200"
                                                    : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                                            }`}
                                        >
                                            <Icon
                                                name={item.icon}
                                                size={19}
                                                className={
                                                    active
                                                        ? "text-white"
                                                        : "text-slate-400 group-hover:text-blue-600"
                                                }
                                            />

                                            <span className="flex-1">
                                                {item.name}
                                            </span>

                                            {active && (
                                                <Icon
                                                    name="chevron"
                                                    size={16}
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Sidebar footer and logout */}
                <div className="shrink-0 space-y-3 border-t border-slate-100 p-4">
                    <div className="rounded-xl bg-blue-50 p-4">
                        <p className="text-xs font-bold text-blue-900">
                            MIADP Management
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-blue-700">
                            Economic and financial evaluation of infrastructure subprojects.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="group flex w-full items-center gap-3 rounded-xl border border-red-100 px-4 py-3 text-sm font-bold text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Icon
                            name="logout"
                            size={19}
                            className="transition-transform group-hover:-translate-x-0.5"
                        />

                        <span>
                            {loggingOut ? "Logging out..." : "Logout"}
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main panel */}
            <div className="min-h-screen lg:pl-72">
                {/* Top navigation bar */}
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                    <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-100 lg:hidden"
                                aria-label="Open navigation"
                            >
                                <Icon name="menu" />
                            </button>

                            <div className="min-w-0">
                                <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
                                    <span>MIADP System</span>
                                    <Icon name="chevron" size={13} />
                                    <span className="truncate text-blue-700">
                                        {title}
                                    </span>
                                </div>

                                <h2 className="truncate text-lg font-extrabold text-slate-900 sm:mt-1 sm:text-xl">
                                    {title}
                                </h2>
                            </div>
                        </div>

                        {/* User profile */}
                        <div className="flex shrink-0 items-center gap-3">
                            <div className="hidden text-right sm:block">
                                <p className="max-w-48 truncate text-sm font-bold text-slate-800">
                                    {userName}
                                </p>
                                <p className="max-w-48 truncate text-xs text-slate-500">
                                    {user?.email || "System Administrator"}
                                </p>
                            </div>

                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-extrabold text-blue-800 ring-2 ring-white"
                                title={userName}
                            >
                                {(userName.charAt(0) || "A").toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="mx-auto min-h-[calc(100vh-160px)] w-full max-w-[1600px]">
                    {children}
                </main>

                {/* Footer */}
                <footer className="border-t border-slate-200 bg-white px-6 py-5">
                    <div className="flex flex-col justify-between gap-2 text-xs text-slate-500 sm:flex-row">
                        <p>
                            © {new Date().getFullYear()} MIADP System. All
                            rights reserved.
                        </p>

                        <p>
                            Hondrada
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
