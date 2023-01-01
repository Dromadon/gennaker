import {Section} from './Section';
import {Category} from './Category';


//Given
const displayName = "Catégorie de test";

const section1 = new Section({displayName: 'Section 1', questionsNumber: 2});
const section2 = new Section({displayName: 'Section 2', questionsNumber: 3});
const section3 = new Section({displayName: 'Section 3', questionsNumber: 1});

const sections = {section1: section1, section2: section2, section3: section3};

describe('CategoryStructureShouldBeCorrect', () => {
    test('CategoryCanBeCreatedWithNameAndDisplayName', () => {
        //When
        const category = new Category({displayName: displayName});

        //Then
        expect(category.displayName).toBe(displayName);
    })
    
    test('SectionMustBeCreatedWithDisplayName', () => {
        //Then
        expect(() => {new Category()}).toThrowError();
    })
})

describe("CategorySectionsCanBeManipulated", () => {
    //Given
    const category = new Category({displayName: displayName})
    category.setSection({sectionName: "section1", section: section1});
    category.setSection({sectionName: "section2", section: section2});
    category.setSection({sectionName: "section3", section: section3});

    test('CategorySectionsCanBeSet', () => {
        //Then
        expect(category.sections).toStrictEqual(sections);
    })

    test('CategorySectionsCanBeRetrievedAsList', () => {
        // Given
        const expectedSections = [["section1", section1], ["section2", section2], ["section3", section3]]

        //When
        const sectionsRetrieved = category.getSections();

        //Then
        expect(sectionsRetrieved).toStrictEqual(expectedSections);
    })
})
