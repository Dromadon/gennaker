import {Category} from './Category';
import { Evaluation } from './Evaluation';

const support = "categoryTest";
const length = "Catégorie de test";

const category1 = new Category({"displayName": "Catégorie 1"})
const category2 = new Category({"displayName": "Catégorie 2"})
const category3 = new Category({"displayName": "Catégorie 3"})

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

    evaluation.setCategory("categorie1", category1);
    evaluation.setCategory("categorie2", category2);
    evaluation.setCategory("categorie3", category3);

    test('EvaluationCanBeAddedCategories', () => {
        //Then
        expect(evaluation.categories).toStrictEqual(categories);
    })

    test('EvaluationCategoriesCanBeRetrievedAsList', () => {
        // Given
        const expectedCategories = [["categorie1", category1], ["categorie2", category2], ["categorie3", category3]]

        //When
        const categoriesRetrieved = evaluation.getCategories();

        //Then
        expect(categoriesRetrieved).toStrictEqual(expectedCategories);
    })
})