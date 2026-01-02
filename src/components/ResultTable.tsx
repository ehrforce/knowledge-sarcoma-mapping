"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Hash } from "lucide-react";

interface ResultTableProps {
    data: {
        anatomy: any[];
        morphology: any[];
        icd10: any[];
    };
}

export default function ResultTable({ data }: ResultTableProps) {
    const [activeTab, setActiveTab] = useState<"anatomy" | "morphology" | "icd10">("anatomy");
    const [filters, setFilters] = useState<Record<string, string>>({});

    const columns = {
        anatomy: [
            { key: 0, label: "Code" },
            { key: 1, label: "Parent" },
            { key: 2, label: "Organ" },
            { key: 3, label: "Location" },
            { key: 4, label: "Snomed-CT" },
            { key: 7, label: "ICD-10" },
        ],
        morphology: [
            { key: 0, label: "ID" },
            { key: 2, label: "Name" },
            { key: 3, label: "Norpat" },
            { key: 4, label: "ICD-0" },
            { key: 5, label: "Malignity" },
        ],
        icd10: [
            { key: 0, label: "Code" },
            { key: 1, label: "Name" },
        ],
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [`${activeTab}_${key}`]: value.toLowerCase() }));
    };

    const filteredData = useMemo(() => {
        const currentData = data[activeTab];
        return currentData.filter((row) => {
            return columns[activeTab].every((col) => {
                const filterValue = filters[`${activeTab}_${col.key}`];
                if (!filterValue) return true;
                const cellValue = String(row[col.key] || "").toLowerCase();
                return cellValue.includes(filterValue);
            });
        });
    }, [data, activeTab, filters]);

    return (
        <div className="flex flex-col w-full animate-in">
            <div className="tabs">
                <div
                    className={`tab ${activeTab === "anatomy" ? "active" : ""}`}
                    onClick={() => setActiveTab("anatomy")}
                >
                    Anatomy ({data.anatomy.length})
                </div>
                <div
                    className={`tab ${activeTab === "morphology" ? "active" : ""}`}
                    onClick={() => setActiveTab("morphology")}
                >
                    Morphology ({data.morphology.length})
                </div>
                <div
                    className={`tab ${activeTab === "icd10" ? "active" : ""}`}
                    onClick={() => setActiveTab("icd10")}
                >
                    ICD-10 ({data.icd10.length})
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            {columns[activeTab].map((col) => (
                                <th key={col.key}>
                                    <div className="flex flex-col">
                                        <span>{col.label}</span>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            className="filter-input"
                                            value={filters[`${activeTab}_${col.key}`] || ""}
                                            onChange={(e) => handleFilterChange(String(col.key), e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.slice(0, 100).map((row, idx) => (
                            <tr key={idx}>
                                {columns[activeTab].map((col) => (
                                    <td key={col.key}>{String(row[col.key] || "")}</td>
                                ))}
                            </tr>
                        ))}
                        {filteredData.length > 100 && (
                            <tr>
                                <td colSpan={columns[activeTab].length} style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>
                                    Showing first 100 entries. Use filters to narrow down.
                                </td>
                            </tr>
                        )}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={columns[activeTab].length} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                    No matching entries found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
