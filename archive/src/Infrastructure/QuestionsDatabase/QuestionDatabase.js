import { Question } from '../../Domain/Question';

const _ = require('lodash')

class QuestionDatabase {

    async getQuestions({ category, section, number, support, excludedQuestions } = {}) {
        if (category === undefined || category === null)
            throw new Error("Category is undefined or null");
        if (section === undefined || section === null)
            throw new Error("Section is undefined or null");

        console.log("Getting " + number + " questions from DB for category " + category + " and section " + section + " with support " + support)

        const questionsData = await this.fetchQuestionDatabaseFile({ category: category, section: section });

        const filteredQuestionsData = questionsData
            .filter(questionData => this.filterSupport(questionData, support))
            .filter(questionData => this.filterExcludedQuestions(questionData, excludedQuestions))

        const questions = this.getRandomQuestions(filteredQuestionsData, number).map((question) => {
            return new Question({
                fileName: category + "/" + section + "/" + question.fileName,
                answerSize: question.answerSize,
                supports: question.supports
            })
        })

        return questions


    }

    filterSupport(questionData, support) {
        if (support === undefined)
            return true
        else {
            return !questionData.hasOwnProperty("supports") || questionData["supports"].includes(support)
        }
    }

    filterExcludedQuestions(questionData, excludedQuestions) {
        if (excludedQuestions === undefined)
            return true
        else {
            if (excludedQuestions.some(excludedQuestion => excludedQuestion.fileName.split('/').pop() === questionData.fileName))
                return false
            else
                return true
        }
    }

    getRandomQuestions(questionsData, number) {
        if (number === undefined)
            return questionsData
        else
            return _.sampleSize(questionsData, number);
    }

    async fetchQuestionDatabaseFile({ category, section } = {}) {
        console.debug("Fetching questions for category " + category + " and section " + section);
        const questionDB = await (await fetch(process.env.PUBLIC_URL + "/questions/" + category + "/" + section + "/db.json",
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }))
            .json();
        return questionDB;
    }
}

export { QuestionDatabase }