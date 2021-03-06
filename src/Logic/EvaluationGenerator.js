
const _ = require('lodash')

export function generateEval(db, evalStructure, evalParameters) {
    let evaluation = {};
    const support = evalParameters["support"];

    console.debug("Generating eval with following inputs");
    console.debug(evalStructure);
    console.debug(db);
    console.debug(evalParameters);

    Object.entries(evalStructure).forEach(([categoryName, categoryStructure]) => {
        console.debug("Initiating category " + categoryName);
        evaluation[categoryName] = generateCategory(db[categoryName], categoryStructure, support);
    })
    return evaluation;
}

function generateCategory(dbCategory, categoryStructure, support) {
    let category = {};

    Object.entries(categoryStructure).forEach(([sectionName, sectionStructure]) => {
        console.debug("Initiating section " + sectionName);
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
        return(!question.hasOwnProperty("supports") || question["supports"].includes(support))
    })
}
