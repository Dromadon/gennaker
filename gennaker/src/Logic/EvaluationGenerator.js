
const _ = require('lodash')

export function generateEval(db, evalStructure, evalParameters) {
    let evaluation = {};
    const support = evalParameters["support"];

    Object.entries(evalStructure).forEach(([categoryName, sectionsStructure]) => {
        evaluation[categoryName] = generateCategory(db[categoryName], sectionsStructure, support);
    })
    return evaluation;
}

function generateCategory(dbCategory, sectionsStructure, support) {
    let category = {};

    Object.entries(sectionsStructure).forEach(([sectionName, sectionStructure]) => {
        category[sectionName] = generateSection(dbCategory[sectionName], sectionStructure, support);
    })

    return category;
}

function generateSection(dbSection, sectionStructure, support) {
    const numberOfQuestions = sectionStructure["number"];

    const filteredDBSection = filterSupport(dbSection, support);

    return _.sampleSize(filteredDBSection, numberOfQuestions);
}

function filterSupport(dbSection, support) {
    return dbSection.filter((question) => {
        if (!question.hasOwnProperty("supports") || question["supports"].includes("catamaran")) {
            return true;
        }
    })
}
