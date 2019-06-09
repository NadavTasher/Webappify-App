const EXPLORER_API = "explorer";
const EXPLORER_ENDPOINT = "scripts/backend/explorer/explorer.php";

function explorer_load() {
    view("explorer");
    view("explorer-home");
}

function explorer_random() {
    api(EXPLORER_ENDPOINT, EXPLORER_API, "random", {}, (success, result, error) => {
        if (success) {
            window.location.href = "../apps/" + result.id;
        }
    });
}

function explorer_list() {
    view("explorer-list");
    clear("explorer-list-list");
    api(EXPLORER_ENDPOINT, EXPLORER_API, "list", {}, (success, result, error) => {
        if (success) {
            for (let a = 0; a < result.length; a++) {
                let app = result[a];
                let div = document.createElement("div");
                let name = document.createElement("p");
                let description = document.createElement("p");
                div.classList.add("background");
                name.classList.add("content");
                description.classList.add("fineprint");
                name.innerText = app.name;
                description.innerText = app.description;
                div.onclick = () => window.location.href = "../apps/" + app.id;
                div.appendChild(name);
                div.appendChild(description);
                get("explorer-list-list").appendChild(div);
            }
        }
    });
}