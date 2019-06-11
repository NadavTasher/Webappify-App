/*
Created By NadavTasher
https://github.com/NadavTasher/WebAppBase/
*/

const ACCOUNTS_CERTIFICATE_COOKIE = "certificate";
const ACCOUNTS_ENDPOINT = document.getElementsByName("endpoint")[0].getAttribute("content");
const ACCOUNTS_STARTPOINT = document.getElementsByName("startpoint")[0].getAttribute("content");
const ACCOUNTS_API = "accounts";
let success, failure;

function accounts(callback = null) {
    if (exists("accounts")) view("accounts");
    success = (loggedIn = false) => {
        if (exists("accounts")) hide("accounts");
        if (callback !== null) callback(loggedIn);
    };
    failure = () => {
        if (exists("accounts") && exists("login")) {
            view("login");
        } else {
            if (ACCOUNTS_STARTPOINT.length === 0) {
                success(false);
            } else {
                window.location.href = ACCOUNTS_STARTPOINT;
            }
        }
    };
    if (hasCookie(ACCOUNTS_CERTIFICATE_COOKIE)) {
        verify(success, failure);
    } else {
        failure();
    }
}

function fillForm(form = body()) {
    if (hasCookie(ACCOUNTS_CERTIFICATE_COOKIE)) {
        form = body(ACCOUNTS_API, "verify", {certificate: pullCookie(ACCOUNTS_CERTIFICATE_COOKIE)}, form);
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
    api(ACCOUNTS_ENDPOINT, ACCOUNTS_API, "login", {
        name: name,
        password: password
    }, (success, result, error) => {
        if (success) {
            pushCookie(ACCOUNTS_CERTIFICATE_COOKIE, result);
            window.location.reload();
        } else {
            get("login-error").innerText = error;
        }
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
    api(ACCOUNTS_ENDPOINT, ACCOUNTS_API, "register", {
        name: name,
        password: password
    }, (success, result, error) => {
        if (success) {
            login(name, password);
        } else {
            get("register-error").innerText = error
        }
    });
}

function verify(success, failure) {
    api(ACCOUNTS_ENDPOINT, ACCOUNTS_API, "verify", null, (status) => {
        if (status) {
            success(true);
        } else {
            failure();
        }
    }, fillForm());
}
