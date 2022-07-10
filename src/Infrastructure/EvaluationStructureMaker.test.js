import {EvaluationStructureMaker} from "./EvaluationStructureMaker";
import * as TestStructure from "./TestStructure";
import fetchMock from "jest-fetch-mock";


//*
beforeEach(() => {
    fetchMock.resetMocks();
})
//*/

/*
describe('EvaluationCanBeGeneratedWithSupportAndLength', () => {
    //Given
    const support="catamaran";
    const length="raccourcie";
    fetchMock.enableMocks();


    fetchMock.mockResponseOnce(JSON.stringify(TestStructure.GENERIC_STRUCTURE));
 //   fetchMock.mockResponseOnce(JSON.stringify(TestStructure.catamaran_raccourcie));

    test('EvaluationCanBeCreatedWithSupportAndLength', () => {
        //When
        const evaluation = EvaluationStructureMaker.generateStructure({support: support, length: length});

        //Then
        expect(evaluation.support).toBe(support);
        expect(evaluation.length).toBe(length);
    })
})
//*/

describe('EvaluationStructureIsGeneratedBasedOnStructureFiles', () => {
    //Given
    fetchMock.enableMocks();
    fetchMock.mockResponseOnce(JSON.stringify(TestStructure.GENERIC_STRUCTURE));
    fetchMock.mockResponseOnce(JSON.stringify(TestStructure.catamaran_raccourcie));

    //fetchMock.mockResponseOnce(JSON.stringify(TestStructure.GENERIC_STRUCTURE))

    const evaluationCatamaranRaccourcie = EvaluationStructureMaker.generateStructure({support: "catamaran", length: "raccourcie"})
    //const evaluationDeriveurStandard = EvaluationStructureMaker.generateStructure({support: "deriveur", length: "standard"})

    test('EvaluationHaveExpectedCategories', () => {
        //Then
        console.debug(evaluationCatamaranRaccourcie);
        console.debug(TestStructure.expectedCatamaranRaccourcieCategories);

        expect(evaluationCatamaranRaccourcie.categories)
            .toStrictEqual(TestStructure.expectedCatamaranRaccourcieCategories)
        /*expect(evaluationDeriveurStandard.categories)
            .toStrictEqual(TestStructure.expectedDeriveurStandardCategories)
        */
        
    })
})