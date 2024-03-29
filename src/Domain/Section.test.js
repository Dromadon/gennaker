import { Question } from './Question';
import {Section} from './Section';
import {QuestionDatabase} from "../Infrastructure/QuestionsDatabase/QuestionDatabase"

describe('SectionShouldContainQuestions', () => {
    //Given
    const sectionDisplayName = "Section de test";
    const questionsNumber = 2;

    const question1 = new Question({fileName: "path/1"});
    const question2 = new Question({fileName: "path/2"});
    const question3 = new Question({fileName: "path/3"});
    const questions = [question1, question2, question3]

    test('SectionCanBeCreatedWithNameAndDisplayNameAndQuestionsNumber', () => {
        //When
        const section = new Section({displayName:sectionDisplayName});

        //Then
        expect(section.displayName).toBe(sectionDisplayName);
    })
    
    test('SectionMustBeCreatedWithDisplayName', () => {
        //Then
        expect(() => {new Section()}).toThrowError();
    })

    test('SectionCanBeSetQuestionNumber', () => {
        //When
        const section = new Section({displayName:sectionDisplayName});
        section.setQuestionsNumber(2);
        
        //Then
        expect(section.questionsNumber).toBe(2);
    })

    test('SectionCanBeSetQuestions', () => {
        //When
        const section = new Section({displayName:sectionDisplayName});
        section.setQuestionsNumber(3);
        section.setQuestions({questions: questions});
        
        //Then
        expect(section.questions).toBe(questions);
    })
})