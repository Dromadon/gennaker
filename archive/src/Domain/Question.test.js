import {Question} from './Question';

describe('QuestionShouldContainAdequateFields', () => {
    //Given
    const fileName="a/path/to/file.md";
    const answerSize="md";
    const supports=["catamaran", "deriveur"];

    test('QuestionCanBeCreatedWithFileName', () => {
        //When
        const question = new Question({fileName: fileName});

        //Then
        expect(question).toHaveProperty('fileName')
    })

    test('QuestionCanBeCreatedWithFileNameAndAnswerSize', () => {
        //When
        const question = new Question({fileName: fileName, answerSize: answerSize});

        //Then
        expect(question.fileName).toBe(fileName);
        expect(question.answerSize).toBe(answerSize);
    })

    test('QuestionCanBeCreatedWithFileNameAndSupports', () => {
        //When
        const question = new Question({fileName: fileName, supports: supports});

        //Then
        expect(question.fileName).toBe(fileName);
        expect(question.supports).toBe(supports);
    })

    test('QuestionCanBeCreatedWithFileNameAndAnswerSizeAndSupports', () => {
        //When
        const question = new Question({fileName: fileName, answerSize: answerSize, supports: supports});

        //Then
        expect(question.fileName).toBe(fileName);
        expect(question.answerSize).toBe(answerSize);
        expect(question.supports).toBe(supports);
    })

    test('NonMandatoryFieldsAreSetToNullWhenNotProvided', () => {
        //When
        const question = new Question({fileName: fileName});

        //Then
        expect(question.fileName).toBe(fileName);
        expect(question.answerSize).toBe(null);
        expect(question.supports).toBe(null);
    })

    test('FileNameMustBeProvided', () => {
        //When and Then
        expect(() => {new Question()}).toThrowError();
    })

})