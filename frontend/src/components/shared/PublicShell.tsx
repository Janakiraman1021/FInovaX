"use client";

import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
    { label: "About",      href: "/about"      },
    { label: "Why OneFlow", href: "/why-oneflow" },
    { label: "Terms",      href: "/terms-and-conditions" },
    { label: "Privacy",    href: "/privacy-policy" },
];

export default function PublicShell({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="min-h-screen flex flex-col" style={{ background: "var(--mg-base)" }}>
            {/* ── Navbar ── */}
            <header className="mg-navbar sticky top-0 z-50 h-14 px-6 md:px-10 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #4a4e8f, #6b5ea0)", boxShadow: "0 0 10px rgba(74,78,143,0.22)" }}>
                        <Shield className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-bold text-mg-silver tracking-tight">Fino<span className="text-mg-lavender">vaX</span></span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map(l => (
                        <Link key={l.href} href={l.href} className="text-sm font-medium text-mg-muted hover:text-mg-silver transition-colors">
                            {l.label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden md:flex items-center gap-3">
                    <Link href="/login" className="text-sm font-medium text-mg-muted hover:text-mg-silver transition-colors">Sign in</Link>
                    <Link href="/register" className="mg-btn-primary text-sm py-2 px-4 rounded-lg">Get Started</Link>
                </div>

                {/* Mobile toggle */}
                <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg text-mg-muted hover:text-mg-silver">
                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </header>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden bg-white border-b border-mg-lavender/10 px-6 py-4 space-y-3">
                    {navLinks.map(l => (
                        <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                            className="block text-sm font-medium text-mg-muted hover:text-mg-silver transition-colors py-1">
                            {l.label}
                        </Link>
                    ))}
                    <div className="flex gap-3 pt-2">
                        <Link href="/login" className="text-sm font-medium text-mg-muted">Sign in</Link>
                        <Link href="/register" className="mg-btn-primary text-sm py-1.5 px-3 rounded-lg">Get Started</Link>
                    </div>
                </div>
            )}

            {/* ── Content ── */}
            <main className="flex-1">{children}</main>

            {/* ── Footer ── */}
            <footer className="border-t border-mg-lavender/10 py-8 px-8">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #4a4e8f, #6b5ea0)" }}>
                            <Shield className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-bold text-mg-silver">Fino<span className="text-mg-lavender">vaX</span></span>
                    </div>
                    <nav className="flex items-center gap-5">
                        {navLinks.map(l => (
                            <Link key={l.href} href={l.href} className="text-xs text-mg-dim hover:text-mg-muted transition-colors">
                                {l.label}
                            </Link>
                        ))}
                    </nav>
                    <p className="text-xs text-mg-dim">© 2026 OneFlow · Built on <span className="text-mg-lavender">Polygon zkEVM</span></p>
                </div>
            </footer>
        </div>
    );
}
