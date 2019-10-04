/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

const BUILDER_API = "builder";
const BUILDER_ENDPOINT = "scripts/backend/builder/builder.php";
const DEPLOYER_API = "deployer";
const DEPLOYER_ENDPOINT = "scripts/backend/deployer/deployer.php";

let layout = undefined;
let stylesheet = undefined;
let code = {
    load: undefined,
    app: undefined
};

function webappify() {
    if (parameter("activate") !== undefined && parameter("key") !== undefined) {
        activation(parameter("activate"), parameter("key"));
    } else if (parameter("reactivate") !== undefined && parameter("key") !== undefined) {
        reactivation(parameter("reactivate"), parameter("key"));
    } else {
        builder();
        page("home");
    }
}

function activation(id, key) {
    page("activate");
    get("activate-button").onclick = () => {
        api(DEPLOYER_ENDPOINT, DEPLOYER_API, "activate", {
            id: id,
            key: key
        }, (success, result, error) => {
            if (success) {
                window.location.href = "../apps/" + id;
            } else {
                popup(error, 3000, "#AA0000DD");
            }
        });
    };
}

function reactivation(id, key) {
    page("reactivate");
    get("reactivate-button").onclick = () => {
        api(DEPLOYER_ENDPOINT, DEPLOYER_API, "reactivate", {
            id: id,
            key: key
        }, (success, result, error) => {
            if (success) {
                window.location.href = "../apps/" + id;
            } else {
                popup(error, 3000, "#AA0000DD");
            }
        });
    };
}

function builder() {
    layout = undefined;
    stylesheet = undefined;
    code = {
        load: undefined,
        app: undefined
    };

    fetch("files/builder/templates.json", {
        method: "get"
    }).then(response => {
        response.text().then((result) => {
            let json = JSON.parse(result);
            for (let key in json) {
                if (json.hasOwnProperty(key)) {
                    let replacements = json[key];
                    let option = make("option");
                    option.innerText = key;
                    option.value = key;
                    get("flavour").appendChild(option);
                    let information = make("div");
                    information.id = "properties-information-" + key.toLowerCase();

                    let codes = make("div");

                    let replacement;
                    for (let r = 0; replacement = replacements[r], r < replacements.length; r++) {
                        if (replacement.hasOwnProperty("name") && replacement.hasOwnProperty("description")) {
                            if (replacement.name === "layout") {
                                let button = make("button");
                                button.innerText = "Design Layout";
                                button.onclick = () => {
                                    if (layout === undefined)
                                        layout = make("div");
                                    page("layout-menu");
                                };
                                information.appendChild(button);
                            } else if (replacement.name === "load") {
                                let button = make("button");
                                button.innerText = "Load Code";
                                button.onclick = () => {
                                    page("load");
                                };
                                codes.appendChild(button);
                            } else if (replacement.name === "code") {
                                let button = make("button");
                                button.innerText = "App Code";
                                button.onclick = () => {
                                    page("code");
                                };
                                codes.appendChild(button);
                            } else if (replacement.name === "stylesheet") {
                                let button = make("button");
                                button.innerText = "Design Stylesheet";
                                button.onclick = () => {
                                    page("stylesheet");
                                };
                                information.appendChild(button);
                            } else {
                                let input = make("input");
                                if (replacement.name === "theme") input.type = "color";
                                input.id = "properties-information-" + key.toLowerCase() + "-replacement-" + replacement.name;
                                input.placeholder = replacement.description;
                                information.appendChild(input);
                            }
                        }
                    }
                    if (codes.children.length > 0) {
                        information.appendChild(codes);
                    }
                    get("properties-information").appendChild(information);
                }
            }
        });
    });
}

function compile_parameters() {
    let flavour = get("flavour").value;
    let replacements = {};
    let objects = get("properties-information-" + flavour.toLowerCase()).childNodes;
    let object;
    for (let o = 0; object = objects[o], o < objects.length; o++) {
        if (object.nodeName.toLowerCase() === "input") {
            replacements[object.id.replace("properties-information-" + flavour.toLowerCase() + "-replacement-", "")] = object.value;
        }
    }
    if (stylesheet !== undefined) {
        replacements.stylesheet = stylesheet;
    }
    if (layout !== undefined) {
        replacements.layout = layout.innerHTML;
    }
    if (code.app !== undefined) {
        replacements.code = code.app;
    }
    if (code.load !== undefined) {
        replacements.load = code.load;
    }
    return {
        flavour: flavour,
        replacements: replacements
    };
}

function download_zip() {
    api(BUILDER_ENDPOINT, BUILDER_API, "bundle", compile_parameters(), (success, result, error) => {
        if (success) {
            save("WebAppBundle.zip", result, "application/zip", "base64");
        }
    });
}

function download_docker() {
    api(BUILDER_ENDPOINT, BUILDER_API, "docker", compile_parameters(), (success, result, error) => {
        if (success) {
            save("WebAppDocker.zip", result, "application/zip", "base64");
        }
    });
}

function deploy(button) {
    if (email(get("deploy-email").value)) {
        hide(button);
        api(DEPLOYER_ENDPOINT, DEPLOYER_API, "deploy", {email: get("deploy-email").value}, (success, result, error) => {
            if (success) {
                popup("An email will be sent with further instructions.", 5000);
            } else {
                show(button);
                popup(error, 4000, "#AA0000DD");
            }
        }, body(BUILDER_API, "bundle", compile_parameters()));
    } else {
        popup("Not an email", 4000, "#AA0000DD");
    }
}

function design_button() {
    let add = () => {
        let button = make("button");
        let id = get("layout-properties-button-id");
        let onclick = get("layout-properties-button-onclick");
        let text = get("layout-properties-button-text");
        if (id.value.length > 0) button.setAttribute("id", id.value);
        if (onclick.value.length > 0) button.setAttribute("onclick", onclick.value);
        if (text.value.length > 0) button.innerText = text.value;
        layout.appendChild(button);
        page("layout-menu");
    };
    empty("layout-properties-button");
    get("layout-properties-add").onclick = add;
}

function design_input() {
    let add = () => {
        let input = make("input");
        let id = get("layout-properties-input-id");
        let placeholder = get("layout-properties-input-placeholder");
        let type = get("layout-properties-input-type");
        let value = get("layout-properties-input-text");
        if (id.value.length > 0) input.setAttribute("id", id.value);
        if (placeholder.value.length > 0) input.setAttribute("placeholder", placeholder.value);
        if (type.value.length > 0) input.setAttribute("type", type.value);
        if (value.value.length > 0) input.setAttribute("value", value.value);
        layout.appendChild(input);
        page("layout-menu");
    };
    empty("layout-properties-input");
    get("layout-properties-add").onclick = add;
}

function design_text() {
    let add = () => {
        let paragraph = make("p");
        let id = get("layout-properties-text-id");
        let size = get("layout-properties-text-size");
        let text = get("layout-properties-text-text");
        let color = get("layout-properties-text-color");
        if (id.value.length > 0) paragraph.setAttribute("id", id.value);
        if (text.value.length > 0) paragraph.innerText = text.value;
        if (size.value.length > 0) paragraph.style.fontSize = size.value;
        if (color.value.length > 0) paragraph.style.color = color.value;
        layout.appendChild(paragraph);
        page("layout-menu");
    };
    empty("layout-properties-text");
    get("layout-properties-add").onclick = add;
}

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

function email(input) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(input).toLowerCase());
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