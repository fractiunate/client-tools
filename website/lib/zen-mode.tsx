"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ZenModeContextType {
    zenMode: boolean;
    isLoaded: boolean;
    toggleZenMode: () => void;
}

const ZenModeContext = createContext<ZenModeContextType | undefined>(undefined);

const ZEN_MODE_KEY = "zen-mode";

export function ZenModeProvider({ children }: { children: ReactNode }) {
    const [zenMode, setZenMode] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(ZEN_MODE_KEY);
        if (stored === "true") {
            setZenMode(true);
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage when changed
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(ZEN_MODE_KEY, zenMode.toString());
        }
    }, [zenMode, isLoaded]);

    const toggleZenMode = () => {
        setZenMode((prev) => !prev);
    };

    return (
        <ZenModeContext.Provider value={{ zenMode, isLoaded, toggleZenMode }}>
            {children}
        </ZenModeContext.Provider>
    );
}

export function useZenMode() {
    const context = useContext(ZenModeContext);
    if (context === undefined) {
        throw new Error("useZenMode must be used within a ZenModeProvider");
    }
    return context;
}
