"use client";

import { ConversionResult, downloadFavicon, downloadAllAsZip, FAVICON_FORMATS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Package, FileImage, CheckCircle2 } from "lucide-react";

interface ConversionResultsProps {
    results: ConversionResult[];
}

export function ConversionResults({ results }: ConversionResultsProps) {
    if (results.length === 0) return null;

    const handleDownload = async (result: ConversionResult) => {
        await downloadFavicon(result);
    };

    const handleDownloadAll = async () => {
        await downloadAllAsZip(results);
    };

    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Conversion Complete
                    </h3>
                </div>
                <Button onClick={handleDownloadAll} variant="outline" size="sm">
                    <Package className="mr-2 h-4 w-4" />
                    Download All (ZIP)
                </Button>
            </div>

            {/* Results grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.map((result) => (
                    <ResultCard key={result.id} result={result} onDownload={handleDownload} />
                ))}
            </div>

            {/* HTML snippet helper */}
            <div className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                    Add to your HTML
                </h4>
                <pre className="text-xs bg-zinc-100 dark:bg-zinc-800 rounded-md p-3 overflow-x-auto">
                    <code className="text-zinc-700 dark:text-zinc-300">
                        {generateHtmlSnippet(results)}
                    </code>
                </pre>
            </div>
        </div>
    );
}

interface ResultCardProps {
    result: ConversionResult;
    onDownload: (result: ConversionResult) => void;
}

function ResultCard({ result, onDownload }: ResultCardProps) {
    const format = FAVICON_FORMATS.find((f) => f.id === result.format);
    const canPreview = result.url && !result.format.includes("ico");

    return (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    {canPreview ? (
                        <img
                            src={result.url}
                            alt={result.filename}
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <FileImage className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                    )}
                </div>
                <div>
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                        {result.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        {result.size && (
                            <Badge variant="secondary" className="text-xs">
                                {result.size}x{result.size}
                            </Badge>
                        )}
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {format?.name}
                        </span>
                    </div>
                </div>
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onDownload(result)}
                className="flex-shrink-0"
            >
                <Download className="h-4 w-4" />
                <span className="sr-only">Download {result.filename}</span>
            </Button>
        </div>
    );
}

function generateHtmlSnippet(results: ConversionResult[]): string {
    const lines: string[] = [];

    results.forEach((result) => {
        if (result.format === "ico") {
            lines.push(`<link rel="icon" href="/favicon.ico" sizes="48x48">`);
        } else if (result.format === "svg") {
            lines.push(`<link rel="icon" href="/favicon.svg" type="image/svg+xml">`);
        } else if (result.format === "png-180") {
            lines.push(`<link rel="apple-touch-icon" href="/apple-touch-icon.png">`);
        } else if (result.format.startsWith("png-") && result.size) {
            lines.push(
                `<link rel="icon" type="image/png" sizes="${result.size}x${result.size}" href="/favicon-${result.size}x${result.size}.png">`
            );
        }
    });

    return lines.join("\n");
}
