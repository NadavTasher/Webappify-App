/*
Created By NadavTasher
https://github.com/NadavTasher/WebAppBase/
*/

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

function validateEmail(email) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function parameter(parameterName) {
    let tmp = [];
    let items = location.search.substr(1).split("&");
    for (let index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) return decodeURIComponent(tmp[1]);
    }
    return undefined;
}