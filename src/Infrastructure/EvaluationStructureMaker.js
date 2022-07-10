import { Category } from "../Domain/Category";
import {Evaluation} from "../Domain/Evaluation"
import { Section } from "../Domain/Section";

class EvaluationStructureMaker {
    static async generateStructure({support, length}={}) {
        console.log("Fetching categories data");
        const categoriesDataResult = await fetch("http://"+process.env.PUBLIC_URL + "/questions/categoriesDB.json", {
            headers : { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
                }
        })
        const categoriesData = await categoriesDataResult.json();
        console.log(categoriesData);

        const evalStructureResult = await fetch(process.env.PUBLIC_URL + "/evaluations/" + support + "/categoriesDB.json", {
            headers : { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
                }
        })
        const evalStructure = await evalStructureResult.json();
        console.debug(evalStructure);
        
        //*
        const evaluation = new Evaluation({support: support, length: length});

        Object.entries(evalStructure).map(([categoryName, sectionNames]) => {
            console.debug("Adding category" + categoryName);
            const category = new Category({displayName: categoriesData[categoryName]["displayName"]});
            Object.entries(sectionNames).map(([sectionName, questionsNumber]) => {
                const section = new Section({displayName: categoriesData[categoryName]["sections"][sectionName]["displayName"]})
                    .setQuestionsNumber(questionsNumber);
            })
            evaluation.setCategory(categoryName, category);
        })
        console.debug(evaluation.categories);
        return evaluation;

        //*/
    }
}

export {EvaluationStructureMaker}
