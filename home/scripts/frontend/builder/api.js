/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

const BUILDER_API = "builder";
const BUILDER_ENDPOINT = "scripts/backend/builder/builder.php";

let layout = undefined;
let stylesheet = undefined;
let code = {
    load: undefined,
    app: undefined
};

function builder_load() {
    builder_load_templates(() => {
        view("builder");
        view("builder-template");
    });
}

function builder_load_templates(callback) {
    fetch("files/builder/templates.json", {
        method: "get"
    }).then(response => {
        response.text().then((result) => {
            let json = JSON.parse(result);
            for (let key in json) {
                if (json.hasOwnProperty(key)) {
                    let replacements = json[key];
                    let option = document.createElement("option");
                    option.innerText = key;
                    option.value = key;
                    get("builder-flavour").appendChild(option);
                    let information = document.createElement("div");
                    information.id = "builder-properties-information-" + key.toLowerCase();

                    let codes = document.createElement("div");
                    codes.classList.add("sideways");

                    let replacement;
                    for (let r = 0; replacement = replacements[r], r < replacements.length; r++) {
                        if (replacement.hasOwnProperty("name") && replacement.hasOwnProperty("description")) {
                            if (replacement.name === "layout") {
                                let button = document.createElement("button");
                                button.innerText = "Design Layout";
                                button.onclick = () => {
                                    if (layout === undefined)
                                        layout = document.createElement("div");
                                    view("builder-layout-menu");
                                    view("builder-layout");
                                };
                                information.appendChild(button);
                            } else if (replacement.name === "load") {
                                let button = document.createElement("button");
                                button.innerText = "Load Code";
                                button.onclick = () => {
                                    view("builder-load");
                                };
                                codes.appendChild(button);
                            } else if (replacement.name === "code") {
                                let button = document.createElement("button");
                                button.innerText = "App Code";
                                button.onclick = () => {
                                    view("builder-code");
                                };
                                codes.appendChild(button);
                            } else if (replacement.name === "stylesheet") {
                                let button = document.createElement("button");
                                button.innerText = "Design Stylesheet";
                                button.onclick = () => {
                                    view("builder-stylesheet");
                                };
                                information.appendChild(button);
                            } else {
                                let input = document.createElement("input");
                                if (replacement.name === "theme") input.type = "color";
                                input.id = "builder-properties-information-" + key.toLowerCase() + "-replacement-" + replacement.name;
                                input.placeholder = replacement.description;
                                information.appendChild(input);
                            }
                        }
                    }
                    if (codes.children.length > 0) {
                        information.appendChild(codes);
                    }
                    get("builder-properties-information").appendChild(information);
                }
            }
            callback();
        });
    });
}

function builder_compile_parameters() {
    let flavour = get("builder-flavour").value;
    let replacements = {};
    let objects = get("builder-properties-information-" + flavour.toLowerCase()).childNodes;
    let object;
    for (let o = 0; object = objects[o], o < objects.length; o++) {
        if (object.nodeName.toLowerCase() === "input") {
            replacements[object.id.replace("builder-properties-information-" + flavour.toLowerCase() + "-replacement-", "")] = object.value;
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

function builder_deploy_deploy() {
    deployer_load(builder_compile_parameters());
}

function builder_deploy_download() {
    let parameters = builder_compile_parameters();
    let name = (!parameters.replacements.hasOwnProperty("name") || parameters.replacements.name === "" ? "WebAppBundle" : parameters.replacements.name);
    api(BUILDER_ENDPOINT, BUILDER_API, "build", parameters, (success, result, error) => {
        if(success) {
            download(name + ".zip", result, "application/zip", "base64");
            window.location.reload(true);
        }
    });
}

function builder_design_text() {
    let add = () => {
        let paragraph = document.createElement("p");
        let id = get("builder-layout-properties-text-id");
        let size = get("builder-layout-properties-text-size");
        let text = get("builder-layout-properties-text-text");
        let color = get("builder-layout-properties-text-color");
        if (id.value.length > 0) paragraph.setAttribute("id", id.value);
        if (text.value.length > 0) paragraph.innerText = text.value;
        if (size.value.length > 0) paragraph.style.fontSize = size.value;
        if (color.value.length > 0) paragraph.style.color = color.value;
        layout.appendChild(paragraph);
        view("builder-layout-menu");
    };
    empty("builder-layout-properties-text");
    get("builder-layout-properties-add").onclick = add;
    view("builder-layout-properties-text");
    view("builder-layout-properties");
}

function builder_design_button() {
    let add = () => {
        let button = document.createElement("button");
        let id = get("builder-layout-properties-button-id");
        let onclick = get("builder-layout-properties-button-onclick");
        let text = get("builder-layout-properties-button-text");
        if (id.value.length > 0) button.setAttribute("id", id.value);
        if (onclick.value.length > 0) button.setAttribute("onclick", onclick.value);
        if (text.value.length > 0) button.innerText = text.value;
        layout.appendChild(button);
        view("builder-layout-menu");
    };
    empty("builder-layout-properties-button");
    get("builder-layout-properties-add").onclick = add;
    view("builder-layout-properties-button");
    view("builder-layout-properties");
}

function builder_design_input() {
    let add = () => {
        let input = document.createElement("input");
        let id = get("builder-layout-properties-input-id");
        let placeholder = get("builder-layout-properties-input-placeholder");
        let type = get("builder-layout-properties-input-type");
        let value = get("builder-layout-properties-input-text");
        if (id.value.length > 0) input.setAttribute("id", id.value);
        if (placeholder.value.length > 0) input.setAttribute("placeholder", placeholder.value);
        if (type.value.length > 0) input.setAttribute("type", type.value);
        if (value.value.length > 0) input.setAttribute("value", value.value);
        layout.appendChild(input);
        view("builder-layout-menu");
    };
    empty("builder-layout-properties-input");
    get("builder-layout-properties-add").onclick = add;
    view("builder-layout-properties-input");
    view("builder-layout-properties");
}