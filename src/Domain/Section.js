class Section {
    constructor({displayName}={}) {
        if(displayName === undefined)
            throw new Error('Section display name not defined');

        this.displayName = displayName;
        this.questions = []
    }

    addQuestion(question) {
        this.questions.push(question);
        return this;
    }

    setQuestionsNumber(questionsNumber) {
        this.questionsNumber=questionsNumber;
        return this;
    }
}

export {Section}