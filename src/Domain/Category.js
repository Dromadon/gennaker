class Category {
    constructor({displayName}={}) {
        if(displayName === undefined)
            throw new Error('Section display name not defined');

        this.displayName = displayName;
        this.sections = {}
    }

    setSection(sectionName, section) {
        this.sections[sectionName] = section;
        return this;
    }

    getSections() {
        return Object.entries(this.sections);
    }
}

export {Category}