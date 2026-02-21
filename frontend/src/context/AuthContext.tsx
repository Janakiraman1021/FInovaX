"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserRole } from "@/lib/mock/mockUsers";
import { useRouter } from "next/navigation";
import { authAPI, AuthUser, RegisterPayload } from "@/lib/api";

interface AuthContextType {
    user: AuthUser | null;
    role: UserRole | null;
    isAuthenticated: boolean;
    /** Demo / backwards-compat login — sets a role without calling the backend */
    login: (role: UserRole) => void;
    /** Real login — calls POST /auth/login, throws on failure */
    loginWithCredentials: (email: string, password: string) => Promise<void>;
    /** Real registration — calls POST /auth/register, throws on failure */
    registerUser: (payload: RegisterPayload) => Promise<void>;
    logout: () => void;
    switchRole: (role: UserRole) => void;
    isDemoMode: boolean;
    toggleDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "finovax-token";
const ROLE_KEY  = "finovax-role";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser]             = useState<AuthUser | null>(null);
    const [role, setRole]             = useState<UserRole | null>(null);
    const [isDemoMode, setIsDemoMode] = useState(true);
    const router = useRouter();

    // Restore session on mount — try real token first, fall back to saved role
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && !token.startsWith("mock.")) {
            authAPI.getMe(token)
                .then(res => {
                    setUser(res.data);
                    setRole(res.data.role as UserRole);
                })
                .catch(() => {
                    localStorage.removeItem(TOKEN_KEY);
                    const savedRole = localStorage.getItem(ROLE_KEY) as UserRole;
                    if (savedRole) setRole(savedRole);
                });
        } else {
            const savedRole = localStorage.getItem(ROLE_KEY) as UserRole;
            if (savedRole) setRole(savedRole);
        }
    }, []);

    const setSession = useCallback((authUser: AuthUser, token: string) => {
        setUser(authUser);
        setRole(authUser.role as UserRole);
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(ROLE_KEY, authUser.role);
        document.cookie = `finovax-role=${authUser.role}; path=/; max-age=86400`;
    }, []);

    // ── Real credential login ──────────────────────────────────────────────────
    const loginWithCredentials = useCallback(async (email: string, password: string) => {
        const res = await authAPI.login(email, password);
        setSession(res.data.user, res.data.token);
        router.push(`/${res.data.user.role}/dashboard`);
    }, [setSession, router]);

    // ── Real registration ──────────────────────────────────────────────────────
    const registerUser = useCallback(async (payload: RegisterPayload) => {
        const res = await authAPI.register(payload);
        setSession(res.data.user, res.data.token);
        router.push(`/${res.data.user.role}/dashboard`);
    }, [setSession, router]);

    // ── Demo / legacy login (no API call) ─────────────────────────────────────
    const login = useCallback((newRole: UserRole) => {
        const demoUser: AuthUser = {
            id: `demo-${newRole}`,
            name: newRole.charAt(0).toUpperCase() + newRole.slice(1) + " Demo",
            email: `demo@${newRole}.finovax`,
            role: newRole,
            organization: "FInovaX Demo",
        };
        setUser(demoUser);
        setRole(newRole);
        localStorage.setItem(ROLE_KEY, newRole);
        localStorage.setItem(TOKEN_KEY, `mock.jwt.finovax.${newRole}`);
        document.cookie = `finovax-role=${newRole}; path=/; max-age=86400`;
        router.push(`/${newRole}/dashboard`);
    }, [router]);

    const logout = useCallback(() => {
        setUser(null);
        setRole(null);
        localStorage.removeItem(ROLE_KEY);
        localStorage.removeItem(TOKEN_KEY);
        document.cookie = "finovax-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/login");
    }, [router]);

    const switchRole = useCallback((newRole: UserRole) => {
        login(newRole);
    }, [login]);

    const toggleDemoMode = () => setIsDemoMode(prev => !prev);

    return (
        <AuthContext.Provider value={{
            user,
            role,
            isAuthenticated: !!role,
            login,
            loginWithCredentials,
            registerUser,
            logout,
            switchRole,
            isDemoMode,
            toggleDemoMode,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
