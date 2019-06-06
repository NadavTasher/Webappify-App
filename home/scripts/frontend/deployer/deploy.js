const deployCookie = "deployCookie";

function deploy(email, parameters) {
    let body = fillForm();
    body.append("deployer", JSON.stringify({
        action: "deploy",
        parameters: {
            parameters: parameters,
            email: email
        }
    }));
    fetch("scripts/backend/deployer/deployer.php", {
        method: "post",
        body: body
    }).then(response => {
        response.text().then((result) => {
            let json = JSON.parse(result);
            if (json.hasOwnProperty("deployer")) {
                if (json.deployer.hasOwnProperty("deploy")) {
                    if (json.deployer.deploy.hasOwnProperty("success")) {
                        if (json.deployer.deploy.success) {
                            slide("deploy-deploy-status", true, false);
                            get("deploy-deploy-status").innerText = "Check your email for further instructions.";
                            pushCookie(deployCookie, "");
                            setTimeout(() => window.location = "", 10000);
                        }
                    }
                }
            }
        });
    });
}

function loadDeploy(parameters) {
    accounts((loggedIn) => {
        if (loggedIn) {
            view("deploy");
            view("deploy-deploy");
            get("deploy-deploy-button").onclick = () => {
                slide("deploy-deploy-email", false, false);
                slide("deploy-deploy-button", false, true, () => {
                    let email = get("deploy-deploy-email").value;
                    if (validateEmail(email)) {
                        deploy(email, parameters);
                    } else {
                        slide("deploy-deploy-email", true, false);
                        slide(get("deploy-deploy-button"), true, true, () => {
                            get("deploy-deploy-status").innerText = "Wrong email syntax";
                        });
                    }
                });
            };
        } else {
            loadDeploy(parameters);
        }
    });

}