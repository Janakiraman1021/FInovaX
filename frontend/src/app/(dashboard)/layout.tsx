"use client";

import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/shared/Navbar";
import { Sidebar } from "@/components/shared/Sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { role, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) router.push("/login");
    }, [isAuthenticated, router]);

    if (!isAuthenticated) return null;

    return (
        <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--mg-base)" }}>
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto relative">
                    {/* Subtle ambient glow — top right */}
                    <div className="pointer-events-none absolute top-0 right-0 w-96 h-72 rounded-full blur-[100px] opacity-15"
                        style={{ background: "radial-gradient(ellipse, rgba(74,78,143,0.18) 0%, transparent 70%)" }} />
                    {/* Subtle ambient glow — bottom left */}
                    <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-64 rounded-full blur-[80px] opacity-10"
                        style={{ background: "radial-gradient(ellipse, rgba(107,94,160,0.14) 0%, transparent 70%)" }} />
                    <div className="relative z-10 max-w-7xl mx-auto p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
