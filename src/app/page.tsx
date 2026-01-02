"use client";

import { useState, useEffect } from "react";
import DropZone from "@/components/DropZone";
import ResultTable from "@/components/ResultTable";
import { Sparkles, Download, RefreshCcw, AlertTriangle, Table, Code, Save, Database, History } from "lucide-react";

export default function Home() {
    const [mappingFile, setMappingFile] = useState<File | null>(null);
    const [icd10File, setIcd10File] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingMaster, setIsLoadingMaster] = useState(true);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"detailed" | "compact">("detailed");
    const [displayMode, setDisplayMode] = useState<"json" | "table">("table");
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch Master Data on load
    useEffect(() => {
        fetchMaster();
    }, []);

    const fetchMaster = async () => {
        setIsLoadingMaster(true);
        setError(null);
        try {
            const response = await fetch("/api/generate");
            if (response.ok) {
                const data = await response.json();
                setResult(data);
            } else if (response.status !== 404) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to fetch master data");
            }
        } catch (err: any) {
            console.error(err);
            setError("Could not load master data: " + err.message);
        } finally {
            setIsLoadingMaster(false);
        }
    };

    const handleProcess = async () => {
        if (!mappingFile || !icd10File) return;

        setIsProcessing(true);
        setError(null);

        const formData = new FormData();
        formData.append("mapping", mappingFile);
        formData.append("icd10", icd10File);

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to update master data");
            }

            const data = await response.json();
            setResult(data);
            // Clear local files after successful upload to master
            setMappingFile(null);
            setIcd10File(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const copyToClipboard = () => {
        if (!result) return;
        const text = viewMode === "detailed"
            ? JSON.stringify(result, null, 2)
            : JSON.stringify(result);
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadJson = () => {
        if (!result) return;
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "knowledge.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <main>
            <div className="animate-in">
                <h1>Sarcoma Knowledge Builder</h1>
                <p className="description">
                    Seamlessly extract knowledge databases from Excel mapping files for OpenEHR archetypes.
                </p>
            </div>

            <div className="glass-card flex flex-col gap-8">
                {isLoadingMaster ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-in">
                        <RefreshCcw className="animate-spin text-blue-500 mb-4" size={40} />
                        <p className="text-slate-400 font-medium">Fetching shared master data...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                <Database className="text-blue-400" size={20} />
                                <h2 className="text-xl font-semibold">Master Configuration</h2>
                                {result?._metadata && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500 ml-auto bg-slate-800/50 px-3 py-1 rounded-full">
                                        <History size={14} />
                                        Last Updated: {new Date(result._metadata.updatedAt).toLocaleString()}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DropZone
                                    label={result?._metadata?.mappingName || "Mapping Excel (.xlsx)"}
                                    onFileSelect={setMappingFile}
                                />
                                <DropZone
                                    label={result?._metadata?.icd10Name || "ICD-10 Excel (.xlsx)"}
                                    onFileSelect={setIcd10File}
                                />
                            </div>

                            {mappingFile && icd10File && (
                                <div className="flex justify-center py-4 animate-in">
                                    <button
                                        className="button flex items-center gap-2 text-lg px-8 py-3 bg-emerald-600 hover:bg-emerald-700"
                                        disabled={isProcessing}
                                        onClick={handleProcess}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <RefreshCcw className="animate-spin" size={20} />
                                                Updating Master...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={20} />
                                                Update Shared Master Data
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {result && (
                            <div className="flex flex-col items-center gap-4 animate-in w-full border-t border-slate-800 pt-8">
                                <div className="bg-emerald-500/10 text-emerald-400 px-6 py-4 rounded-xl border border-emerald-500/20 flex flex-col items-center text-center w-full max-w-md mb-4">
                                    <p className="font-bold text-lg mb-1">Active Data</p>
                                    <p className="text-sm opacity-80">
                                        {result.morphology?.length || 0} morphology codes & {result.anatomy?.length || 0} anatomy nodes.
                                    </p>
                                </div>

                                <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-800">
                                    <button
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${displayMode === "table" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                                        onClick={() => setDisplayMode("table")}
                                    >
                                        <Table size={18} />
                                        Table View
                                    </button>
                                    <button
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${displayMode === "json" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                                        onClick={() => setDisplayMode("json")}
                                    >
                                        <Code size={18} />
                                        JSON Preview
                                    </button>
                                </div>

                                {displayMode === "table" ? (
                                    <ResultTable data={result} />
                                ) : (
                                    <div className="w-full preview-container animate-in text-left">
                                        <div className="preview-header">
                                            <div className="toggle-group">
                                                <button
                                                    className={`toggle-btn ${viewMode === "detailed" ? "active" : ""}`}
                                                    onClick={() => setViewMode("detailed")}
                                                >
                                                    Detailed
                                                </button>
                                                <button
                                                    className={`toggle-btn ${viewMode === "compact" ? "active" : ""}`}
                                                    onClick={() => setViewMode("compact")}
                                                >
                                                    Compact
                                                </button>
                                            </div>
                                            <button className="copy-btn" onClick={copyToClipboard}>
                                                {copied ? "Copied!" : "Copy JSON"}
                                            </button>
                                        </div>
                                        <pre className="preview-content">
                                            {viewMode === "detailed"
                                                ? JSON.stringify(result, null, 2)
                                                : JSON.stringify(result)}
                                        </pre>
                                    </div>
                                )}

                                <div className="flex flex-wrap justify-center gap-4 border-t border-slate-800 pt-8 w-full">
                                    <button
                                        className="button flex items-center gap-2 px-6"
                                        onClick={downloadJson}
                                    >
                                        <Download size={18} />
                                        Download JSON
                                    </button>

                                    {result?._metadata && (
                                        <div className="flex gap-4">
                                            <a
                                                href={result._metadata.mappingUrl}
                                                className="px-6 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition text-slate-300 flex items-center gap-2"
                                                download
                                            >
                                                <Download size={18} />
                                                Download {result._metadata.mappingName}
                                            </a>
                                            <a
                                                href={result._metadata.icd10Url}
                                                className="px-6 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition text-slate-300 flex items-center gap-2"
                                                download
                                            >
                                                <Download size={18} />
                                                Download {result._metadata.icd10Name}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {error && (
                    <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg border border-red-500/20 flex items-center gap-3 animate-in">
                        <AlertTriangle size={20} />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}
            </div>

            <style jsx>{`
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: 1fr; }
        @media (min-width: 768px) {
          .grid-cols-2 { grid-template-columns: 1fr 1fr; }
        }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }
        .gap-8 { gap: 2rem; }
        .text-lg { font-size: 1.125rem; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .px-8 { padding-left: 2rem; padding-right: 2rem; }
        .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .pt-8 { padding-top: 2rem; }
        .text-center { text-align: center; }
        .border-t { border-top-width: 1px; }
        .border-slate-800 { border-color: #1e293b; }
        .text-sm { font-size: 0.875rem; }
        .font-bold { font-weight: 700; }
        .mb-1 { margin-bottom: 0.25rem; }
        .opacity-80 { opacity: 0.8; }
        .rounded-xl { border-radius: 0.75rem; }
        .ml-4 { margin-left: 1rem; }
      `}</style>
        </main>
    );
}
