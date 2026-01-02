import { NextRequest, NextResponse } from "next/server";
import { createKnowledgeDatabaseFromExcel } from "@/lib/createKnowledgeDatabaseFromExcel";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const config = await prisma().configuration.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        if (!config) {
            return NextResponse.json({ error: "No master configuration found. Please upload files." }, { status: 404 });
        }

        // Fetch blobs and process
        const mappingRes = await fetch(config.mappingUrl);
        const icd10Res = await fetch(config.icd10Url);

        const mappingBuffer = Buffer.from(await mappingRes.arrayBuffer());
        const icd10Buffer = Buffer.from(await icd10Res.arrayBuffer());

        const db = await createKnowledgeDatabaseFromExcel(mappingBuffer, icd10Buffer);

        return NextResponse.json({
            ...db,
            _metadata: {
                mappingName: config.mappingName,
                icd10Name: config.icd10Name,
                updatedAt: config.updatedAt,
                mappingUrl: config.mappingUrl,
                icd10Url: config.icd10Url
            }
        });
    } catch (error: any) {
        console.error("GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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

        const mappingBuffer = Buffer.from(await mappingFile.arrayBuffer());
        const icd10Buffer = Buffer.from(await icd10File.arrayBuffer());

        // 1. Upload to Vercel Blob
        const mappingBlob = await put(`mappings/${mappingFile.name}`, mappingBuffer, { access: 'public' });
        const icd10Blob = await put(`icd10/${icd10File.name}`, icd10Buffer, { access: 'public' });

        // 2. Update Database
        const config = await prisma().configuration.create({
            data: {
                mappingUrl: mappingBlob.url,
                mappingName: mappingFile.name,
                icd10Url: icd10Blob.url,
                icd10Name: icd10File.name,
                isActive: true
            }
        });

        // 3. Process and return
        const db = await createKnowledgeDatabaseFromExcel(mappingBuffer, icd10Buffer);

        return NextResponse.json({
            ...db,
            _metadata: {
                mappingName: config.mappingName,
                icd10Name: config.icd10Name,
                updatedAt: config.updatedAt,
                mappingUrl: config.mappingUrl,
                icd10Url: config.icd10Url
            }
        });
    } catch (error: any) {
        console.error("POST Error:", error);
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred during processing" },
            { status: 500 }
        );
    }
}
