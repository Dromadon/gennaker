var dir = require('node-dir');
const fs = require('fs');
require('colors');
const readline = require('readline');
const prompt = require('prompt-sync')({sigint: true});


//loop over categories
//loop over sections
//get questions files
//load db json
//check if each file is in db

//for later: backup db, update it
const BASE_PATH = "public/questions";

console.log("Listing categories".bold.underline.yellow);

dir.files(BASE_PATH, 'dir', null, { sync: true, recursive: false, shortName: true })
    .map(
        (category) => {
            checkCategory(category)
        }
    )

function checkCategory(category) {
    console.log("\n\nEntering category ".bold.underline + category.bold.underline.red);

    dir.files(BASE_PATH + '/' + category, 'dir', null, { sync: true, recursive: false, shortName: true })
        .map(
            (section) => {
                checkSection(category, section)
            }
        )
}


function checkSection(category, section) {
    console.log("\nEntering section ".bold + section.bold.red);
    const SECTION_PATH = BASE_PATH + '/' + category + '/' + section;

    backupDB(SECTION_PATH)

    const dbQuestions = loadDB(SECTION_PATH)
    const fileQuestions = dir.files(SECTION_PATH, { sync: true })
        .filter((file) => file.indexOf(['.md']) > -1)
        .map((question) => (question.replace(SECTION_PATH + '/', "")))

    console.log("DB & file questions loaded".italic)
    const missingQuestionsInDB = checkQuestionsExistInDB(fileQuestions, dbQuestions);
    writeDB(SECTION_PATH, dbQuestions)

    checkQuestionsExistOnFileSystem(fileQuestions, dbQuestions);

    return missingQuestionsInDB
}

function checkQuestionsExistInDB(fileQuestions, dbQuestions) {
    console.log("\nChecking if file questions exist in db".italic)
    var missinQuestionsInDB = []

    fileQuestions.map((fileQuestion) => {
        if (dbQuestions.some(dbQuestion => dbQuestion.fileName === fileQuestion)) {
            console.log("Found question in DB: ".green + fileQuestion);
        }
        else {
            console.log("Missing question in DB: ".bold.red + fileQuestion);
            const questionAddedToDB = addQuestionToDB(dbQuestions, fileQuestion)

            if (!questionAddedToDB)
                missinQuestionsInDB.push(fileQuestion)
        }
    })

    return missinQuestionsInDB
}

function checkQuestionsExistOnFileSystem(fileQuestions, dbQuestions) {
    console.log("\nChecking if questions in db exist on filesystem".italic)
    dbQuestions.map((dbQuestion) => {
        if (fileQuestions.some(fileQuestion => fileQuestion === dbQuestion.fileName)) {
            console.log("Found question on filesystem: ".green + dbQuestion.fileName);
        }
        else {
            console.log("Missing question on filesystem: ".bold.red + dbQuestion.fileName);
        }
    })
}

function addQuestionToDB(dbQuestions, fileQuestion) {
    const decision = prompt("Do you want to add the question to the DB? y/n : ")

    if (decision === "y"){
        newQuestion = {"filename": fileQuestion}

        console.log("Which answer size?")
        const answerSize = prompt("xs/sm/md/lg/xl or leave empty: ")
        if (answerSize != "")
            newQuestion["answerSize"] = answerSize

        console.log("Which supports?")
        const supports = prompt("deriveur/catamaran/windsurf/croisiere, separated by ',' or leave empty: ")
        if (supports != "")
            newQuestion["supports"] = supports.split(' ')

        console.log("Adding question to the DB")
        dbQuestions.push(newQuestion)
        return true
    } 

    return false
}

function loadDB(sectionPath) {
    return JSON.parse(fs.readFileSync(sectionPath + '/db.json', 'utf-8').toString());
}

function backupDB(sectionPath) {
    fs.copyFile(sectionPath+'/db.json', sectionPath+'/db.json.backup', (err) => {
        if (err) throw err;
        console.log('source.txt was copied to destination.txt');
      });
}

function writeDB(sectionPath, dbQuestions) {
    fs.writeFileSync(sectionPath+'/db.json', JSON.stringify(dbQuestions, null, 4), 'utf8');
}