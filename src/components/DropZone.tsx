"use client";

import { useState, useRef } from "react";
import { Upload, FileCheck, X } from "lucide-react";

interface DropZoneProps {
    label: string;
    onFileSelect: (file: File | null) => void;
    accept?: string;
}

export default function DropZone({ label, onFileSelect, accept = ".xlsx" }: DropZoneProps) {
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setFileName(file.name);
            onFileSelect(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFileName(file.name);
            onFileSelect(file);
        }
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFileName(null);
        onFileSelect(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div
            className={`drop-zone ${dragActive ? "active" : ""} ${fileName ? "has-file" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                style={{ display: "none" }}
                accept={accept}
                onChange={handleChange}
            />

            {fileName ? (
                <div className="flex items-center justify-center gap-3 animate-in">
                    <FileCheck className="text-blue-400" size={32} />
                    <div className="text-left">
                        <div className="font-medium">{fileName}</div>
                        <div className="text-sm text-slate-400">{label}</div>
                    </div>
                    <button onClick={clearFile} className="ml-4 p-1 rounded-full hover:bg-slate-700 transition">
                        <X size={18} />
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <Upload className="text-slate-500 mb-2" size={32} />
                    <p className="font-medium text-slate-300">Drop {label} here</p>
                    <p className="text-sm text-slate-500">or click to browse</p>
                </div>
            )}
        </div>
    );
}
