import * as csv from 'fast-csv';
import { ICD10 } from '../utils/icd10';

export async function writeIcd10ToCsv(data: ICD10[], outfile?: string): Promise<string> {
    if (outfile) {
        console.log("Write CSV to file");
        return new Promise((resolve, reject) => {
            csv.writeToPath(outfile, data, { headers: true })
                .on("error", () => reject("Could not write to file"))
                .on("finish", () => resolve("Wrote CSV to file"));
        })
    } else {
        console.log("Write CSV to System.out");
        const csvStream = csv.format({ headers: true });

        csvStream.pipe(process.stdout).on('end', () => process.exit());
        data.forEach(d => {
            csvStream.write({ code: d.code, name: d.name });
        })
        csvStream.end();
        return "Write data to System.out";
    }


}