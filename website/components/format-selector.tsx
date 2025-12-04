"use client";

import { ConversionFormat, FAVICON_FORMATS } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface FormatSelectorProps {
    selectedFormats: string[];
    onFormatsChange: (formats: string[]) => void;
    disabled?: boolean;
}

export function FormatSelector({
    selectedFormats,
    onFormatsChange,
    disabled,
}: FormatSelectorProps) {
    const toggleFormat = (formatId: string) => {
        if (disabled) return;

        if (selectedFormats.includes(formatId)) {
            onFormatsChange(selectedFormats.filter((id) => id !== formatId));
        } else {
            onFormatsChange([...selectedFormats, formatId]);
        }
    };

    const selectAll = () => {
        if (disabled) return;
        onFormatsChange(FAVICON_FORMATS.map((f) => f.id));
    };

    const clearAll = () => {
        if (disabled) return;
        onFormatsChange([]);
    };

    const selectPreset = (preset: "web" | "mobile" | "all") => {
        if (disabled) return;

        switch (preset) {
            case "web":
                onFormatsChange(["ico", "png-16", "png-32", "svg"]);
                break;
            case "mobile":
                onFormatsChange(["png-180", "png-192", "png-512"]);
                break;
            case "all":
                selectAll();
                break;
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Quick presets */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => selectPreset("web")}
                    disabled={disabled}
                    className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-full border transition-colors",
                        "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    Web Essentials
                </button>
                <button
                    onClick={() => selectPreset("mobile")}
                    disabled={disabled}
                    className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-full border transition-colors",
                        "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    Mobile Icons
                </button>
                <button
                    onClick={selectAll}
                    disabled={disabled}
                    className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-full border transition-colors",
                        "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    Select All
                </button>
                {selectedFormats.length > 0 && (
                    <button
                        onClick={clearAll}
                        disabled={disabled}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-full border transition-colors",
                            "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Format grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FAVICON_FORMATS.map((format) => (
                    <FormatCard
                        key={format.id}
                        format={format}
                        selected={selectedFormats.includes(format.id)}
                        onClick={() => toggleFormat(format.id)}
                        disabled={disabled}
                    />
                ))}
            </div>

            {/* Selection count */}
            <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                <span>
                    {selectedFormats.length} format{selectedFormats.length !== 1 ? "s" : ""} selected
                </span>
            </div>
        </div>
    );
}

interface FormatCardProps {
    format: ConversionFormat;
    selected: boolean;
    onClick: () => void;
    disabled?: boolean;
}

function FormatCard({ format, selected, onClick, disabled }: FormatCardProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "relative flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-all",
                selected
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {/* Checkmark */}
            <div
                className={cn(
                    "absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full transition-all",
                    selected
                        ? "bg-primary text-primary-foreground"
                        : "border border-zinc-300 dark:border-zinc-600"
                )}
            >
                {selected && <Check className="h-3 w-3" />}
            </div>

            {/* Format info */}
            <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {format.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                    {format.extension}
                </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 pr-6">
                {format.description}
            </p>
        </button>
    );
}
