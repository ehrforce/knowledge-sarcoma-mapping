import { CodedItem, DvCodedText, DvText } from 'ehrcraft-form-api';
import { SarkomKnowledgeDatabase, MorphologyDataSet, morphologyRowToDataSet, AnatomyData, anatomyRowToDataSet, ICD10Row } from './model';
import { ICD10 } from '../index';

/**
 * ben=1, bløtvev=2, indre ograner+retroperitenum=3, genitalia = 4,  ukjent lokasjon=5
 */
export enum AnatomicalOrgan {
    BEN = 1,
    BLOTVEV = 2,
    INDRE_ORGANER = 3,
    KVINNELIG_GENITALIE = 4,
    UKJENT = 5,
    NOT_SET = 10


}

export function mapAnatomicalOrganTextToEnum(t?: DvText): AnatomicalOrgan {
    switch (t?.value) {
        case "Ben": //local::Ben|Ben|
            return AnatomicalOrgan.BEN;
        case "Bløtvev": //local::Bløtvev|Bløtvev|": 
            return AnatomicalOrgan.BLOTVEV;
        case "Retroperitoneum og indre organer":// "local::Retroperitoneum og indre organer|Retroperitoneum og indre organer|": 
            return AnatomicalOrgan.INDRE_ORGANER;
        case "Kvinnelige genitalia"://"local::Kvinnelige genitalia|Kvinnelige genitalia|": 
            return AnatomicalOrgan.KVINNELIG_GENITALIE;
        case "Primærtumor ukjent"://"local::Primærtumor ukjent|Primærtumor ukjent|": 
            return AnatomicalOrgan.UKJENT;
        default:
            return AnatomicalOrgan.NOT_SET;

    }
}

export class KnowledgeManager {
    private readonly Version = "0.0.1-alpha";
    public static readonly TERM_ID_MORPHOLOGY = "no.onk.morfologi";
    public static readonly TERM_ID_ANATOMY = "no.onk.anatomi";
    public static readonly CODE_PREFIX_ANATOMY = "A";
    public static readonly CODE_PREFIX_MORPHOLOGY = "M";
    private morphology: MorphologyDataSet[];
    private anataomy: AnatomyData[];
    private ICD10:ICD10Row[];
    constructor(db: SarkomKnowledgeDatabase) {

        this.morphology = db.morphology.map(x => morphologyRowToDataSet(x, KnowledgeManager.CODE_PREFIX_MORPHOLOGY));
        this.anataomy = db.anatomy.map(x => anatomyRowToDataSet(x, KnowledgeManager.CODE_PREFIX_ANATOMY));
        this.ICD10 = db.icd10;

    }
    public toString(): string {
        return `KnowledgeManager v${this.Version}`
    }



    private getIcdCodeBasedOnMalignGrade(malignGrade: "benign" | "malign" | "uncertain") {
        switch (malignGrade) {
            case 'benign':
                return this.anataomy.map(x => x.icd10Benign);
            case 'malign':
                return this.anataomy.map(x => x.icd10Malign);
            case 'uncertain':
                return this.anataomy.map(x => x.icd10Uncertain);
        }
    }
    public getMorphologyCodes(): CodedItem[] {
        const result: CodedItem[] = [];
        this.morphology.forEach(x => {
            const c = new CodedItem(x.code, x.name, x.name, KnowledgeManager.TERM_ID_MORPHOLOGY);
            result.push(c);
        })
        return result;

    }

    public getAnatomyLocationCodesForParent(value?: DvCodedText): CodedItem[] {
        if (value?.definingCode.codeString) {
            const parentCode = value.definingCode.codeString;
            return this.anataomy
                .filter(x => parentCode == x.parent)
                .map(x => this.anatomyDataToCodedItem(x));
        } else {
            return this.getAnatomyLocationCodes();
        }




    }
    private anatomyDataToCodedItem(a: AnatomyData): CodedItem {
        if (a.code == a.parent) {
            // this is a parent node 

            return createCodedItem(a.code, a.organ);
        }
        return createCodedItem(a.code, a.location);

        function createCodedItem(code: string, name: string) {
            const n = name.trim();
            return new CodedItem(code.trim(), n, n, KnowledgeManager.CODE_PREFIX_ANATOMY);
        }
    }

    public getAnatomyLocationCodes(): CodedItem[] {
        return this.anataomy
            .map(x => this.anatomyDataToCodedItem(x));

    }
    public getAnatomyOrganCodes(anatomyCategory?: DvText): CodedItem[] {
        return this.getAnatomicalOrganBasedOnCategory(anatomyCategory).filter(x => x.code == x.parent).map(x => this.anatomyDataToCodedItem(x));
    }
    /**
     * Find the list of anatomical locations matching the category 
     * @param t anatomical category
     * @returns 
     */
    public getAnatomicalLocationsForCategory(filter: { category?: DvText, parent?: DvCodedText }): CodedItem[] {
        const category = mapAnatomicalOrganTextToEnum(filter.category);
        if (category == AnatomicalOrgan.NOT_SET) {
            return this.anataomy
                .map(x => this.anatomyDataToCodedItem(x));
        } else {
            if (filter.parent?.definingCode.codeString) {
                return this.anataomy
                    .filter(x => x.category == category && x.parent == filter.parent?.definingCode.codeString)
                    .map(x => this.anatomyDataToCodedItem(x));
            } else {
                return this.anataomy
                    .filter(x => x.category == category)
                    .map(x => this.anatomyDataToCodedItem(x));
            }

        }

    }
    public getAnatomicalOrganBasedOnCategory(t?: DvText): AnatomyData[] {
        const category = mapAnatomicalOrganTextToEnum(t);
        console.debug(`>  Category is ${category} based on ${t}`);
        if (category == AnatomicalOrgan.NOT_SET) {
            return this.anataomy;
        } else {
            return this.anataomy.filter(x => x.category == category);
        }
    }
    public anatomyDataListToCodedItem(list: AnatomyData[]): CodedItem[] {
        return list.map(x => dataToCodeItem(x));
        function dataToCodeItem(c: AnatomyData) {
            const d = new CodedItem(c.code, c.location, c.organ, KnowledgeManager.TERM_ID_ANATOMY);
            return d;
        }
    }

    public codedItemToDvCodedText(c: CodedItem): DvCodedText {
        return DvCodedText.Parse(`${c.terminology}::${c.code}|${c.name}|`);
    }
    public getParentCodeForAnatomyLocationOrDefault(value?: DvCodedText): CodedItem | undefined {
        const locationDefiningCode = value?.definingCode.codeString;
        if (locationDefiningCode == undefined) {
            // there was noe defining code present
            return undefined;
        }

        const anatomyData = this.anataomy.find(x => x.code == locationDefiningCode);
        if (anatomyData == undefined) {
            console.warn("## Did not find any anatomy code matchin " + locationDefiningCode);

            return undefined;
        }

        const parentCode = this.anataomy.find(x => x.code == anatomyData.parent);
        if (parentCode) {
            // Success !!!! 
            return this.anatomyDataToCodedItem(parentCode);
        } else {
            console.warn(`## Did not find any parent anatomy code with location code = ${anatomyData.parent}`);
            return undefined;
        }

    } 

    public icd10ToCodeItems(): CodedItem[]{
        return this.ICD10.map(x => toCodedItem(x));        
        function toCodedItem(r:ICD10Row):CodedItem{
            return new CodedItem(r[0], r[1], r[1], "ICD10");
        }
    }


}