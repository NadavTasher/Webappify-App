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

}