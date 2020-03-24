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
                UI.find("flavor").appendChild(option);
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
        flavor: UI.find("flavor").value,
        configuration: {
            name: UI.find("name-text").value,
            description: UI.find("description-text").value,
            color: UI.find("color-text").value,
            layout: UI.find("layout-text").value,
            style: UI.find("style-text").value,
            code: UI.find("code-text").value,
            load: UI.find("load-text").value
        }
    }, (success, result) => {
        if (success) {
            UI.find("open").onclick = () => window.location = "../apps/" + result.id + "/src/";
            UI.find("sources").onclick = () => webappify_save("WebAppBundle.zip", result.sources, "application/zip", "base64");
            UI.page("finish");
        } else {
            alert("An error occurred: " + result);
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