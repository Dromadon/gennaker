import { Question } from './Question';
import {Section} from './Section';
import {Category} from './Category';

describe('SectionShouldContainQuestions', () => {
    //Given
    const categoryName = "categoryTest";
    const categoryDisplayName = "Catégorie de test";

    const section1 = new Section({name: 'section1', displayName: 'Section 1', questionsNumber: 2});
    const section2 = new Section({name: 'section2', displayName: 'Section 2', questionsNumber: 3});
    const section3 = new Section({name: 'section3', displayName: 'Section 3', questionsNumber: 1});

    const sections = [section1, section2, section3];

    test('CategoryCanBeCreatedWithNameAndDisplayName', () => {
        //When
        const category = new Category({name: categoryName, displayName: categoryDisplayName});

        //Then
        expect(category.name).toBe(categoryName);
        expect(category.displayName).toBe(categoryDisplayName);
    })
    
    test('SectionMustBeCreatedWithNameAndSectionDisplayName', () => {
        //Then
        expect(() => {new Category()}).toThrowError();
        expect(() => {new Category({name: categoryName})}).toThrowError();
        expect(() => {new Category({displayName: categoryDisplayName})}).toThrowError();
    })

    test('CategoryCanBeAddedQuestions', () => {
        //When
        const category = new Category({name: categoryName, displayName: categoryDisplayName})
        category.addSection(section1);
        category.addSection(section2);
        category.addSection(section3);


        //Then
        category.sections = sections;
    })


})