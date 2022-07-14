import { Category } from "../../Domain/Category";
import {Evaluation} from "../../Domain/Evaluation"
import { Section } from "../../Domain/Section";

class EvaluationStructureMaker {

    async generateStructure({support, length}={}) {
        
        const categoriesData = this.fetchCategoriesData();
        console.log(categoriesData);

        const evalStructure = this.fetchEvalStructure({support: support, length: length});
        console.debug(evalStructure);
        
        //*
        const evaluation = new Evaluation({support: support, length: length});

        Object.entries(evalStructure).map(([categoryName, sectionNames]) => {
            console.debug("Adding category " + categoryName);
            const category = new Category({displayName: categoriesData[categoryName]["displayName"]});
            Object.entries(sectionNames).map(([sectionName, questionsNumber]) => {
                const section = new Section({displayName: categoriesData[categoryName]["sections"][sectionName]["displayName"]})
                    .setQuestionsNumber(questionsNumber);
                category.setSection({sectionName: sectionName, section: section});
            })
            evaluation.setCategory({categoryName: categoryName, category: category});
        })
        console.debug(evaluation.categories);
        return evaluation;

        //*/
    }

    async fetchCategoriesData() {
        console.log("Fetching categories data");
        const categoriesDataResult = await fetch(process.env.PUBLIC_URL + "/questions/categoriesDB.json", {
            headers : { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
                }
        })
        const categoriesData = await categoriesDataResult.json();
        console.log(categoriesData);
        return categoriesData;
    }

    async fetchEvalStructure({support, length}) {
        console.debug("Fetching eval structure for support "+support+" and length "+length);
        const evalStructureResult = await fetch(process.env.PUBLIC_URL + "/evaluations/" + support + "_" + length + ".json", {
            headers : { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
                }
        })
        const evalStructure = await evalStructureResult.json();
        console.debug(evalStructure);
        return evalStructure;
    }
}

export {EvaluationStructureMaker}
