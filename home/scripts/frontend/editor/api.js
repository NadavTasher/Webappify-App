/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

const EDITOR_API = "editor";
const EDITOR_ENDPOINT = "scripts/backend/editor/editor.php";

function editor_load() {
    api(DEPLOYER_ENDPOINT, DEPLOYER_API, "list", {}, (success, result, error) => {
        clear("editor-home-list");
        if (success) {
            for (let i = 0; i < result.length; i++) {
                let app = result[i];
                let button = document.createElement("button");
                let name = document.createElement("p");
                let description = document.createElement("p");
                button.classList.add("background");
                name.style.fontSize = "120%";
                name.innerText = app.name;
                description.innerText = app.description;
                button.onclick = () => page("editor-home", "editor-editor", () => editor_edit(app.id));
                button.appendChild(name);
                button.appendChild(description);
                get("editor-home-list").appendChild(button);
            }
        }
    }, accounts_fill());
}

function editor_edit(id) {
    api(EDITOR_ENDPOINT, EDITOR_API, "read", {id: id}, (success, result, error) => {
        clear("editor-editor-files");
        if (success) {
            for (let f = 0; f < result.length; f++) {
                let button = document.createElement("button");
                let file = result[f];
                button.innerText = file;
                button.onclick = () => {
                    get("editor-editor-text").oninput = null;
                    get("editor-editor-text").value = "Loading...";
                    get("editor-editor-text").readOnly = true;
                    get("editor-editor-text").style.color = "green";
                    api(EDITOR_ENDPOINT, EDITOR_API, "read", {id: id, file: file}, (success, result, error) => {
                        get("editor-editor-text").style.removeProperty("color");
                        get("editor-editor-text").readOnly = false;
                        get("editor-editor-text").value = result;
                        get("editor-editor-text").oninput = () => {
                            let textA = get("editor-editor-text").value;
                            setTimeout(() => {
                                let textB = get("editor-editor-text").value;
                                if (textA === textB) {
                                    api(EDITOR_ENDPOINT, EDITOR_API, "write", {
                                        id: id,
                                        file: file,
                                        content: get("editor-editor-text").value
                                    }, null, accounts_fill());
                                }
                            }, 1000);
                        };

                    }, accounts_fill());
                };
                get("editor-editor-files").appendChild(button);
            }
            get("editor-editor-files").children[0].onclick();
        }
    }, accounts_fill());
}