"use client";

import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/shared/Navbar";
import { Sidebar } from "@/components/shared/Sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isHydrating } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isHydrating && !isAuthenticated) router.push("/login");
    }, [isHydrating, isAuthenticated, router]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [router]);

    if (isHydrating) {
        return (
            <div className="flex items-center justify-center h-screen" style={{ background: "var(--mg-base)" }}>
                <div className="w-8 h-8 rounded-full border-2 border-mg-dim border-t-mg-lavender animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--mg-base)" }}>
            <Navbar onToggleSidebar={() => setSidebarOpen(v => !v)} />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className="flex-1 overflow-y-auto relative">
                    {/* Subtle ambient glow — top right */}
                    <div className="pointer-events-none absolute top-0 right-0 w-96 h-72 rounded-full blur-[100px] opacity-15"
                        style={{ background: "radial-gradient(ellipse, rgba(74,78,143,0.18) 0%, transparent 70%)" }} />
                    {/* Subtle ambient glow — bottom left */}
                    <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-64 rounded-full blur-[80px] opacity-10"
                        style={{ background: "radial-gradient(ellipse, rgba(107,94,160,0.14) 0%, transparent 70%)" }} />
                    <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
