import * as TestStructure from "./TestStructure";
import fetchMock from "jest-fetch-mock";
import {QuestionDatabase} from "./QuestionsDatabase";



describe('QuestionDatabaseShouldReturnCorrectQuestions', () => {
    //Given
    const questionDatabase = new QuestionDatabase();
    let spyDB = jest.spyOn(questionDatabase, "fetchQuestionDatabaseFile")
        .mockReturnValue(TestStructure.CAT2_SEC21_QUESTIONS_DB);

    const category = TestStructure.CATEGORY_2_NAME;
    const section = TestStructure.SECTION_21_NAME;

    test("GetQuestionsShouldThrowErrorIfCategoryOrSectionNotProvidedOrNull", async () => {
        //Then
        await expect(questionDatabase.getQuestions()).rejects.toThrowError();
        await expect(questionDatabase.getQuestions({category: category})).rejects.toThrowError();
        await expect(questionDatabase.getQuestions({section: section})).rejects.toThrowError();
        await expect(questionDatabase.getQuestions({category: null, section: section})).rejects.toThrowError();
        await expect(questionDatabase.getQuestions({category: category, section: null})).rejects.toThrowError();
    })

    test('GetQuestionsShouldReturnTheProvidedNumberOfQuestions', async () => {
        //When
        const questions1 = await questionDatabase.getQuestions({category: category, section: section, number: 1});
        const questions2 = await questionDatabase.getQuestions({category: category, section: section, number: 2});
        const questions3 = await questionDatabase.getQuestions({category: category, section: section, number: 3});

        //Then
        expect(questions1.length).toBe(1);
        expect(questions2.length).toBe(2);
        expect(questions3.length).toBe(3);
    })

    test('GetQuestionsShouldReturnAllTheQuestionsIfNoNumberIsGiven', async () => {
        //When
        const questions = await questionDatabase.getQuestions({category: category, section: section});

        //Then
        expect(questions.sort())
            .toStrictEqual([TestStructure.QUESTION_3, TestStructure.QUESTION_4, TestStructure.QUESTION_5].sort());
    })

    test('GetQuestionsShouldReturnOnlyQuestionsWithSpecifiedSupport', async () => {
        //When
        const questions = await questionDatabase.getQuestions({category: category, section: section, support: "deriveur"})

        //Then
        expect(questions.sort())
            .toStrictEqual([TestStructure.QUESTION_3, TestStructure.QUESTION_4]);
    })
})


describe("QuestionDatabaseShouldFetchCorrectFiles", () => {
    //Given
    const questionDatabase = new QuestionDatabase();
    fetchMock.enableMocks();

    test('FetchQuestionDatabaseForSeveralCategoriesAndSectionsWork', async () => {
        //Given
        fetchMock.resetMocks();
        fetchMock.mockResponseOnce(JSON.stringify(TestStructure.CAT1_SEC11_QUESTIONS_DB))
            .mockResponseOnce(JSON.stringify(TestStructure.CAT2_SEC21_QUESTIONS_DB));

        //When
        const cat1Sec11QuestionDB = await questionDatabase
            .fetchQuestionDatabaseFile({category: TestStructure.CATEGORY_1_NAME, 
                section: TestStructure.SECTION_11_NAME});
        const cat2Sec21QuestionDB = await questionDatabase
            .fetchQuestionDatabaseFile({category: TestStructure.CATEGORY_2_NAME, 
                section: TestStructure.SECTION_21_NAME});

        //Then
        expect(fetch.mock.calls[0][0])
            .toEqual("/questions/"+TestStructure.CATEGORY_1_NAME+"/"+TestStructure.SECTION_11_NAME+"/db.json");
        expect(fetch.mock.calls[1][0])
            .toEqual("/questions/"+TestStructure.CATEGORY_2_NAME+"/"+TestStructure.SECTION_21_NAME+"/db.json");

        expect(cat1Sec11QuestionDB)
            .toStrictEqual(TestStructure.CAT1_SEC11_QUESTIONS_DB);      
        expect(cat2Sec21QuestionDB)
            .toStrictEqual(TestStructure.CAT2_SEC21_QUESTIONS_DB);  
    })
})