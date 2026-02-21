"use client";

import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/shared/Navbar";
import { Sidebar } from "@/components/shared/Sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { role, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) router.push("/login");
    }, [isAuthenticated, router]);

    if (!isAuthenticated) return null;

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-galaxy-void">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-8 relative">
                    {/* Subtle per-page nebula */}
                    <div className="absolute top-0 right-0 w-[500px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-30"
                        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 70%)" }} />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full blur-[100px] pointer-events-none opacity-20"
                        style={{ background: "radial-gradient(ellipse, rgba(236,72,153,0.12) 0%, transparent 70%)" }} />
                    <div className="max-w-7xl mx-auto relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
