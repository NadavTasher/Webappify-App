let layout = undefined;

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
                    let needsLayout = false;
                    let replacement;
                    for (let r = 0; replacement = replacements[r], r < replacements.length; r++) {
                        if (replacement.hasOwnProperty("name") && replacement.hasOwnProperty("description")) {
                            if (replacement.name === "layout") {
                                needsLayout = true;
                            } else {
                                let input = document.createElement("input");
                                if (replacement.name === "theme") input.type = "color";
                                input.id = "build-replacement-" + key.toLowerCase() + "-" + replacement.name;
                                input.placeholder = replacement.description;
                                information.appendChild(input);
                            }
                        }
                    }

                    if (needsLayout) {
                        get("build-properties-next").onclick = () => {
                            layout = document.createElement("div");
                            view("build-layout");
                        };
                    } else {
                        get("build-properties-next").onclick = () => {
                            view("build-deploy");
                        };
                    }
                    get("build-properties-information").appendChild(information);
                }
            }
            callback();
        });
    });
}

function parameters() {
    let flavour = get("build-flavour").value;
    let replacements = {};
    let objects = get("build-properties-information-" + flavour.toLowerCase()).childNodes;
    let object;
    for (let o = 0; object = objects[o], o < objects.length; o++) {
        if (object.nodeName.toLowerCase() === "input") {
            replacements[object.id.replace("build-replacement-" + flavour.toLowerCase() + "-", "")] = object.value;
        }
    }
    if (layout !== undefined) {
        replacements.layout = layout.innerHTML;
    }
    return {
        flavour: flavour,
        replacements: replacements
    };
}

function buildDownload() {
    let body = new FormData;
    body.append("builder", JSON.stringify({
        action: "build",
        parameters: parameters()
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
                                download((!replacements.hasOwnProperty("name") || replacements.name === "" ? "WebAppBundle" : replacements.name) + ".zip", json.builder.build.content, "application/zip", "base64");
                                window.location.href = "../";
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
    let parent = element.parentNode;
    for (let n = 0; n < parent.children.length; n++) {
        if (parent.children[n].value.length !== 0) {
            parent.children[n].value = 0;
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
}