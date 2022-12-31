class Evaluation {
    constructor({support, length}={}) {
        if (support === undefined)
            throw new Error("Support not defined for Evaluation");
        if (length === undefined)
            throw new Error("Length not defined for Evaluation");

        this.support = support;
        this.length = length;
        this.categories = {};
    }

    setCategory({categoryName, category}) {
        this.categories[categoryName] = category;
        return this;
    }

    getCategories() {
        return Object.entries(this.categories);
    }

    async updateSectionQuestions({questionsDB, categoryName, sectionName}) {
        console.debug("Updating questions for category "+categoryName+" and section "+sectionName);
        const number = this.categories[categoryName].sections[sectionName].questionsNumber;
        const questions = await questionsDB.getQuestions({category: categoryName, section: sectionName, number: number, support: this.support})
        console.debug("Questions received from DB for category "+categoryName+" and section "+sectionName+" are ");
        console.debug(questions);
        this.categories[categoryName].sections[sectionName].setQuestions({questions: questions});
        return this;
    }

    async updateAllQuestions({questionsDB}) {
        console.debug("Updating all questions in Evaluation")
        await Promise.all(Object.keys(this.categories).map(async (categoryName) => {
            return Promise.all(Object.keys(this.categories[categoryName].sections).map(async (sectionName) => {
                await this.updateSectionQuestions({ questionsDB: questionsDB, categoryName: categoryName, sectionName: sectionName });
            }));
        }))
        return this;
    }
}

export {Evaluation}