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
            slide("deployer-deploy-status", true, false);
            get("deployer-deploy-status").innerText = "Check your email for further instructions.";
            setTimeout(() => window.location = "", 10000);
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
                slide("deployer-deploy-status", false, false);
                slide("deployer-deploy-email", false, false);
                slide("deployer-deploy-button", false, true, () => {
                    let email = get("deployer-deploy-email").value;
                    if (validateEmail(email)) {
                        slide("deployer-deploy-status", false, false);
                        deployer_deploy(email, parameters);
                    } else {
                        slide("deployer-deploy-status", true, false);
                        get("deployer-deploy-status").innerText = "Wrong email syntax";
                        slide("deployer-deploy-email", true, false);
                        slide("deployer-deploy-button", true, true);
                    }
                });
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
        slide("deployer-unlock-button", false, true, () => {
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
        slide("deployer-unlock-button", false, true, () => {
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