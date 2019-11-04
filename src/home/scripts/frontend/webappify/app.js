/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

const WEBAPPIFY_API = "webappify";
const WEBAPPIFY_ENDPOINT = "scripts/backend/webappify/webappify.php";

let configuration = {
    layout: undefined,
    stylesheet: undefined,
    code: {
        load: undefined,
        code: undefined
    }
};

function webappify() {
    fetch("files/builder/templates.json", {
        method: "get"
    }).then(response => {
        response.text().then((result) => {
            let json = JSON.parse(result);
            for (let key in json) {
                let option = make("option", key);
                option.value = key;
                get("flavour").appendChild(option);
            }
        });
    });
    page("home");
}

function finish() {
    api(WEBAPPIFY_ENDPOINT, WEBAPPIFY_API, "create", {
        flavour: get('flavour').value,
        configuration: configuration
    }, (success, result, error) => {
        if (success) {
            get("open").onclick = () => window.location = result.id;
            get("sources").onclick = () => save("WebAppBundle.zip", result.sources, "application/zip", "base64");
            get("docker").onclick = () => save("WebAppDocker.zip", result.docker, "application/zip", "base64");
            page("finish");
        } else {
            popup("An error occurred: " + error, 0, "#AA0000AA");
        }
    });
}