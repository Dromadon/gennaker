import { generateEval } from './EvaluationGenerator';
import testDB from './testDB.json';
import testEvalStructureCatamaran from './testEvalStructureCatamaran.json';

const util = require('util');
const evalParameters = {'support': 'catamaran'}

describe('generatorShouldReturnStructureAsDescribedByStructureJSON', () => {
    //When
    const evaluation = generateEval(testDB, testEvalStructureCatamaran, evalParameters);

    test('generateEvalShouldReturnCategoriesFromEvalStructure', () => {
        // Then
        expect(evaluation).toHaveProperty('Meteo');
        expect(evaluation).toHaveProperty('Conduite');
    })
    
    test('generateEvalShouldNotReturnCategoriesNotInEvalStructure', () => {
        // Then
        expect(evaluation).not.toHaveProperty('CategorieInexistante');
    })
    
    test('generateEvalShouldReturnSectionsFromEvalStructure', () => {
        // Then
        expect(evaluation['Meteo']).toHaveProperty('Section1');
        expect(evaluation['Meteo']).toHaveProperty('Section2');
        expect(evaluation['Conduite']).toHaveProperty('Section1');
    })
    
    test('generateEvalShouldNotReturnSectionsNotEvalStructure', () => {
        // Then
        expect(evaluation['Meteo']).not.toHaveProperty('Section3');
    })
})

describe('generatorShouldReturnQuestionsAsDescribedByStructure', () => {
    const evaluation = generateEval(testDB, testEvalStructureCatamaran, evalParameters);
    console.log(util.inspect(evaluation, {showHidden: false, depth: null, colors: true}))

    test('generateEvalShouldReturnAllQuestionsWithFileNameProperty', () => {
        // Then
        //console.log(util.inspect(evaluation, {showHidden: false, depth: null, colors: true}))
        Object.values(evaluation).forEach((category) => {
            Object.values(category).forEach((section) => {
                expect(section.length).toBeGreaterThan(0);
                section.forEach((question) => {
                    expect(question).toHaveProperty('fileName');
                })
                
            })
        })
    })

    test('generateEvalShouldReturnNumberOfQuestionsInSectionDescribedByStructure', () => {
        // Then
        expect(evaluation['Meteo']['Section1'].length).toEqual(1);
    })

    test('generateEvalShouldExcludeQuestionsWithBadSupport', () => {
        // Then
        /* 
        This needs to be ran several times, because otherwise it could 
        land randomly on working case 
        Improvement idea: launch it 10 times, try to mock the random generation (hard)
        */
        evaluation['Conduite']['Section1'].forEach((question) => {
            expect(question['supports']).toEqual(expect.arrayContaining(['catamaran']));
        });
    })

    test('generateEvalShouldIncludeQuestionsWithoutDefinedSupport', () => {
        // Then
        expect(evaluation['Meteo']['Section1'].length).toBeGreaterThan(0);
    })
})
