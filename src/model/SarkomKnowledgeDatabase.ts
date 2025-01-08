


export type AnatomyData = {
    code: string;
    parent: string;
    organ: string;
    location: string;
    snomed_ct: string;
    norpat: string;
    icd10Benign: string;
    icd10Malign: string;
    icd10Uncertain: string;
    category: number;
    //grading: number;
    comment: string;
};
export type AnatomyRow = [
    number, // code
    number, // parent
    string, // organ
    string, // anatomical location
    string, // SNOMED-CT
    string, // NORPAT-T
    string, // ICD-10 benign
    string, // ICD-10 maling
    string, // ICD-10 uncertain
    number, // anatomical category 
    string // comment
    
];


export function anatomyRowToDataSet(t: AnatomyRow, term = "SA"): AnatomyData {
    return {
        code: term + t[0],
        parent: term + t[1],
        organ: t[2],
        location: t[3],
        snomed_ct: t[4],
        norpat: t[5],
        icd10Benign: t[6],
        icd10Malign: t[7],
        icd10Uncertain: t[8],
        category: t[9],
        comment: t[10]
        
    };
}

export function KnowledgeCodeMapper() {
    return {
        malignity: mapMalignity,
        category: mapCategory,
        grading: mapGrading
    }

    function mapMalignity(n: number): "benign" | "malign" | "uncertain" {
        //Malignitet (0=benign, 1=malign, 2=usikker malign/benign)
        switch (n) {
            case 0:
                return "benign";
            case 1:
                return "malign";
            case 2:
                return "uncertain";
            default:
                throw Error("Not supported");
        }

    }
    function mapCategory(n: number) {
        //ben=1, bløtvev=2, indre ograner+retroperitenum=3, ukjent lokasjon=4
        switch (n) {
            case 1:
                return "ben";
            case 2:
                return "bloetvev";
            case 3:
                return "indre_organer";
            case 4:
                return "ukjent";
            default:
                throw Error("Unknown anatomical location" + n);

        }

    }
    /**
     * @deprecated Grading was taken out of the Excel sheet december 2024
     * @param n 
     * @returns 
     */
    function mapGrading(n: number) {
        //1=WHO ben, 2=FNCLCC, 3=Joensuu GIST, 4=FIGO
        switch (n) {
            case 0:
                return "Ingen";
            case 1:
                return "WHO";
            case 2:
                return "FNCLCC";
            case 3:
                return "GIST";
            case 4:
                return "FIGO";
            default:
                throw Error("Unknown grading" + n);
        }
    }
}

export type MorphologyDataSet = {
    code: string;
    include: string;
    name: string;
    norpat: string;
    icd0: string;
    malignity: number;
};

export type MorphologyRow = [
    number, // 0 egen kode
    string, // 1 ønskes med i kodesett
    string, // 2 navn
    string, // 3 NORPAT
    string, // 4 ICD-0
    number // 5 Malignitet

];

export function morphologyRowToDataSet(row: MorphologyRow, termId = "M"): MorphologyDataSet {
    return {
        code: termId + row[0],
        include: row[1],
        name: row[2],
        norpat: row[3],
        icd0: row[4],
        malignity: row[5]
    };
}




