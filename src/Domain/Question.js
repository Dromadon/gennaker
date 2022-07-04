class Question {
    constructor({fileName, answerSize=null, supports=null}={}) {
        if(fileName === undefined) {
            throw new Error('Question must be provided a fileName');
        }

        this.fileName=fileName;
        this.answerSize=answerSize;
        this.supports=supports;
    }
}

export {Question}