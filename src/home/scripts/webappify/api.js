/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

const WEBAPPIFY_API = "webappify";

/**
 * This function loads the list of templates to the select object.
 */
function webappify_load() {
    API.send(WEBAPPIFY_API, "list", {}, (success, result) => {
        if (success) {
            for (let t = 0; t < result.length; t++) {
                let option = document.createElement("option");
                option.innerText = result[t];
                option.value = result[t];
                UI.get("flavor").appendChild(option);
            }
        }
    });
    UI.page("home");
}

/**
 * This function generates the application.
 */
function webappify_create() {
    API.send(WEBAPPIFY_API, "create", {
        flavor: UI.get("flavor").value,
        configuration: {
            name: UI.get("name-text").value,
            description: UI.get("description-text").value,
            color: UI.get("color-text").value,
            layout: UI.get("layout-text").value,
            style: UI.get("style-text").value,
            code: UI.get("code-text").value,
            load: UI.get("load-text").value
        }
    }, (success, result) => {
        if (success) {
            UI.get("open").onclick = () => window.location = "../apps/" + result.id;
            UI.get("sources").onclick = () => webappify_save("WebAppBundle.zip", result.sources, "application/zip", "base64");
            UI.get("docker").onclick = () => webappify_save("WebAppDocker.zip", result.docker, "application/zip", "base64");
            UI.page("finish");
        } else {
            UI.popup("An error occurred: " + result, 0, "#AA0000AA");
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