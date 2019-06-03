function load(loggedIn) {
    view("app");
    if (parameter("host") !== undefined) {
        if (loggedIn) {
            loadDeploy(parameter("host"));
        } else {
            accounts(load);
        }
    } else {
        view("home");
    }
}

function loadBuilder() {
    loadTemplates(() => {
        view("build");
        view("build-welcome");
    });
}

function loadDeploy(value) {
    view("deploy");
    get("deploy-button").onclick = () => {
        slide(get("deploy-button"), false, true, () => {
            let email = get("deploy-email").value;
            if (validateEmail(email)) {
                deploy(email, JSON.parse(atob(value)));
            } else {
                slide(get("deploy-button"), true, true, () => {
                    get("deploy-status").innerText = "Wrong email syntax";
                });
            }
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