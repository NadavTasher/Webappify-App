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
                            get("deploy-status").innerText = "Cool! Check your email for further instructions!";
                        }
                    }
                }
            }
        });
    });
}