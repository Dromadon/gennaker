var dir = require('node-dir');
const fs = require('fs');
var colors = require('colors');


//loop over categories
//loop over sections
//get questions files
//load db json
//check if each file is in db

//for later: backup db, update it
const BASE_PATH="public/questions";

var categories = dir.files(BASE_PATH, 'dir', null, {sync: true, recursive: false, shortName: true});
console.log("Listing all categories: ");
console.log(categories);


categories.map((category) => {
    checkCategory(category);
})

function checkCategory(category) {
    console.log("\n\nEntering category ".bold.underline+category.bold.underline.red);
    console.log("Loading DB");
    categoryDB = loadDB(category);

    console.log("Sections in category are: ");
    var sections = dir.files(BASE_PATH+'/'+category, 'dir', null, {sync: true, recursive: false, shortName: true})
    console.log(sections);
    sections.map((section) => {
        checkSection(category, section, categoryDB)
    })
}

function checkSection(category, section, categoryDB) {
    console.log("\nEntering section ".bold + section.bold.red);
    const sectionPath = BASE_PATH+'/'+category+'/'+section;
    const dbQuestions = categoryDB[section].map()

    console.log("Listing questions files on filesystem")
    var fileQuestions = dir.files(sectionPath, {sync:true})
        .filter((file) => file.indexOf(['.md']) > -1)
        .map((question) => (question.replace(sectionPath+'/', "")))
    checkQuestionsExistInDB(fileQuestions, dbQuestions);
    checkQuestionsExistOnFileSystem(fileQuestions, dbQuestions);
}

function checkQuestionsExistInDB(fileQuestions, dbQuestions) {
    console.log("\nChecking if questions files exist in db".italic)
    fileQuestions.map((fileQuestion) => {
        if (dbQuestions.some(dbQuestion => dbQuestion.fileName === fileQuestion)) {
            console.log("Found question in DB: ".green+fileQuestion);
        }
        else {
            console.log("Missing question in DB: ".bold.red+fileQuestion);
        }
    })
}

function checkQuestionsExistOnFileSystem(fileQuestions, dbQuestions) {
    console.log("\nChecking if questions in db exist on filesystem".italic)
    dbQuestions.map((dbQuestion) => {
        if (fileQuestions.some(fileQuestion => fileQuestion === dbQuestion.fileName)) {
            console.log("Found question on filesystem: ".green+dbQuestion.fileName);
        }
        else {
            console.log("Missing question on filesystem: ".bold.red+dbQuestion.fileName);
        }
    })
}

function loadDB(categoryPath) {
    return JSON.parse(fs.readFileSync(BASE_PATH+'/'+categoryPath+'/db.json', 'utf-8').toString());
}