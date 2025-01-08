import { Command, OptionValues } from "commander";
import * as fs from 'fs';
import { loadAnatomyFromExcel, loadExcelICD10, loadMorphologyFromExcel, } from "./excel/load";
import { anatomyRowToDataSet } from './model/SarkomKnowledgeDatabase';
import { SarkomKnowledgeDatabase } from "./model/model";
import { writeIcd10ToCsv } from "./csv/icd10_to_csv";
export type ICD10 = { code: string, name: string };


export const program = new Command("sarcoma-knowledge-builder");
program.version("0.0.1")
  .description("CLI to extract knowledge from Excel spreadsheets");


addCommandLoadKnowledge(program);
addCommandIcd10(program);
addCommandAnatomySnomedCt(program);


program.parse(process.argv);

function addCommandLoadKnowledge(program: Command) {

  const p = program.command("knowledge <excel_file>")
    .description("Extract knowledgedatabase from mappin.xlsx and export to json db file ")
    .option("-o --outfile [file]", "The file to write the knowledge to", "tmp.knowledge.json")
    .action(async (excel_file: string, options: OptionValues) => {
      const outfile = options.outfile;
      console.log(`Loading knowledge from excel: ${excel_file}  to file ${outfile}`);
      await cliLoad(excel_file, outfile);
    })
    ;

}

function addCommandAnatomySnomedCt(program: Command) {
  const p = program.command("anatomy <mapping_file")
    .description("Load all SNOMED-CT codes defining anatomy from mapping file")
    .option("-o --outfile", "The file to write SNOMED-CT codes", "tmp.anatomy.snomed-ct.txt")
    .action(async (mapping_file: string, options: OptionValues) => {
      const data = await loadUniqueAnatomyCodesFromExcel(mapping_file);
      const codes = data.map(x => anatomyRowToDataSet(x));
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
    .description("Extract unique ICD10 codes defined in mapping and create a codeset file to be used in applications")
    .option("-o --outfile <file>", "The file to write the codeset to", "tmp.icd10.codeset.txt")
    .option("-c --csv", "Write result as CSV")
    .action(async (mapping_file: string, icd10_file: string, options: OptionValues) => {
      /**
       * This action is a bit busy..... 
       * @todo refactor ??? 
       */
      const outfile: string = options.outfile;
      console.log(`Create codeset from excel files. Mapping: ${mapping_file}. ICD10: ${icd10_file}. Write to: ${outfile}`);
      const uniques = await getUniqueICD10Codes(mapping_file);
      const icdcodes = await loadExcelICD10(icd10_file);

      type CodeSet = {
        code: string;
        name: string;
      }

      const result: CodeSet[] = [];
      uniques.forEach(c => {
        const i = icdcodes[c];
        if (i) {
          result.push({
            code: c, name: i
          })
        } else {
          console.warn(`The ICD10 code does not exist ${c}`);
        }
      })

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



async function loadUniqueAnatomyCodesFromExcel(excelfile: string) {
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





async function getUniqueICD10Codes(f: string): Promise<string[]> {
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
async function cliLoad(f: string, out_file: string) {
  try {
    const exist = fs.existsSync(f);
    if (exist) {
      const result = await loadMorphologyFromExcel(f);
      const anatomy = await loadAnatomyFromExcel(f);
      const db: SarkomKnowledgeDatabase = {
        generated: new Date(Date.now()).toISOString(),
        file: f,
        morphology: result.filter(x => x[1] == "x"),
        anatomy: anatomy
      }
      fs.writeFileSync(out_file, JSON.stringify(db), { encoding: "utf-8" });
    } else {
      console.warn("Given file does not exist" + f);
    }
  } catch (error) {
    console.error("Error loading the CLI" + error);

  }


}

function loadUniqueIcd10Codes(rows: Array<any>) {

  const m = mapper();
  rows.forEach(r => {
    const a = anatomyRowToDataSet(r);
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