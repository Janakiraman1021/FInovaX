export type UserRole = "msme" | "lender" | "auditor";

export interface User {
    id: string;
    name: string;
    role: UserRole;
    email: string;
}

export const mockUsers: Record<string, User> = {
    msme_demo: {
        id: "usr_1",
        name: "John Doe (MSME)",
        role: "msme",
        email: "john@techflow.io",
    },
    lender_demo: {
        id: "usr_2",
        name: "Sarah Smith (Lender)",
        role: "lender",
        email: "sarah@globalfinance.com",
    },
    auditor_demo: {
        id: "usr_3",
        name: "Audit Officer (Regulator)",
        role: "auditor",
        email: "officer@finreg.gov",
    },
};
