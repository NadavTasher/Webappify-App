function empty(v) {
    let element = get(v);
    for (let n = 0; n < element.children.length; n++) {
        if (element.children[n].value !== undefined) {
            if (element.children[n].value.length !== 0) {
                element.children[n].value = "";
            }
        }
    }
}
