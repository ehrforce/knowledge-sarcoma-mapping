import * as fs from 'fs';
import { loadAnatomyFromExcel } from "../excel/load";
import { anatomyRowToDataSet } from "../model/model";
import { KnowledgeManager } from "../model/manager";

export type ICD10 = { code: string, name: string };

export async function loadUniqueAnatomyCodesFromExcel(excelfile: string) {
    try {
        if (!fs.existsSync(excelfile)) {
            throw Error("Excel file does not exist" + excelfile);
        }

        const data = await loadAnatomyFromExcel(excelfile);
        return data;
    } catch (err) {
        console.error("Could not load anatomy from excel due to" + err);
        throw err;
    }

}

/**
 * NB! Legge til manuelt C97 fordi den brukes ved multifokal registrering. 
 * @param f 
 * @returns 
 */
export async function getUniqueICD10Codes(f: string): Promise<string[]> {
    try {
        const exixts = fs.existsSync(f);
        if (exixts) {
            const result = await loadAnatomyFromExcel(f);
            //console.log("Loaded excel");
            const codes = loadUniqueIcd10Codes(result);
            //console.log(JSON.stringify(codes, null, 1));
            const uniqes = Object.keys(codes);
            const sortedAndCleaned = uniqes.map(x => x.replace(".", "").trim()).sort();
            return sortedAndCleaned;
        } else {
            throw new Error("File does not exist" + f);
        }
    } catch (err) {
        throw err;
    }
}

function loadUniqueIcd10Codes(rows: Array<any>) {

    const m = mapper();
    rows.forEach(r => {
        const a = anatomyRowToDataSet(r, KnowledgeManager.CODE_PREFIX_ANATOMY);
        m.add(a.icd10Benign);
        m.add(a.icd10Malign);
        m.add(a.icd10Uncertain);
    })
    return m.record();

    function mapper() {
        const r: Record<string, number> = {};
        return {
            record(): Record<string, number> {
                return r;
            },
            codes(): string[] {
                return Object.keys(r);
            },
            add(s: string | undefined | null) {
                if (s) {
                    const existing = r[s];
                    if (existing) {
                        r[s] = existing + 1;
                    } else {
                        r[s] = 1;
                    }
                }

            }
        }
    }
}
