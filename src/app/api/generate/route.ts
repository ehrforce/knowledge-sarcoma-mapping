import { NextRequest, NextResponse } from "next/server";
import { createKnowledgeDatabaseFromExcel } from "@/lib/createKnowledgeDatabaseFromExcel";
import * as fs from "fs";
import * as path from "path";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const mappingFile = formData.get("mapping") as File | null;
        const icd10File = formData.get("icd10") as File | null;

        if (!mappingFile || !icd10File) {
            return NextResponse.json(
                { error: "Both mapping and icd10 files are required" },
                { status: 400 }
            );
        }

        // Convert Files to Buffers for processing
        const mappingBuffer = Buffer.from(await mappingFile.arrayBuffer());
        const icd10Buffer = Buffer.from(await icd10File.arrayBuffer());

        /**
         * NOTE ON STORAGE:
         * To store files on Vercel, you should use "Vercel Blob".
         * Example implementation (requires @vercel/blob):
         * 
         * import { put } from "@vercel/blob";
         * await put(`uploads/${mappingFile.name}`, mappingBuffer, { access: 'public' });
         */

        console.log("Processing mapping file:", mappingFile.name);
        console.log("Processing ICD-10 file:", icd10File.name);

        const db = await createKnowledgeDatabaseFromExcel(mappingBuffer, icd10Buffer);

        return NextResponse.json(db);
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred during processing" },
            { status: 500 }
        );
    }
}
