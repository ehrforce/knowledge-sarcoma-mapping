
import ExcelJS from 'exceljs';

import { asNumber } from './asNumber';
import { asString } from './asString';
import { AnatomyRow, MorphologyRow } from '../model/model';


async function loadWorkbook(input: string | Buffer | ArrayBuffer): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    if (typeof input === 'string') {
        await workbook.xlsx.readFile(input);
    } else if (Buffer.isBuffer(input)) {
        await workbook.xlsx.load(input);
    } else {
        await workbook.xlsx.load(Buffer.from(input));
    }
    return workbook;
}

function worksheetToRows(worksheet: ExcelJS.Worksheet): unknown[][] {
    const rows: unknown[][] = [];
    worksheet.eachRow({ includeEmpty: true }, (row) => {
        // row.values is 1-indexed; slice(1) makes it 0-indexed
        rows.push((row.values as unknown[]).slice(1));
    });
    return rows;
}

/**
 *
 * @param fullPathToFile
 * @param [sheetNumber=1] the sheet number for anatomy information (default is 1 (= second))
 * @param [headerRows=2] defines which row to start reading data from. The Excel sheet have two header rows.
 * @returns
 */
export async function loadAnatomyFromExcel(input: string | Buffer | ArrayBuffer, sheetNumber = 1, headerRows = 0): Promise<Array<any>> {
    const workbook = await loadWorkbook(input);
    const worksheet = workbook.worksheets[sheetNumber];
    const data = worksheetToRows(worksheet);
    let i = 0;

    const result: any[] = [];
    data.forEach(row => {
        if (i > headerRows) {
            result.push(rowToAnatomy(row));
        }
        i++;
    })
    return result;

    function rowToAnatomy(row: unknown): AnatomyRow {
        if (Array.isArray(row)) {
            return [
                asNumber(row[0]), //code
                asNumber(row[1]), // parent
                asString(row[2]), // organ
                asString(row[3]), // anatomical location
                asString(row[4]), // SNOMED-CT
                asString(row[5]), // NORPAT
                asString(row[6]), // ICD-10 benign
                asString(row[7]), // ICD-10 malign
                asString(row[8]), // ICD-10 uncertain
                asNumber(row[10]), // category
                asString(row[11]) // comment
            ]
        } else {
            return [-1, -1, "", "", "", "", "", "", "", -1, "ERROR"]
        }
    }
}

/**
 *
 * @param fullPathToFile
 * @param sheetNumber sheetNumber for morphology (default is 0 (first sheet))
 * @returns
 */
export async function loadMorphologyFromExcel(input: string | Buffer | ArrayBuffer, sheetNumber = 0): Promise<MorphologyRow[]> {
    const workbook = await loadWorkbook(input);
    const worksheet = workbook.worksheets[sheetNumber];
    const data = worksheetToRows(worksheet);
    let i = 0;
    const result: MorphologyRow[] = [];
    data.forEach(row => {
        if (i > 0) {
            result.push(rowToMorfologyRow(row));
        }
        i++;
    })

    return result;

    function rowToMorfologyRow(row: unknown): MorphologyRow {
        if (Array.isArray(row)) {
            return [
                asNumber(row[0]), // egen kode
                asString(row[1]), // ønskes med i kodesett
                asString(row[2]), // navn
                asString(row[3]), // NORPAT
                asString(row[4]), // ICD-0
                asNumber(row[5]) // Malignitet
            ]
        } else {
            return [-1, "", "", "", "", -1];
        }
    }
}

export async function loadExcelICD10(input: string | Buffer | ArrayBuffer): Promise<Record<string, string>> {
    const workbook = await loadWorkbook(input);
    const worksheet = workbook.worksheets[0];
    const data = worksheetToRows(worksheet);
    let i = 0;
    const result: Record<string, string> = {};
    data.forEach(row => {
        if (i > 0) {
            if (Array.isArray(row)) {
                const entry: ICD10CodeEntry = {
                    code: asString(row[0]),
                    name: asString(row[1])
                };
                result[entry.code] = entry.name;
            }
        }
        i++;
    })

    return result;
}

type ICD10CodeEntry = {
    code: string;
    name: string;
}
