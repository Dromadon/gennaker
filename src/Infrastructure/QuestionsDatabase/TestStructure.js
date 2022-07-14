import { Question } from "../../Domain/Question"
import { CAT1_DISPLAY_NAME, CAT1_NAME } from "../EvaluationStructure/TestStructure";

export const CATEGORY_1_NAME = "categorie1";
export const CATEGORY_2_NAME = "categorie2";
export const SECTION_11_NAME = "section11";
export const SECTION_21_NAME = "section21"

export const CAT1_SEC11_QUESTIONS_DB = [
    {
        "fileName": "question1.md",
        "supports": ["catamaran", "deriveur"]
    },
    {
        "fileName": "question2.md",
        "answerSize": "sm"
    },
]

export const CAT2_SEC21_QUESTIONS_DB = [
    {
        "fileName": "question3.md",
        "supports": ["deriveur"],
        "answerSize": "lg"
    },
    {
        "fileName": "question4.md",
    },
    {
        "fileName": "question5.md",
        "supports": ["catamaran"]
    }
]

export const QUESTION_1 = new Question({
    fileName: CATEGORY_1_NAME+"/"+SECTION_11_NAME+"/question1.md",
    supports: ["catamaran", "deriveur"]
})

export const QUESTION_2 = new Question({
    fileName: CATEGORY_1_NAME+"/"+SECTION_11_NAME+"/question2.md",
    answerSize: "sm"
})

export const QUESTION_3 = new Question({
    fileName: CATEGORY_2_NAME+"/"+SECTION_21_NAME+"/question3.md",
    supports: ["deriveur"],
    answerSize: "lg"
})

export const QUESTION_4 = new Question({
    fileName: CATEGORY_2_NAME+"/"+SECTION_21_NAME+"/question4.md"
})

export const QUESTION_5 = new Question({
    fileName: CATEGORY_2_NAME+"/"+SECTION_21_NAME+"/question5.md",
    supports: ["catamaran"]
})