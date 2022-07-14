
import * as TestStructure from "./TestStructure";
import fetchMock from "jest-fetch-mock";
import { EvaluationStructureMaker } from "./EvaluationStructureMaker";

describe('EvaluationStructureIsGeneratedBasedOnStructureFiles', () => {
    //Given
    const evaluationStructureMaker = new EvaluationStructureMaker();
    let spyData = jest.spyOn(evaluationStructureMaker, "fetchCategoriesData").mockReturnValue(TestStructure.GENERIC_STRUCTURE);
    let spyStructure = jest.spyOn(evaluationStructureMaker, "fetchEvalStructure").mockReturnValue(TestStructure.EVAL_STRUCTURE_CATAMARAN_RACCOURCIE);

    test('EvaluationCanBeCreatedWithSupportAndLength', async () => {
        //And
        const support = "catamaran";
        const length = "raccourcie";

        //When
        const evaluation = await evaluationStructureMaker.generateStructure({support: support, length: length});

        //Then
        expect(evaluation.support).toBe(support);
        expect(evaluation.length).toBe(length);
    })

    test('EvaluationHaveExpectedCategories', async () => {
        //When
        const evaluationCatamaranRaccourcie = await evaluationStructureMaker.generateStructure({support: "catamaran", length: "raccourcie"})

        //Then
        expect(evaluationCatamaranRaccourcie.categories)
            .toStrictEqual(TestStructure.expectedCatamaranRaccourcieCategories)        
    })
})

describe('EvaluationStructureMakerCorrectlyFetchesEvalStructureAndCategoriesFiles', () => {
    //Given
    const evaluationStructureMaker2 = new EvaluationStructureMaker();
    //fetchMock.resetMocks();
    fetchMock.enableMocks();

    test('FetchCategoriesDataWorks', async () => {
        //Given
        fetchMock.resetMocks();
        fetchMock.mockResponseOnce(JSON.stringify(TestStructure.GENERIC_STRUCTURE));

        //When
        const categoriesData = await evaluationStructureMaker2.fetchCategoriesData();

        //Then
        expect(fetch).toBeCalledWith("/questions/categoriesDB.json", {"headers": {"Accept": "application/json", "Content-Type": "application/json"}});
        expect(categoriesData)
            .toStrictEqual(TestStructure.GENERIC_STRUCTURE)        
    })

    test('FetchEvalStructureWorksForSeveralSupportAndLength', async () => {
        //Given
        fetchMock.resetMocks();
        fetchMock.mockResponseOnce(JSON.stringify(TestStructure.EVAL_STRUCTURE_CATAMARAN_RACCOURCIE))
            .mockResponseOnce(JSON.stringify(TestStructure.EVAL_STRUCTURE_DERIVEUR_STANDARD));

        //When
        const evalStructureCatamaranRaccourcie = await evaluationStructureMaker2.fetchEvalStructure({support: "catamaran", length: "raccourcie"});
        const evalStructureDeriveurStandard = await evaluationStructureMaker2.fetchEvalStructure({support: "deriveur", length: "standard"});

        //Then
        expect(fetch.mock.calls[0][0]).toEqual("/evaluations/catamaran_raccourcie.json");
        expect(fetch.mock.calls[1][0]).toEqual("/evaluations/deriveur_standard.json");

        expect(evalStructureCatamaranRaccourcie)
            .toStrictEqual(TestStructure.EVAL_STRUCTURE_CATAMARAN_RACCOURCIE);      
        expect(evalStructureDeriveurStandard)
            .toStrictEqual(TestStructure.EVAL_STRUCTURE_DERIVEUR_STANDARD);  
    })
})