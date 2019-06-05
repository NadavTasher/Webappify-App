let layout = undefined;
let stylesheet = undefined;
let code = {
    load: undefined,
    app: undefined
};

function loadTemplates(callback) {
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
                    get("build-flavour").appendChild(option);
                    let information = document.createElement("div");
                    information.id = "build-properties-information-" + key.toLowerCase();

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
                                    view("build-layout-menu");
                                    view("build-layout");
                                };
                                information.appendChild(button);
                            } else if (replacement.name === "load") {
                                let button = document.createElement("button");
                                button.innerText = "Load Code";
                                button.onclick = () => {
                                    view("build-load");
                                };
                                codes.appendChild(button);
                            } else if (replacement.name === "code") {
                                let button = document.createElement("button");
                                button.innerText = "App Code";
                                button.onclick = () => {
                                    view("build-code");
                                };
                                codes.appendChild(button);
                            } else if (replacement.name === "stylesheet") {
                                let button = document.createElement("button");
                                button.innerText = "Design Stylesheet";
                                button.onclick = () => {
                                    view("build-stylesheet");
                                };
                                information.appendChild(button);
                            } else {
                                let input = document.createElement("input");
                                if (replacement.name === "theme") input.type = "color";
                                input.id = "build-properties-information-" + key.toLowerCase() + "-replacement-" + replacement.name;
                                input.placeholder = replacement.description;
                                information.appendChild(input);
                            }
                        }
                    }
                    if (codes.children.length > 0) {
                        information.appendChild(codes);
                    }
                    get("build-properties-information").appendChild(information);
                }
            }
            callback();
        });
    });
}

function buildParameters() {
    let flavour = get("build-flavour").value;
    let replacements = {};
    let objects = get("build-properties-information-" + flavour.toLowerCase()).childNodes;
    let object;
    for (let o = 0; object = objects[o], o < objects.length; o++) {
        if (object.nodeName.toLowerCase() === "input") {
            replacements[object.id.replace("build-properties-information-" + flavour.toLowerCase() + "-replacement-", "")] = object.value;
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

function buildDeploy() {
    window.location.href = "?deploy=" + btoa(unescape(encodeURIComponent(JSON.stringify(buildParameters()))));
}

function buildDownload() {
    let parameters = buildParameters();
    let body = new FormData;
    body.append("builder", JSON.stringify({
        action: "build",
        parameters: parameters
    }));
    fetch("scripts/backend/builder/builder.php", {
        method: "post",
        body: body
    }).then(response => {
        response.text().then((result) => {
            let json = JSON.parse(result);
            if (json.hasOwnProperty("builder")) {
                if (json.builder.hasOwnProperty("build")) {
                    if (json.builder.build.hasOwnProperty("success")) {
                        if (json.builder.build.success) {
                            if (json.builder.build.hasOwnProperty("content")) {
                                download((!parameters.replacements.hasOwnProperty("name") || parameters.replacements.name === "" ? "WebAppBundle" : parameters.replacements.name) + ".zip", json.builder.build.content, "application/zip", "base64");
                                window.location.reload(true);
                            }
                        }
                    }
                }
            }
        });
    });
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

function designText() {
    let add = () => {
        let paragraph = document.createElement("p");
        let id = get("build-layout-properties-text-id");
        let size = get("build-layout-properties-text-size");
        let text = get("build-layout-properties-text-text");
        let color = get("build-layout-properties-text-color");
        if (id.value.length > 0) paragraph.setAttribute("id", id.value);
        if (text.value.length > 0) paragraph.innerText = text.value;
        if (size.value.length > 0) paragraph.style.fontSize = size.value;
        if (color.value.length > 0) paragraph.style.color = color.value;
        layout.appendChild(paragraph);
        view("build-layout-menu");
    };
    empty("build-layout-properties-text");
    get("build-layout-properties-add").onclick = add;
    view("build-layout-properties-text");
    view("build-layout-properties");
}

function designButton() {
    let add = () => {
        let button = document.createElement("button");
        let id = get("build-layout-properties-button-id");
        let onclick = get("build-layout-properties-button-onclick");
        let text = get("build-layout-properties-button-text");
        if (id.value.length > 0) button.setAttribute("id", id.value);
        if (onclick.value.length > 0) button.setAttribute("onclick", onclick.value);
        if (text.value.length > 0) button.innerText = text.value;
        layout.appendChild(button);
        view("build-layout-menu");
    };
    empty("build-layout-properties-button");
    get("build-layout-properties-add").onclick = add;
    view("build-layout-properties-button");
    view("build-layout-properties");
}

function designInput() {
    let add = () => {
        let input = document.createElement("input");
        let id = get("build-layout-properties-input-id");
        let placeholder = get("build-layout-properties-input-placeholder");
        let type = get("build-layout-properties-input-type");
        let value = get("build-layout-properties-input-text");
        if (id.value.length > 0) input.setAttribute("id", id.value);
        if (placeholder.value.length > 0) input.setAttribute("placeholder", placeholder.value);
        if (type.value.length > 0) input.setAttribute("type", type.value);
        if (value.value.length > 0) input.setAttribute("value", value.value);
        layout.appendChild(input);
        view("build-layout-menu");
    };
    empty("build-layout-properties-input");
    get("build-layout-properties-add").onclick = add;
    view("build-layout-properties-input");
    view("build-layout-properties");
}