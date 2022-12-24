import * as TestData from "./TestData";
import fetchMock from "jest-fetch-mock";
import {QuestionDatabase} from "./QuestionDatabase";



describe('QuestionDatabaseShouldReturnCorrectQuestions', () => {
    //Given
    const questionDatabase = new QuestionDatabase();
    const category = TestData.CATEGORY_2_NAME;
    const section = TestData.SECTION_21_NAME;

    // We provide a mock database file for fetching
    jest.spyOn(questionDatabase, "fetchQuestionDatabaseFile")
        .mockReturnValue(TestData.CAT2_SEC21_QUESTIONS_DB);

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
            .toStrictEqual([TestData.QUESTION_3, TestData.QUESTION_4, TestData.QUESTION_5].sort());
    })

    test('GetQuestionsShouldReturnOnlyQuestionsWithSpecifiedSupport', async () => {
        //When
        const questions = await questionDatabase.getQuestions({category: category, section: section, support: "deriveur"})

        //Then
        expect(questions.sort())
            .toStrictEqual([TestData.QUESTION_3, TestData.QUESTION_4]);
    })
})


describe("QuestionDatabaseShouldFetchCorrectFiles", () => {
    //Given
    const questionDatabase = new QuestionDatabase();
    fetchMock.enableMocks();

    test('FetchQuestionDatabaseForSeveralCategoriesAndSectionsWork', async () => {
        //Given
        fetchMock.resetMocks();
        fetchMock.mockResponseOnce("{}")
            .mockResponseOnce("{}");

        //When
        await questionDatabase
            .fetchQuestionDatabaseFile({category: "categorie1", 
                section: "section1"});
        await questionDatabase
            .fetchQuestionDatabaseFile({category: "categorie2", 
                section: "section4"});

        //Then
        expect(fetch.mock.calls[0][0])
            .toEqual("/questions/categorie1/section1/db.json");
        expect(fetch.mock.calls[1][0])
            .toEqual("/questions/categorie2/section4/db.json");
    })
})