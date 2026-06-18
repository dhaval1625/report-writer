import ReportWriter from './components/ReportWriter';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
            {/* Decorative background grid/gradients */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
            <div className="absolute top-0 left-0 right-0 -z-10 h-[500px] bg-gradient-to-b from-blue-500/5 via-indigo-500/0 to-transparent dark:from-blue-500/10 pointer-events-none" />

            <ReportWriter />
        </main>
    );
}
