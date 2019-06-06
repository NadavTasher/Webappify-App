function load(loggedIn) {
    view("app");
    if (parameter("unlock") !== undefined && parameter("key") !== undefined) {
        loadUnlock(parameter("unlock"), parameter("key"));
    } else if (parameter("renew") !== undefined && parameter("key") !== undefined) {
        loadRenew(parameter("renew"), parameter("key"));
    } else {
        view("home");
    }
}

function loadUnlock(id, key) {
    view("deploy");
    view("deploy-unlock");
    get("deploy-unlock-button").onclick = () => {
        slide(get("deploy-unlock-button"), false, true, () => {
            let body = new FormData;
            body.append("deployer", JSON.stringify({
                action: "unlock",
                parameters: {
                    id: id,
                    key: key
                }
            }));
            fetch("scripts/backend/deployer/deployer.php", {
                method: "post",
                body: body
            }).then(response => {
                response.text().then((result) => {
                    let json = JSON.parse(result);
                    if (json.hasOwnProperty("deployer")) {
                        if (json.deployer.hasOwnProperty("unlock")) {
                            if (json.deployer.unlock.hasOwnProperty("success")) {
                                if (json.deployer.unlock.success) {
                                    window.location.href = "../apps/" + id;
                                } else {
                                    window.location = "";
                                }
                            }
                        }
                    }
                });
            });
        });
    };
}

function loadRenew(id, key) {
    view("deploy");
    view("deploy-renew");
    get("deploy-renew-button").onclick = () => {
        slide(get("deploy-renew-button"), false, true, () => {
            let body = new FormData;
            body.append("deployer", JSON.stringify({
                action: "renew",
                parameters: {
                    id: id,
                    key: key
                }
            }));
            fetch("scripts/backend/deployer/deployer.php", {
                method: "post",
                body: body
            }).then(response => {
                response.text().then((result) => {
                    let json = JSON.parse(result);
                    if (json.hasOwnProperty("deployer")) {
                        if (json.deployer.hasOwnProperty("renew")) {
                            if (json.deployer.renew.hasOwnProperty("success")) {
                                if (json.deployer.renew.success) {
                                    window.location.href = "../apps/" + id;
                                } else {
                                    window.location = "";
                                }
                            }
                        }
                    }
                });
            });
        });
    };
}

function validateEmail(email) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function parameter(parameterName) {
    let tmp = [];
    let items = location.search.substr(1).split("&");
    for (let index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) return decodeURIComponent(tmp[1]);
    }
    return undefined;
}