class Section {
    constructor({name, displayName, questionsNumber}={}) {
        if(name === undefined)
            throw new Error('Section name not defined');
        if(displayName === undefined)
            throw new Error('Section display name not defined');
        if(questionsNumber === undefined)
            throw new Error('Questions number not defined');

        this.name = name;
        this.displayName = displayName;
        this.questionsNumber = questionsNumber;
        this.questions = []
    }

    addQuestion(question) {
        this.questions.push(question);
    }
}

export {Section}