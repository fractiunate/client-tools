"use client";

import { useCallback, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateImageFile } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
    onFileSelect: (file: File | null) => void;
    selectedFile: File | null;
    disabled?: boolean;
}

export function FileUpload({ onFileSelect, selectedFile, disabled }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFile = useCallback(
        (file: File) => {
            setError(null);
            const validation = validateImageFile(file);

            if (!validation.valid) {
                setError(validation.error || "Invalid file");
                return;
            }

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            onFileSelect(file);
        },
        [onFileSelect]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);

            if (disabled) return;

            const file = e.dataTransfer.files[0];
            if (file) {
                handleFile(file);
            }
        },
        [handleFile, disabled]
    );

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            if (!disabled) {
                setIsDragging(true);
            }
        },
        [disabled]
    );

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                handleFile(file);
            }
        },
        [handleFile]
    );

    const clearFile = useCallback(() => {
        setPreview(null);
        setError(null);
        onFileSelect(null);
    }, [onFileSelect]);

    return (
        <div className="w-full">
            {!selectedFile ? (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200",
                        isDragging
                            ? "border-primary bg-primary/5 scale-[1.02]"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                        disabled && "opacity-50 cursor-not-allowed",
                        "min-h-[240px]"
                    )}
                >
                    <input
                        type="file"
                        accept="image/*,.ico"
                        onChange={handleInputChange}
                        disabled={disabled}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col items-center gap-4 pointer-events-none">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <Upload className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                                Drop your image here
                            </p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                or click to browse
                            </p>
                        </div>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            PNG, JPG, SVG, WebP, GIF, ICO up to 10MB
                        </p>
                    </div>
                </div>
            ) : (
                <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                    <div className="flex items-center gap-4">
                        {preview ? (
                            <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                                <ImageIcon className="h-8 w-8 text-zinc-400" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearFile}
                            disabled={disabled}
                            className="flex-shrink-0"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove file</span>
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
        </div>
    );
}
