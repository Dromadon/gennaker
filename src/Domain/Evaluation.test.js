import {Category} from './Category';
import { Evaluation } from './Evaluation';
import { Section } from './Section';
import { Question } from './Question';
import { QuestionDatabase } from '../Infrastructure/QuestionsDatabase/QuestionDatabase';

const support = "catamaran";
const length = "LengthTest";

const category1 = new Category({"displayName": "Catégorie 1"});
const category2 = new Category({"displayName": "Catégorie 2"});
const category3 = new Category({"displayName": "Catégorie 3"});

const categories = {"categorie1": category1, "categorie2": category2, "categorie3": category3}

describe('EvaluationShouldHaveCorrectStructure', () => {
    test('EvaluationCanBeCreatedWithSupportAndLength', () => {
        //When
        const evaluation = new Evaluation({support: support, length: length});

        //Then
        expect(evaluation.support).toBe(support);
        expect(evaluation.length).toBe(length);
    })

    test('EvaluationMustBeCreatedWithBothSupportAndLength', () => {
        //When + Then
        expect(() => {new Evaluation()}).toThrowError();
        expect(() => {new Evaluation({support: support})}).toThrowError();
        expect(() => {new Evaluation({length: length})}).toThrowError();
    })
})

describe("EvaluationCategoriesCanBeManipulated", () => {
    const evaluation = new Evaluation({support: support, length: length});

    evaluation.setCategory({categoryName: "categorie1", category: category1});
    evaluation.setCategory({categoryName: "categorie2", category: category2});
    evaluation.setCategory({categoryName: "categorie3", category: category3});

    test('EvaluationCanBeAddedCategories', () => {
        //Then
        expect(evaluation.categories).toStrictEqual(categories);
    })

    test('EvaluationCategoriesCanBeRetrievedAsObjectEntries', () => {
        // Given
        const expectedCategories = [["categorie1", category1], ["categorie2", category2], ["categorie3", category3]]

        //When
        const categoriesRetrieved = evaluation.getCategories();

        //Then
        expect(categoriesRetrieved).toStrictEqual(expectedCategories);
    })
})

describe('EvaluationShouldUpdateQuestions', () => {
    let evaluation;
    let questionsDB;

    beforeEach(() => {
        questionsDB = new QuestionDatabase();

        evaluation = new Evaluation({support: support, length: length})
        const section11 = new Section({"displayName": "Section 11"}).setQuestionsNumber(2);
        const section21 = new Section({"displayName": "Section 21"}).setQuestionsNumber(1);
    
        category1.setSection({sectionName: "section11", section: section11})
        category2.setSection({sectionName: "section21", section: section21})

        evaluation.setCategory({categoryName: "categorie1", category: category1});
        evaluation.setCategory({categoryName: "categorie2", category: category2});
      }); 

    //Given
    const section11Questions = [new Question({fileName: "path/1"}), new Question({fileName: "path/2"})];
    const section21Questions = [new Question({fileName: "path/3"})];

    test('QuestionsCanBeUpdatedForGivenSection', async () => {
        //And
        jest.spyOn(questionsDB, "getQuestions").mockReturnValue(section11Questions);

        //When
        await evaluation.updateSectionQuestions({questionsDB: questionsDB, categoryName: "categorie1", sectionName: "section11"})

        //Then
        expect(evaluation.categories["categorie1"].sections["section11"].questions).toBe(section11Questions);
    })

    test('QuestionsCanBeUpdatedForTheWholeEvaluation', async () => {
        //And
        jest.spyOn(questionsDB, "getQuestions")
            .mockReturnValueOnce(section11Questions)
            .mockReturnValueOnce(section21Questions);

        //When
        await evaluation.updateAllQuestions({questionsDB: questionsDB});

        //Then
        expect(evaluation.categories["categorie1"].sections["section11"].questions).toBe(section11Questions);
        expect(evaluation.categories["categorie2"].sections["section21"].questions).toBe(section21Questions);

    })
})