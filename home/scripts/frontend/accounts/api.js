const certificateCookie = "certificate";
let success, failure;

function accounts(callback) {
    view("accounts");
    success = (loggedIn = false) => {
        hide("accounts");
        callback(loggedIn);
    };
    failure = () => view("login");
    if (hasCookie(certificateCookie))
        verify(success, failure);
    else
        view("login");
}

function fillForm(form = new FormData()) {
    if (hasCookie(certificateCookie)) {
        form.append("accounts", JSON.stringify({
            action: "verify",
            parameters: {
                certificate: pullCookie(certificateCookie)
            }
        }));
    }
    return form;
}

function force() {
    success();
}

function hasCookie(name) {
    return pullCookie(name) !== undefined;
}

function login(name, password) {

    function error(error) {
        get("login-error").innerText = error;
    }

    let form = new FormData();
    form.append("accounts", JSON.stringify({
        action: "login",
        parameters: {
            name: name,
            password: password
        }
    }));
    fetch(document.getElementsByName("endpoint")[0].getAttribute("content"), {
        method: "post",
        body: form
    }).then(response => {
        response.text().then((result) => {
            let json = JSON.parse(result);
            if (json.hasOwnProperty("accounts")) {
                let accounts = json.accounts;
                if (accounts.hasOwnProperty("login")) {
                    if (accounts.login.hasOwnProperty("success")) {
                        if (accounts.login.success) {
                            if (accounts.login.hasOwnProperty("certificate")) {
                                pushCookie(certificateCookie, accounts.login.certificate);
                                window.location.reload();
                            }
                        }
                    }
                }
                if (accounts.hasOwnProperty("errors") && accounts.errors.hasOwnProperty("login")) error(accounts.errors.login);
            }
        });
    });
}

function pullCookie(name) {
    name += "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) === 0) {
            return decodeURIComponent(cookie.substring(name.length, cookie.length));
        }
    }
    return undefined;
}

function pushCookie(name, value) {
    const date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + date.toUTCString() + ";domain=" + window.location.hostname + ";path=/";
}

function register(name, password) {

    function error(error) {
        get("register-error").innerText = error;
    }

    let form = new FormData();
    form.append("accounts", JSON.stringify({
        action: "register",
        parameters: {
            name: name,
            password: password
        }
    }));
    fetch(document.getElementsByName("endpoint")[0].getAttribute("content"), {
        method: "post",
        body: form
    }).then(response => {
        response.text().then((result) => {
            let json = JSON.parse(result);
            if (json.hasOwnProperty("accounts")) {
                let accounts = json.accounts;
                if (accounts.hasOwnProperty("register")) {
                    if (accounts.register.hasOwnProperty("success")) {
                        if (accounts.register.success) {
                            login(name, password);
                        }
                    }
                }
                if (accounts.hasOwnProperty("errors") && accounts.errors.hasOwnProperty("register")) error(accounts.errors.register);
            }
        });
    });
}

function verify(success, failure) {
    let form = fillForm();
    fetch(document.getElementsByName("endpoint")[0].getAttribute("content"), {
        method: "post",
        body: form
    }).then(response => {
        response.text().then((result) => {
            let json = JSON.parse(result);
            if (json.hasOwnProperty("accounts")) {
                let accounts = json.accounts;
                if (accounts.hasOwnProperty("verify")) {
                    if (accounts.verify.hasOwnProperty("success")) {
                        if (accounts.verify.success) {
                            view("app");
                            success(true);
                        } else {
                            failure();
                        }
                    }
                } else {
                    failure();
                }
            }
        });
    });
}
