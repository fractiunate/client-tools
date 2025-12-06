"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Coffee, Github, ChevronDown, Image, QrCode, Braces, FileArchive, Palette, KeyRound, Wrench, ShieldCheck, LucideIcon } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { tools, Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";

// Map icon names to Lucide components
const iconMap: Record<Tool["icon"], LucideIcon> = {
    Image,
    QrCode,
    Braces,
    FileArchive,
    Palette,
    KeyRound,
    Wrench,
    ShieldCheck,
};

interface SiteHeaderProps {
    currentToolId?: string;
}

export function SiteHeader({ currentToolId }: SiteHeaderProps) {
    const currentTool = tools.find((t) => t.id === currentToolId);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef}>
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                                {currentTool && (() => {
                                    const IconComponent = iconMap[currentTool.icon];
                                    return <IconComponent className="h-4 w-4 text-white" />;
                                })()}
                                {!currentTool && <Wrench className="h-4 w-4 text-white" />}
                            </div>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                Free {currentTool?.name || "Fractiunate Tools"}
                            </span>
                            <ChevronDown className={cn(
                                "h-4 w-4 text-zinc-500 transition-transform",
                                isOpen && "rotate-180"
                            )} />
                        </button>
                    </div>

                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a
                                        href="https://buymeacoffee.com/fractiunate"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                                    >
                                        <Coffee className="h-5 w-5 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Buy me a coffee</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a
                                        href="https://github.com/fractiunate/favicon-converter"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <Github className="h-5 w-5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" />
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>github/fractiunate/favicon-converter</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </header>

            {/* Dropdown - positioned absolute below header */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-16 z-40 flex justify-center px-4">
                    <div className="w-full max-w-5xl">
                        <div className="w-[350px] md:w-[450px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden">
                            <ul className="grid gap-1 p-2 md:grid-cols-2">
                                {tools.map((tool) => (
                                    <ToolListItem
                                        key={tool.id}
                                        tool={tool}
                                        isActive={tool.id === currentToolId}
                                        onClick={() => setIsOpen(false)}
                                    />
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface ToolListItemProps {
    tool: Tool;
    isActive: boolean;
    onClick: () => void;
}

function ToolListItem({ tool, isActive, onClick }: ToolListItemProps) {
    const IconComponent = iconMap[tool.icon];

    const content = (
        <div
            className={cn(
                "flex items-start gap-3 rounded-lg p-3 transition-colors",
                tool.available
                    ? "hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    : "opacity-50 cursor-not-allowed",
                isActive && "bg-violet-50 dark:bg-violet-900/20"
            )}
        >
            <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <IconComponent className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                        {tool.name}
                    </span>
                    {!tool.available && (
                        <span className="text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded font-medium">
                            Soon
                        </span>
                    )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                    {tool.description}
                </p>
            </div>
        </div>
    );

    if (!tool.available) {
        return <li>{content}</li>;
    }

    return (
        <li>
            <Link href={tool.href} onClick={onClick}>
                {content}
            </Link>
        </li>
    );
}
