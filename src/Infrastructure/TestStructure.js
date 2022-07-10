import { Category } from "../Domain/Category";
import { Section } from "../Domain/Section";

//Categories and sections names and display names
export const CAT1_NAME="categorie1"; export const CAT1_DISPLAY_NAME="Catégorie 1";
export const SEC11_NAME="section11"; export const SEC11_DISPLAY_NAME="Section 11"
export const SEC12_NAME="section12"; export const SEC12_DISPLAY_NAME="Section 12"

export const CAT2_NAME="categorie2"; export const CAT2_DISPLAY_NAME="Catégorie 2";
export const SEC21_NAME="section21"; export const SEC21_DISPLAY_NAME="Section 21"
export const SEC22_NAME="section22"; export const SEC22_DISPLAY_NAME="Section 22"


//Eval structure questions numbers
export const CATAMARAN_RACCOURCIE_CAT1_SEC12_NUMBER=2;
export const CATAMARAN_RACCOURCIE_CAT2_SEC21_NUMBER=1;
export const DERIVEUR_STANDARD_CAT1_SEC11_NUMBER=2;
export const DERIVEUR_STANDARD_CAT2_SEC21_NUMBER=2;
export const DERIVEUR_STANDARD_CAT2_SEC22_NUMBER=1;

//file with all categories and sections names and display names
export const GENERIC_STRUCTURE = {
    [CAT1_NAME]: {
        "displayName": CAT1_DISPLAY_NAME,
        "sections": {
            [SEC11_NAME]: {
                "displayName": SEC11_DISPLAY_NAME
            },
            [SEC12_NAME]: {
                "displayName": SEC12_DISPLAY_NAME
            }
        }
    },
    [CAT2_NAME]: {
        "displayName": CAT2_DISPLAY_NAME,
        "sections": {
            [SEC21_NAME]: {
                "displayName": SEC21_DISPLAY_NAME
            },
            [SEC22_NAME]: {
                "displayName": SEC22_DISPLAY_NAME
            }
        }
    }
}

//file with catamaran raccourcie eval structure
export const catamaran_raccourcie = {
    [CAT1_NAME]: {
        [SEC12_NAME]: CATAMARAN_RACCOURCIE_CAT1_SEC12_NUMBER
    },
    [CAT2_NAME]: {
        [SEC21_NAME]: CATAMARAN_RACCOURCIE_CAT2_SEC21_NUMBER
    }
}

//expected resulting catamaran raccourcie eval object categories
export const expectedCatamaranRaccourcieCategories = {
    CAT1_NAME: new Category({displayName: CAT1_DISPLAY_NAME})
        .setSection({
            sectionName: SEC12_NAME, 
            section: new Section({displayName: SEC12_DISPLAY_NAME})
                .setQuestionsNumber(CATAMARAN_RACCOURCIE_CAT1_SEC12_NUMBER)
        }),
    CAT2_NAME: new Category({displayName: CAT2_DISPLAY_NAME})
        .setSection({
            sectionName: SEC21_NAME,
            section: new Section({displayName: SEC21_DISPLAY_NAME})
                .setQuestionsNumber(CATAMARAN_RACCOURCIE_CAT2_SEC21_NUMBER)
        })
}

//file with deriveur standard eval structure
const deriveur_standard = {
    [CAT1_NAME]: {
        [SEC11_NAME]: DERIVEUR_STANDARD_CAT1_SEC11_NUMBER,
    },
    [CAT2_NAME]: {
        [SEC21_NAME]: DERIVEUR_STANDARD_CAT2_SEC21_NUMBER,
        [SEC22_NAME]: DERIVEUR_STANDARD_CAT2_SEC22_NUMBER
    }
}

//expected resulting deriveur standard eval object categories
export const expectedDeriveurStandardCategories = {
    CAT1_NAME: new Category({displayName: CAT1_DISPLAY_NAME})
        .setSection({
            sectionName: SEC11_NAME, 
            section: new Section({displayName: SEC11_DISPLAY_NAME})
                .setQuestionsNumber(DERIVEUR_STANDARD_CAT1_SEC11_NUMBER)
        }),
    CAT2_NAME: new Category({displayName: CAT2_DISPLAY_NAME})
        .setSection({
            sectionName: SEC21_NAME,
            section: new Section({displayName: SEC21_DISPLAY_NAME})
                .setQuestionsNumber(DERIVEUR_STANDARD_CAT2_SEC21_NUMBER)
        })
        .setSection({
            sectionName: SEC22_NAME,
            section: new Section({displayName: SEC22_DISPLAY_NAME})
                .setQuestionsNumber(DERIVEUR_STANDARD_CAT2_SEC22_NUMBER)
        })
}
