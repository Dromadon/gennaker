class Category {
    constructor({name, displayName}={}) {
        if(name === undefined)
            throw new Error('Section name not defined');
        if(displayName === undefined)
            throw new Error('Section dispaly name not defined');

        this.name = name;
        this.displayName = displayName;
        this.sections = []
    }

    addSection(section) {
        this.sections.push(section);
    }
}

export {Category}