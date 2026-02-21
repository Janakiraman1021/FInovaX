"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole } from "@/lib/mock/mockUsers";
import { useRouter } from "next/navigation";

interface AuthContextType {
    role: UserRole | null;
    isAuthenticated: boolean;
    login: (role: UserRole) => void;
    logout: () => void;
    switchRole: (role: UserRole) => void;
    isDemoMode: boolean;
    toggleDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [role, setRole] = useState<UserRole | null>(null);
    const [isDemoMode, setIsDemoMode] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const savedRole = localStorage.getItem("finovax-role") as UserRole;
        if (savedRole) {
            setRole(savedRole);
        }
    }, []);

    const login = (newRole: UserRole) => {
        setRole(newRole);
        localStorage.setItem("finovax-role", newRole);
        localStorage.setItem("finovax-token", `mock.jwt.finovax.${newRole}`);
        document.cookie = `finovax-role=${newRole}; path=/; max-age=86400`;
        router.push(`/${newRole}/dashboard`);
    };

    const logout = () => {
        setRole(null);
        localStorage.removeItem("finovax-role");
        localStorage.removeItem("finovax-token");
        document.cookie = "finovax-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/login");
    };

    const switchRole = (newRole: UserRole) => {
        login(newRole);
    };

    const toggleDemoMode = () => setIsDemoMode((prev: boolean) => !prev);

    return (
        <AuthContext.Provider
            value={{
                role,
                isAuthenticated: !!role,
                login,
                logout,
                switchRole,
                isDemoMode,
                toggleDemoMode,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
