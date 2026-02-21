import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "FINOVAX | Web3 Invoice Financing",
    description: "Midnight Galaxy — Hybrid Audit Architecture for Secure Invoice Financing",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.className} min-h-screen`} style={{ background: 'var(--mg-base)', color: 'var(--mg-silver)' }}>
                <AuthProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        theme="dark"
                        richColors
                        toastOptions={{
                            style: {
                                background: "rgba(10,8,30,0.95)",
                                border: "1px solid rgba(167,139,250,0.30)",
                                backdropFilter: "blur(20px)",
                                color: "#e2e8f0",
                            },
                        }}
                    />
                </AuthProvider>
            </body>
        </html>
    );
}
