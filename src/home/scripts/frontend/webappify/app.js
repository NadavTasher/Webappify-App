/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

const WEBAPPIFY_API = "webappify";
const WEBAPPIFY_ENDPOINT = "scripts/backend/webappify/webappify.php";

function webappify() {
    api(WEBAPPIFY_ENDPOINT, WEBAPPIFY_API, "list", {}, (success, result, error) => {
        for (let t = 0; t < result.length; t++) {
            let option = make("option");
            option.innerText = result[t];
            option.value = result[t];
            get("flavor").appendChild(option);
        }
    });
    page("home");
}

function finish() {
    api(WEBAPPIFY_ENDPOINT, WEBAPPIFY_API, "create", {
        flavor: get("flavor").value,
        configuration: {
            name: get("name-text").value,
            description: get("description-text").value,
            color: get("color-text").value,
            layout: get("layout-text").value,
            style: get("style-text").value,
            code: {
                app: get("code-app-text").value,
                load: get("code-load-text").value
            }
        }
    }, (success, result, error) => {
        if (success) {
            get("open").onclick = () => window.location = "../apps/" + result.id;
            get("sources").onclick = () => save("WebAppBundle.zip", result.sources, "application/zip", "base64");
            get("docker").onclick = () => save("WebAppDocker.zip", result.docker, "application/zip", "base64");
            page("finish");
        } else {
            popup("An error occurred: " + error, 0, "#AA0000AA");
        }
    });
}