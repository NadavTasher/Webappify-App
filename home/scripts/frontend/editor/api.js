const EDITOR_API = "editor";
const EDITOR_ENDPOINT = "scripts/backend/editor/editor.php";

function editor_load() {
    api(DEPLOYER_ENDPOINT, DEPLOYER_API, "list", {}, (success, result, error) => {
        view("editor");
        view("editor-home");
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
                button.onclick = () => slide(button, false, i % 2 === 0, () => editor_edit(app.id));
                button.appendChild(name);
                button.appendChild(description);
                get("editor-home-list").appendChild(button);
            }
        }
    }, fillForm());
}

function editor_edit(id) {
    api(EDITOR_ENDPOINT, EDITOR_API, "read", {id: id}, (success, result, error) => {
        view("editor-editor");
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
                                    }, null, fillForm());
                                }
                            }, 1000);
                        };

                    }, fillForm());
                };
                get("editor-editor-files").appendChild(button);
            }
            get("editor-editor-files").children[0].onclick();
        }
    }, fillForm());
}