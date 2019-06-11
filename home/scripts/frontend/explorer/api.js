/*
Created By NadavTasher
https://github.com/NadavTasher/WebAppBase/
*/

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
                let button = document.createElement("button");
                let name = document.createElement("p");
                let description = document.createElement("p");
                button.classList.add("background");
                name.style.fontSize = "120%";
                name.innerText = app.name;
                description.innerText = app.description;
                button.onclick = () => slide(button, false, a % 2 === 0, () => window.location.href = "../apps/" + app.id);
                button.appendChild(name);
                button.appendChild(description);
                get("explorer-list-list").appendChild(button);
            }
        }
    });
}