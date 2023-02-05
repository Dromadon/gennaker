var dir = require('node-dir');
const fs = require('fs');
require('colors');
const readline = require('readline');
const prompt = require('prompt-sync')({ sigint: true });

const BASE_PATH = "public/questions";

console.log("Listing categories".bold.underline.yellow);

missingQuestionsInDB = {}
missingQuestionsInFiles = {}

dir.files(BASE_PATH, 'dir', null, { sync: true, recursive: false, shortName: true })
    .map(
        (category) => {
            checkCategory(category, missingQuestionsInDB)
        }
    )

displayMissingQuestions(missingQuestionsInDB, missingQuestionsInFiles)

function checkCategory(category) {
    console.log("\n\nEntering category ".bold.underline + category.bold.underline.green);
    missingQuestionsInDB[category] = {}
    missingQuestionsInFiles[category] = {}

    dir.files(BASE_PATH + '/' + category, 'dir', null, { sync: true, recursive: false, shortName: true })
        .map(
            (section) => {
                [missingQuestionsInDBForSection, missingQuestionsInFilesForSection] = checkSection(category, section)
                missingQuestionsInDB[category][section] = missingQuestionsInDBForSection
                missingQuestionsInFiles[category][section] = missingQuestionsInFilesForSection
            }
        )
}


function checkSection(category, section) {
    console.log("\nEntering section ".bold + section.bold.green);
    const SECTION_PATH = BASE_PATH + '/' + category + '/' + section;

    backupDB(SECTION_PATH)

    const dbQuestions = loadDB(SECTION_PATH)
    const fileQuestions = dir.files(SECTION_PATH, { sync: true })
        .filter((file) => file.indexOf(['.md']) > -1)
        .map((question) => (question.replace(SECTION_PATH + '/', "")))

    console.log("DB & file questions loaded".italic)
    const missingQuestionsInDB = checkQuestionsExistInDB(fileQuestions, dbQuestions);
    const missingQuestionsInFiles = checkQuestionsExistOnFileSystem(fileQuestions, dbQuestions);

    writeDB(SECTION_PATH, dbQuestions)

    return [missingQuestionsInDB, missingQuestionsInFiles]
}

function checkQuestionsExistInDB(fileQuestions, dbQuestions) {
    console.log("\nChecking if file questions exist in db".italic)
    var missingQuestionsInDB = []

    fileQuestions.map((fileQuestion) => {
        if (dbQuestions.some(dbQuestion => dbQuestion.fileName === fileQuestion)) {
            console.log("Found question in DB: ".green + fileQuestion);
        }
        else {
            console.log("Missing question in DB: ".bold.red + fileQuestion);
            const questionAddedToDB = addQuestionToDB(dbQuestions, fileQuestion)

            if (!questionAddedToDB)
                missingQuestionsInDB.push(fileQuestion)
        }
    })

    return missingQuestionsInDB
}

function checkQuestionsExistOnFileSystem(fileQuestions, dbQuestions) {
    console.log("\nChecking if questions in db exist on filesystem".italic)
    var missingQuestionsInFiles = []

    dbQuestions.map((dbQuestion) => {
        if (fileQuestions.some(fileQuestion => fileQuestion === dbQuestion.fileName)) {
            console.log("Found question on filesystem: ".green + dbQuestion.fileName);
        }
        else {
            console.log("Missing question on filesystem: ".bold.red + JSON.stringify(dbQuestion));
            const questionRemovedFromDB = removeQuestionFromDB(dbQuestions, dbQuestion)

            if(!questionRemovedFromDB)
                missingQuestionsInFiles.push(dbQuestion)
        }
    })

    return missingQuestionsInFiles
}

function addQuestionToDB(dbQuestions, fileQuestion) {
    const decision = prompt("Do you want to add the question to the DB? y/n : ")

    if (decision === "y") {
        newQuestion = { "fileName": fileQuestion }

        console.log("Which answer size?")
        const answerSize = prompt("xs/sm/md/lg/xl or leave empty: ")
        if (answerSize != "")
            newQuestion["answerSize"] = answerSize

        console.log("Which supports?")
        const supports = prompt("deriveur/catamaran/windsurf/croisiere, separated by ',' or leave empty: ")
        if (supports != "")
            newQuestion["supports"] = supports.split(',')

        console.log("Adding question to the DB")
        dbQuestions.push(newQuestion)
        return true
    }

    return false
}

function removeQuestionFromDB(dbQuestions, dbQuestion) {
    const decision = prompt("Do you want to remove the question to the DB? y/n : ")

    if (decision === "y") {
        dbQuestions.splice(dbQuestions.indexOf(dbQuestion), 1)
        return true
    }

    return false
}

function displayMissingQuestions(missingQuestionsInDB, missingQuestionsInFiles) {
    console.log("\n\nQuestions still missing in database :".bold.underline.red)
    Object.entries(missingQuestionsInDB).map(([categoryName, category]) => {
        Object.entries(category).map(([sectionName, section]) => {
            section.map(question => console.log(categoryName.bold+" "+sectionName.bold+" : "+question))
        })
    })

    console.log("\n\nQuestions still missing in files :".bold.underline.red)
    Object.entries(missingQuestionsInFiles).map(([categoryName, category]) => {
        Object.entries(category).map(([sectionName, section]) => {
            section.map(question => console.log(categoryName.bold+" "+sectionName.bold+" : "+JSON.stringify(question)))
        })
    })
}

function loadDB(sectionPath) {
    return JSON.parse(fs.readFileSync(sectionPath + '/db.json', 'utf-8').toString());
}

function backupDB(sectionPath) {
    fs.copyFileSync(sectionPath + '/db.json', sectionPath + '/db.json.backup')
}

function writeDB(sectionPath, dbQuestions) {
    fs.writeFileSync(sectionPath + '/db.json', JSON.stringify(dbQuestions, null, 4), 'utf8');
}