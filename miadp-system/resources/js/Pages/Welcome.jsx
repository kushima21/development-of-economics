
import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";
import {
    FaChartLine,
    FaEnvelope,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaArrowRight,
    FaLeaf,
    FaUsers,
    FaChartBar,
    FaClipboardCheck,
    FaSpinner,
} from "react-icons/fa";

export default function Welcome() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post("/login", {
            onFinish: () => reset("password"),
        });
    };

    return (
        <>
            <Head title="Sign In | MIADP System" />

            <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
                {/* LEFT: Branding and background image */}
                <section className="relative hidden min-h-screen overflow-hidden lg:flex">
                    <img
                        src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=85"
                        alt="Mountain landscape representing sustainable development"
                        className="absolute inset-0 h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-blue-900/70 to-emerald-950/70" />

                    <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full border border-white/10" />
                    <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full border border-white/10" />

                    <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
                        {/* Brand */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl text-white shadow-lg ring-1 ring-white/25 backdrop-blur-md">
                                <FaChartLine />
                            </div>

                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                                    MIADP <span className="font-light">System</span>
                                </h1>
                                <p className="mt-1 text-xs font-medium tracking-[0.2em] text-blue-100">
                                    INFRASTRUCTURE DECISION SUPPORT
                                </p>
                            </div>
                        </div>

                        {/* Main message */}
                        <div className="max-w-xl py-16">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
                                <FaLeaf className="text-emerald-300" />
                                Sustainable Development Through Data
                            </div>

                            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-6xl">
                                Better Data.
                                <br />
                                Smarter Decisions.
                                <br />
                                <span className="text-emerald-300">
                                    Stronger Communities.
                                </span>
                            </h2>

                            <p className="mt-6 max-w-lg text-base leading-8 text-blue-50/90 xl:text-lg">
                                A decision support system for evaluating
                                MIADP infrastructure subprojects through
                                economic analysis, financial assessment,
                                and data-driven project monitoring.
                            </p>

                            <div className="mt-10 grid grid-cols-3 gap-4">
                                {[
                                    {
                                        icon: FaChartBar,
                                        title: "Analyze",
                                        description: "Project performance",
                                    },
                                    {
                                        icon: FaClipboardCheck,
                                        title: "Evaluate",
                                        description: "Economic benefits",
                                    },
                                    {
                                        icon: FaUsers,
                                        title: "Empower",
                                        description: "Local communities",
                                    },
                                ].map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <div
                                            key={item.title}
                                            className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md"
                                        >
                                            <Icon className="mb-4 text-2xl text-emerald-300" />
                                            <h3 className="font-bold text-white">
                                                {item.title}
                                            </h3>
                                            <p className="mt-1 text-xs leading-5 text-blue-100">
                                                {item.description}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-6 text-sm text-blue-100/80">
                            <p>MIADP Infrastructure Project Management</p>
                            <p>© {new Date().getFullYear()} MIADP System</p>
                        </div>
                    </div>
                </section>

                {/* RIGHT: Login form */}
                <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-10 lg:bg-white xl:px-20">
                    <div className="w-full max-w-md">
                        {/* Mobile logo */}
                        <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white shadow-lg shadow-blue-600/25">
                                <FaChartLine />
                            </div>
                            <h1 className="text-2xl font-extrabold text-slate-900">
                                MIADP <span className="font-normal">System</span>
                            </h1>
                        </div>

                        {/* Form heading */}
                        <div className="mb-8">
                            <div className="mb-6 hidden h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-600 lg:flex">
                                <FaChartLine />
                            </div>

                            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
                                Welcome Back
                            </p>

                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                                Sign in to your account
                            </h2>

                            <p className="mt-3 leading-7 text-slate-500">
                                Enter your credentials to access the MIADP
                                decision support dashboard.
                            </p>
                        </div>

                        {/* Login card */}
                        <form onSubmit={submit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Email Address
                                </label>

                                <div className="relative">
                                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        autoComplete="username"
                                        autoFocus
                                        required
                                        value={data.email}
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                        placeholder="you@example.com"
                                        aria-invalid={!!errors.email}
                                        className={`w-full rounded-xl border bg-white py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                                            errors.email
                                                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                                : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                                        }`}
                                    />
                                </div>

                                {errors.email && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-semibold text-slate-700"
                                    >
                                        Password
                                    </label>

                                    <a
                                        href="/forgot-password"
                                        className="text-xs font-semibold text-blue-600 transition hover:text-blue-800"
                                    >
                                        Forgot password?
                                    </a>
                                </div>

                                <div className="relative">
                                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        autoComplete="current-password"
                                        required
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        placeholder="Enter your password"
                                        aria-invalid={!!errors.password}
                                        className={`w-full rounded-xl border bg-white py-3.5 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                                            errors.password
                                                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                                : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                                        }`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>

                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Remember me */}
                            <div className="flex items-center gap-3 py-1">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
                                    className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
                                />

                                <label
                                    htmlFor="remember"
                                    className="cursor-pointer text-sm text-slate-600"
                                >
                                    Remember me
                                </label>
                            </div>

                            {/* Authentication errors */}
                            {errors.message && (
                                <div
                                    role="alert"
                                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                >
                                    {errors.message}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="group flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                            >
                                {processing ? (
                                    <>
                                        <FaSpinner className="animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>

                            <p className="pt-2 text-center text-xs leading-6 text-slate-400">
                                By signing in, you agree to use the MIADP
                                System in accordance with your organization's
                                access policies.
                            </p>
                        </form>

                    </div>
                </section>
            </div>
        </>
    );
}
