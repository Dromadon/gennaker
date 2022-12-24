import { Question } from "../../Domain/Question"

export const CATEGORY_2_NAME = "categorie2";
export const SECTION_21_NAME = "section21"

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