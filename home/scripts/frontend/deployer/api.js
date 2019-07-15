/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

const DEPLOYER_API = "deployer";
const DEPLOYER_ENDPOINT = "scripts/backend/deployer/deployer.php";

function deployer_deploy(mail, parameters) {
    api(DEPLOYER_ENDPOINT, DEPLOYER_API, "deploy", {
        parameters: parameters,
        mail: mail
    }, (success, result, error) => {
        if (success) {
            get("deployer-deploy-status").innerText = "Check your email for further instructions.";
            setTimeout(() => page("deployer-deploy", "home"), 10000);
        }
    }, accounts_fill());
}

function deployer_load(parameters) {
    accounts((loggedIn) => {
        if (loggedIn) {
            view("app");
            view("deployer");
            view("deployer-deploy");
            get("deployer-deploy-button").onclick = () => {
                let email = get("deployer-deploy-email").value;
                if (validateEmail(email)) {
                    transition("deployer-deploy-information", OUT, () => deployer_deploy(email, parameters));
                } else {
                    transition("deployer-deploy-information", OUT, () => get("deployer-deploy-status").innerText = "Wrong email syntax");
                }
            };
        } else {
            deployer_load(parameters);
        }
    });
}

function deployer_unlock_load(id, key) {
    view("deployer");
    view("deployer-unlock");
    get("deployer-unlock-button").onclick = () => {
        transition("deployer-unlock", OUT, () => {
            api(DEPLOYER_ENDPOINT, DEPLOYER_API, "unlock", {
                id: id,
                key: key
            }, (success, result, error) => {
                if (success) {
                    window.location.href = "../apps/" + id;
                } else {
                    window.location.href = "./";
                }
            });
        });
    };
}

function deployer_renew_load(id, key) {
    view("deployer");
    view("deployer-renew");
    get("deployer-renew-button").onclick = () => {
        transition("deployer-renew", OUT, () => {
            api(DEPLOYER_ENDPOINT, DEPLOYER_API, "renew", {
                id: id,
                key: key
            }, (success, result, error) => {
                if (success) {
                    window.location.href = "../apps/" + id;
                } else {
                    window.location.href = "./";
                }
            });
        });
    };
}