function loadExplore() {
    view("explore");
    view("explore-home");
}

function exploreRandom() {
    let body = new FormData;
    body.append("explorer", JSON.stringify({
        action: "random",
        parameters: {}
    }));
    fetch("scripts/backend/explorer/explorer.php", {
        method: "post",
        body: body
    }).then(response => {
        response.text().then((result) => {
            let json = JSON.parse(result);
            if (json.hasOwnProperty("explorer")) {
                if (json.explorer.hasOwnProperty("random")) {
                    if (json.explorer.build.hasOwnProperty("success")) {
                        if (json.explorer.build.success) {
                            if (json.builder.build.hasOwnProperty("content")) {
                                download((!parameters.replacements.hasOwnProperty("name") || parameters.replacements.name === "" ? "WebAppBundle" : parameters.replacements.name) + ".zip", json.builder.build.content, "application/zip", "base64");
                                window.location.reload(true);
                            }
                        }
                    }
                }
            }
        });
    });
}

function exploreList() {

}