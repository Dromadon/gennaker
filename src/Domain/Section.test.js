import { Question } from './Question';
import {Section} from './Section';

describe('SectionShouldContainQuestions', () => {
    //Given
    const sectionName = "sectionTest";
    const sectionDisplayName = "Section de test";
    const questionsNumber = 2;

    const question1 = new Question({fileName: "path/1"});
    const question2 = new Question({fileName: "path/2"});
    const question3 = new Question({fileName: "path/3"});
    const questions = [question1, question2, question3]

    test('SectionCanBeCreatedWithNameAndDisplayNameAndQuestionsNumber', () => {
        //When
        const section = new Section({name: sectionName, displayName:sectionDisplayName, questionsNumber: questionsNumber});

        //Then
        expect(section.name).toBe(sectionName);
        expect(section.displayName).toBe(sectionDisplayName);
    })
    
    test('SectionMustBeCreatedWithNameAndSectionDisplayNameAndQuestionsNumber', () => {
        //Then
        expect(() => {new Section()}).toThrowError();
        expect(() => {new Section({name: sectionName})}).toThrowError();
        expect(() => {new Section({displayName: sectionDisplayName})}).toThrowError();
        expect(() => {new Section({questionsNumber: questionsNumber})}).toThrowError();

        expect(() => {new Section({name: sectionName, displayName: sectionDisplayName})}).toThrowError();
    })

    test('SectionCanBeAddedQuestions', () => {
        //When
        const section = new Section({name: sectionName, displayName: sectionDisplayName, questionsNumber: questionsNumber})
        section.addQuestion(question1);
        section.addQuestion(question2);
        section.addQuestion(question3);

        //Then
        section.questions = questions;
    })


})