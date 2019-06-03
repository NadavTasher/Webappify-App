let layout = undefined;

function load() {
    output("Loading...");
    loadTemplates(() => {
        view("welcome");
    });
}

function loadTemplates(callback) {
    fetch("files/templates.json", {
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
                    get("flavour").appendChild(option);

                    let information = document.createElement("div");
                    information.id = "info-" + key.toLowerCase();
                    let title = document.createElement("p");
                    title.innerText = "Fill information";
                    title.classList.add("title");
                    information.appendChild(title);

                    let needsLayout = false;
                    let replacement;
                    for (let r = 0; replacement = replacements[r], r < replacements.length; r++) {
                        if (replacement.hasOwnProperty("name") && replacement.hasOwnProperty("description")) {
                            if (replacement.name === "layout") {
                                needsLayout = true;
                            } else {
                                let input = document.createElement("input");
                                input.id = "input-" + replacement.name;
                                input.placeholder = replacement.description;
                                information.appendChild(input);
                            }
                        }
                    }

                    let button = document.createElement("button");
                    if (needsLayout) {
                        button.innerText = "Create Layout";
                        button.onclick = () => {
                            layout = document.createElement("div");
                            view("layout");
                        };
                    } else {
                        button.innerText = "Finish";
                        button.onclick = () => {
                            view("finish");
                        };
                    }
                    information.appendChild(button);
                    get("info").appendChild(information);
                }
            }
            callback();
        });
    });
}

function output(text) {
    let p = get("output");
    p.innerText = text;
    view(p);
}

function parameters() {
    let flavour = get("flavour").value;
    let replacements = {};
    let objects = get("info-" + flavour.toLowerCase()).childNodes;
    let object;
    for (let o = 0; object = objects[o], o < objects.length; o++) {
        if (object.nodeName.toLowerCase() === "input") {
            replacements[object.id.replace("input-", "")] = object.value;
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

function host() {
    window.location.href = "../host/?host=" + btoa(JSON.stringify(parameters()));
}

function generate() {
    let body = new FormData;
    let flavour = get("flavour").value;
    let replacements = {};
    let objects = get("info-" + flavour.toLowerCase()).childNodes;
    let object;
    for (let o = 0; object = objects[o], o < objects.length; o++) {
        if (object.nodeName.toLowerCase() === "input") {
            replacements[object.id.replace("input-", "")] = object.value;
        }
    }
    if (layout !== undefined) {
        replacements.layout = layout.innerHTML;
    }
    body.append("builder", JSON.stringify({
        action: "build",
        parameters: parameters()
    }));
    fetch("scripts/backend/build.php", {
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

function addButton() {
    let button = document.createElement("button");
    let properties = get("properties");
    clear(properties);
    let text = document.createElement("input");
    let id = document.createElement("input");
    let onclick = document.createElement("input");
    let finish = document.createElement("button");
    let back = document.createElement("button");
    back.innerText = "Back";
    back.onclick = function () {
        view("menu");
    };
    text.placeholder = "Button Text";
    text.type = "text";
    id.placeholder = "Button ID";
    id.type = "text";
    onclick.placeholder = "Button Onclick";
    onclick.type = "text";
    finish.innerText = "Add Button";
    finish.onclick = function () {

        if (id.value.length > 0) button.setAttribute("id", id.value);
        if (onclick.value.length > 0) button.setAttribute("onclick", onclick.value);
        if (text.value.length > 0) button.innerText = text.value;

        layout.appendChild(button);
        view("menu");
    };
    properties.appendChild(text);
    properties.appendChild(id);
    properties.appendChild(onclick);
    properties.appendChild(back);
    properties.appendChild(finish);
    view(properties);
}

function addText() {
    let paragraph = document.createElement("p");
    let properties = get("properties");
    clear(properties);
    let finish = document.createElement("button");
    let text = document.createElement("input");
    let id = document.createElement("input");
    let size = document.createElement("input");
    let color = document.createElement("input");
    let back = document.createElement("button");
    back.innerText = "Back";
    back.onclick = function () {
        view("menu");
    };
    color.placeholder = "Paragraph Color";
    color.type = "text";
    text.placeholder = "Paragraph Text";
    text.type = "text";
    id.placeholder = "Paragraph ID";
    id.type = "text";
    size.placeholder = "Paragraph Font Size";
    size.type = "text";
    finish.innerText = "Add Paragraph";
    finish.onclick = function () {

        if (id.value.length > 0) paragraph.setAttribute("id", id.value);
        if (text.value.length > 0) paragraph.innerText = text.value;
        if (size.value.length > 0) paragraph.style.fontSize = size.value;
        if (color.value.length > 0) paragraph.style.color = color.value;

        layout.appendChild(paragraph);
        view("menu");
    };
    properties.appendChild(text);
    properties.appendChild(id);
    properties.appendChild(color);
    properties.appendChild(size);
    properties.appendChild(back);
    properties.appendChild(finish);
    view(properties);
}

function addImage() {
    let image = document.createElement("img");
    let properties = get("properties");
    clear(properties);
    let finish = document.createElement("button");
    let src = document.createElement("input");
    let alt = document.createElement("input");
    let id = document.createElement("input");
    let size = document.createElement("input");
    let back = document.createElement("button");
    back.innerText = "Back";
    back.onclick = function () {
        view("menu");
    };
    src.placeholder = "Image URL";
    src.type = "text";
    alt.placeholder = "Image Alternative Text";
    alt.type = "text";
    id.placeholder = "Image ID";
    id.type = "text";
    size.placeholder = "Image Size";
    size.type = "text";
    finish.innerText = "Add Image";
    finish.onclick = function () {

        if (id.value.length > 0) image.setAttribute("id", id.value);
        if (src.value.length > 0) image.setAttribute("src", src.value);
        if (size.value.length > 0) image.setAttribute("height", size.value);
        if (size.value.length > 0) image.setAttribute("width", size.value);
        if (alt.value.length > 0) image.setAttribute("alt", alt.value);

        layout.appendChild(image);
        view("menu");
    };
    properties.appendChild(src);
    properties.appendChild(alt);
    properties.appendChild(id);
    properties.appendChild(size);
    properties.appendChild(back);
    properties.appendChild(finish);
    view(properties);
}

function addInput() {
    let input = document.createElement("input");
    let properties = get("properties");
    clear(properties);
    let finish = document.createElement("button");
    let placeholder = document.createElement("input");
    let type = document.createElement("input");
    let id = document.createElement("input");
    let value = document.createElement("input");
    let back = document.createElement("button");
    back.innerText = "Back";
    back.onclick = function () {
        view("menu");
    };
    placeholder.placeholder = "Placeholder";
    placeholder.type = "text";
    type.placeholder = "Input Type";
    type.type = "text";
    id.placeholder = "Input ID";
    id.type = "text";
    value.placeholder = "Input Text";
    value.type = "text";
    finish.innerText = "Add Input";
    finish.onclick = function () {

        if (id.value.length > 0) input.setAttribute("id", id.value);
        if (placeholder.value.length > 0) input.setAttribute("placeholder", placeholder.value);
        if (type.value.length > 0) input.setAttribute("type", type.value);
        if (value.value.length > 0) input.setAttribute("value", value.value);

        layout.appendChild(input);
        view("menu");
    };
    properties.appendChild(placeholder);
    properties.appendChild(type);
    properties.appendChild(id);
    properties.appendChild(value);
    properties.appendChild(back);
    properties.appendChild(finish);
    view(properties);
}