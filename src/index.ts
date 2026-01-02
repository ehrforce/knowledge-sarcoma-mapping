import { Command, OptionValues } from "commander";
import * as fs from 'fs';
import { loadAnatomyFromExcel, loadExcelICD10, } from "./excel/load";

import { anatomyRowToDataSet, SarkomKnowledgeDatabase } from "./model/model";
import { writeIcd10ToCsv } from "./csv/icd10_to_csv";
import { createKnowledgeDatabaseFromExcel } from "./createKnowledgeDatabaseFromExcel";
import { createICD10Knowledge } from "./createICD10Knowledge";
import { KnowledgeManager } from "./model/manager";
import { getUniqueICD10Codes, loadUniqueAnatomyCodesFromExcel } from "./utils/icd10";


const program = new Command("sarcoma-knowledge-builder");
program.version("0.0.1")
  .description("CLI to extract knowledge from Excel spreadsheets");


addCommandLoadKnowledge(program);
addCommandIcd10(program);
addCommandAnatomySnomedCt(program);


program.parse(process.argv);

function addCommandLoadKnowledge(program: Command) {

  const p = program.command("knowledge <excel_file> <icd10_file>")
    .description("Extract knowledgedatabase from mappin.xlsx and export to json db file ")
    .option("-o --outfile [file]", "The file to write the knowledge to", "tmp.knowledge.json")
    .action(async (excel_file: string, icd10_file: string, options: OptionValues) => {
      const outfile = options.outfile;
      console.log(`Loading knowledge from excel: ${excel_file}  ${excel_file} to file ${outfile}`);
      const db: SarkomKnowledgeDatabase = await createKnowledgeDatabaseFromExcel(excel_file, icd10_file);
      fs.writeFileSync(outfile, JSON.stringify(db), { encoding: "utf-8" });

    })
    ;

}

function addCommandAnatomySnomedCt(program: Command) {
  const p = program.command("anatomy <mapping_file")
    .description("Load all SNOMED-CT codes defining anatomy from mapping file")
    .option("-o --outfile", "The file to write SNOMED-CT codes", "tmp.anatomy.snomed-ct.txt")
    .action(async (mapping_file: string, options: OptionValues) => {
      const data = await loadUniqueAnatomyCodesFromExcel(mapping_file);
      const codes = data.map(x => anatomyRowToDataSet(x, KnowledgeManager.CODE_PREFIX_ANATOMY));
      const snomeds: Record<string, string> = {};
      codes.forEach(c => {
        const sct = c.snomed_ct.replace(";", "").trim();
        const name = c.organ.trim();
        if ("NON" == sct.toUpperCase().trim() || sct.length <= 0) {
          console.log("Skipping " + name);
        } else if (c.parent != c.code) {
          console.log("Skipping not parent code");
        }
        else {
          if (snomeds[sct]) {
            console.log(`SNOMED-CODE exist ${sct} ${name} ${c.location}`);
          } else {
            snomeds[sct] = name;
          }
        }

      });
      console.log(`Finished collection SNOMED-CT codes. ${Object.keys(snomeds).length}`);

      const lines: string[] = [];
      Object.keys(snomeds).forEach(k => {
        const name = snomeds[k];
        lines.push(`${k}\t${name}`);
      });

      const outfile = options.outfile;

      fs.writeFileSync(outfile, lines.join("\n"), { encoding: "utf-8" });
      console.log("Wrote SNOMED-CT codes to " + outfile);

    })
}

function addCommandIcd10(program: Command) {
  const p = program.command("icd10").description("ICD10 operations");


  p.command("unique <mapping_file")
    .description("Extract unique ICD10 codes from the mapping file")
    .option("-o --outfile <file>", "The file to write the data to", "tmp.unique.icd10.json")
    .action(async (mapping_file: string, options: OptionValues) => {
      const outfile = options.outfile;
      const data = await getUniqueICD10Codes(mapping_file);
      fs.writeFileSync(outfile, JSON.stringify(data, null, 1), { encoding: "utf-8" });
      console.log(`Wrote unique ICD10 codes to ${outfile}`);

    })


  p.command("icd10 <icd10_file").description("Collect all ICD10 codes from ICD10 excel file")
    .action(async (icd10_file: string) => {
      console.log("Collect ICD10 codes from " + icd10_file);
      const data = await loadExcelICD10(icd10_file);
      console.log(data);

    })

  p.command("codeset <mapping_file> <icd10_file>")
    .description("Extract unique ICD10 codes defined in mapping and create a codeset file to be used in applications (with additional code C97)")
    .option("-o --outfile <file>", "The file to write the codeset to", "tmp.icd10.codeset.txt")
    .option("-c --csv", "Write result as CSV")
    .action(async (mapping_file: string, icd10_file: string, options: OptionValues) => {
      const outfile: string = options.outfile;
      console.log(`Create codeset from excel files. Mapping: ${mapping_file}. ICD10: ${icd10_file}. Write to: ${outfile}`);

      const result = await createICD10Knowledge(mapping_file, icd10_file);

      if (options.csv) {
        let csvout = outfile;
        if (!csvout.endsWith("csv")) {
          csvout = csvout.concat(".csv");

        }
        const csvresult = await writeIcd10ToCsv(result, csvout);
        console.log(csvresult);

      } else {
        const lines = result.map(x => `ICD10::${x.code}::${x.name}`).join("\n");
        fs.writeFileSync(outfile, lines, { encoding: "utf-8" });
        console.log(`Wrote codeset to file${outfile}. n=${result.length}`);
      }
    })
}