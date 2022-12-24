
import * as TestData from "./TestData";
import fetchMock from "jest-fetch-mock";
import { EvaluationStructureMaker } from "./EvaluationStructureMaker";

describe('EvaluationStructureIsGeneratedBasedOnStructureFiles', () => {
    //Given
    const evaluationStructureMaker = new EvaluationStructureMaker();
    const support = "catamaran";
    const length = "raccourcie";

    jest.spyOn(evaluationStructureMaker, "fetchCategoriesData").mockReturnValue(TestData.CATEGORIES_DATA);
    jest.spyOn(evaluationStructureMaker, "fetchEvalStructure").mockReturnValue(TestData.EVAL_STRUCTURE_CATAMARAN_RACCOURCIE);

    test('EvaluationCanBeCreatedWithSupportAndLength', async () => {
        //When
        const evaluation = await evaluationStructureMaker.generateStructure({support: support, length: length});

        //Then
        expect(evaluation.support).toBe(support);
        expect(evaluation.length).toBe(length);
    })

    test('EvaluationHaveExpectedCategories', async () => {
        //When
        const evaluationCatamaranRaccourcie = await evaluationStructureMaker.generateStructure({support: support, length: length})

        //Then
        expect(evaluationCatamaranRaccourcie)
            .toStrictEqual(TestData.EXPECTED_CATAMARAN_RACCOURCIE_EVALUATION)        
    })
})

describe('EvaluationStructureMakerCorrectlyFetchesEvalStructureAndCategoriesFiles', () => {
    //Given
    const evaluationStructureMaker = new EvaluationStructureMaker();
    fetchMock.enableMocks();

    test('FetchCategoriesDataWorks', async () => {
        //Given
        fetchMock.resetMocks();
        fetchMock.mockResponseOnce(JSON.stringify(TestData.CATEGORIES_DATA));

        //When
        const categoriesData = await evaluationStructureMaker.fetchCategoriesData();

        //Then
        expect(fetch).toBeCalledWith("/questions/categoriesDB.json", {"headers": {"Accept": "application/json", "Content-Type": "application/json"}});
        expect(categoriesData)
            .toStrictEqual(TestData.CATEGORIES_DATA)        
    })

    test('FetchEvalStructureWorksForSeveralSupportAndLength', async () => {
        //Given
        fetchMock.resetMocks();
        fetchMock.mockResponseOnce("{}")
            .mockResponseOnce("{}");

        //When
        await evaluationStructureMaker.fetchEvalStructure({support: "catamaran", length: "raccourcie"});
        await evaluationStructureMaker.fetchEvalStructure({support: "deriveur", length: "standard"});

        //Then
        expect(fetch.mock.calls[0][0]).toEqual("/evaluations/catamaran_raccourcie.json");
        expect(fetch.mock.calls[1][0]).toEqual("/evaluations/deriveur_standard.json");
    })
})