import { SiteHeader } from "@/components/site-header";

interface PageLayoutProps {
    children: React.ReactNode;
    toolId?: string;
}

export function PageLayout({ children, toolId }: PageLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
            <SiteHeader currentToolId={toolId} />
            {children}
            {/* Footer */}
            <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    <p>
                        Built with ❤️ by{" "}
                        <a
                            href="https://fractiunate.me"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-900 dark:text-zinc-100 hover:underline"
                        >
                            Fractiunate
                        </a>
                    </p>
                    <p className="mt-1">
                        100% client-side • Your files never leave your browser
                    </p>
                </div>
            </footer>
        </div>
    );
}
