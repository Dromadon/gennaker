import { Category } from "../../Domain/Category";
import {Evaluation} from "../../Domain/Evaluation"
import { Section } from "../../Domain/Section";

class EvaluationStructureMaker {

    async generateStructure({support, length}={}) {
        
        const categoriesData = this.fetchCategoriesData();
        console.debug(categoriesData);

        const evalStructure = this.fetchEvalStructure({support: support, length: length});
        console.debug(evalStructure);
        
        const evaluation = new Evaluation({support: support, length: length});
        this.populateEvaluationStructure(evaluation, evalStructure, categoriesData);

        console.debug(evaluation.categories);
        return evaluation;
    }

    populateEvaluationStructure(evaluation, evalStructure, categoriesData) {
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
    }

    async fetchCategoriesData() {
        console.log("Fetching categories data");
        const categoriesData = await (await fetch(process.env.PUBLIC_URL + "/questions/categoriesDB.json", {
            headers : { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
                }
        })).json();
        console.log(categoriesData);
        return categoriesData;
    }

    async fetchEvalStructure({support, length}) {
        console.debug("Fetching eval structure for support "+support+" and length "+length);
        const evalStructure = await (await fetch(process.env.PUBLIC_URL + "/evaluations/" + support + "_" + length + ".json", {
            headers : { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
                }
        })).json();
        console.debug(evalStructure);
        return evalStructure;
    }
}

export {EvaluationStructureMaker}
