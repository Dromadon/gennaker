import { Question } from '../../Domain/Question';

const _ = require('lodash')

class QuestionDatabase {

    async getQuestions({category, section, number, support}={}){   
        if (category === undefined || category === null)
            throw new Error("Category is undefined or null");
        if (section === undefined || section === null)
            throw new Error("Section is undefined or null");

        console.log("Getting "+number+" questions from DB for category "+category+" and section "+section+" with support "+support)

        const questionsDB = await this.fetchQuestionDatabaseFile({category: category, section: section});
        const filteredQuestionsDB = this.filterSupport(questionsDB, support); 

        //Optimisation de perf : instancier les objets après le choix aléatoire
        const questions = filteredQuestionsDB.map((question) => {    
            return new Question({
            fileName: category+"/"+section+"/"+question.fileName,
            answerSize: question.answerSize,
            supports: question.supports
            })
        })

        console.debug("Questions returned from DB are ");
        console.debug(questions);

        if(number === undefined)
            return questions
        else
            return _.sampleSize(questions, number);
    }

    filterSupport(questionsDB, support) {
        if(support === undefined)
            return questionsDB
        else {
            return questionsDB.filter((question) => {
                return(!question.hasOwnProperty("supports") || question["supports"].includes(support))
            })
        }
    }

    async fetchQuestionDatabaseFile({category, section}={}) {
        console.debug("Fetching questions for category "+category+" and section "+section);
        const questionDB = await (await fetch(process.env.PUBLIC_URL + "/questions/" + category + "/" + section + "/db.json", 
            { 
                headers : { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }))
            .json();
        return questionDB;
    }
}

export {QuestionDatabase}