class Section {
    constructor({displayName}={}) {
        if(displayName === undefined)
            throw new Error('Section display name not defined');

        this.displayName = displayName;
        this.questions = []
    }

    setQuestionsNumber(questionsNumber) {
        this.questionsNumber=questionsNumber;
        return this;
    }

    setQuestions({questions}) {
        this.questions = questions;
        return this;
    }
}

export {Section}