"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserRole } from "@/lib/mock/mockUsers";
import { useRouter } from "next/navigation";
import { authAPI, AuthUser, RegisterPayload } from "@/lib/api";

interface AuthContextType {
    user: AuthUser | null;
    role: UserRole | null;
    isAuthenticated: boolean;
    /** true while the session is being restored from localStorage on mount */
    isHydrating: boolean;
    login: (role: UserRole) => void;
    loginWithCredentials: (email: string, password: string) => Promise<void>;
    registerUser: (payload: RegisterPayload) => Promise<void>;
    /** Update name/organization — calls PATCH /auth/me */
    updateProfile: (updates: { name?: string; organization?: string }) => Promise<void>;
    logout: () => void;
    switchRole: (role: UserRole) => void;
    isDemoMode: boolean;
    toggleDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "oneflow-token";
const ROLE_KEY  = "oneflow-role";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser]             = useState<AuthUser | null>(null);
    const [role, setRole]             = useState<UserRole | null>(null);
    const [isDemoMode, setIsDemoMode] = useState(true);
    const [isHydrating, setIsHydrating] = useState(true);
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
                    // Token expired / invalid — keep role from cookie for middleware
                    // but don't remove it so the user can re-auth gracefully
                    const savedRole = localStorage.getItem(ROLE_KEY) as UserRole;
                    if (savedRole) setRole(savedRole);
                })
                .finally(() => setIsHydrating(false));
        } else {
            const savedRole = localStorage.getItem(ROLE_KEY) as UserRole;
            if (savedRole) setRole(savedRole);
            setIsHydrating(false);
        }
    }, []);

    const setSession = useCallback((authUser: AuthUser, token: string) => {
        setUser(authUser);
        setRole(authUser.role as UserRole);
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(ROLE_KEY, authUser.role);
        document.cookie = `oneflow-role=${authUser.role}; path=/; max-age=86400`;
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

    // ── Update profile ────────────────────────────────────────────────────────
    const updateProfile = useCallback(async (updates: { name?: string; organization?: string }) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token || token.startsWith("mock.")) {
            // demo mode — update local state only, no API call
            setUser(prev => prev ? { ...prev, ...updates } : prev);
            return;
        }
        const res = await authAPI.updateProfile(token, updates);
        setUser(res.data);
    }, []);

    // ── Demo / legacy login (no API call) ─────────────────────────────────────
    const login = useCallback((newRole: UserRole) => {
        const demoUser: AuthUser = {
            id: `demo-${newRole}`,
            name: newRole.charAt(0).toUpperCase() + newRole.slice(1) + " Demo",
            email: `demo@${newRole}.oneflow`,
            role: newRole,
            organization: "OneFlow Demo",
        };
        setUser(demoUser);
        setRole(newRole);
        localStorage.setItem(ROLE_KEY, newRole);
        localStorage.setItem(TOKEN_KEY, `mock.jwt.oneflow.${newRole}`);
        document.cookie = `oneflow-role=${newRole}; path=/; max-age=86400`;
        router.push(`/${newRole}/dashboard`);
    }, [router]);

    const logout = useCallback(() => {
        setUser(null);
        setRole(null);
        localStorage.removeItem(ROLE_KEY);
        localStorage.removeItem(TOKEN_KEY);
        document.cookie = "oneflow-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
            isHydrating,
            login,
            loginWithCredentials,
            registerUser,
            updateProfile,
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
