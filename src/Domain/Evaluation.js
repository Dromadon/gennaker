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
}

export {Evaluation}