import { Category } from "../../Domain/Category";
import { Evaluation } from "../../Domain/Evaluation";
import { Section } from "../../Domain/Section";

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


// Content of file with all categories data
export const CATEGORIES_DATA = {
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

// Content of file with eval structure for support "catamaran" and length "raccourcie"
export const EVAL_STRUCTURE_CATAMARAN_RACCOURCIE = {
    [CAT1_NAME]: {
        [SEC12_NAME]: {
            "number": CATAMARAN_RACCOURCIE_CAT1_SEC12_NUMBER
        }
    },
    [CAT2_NAME]: {
        [SEC21_NAME]: {
            "number": CATAMARAN_RACCOURCIE_CAT2_SEC21_NUMBER
        }
    }
}

// Expected categories in generated evaluation for support "catamaran" and length "raccourcie"
export const EXPECTED_CATAMARAN_RACCOURCIE_EVALUATION = new Evaluation({support: "catamaran", length: "raccourcie"})
    .setCategory({categoryName: CAT1_NAME, category: new Category({displayName: CAT1_DISPLAY_NAME})
        .setSection({
            sectionName: SEC12_NAME, 
            section: new Section({displayName: SEC12_DISPLAY_NAME})
                .setQuestionsNumber(CATAMARAN_RACCOURCIE_CAT1_SEC12_NUMBER)
        })
    })
    .setCategory({categoryName: CAT2_NAME, category: new Category({displayName: CAT2_DISPLAY_NAME})
        .setSection({
            sectionName: SEC21_NAME,
            section: new Section({displayName: SEC21_DISPLAY_NAME})
                .setQuestionsNumber(CATAMARAN_RACCOURCIE_CAT2_SEC21_NUMBER)
        })
    })