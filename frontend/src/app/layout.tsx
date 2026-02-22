import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "ONEFLOW | Web3 Invoice Financing",
    description: "Midnight Galaxy — Hybrid Audit Architecture for Secure Invoice Financing",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen`} style={{ background: 'var(--mg-base)', color: 'var(--mg-silver)' }}>
                <AuthProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        theme="light"
                        richColors
                        toastOptions={{
                            style: {
                                background: "#ffffff",
                                border: "1px solid rgba(74,78,143,0.18)",
                                backdropFilter: "blur(20px)",
                                color: "#1e1433",
                            },
                        }}
                    />
                    <Analytics />
                </AuthProvider>
            </body>
        </html>
    );
}
