/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

const WEBAPPIFY_API = "webappify";
const WEBAPPIFY_ENDPOINT = "scripts/backend/webappify/webappify.php";

/**
 * This function loads the list of templates to the select object.
 */
function webappify_load() {
    api(WEBAPPIFY_ENDPOINT, WEBAPPIFY_API, "list", {}, (success, result) => {
        if (success) {
            for (let t = 0; t < result.length; t++) {
                let option = make("option");
                option.innerText = result[t];
                option.value = result[t];
                get("flavor").appendChild(option);
            }
        }
    });
    page("home");
}

/**
 * This function generates the application.
 */
function webappify_create() {
    api(WEBAPPIFY_ENDPOINT, WEBAPPIFY_API, "create", {
        flavor: get("flavor").value,
        configuration: {
            name: get("name-text").value,
            description: get("description-text").value,
            color: get("color-text").value,
            layout: get("layout-text").value,
            style: get("style-text").value,
            code: get("code-text").value,
            load: get("load-text").value
        }
    }, (success, result, error) => {
        if (success) {
            get("open").onclick = () => window.location = "../apps/" + result.id;
            get("sources").onclick = () => webappify_save("WebAppBundle.zip", result.sources, "application/zip", "base64");
            get("docker").onclick = () => webappify_save("WebAppDocker.zip", result.docker, "application/zip", "base64");
            page("finish");
        } else {
            popup("An error occurred: " + error, 0, "#AA0000AA");
        }
    });
}

/**
 * This function saves a file to the users device.
 * @param file File name
 * @param data File data
 * @param type Data type
 * @param encoding Data encoding
 */
function webappify_save(file, data, type = "text/plain", encoding = "utf8") {
    let link = document.createElement("a");
    link.download = file;
    link.href = "data:" + type + ";" + encoding + "," + data;
    link.click();
}