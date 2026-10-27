
import Layout from "../Layouts/Layout";

const statistics = [
    {
        label: "Total Subprojects",
        value: "0",
        description: "Registered infrastructure projects",
        color: "blue",
        icon: "▦",
    },
    {
        label: "Municipalities",
        value: "0",
        description: "Municipalities covered",
        color: "violet",
        icon: "⌖",
    },
    {
        label: "Barangays",
        value: "0",
        description: "Participating communities",
        color: "emerald",
        icon: "⌂",
    },
    {
        label: "Registered Users",
        value: "0",
        description: "System user accounts",
        color: "amber",
        icon: "♙",
    },
];

const shortcuts = [
    {
        title: "Manage Subprojects",
        description: "Register and review infrastructure investments.",
        href: "/subprojects",
        icon: "▦",
    },
    {
        title: "Economic Analysis",
        description: "Review the economic feasibility of projects.",
        href: "/economic-analysis",
        icon: "↗",
    },
    {
        title: "Financial Analysis",
        description: "Assess costs, revenues, and financial viability.",
        href: "/financial-analysis",
        icon: "₱",
    },
    {
        title: "Generate Reports",
        description: "Access project summaries and evaluation reports.",
        href: "/reports",
        icon: "▤",
    },
];

export default function Dashboard() {
    return (
        <Layout title="Dashboard">
            <div className="space-y-8">
                {/* Welcome section */}
                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 p-6 text-white shadow-lg sm:p-9">
                    <div className="relative z-10 max-w-2xl">
                        <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
                            MIADP MANAGEMENT PORTAL
                        </span>

                        <h1 className="mt-5 text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
                            Economic & Financial
                            <br className="hidden sm:block" /> Decision Support
                            System
                        </h1>

                        <p className="mt-4 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                            Manage infrastructure subprojects, organize
                            project information, and support evidence-based
                            economic and financial evaluation.
                        </p>

                        <a
                            href="/subprojects"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 shadow transition hover:bg-blue-50"
                        >
                            Explore Subprojects
                            <span aria-hidden="true">→</span>
                        </a>
                    </div>

                    <div className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full border-[35px] border-white/10" />
                    <div className="pointer-events-none absolute -bottom-28 right-28 h-64 w-64 rounded-full border-[30px] border-white/10" />
                </section>

                {/* Statistics */}
                <section>
                    <div className="mb-5">
                        <h2 className="text-lg font-extrabold text-slate-900">
                            System Overview
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            A summary of your registered system records.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {statistics.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">
                                            {item.label}
                                        </p>
                                        <h3 className="mt-3 text-3xl font-extrabold text-slate-900">
                                            {item.value}
                                        </h3>
                                    </div>

                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl font-bold text-blue-700">
                                        {item.icon}
                                    </div>
                                </div>

                                <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Quick actions */}
                <section>
                    <div className="mb-5">
                        <h2 className="text-lg font-extrabold text-slate-900">
                            Quick Access
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Go directly to frequently used modules.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {shortcuts.map((item) => (
                            <a
                                key={item.title}
                                href={item.href}
                                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                            >
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl font-bold text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                                    {item.icon}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-slate-900 group-hover:text-blue-700">
                                        {item.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        {item.description}
                                    </p>
                                </div>

                                <span className="text-lg text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700">
                                    →
                                </span>
                            </a>
                        ))}
                    </div>
                </section>

                {/* Evaluation notice */}
                <section className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-800">
                        i
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-950">
                            Decision Support Information
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-blue-800">
                            Economic and financial assessment results should
                            support, not replace, the review and approval
                            decisions of authorized project evaluators.
                        </p>
                    </div>
                </section>
            </div>
        </Layout>
    );
}
