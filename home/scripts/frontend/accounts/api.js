/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/AccountsTemplate/
 **/

const ACCOUNTS_CERTIFICATE_COOKIE = "certificate";
const ACCOUNTS_ENDPOINT = document.getElementsByName("endpoint")[0].getAttribute("content");
const ACCOUNTS_STARTPOINT = document.getElementsByName("startpoint")[0].getAttribute("content");
const ACCOUNTS_API = "accounts";
let accounts_callback_success, accounts_callback_failure;

function accounts(callback = null) {
    if (exists("accounts")) view("accounts");
    accounts_callback_success = (loggedIn = false) => {
        if (exists("accounts")) hide("accounts");
        if (callback !== null) callback(loggedIn);
    };
    accounts_callback_failure = () => {
        if (exists("accounts") && exists("login")) {
            view("login");
        } else {
            if (ACCOUNTS_STARTPOINT.length === 0) {
                accounts_callback_success(false);
            } else {
                window.location.href = ACCOUNTS_STARTPOINT;
            }
        }
    };
    if (accounts_cookie_has(ACCOUNTS_CERTIFICATE_COOKIE)) {
        accounts_verify(accounts_callback_success, accounts_callback_failure);
    } else {
        accounts_callback_failure();
    }
}

function accounts_fill(form = body()) {
    if (accounts_cookie_has(ACCOUNTS_CERTIFICATE_COOKIE)) {
        form = body(ACCOUNTS_API, "verify", {certificate: accounts_cookie_pull(ACCOUNTS_CERTIFICATE_COOKIE)}, form);
    }
    return form;
}

function accounts_force() {
    accounts_callback_success();
}

function accounts_cookie_has(name) {
    return accounts_cookie_pull(name) !== undefined;
}

function accounts_login(name, password) {
    api(ACCOUNTS_ENDPOINT, ACCOUNTS_API, "login", {
        name: name,
        password: password
    }, (success, result, error) => {
        if (success) {
            accounts_cookie_push(ACCOUNTS_CERTIFICATE_COOKIE, result);
            window.location.reload();
        } else {
            get("login-error").innerText = error;
        }
    });
}

function accounts_cookie_pull(name) {
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

function accounts_cookie_push(name, value) {
    const date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + date.toUTCString() + ";domain=" + window.location.hostname + ";path=/";
}

function accounts_register(name, password) {
    api(ACCOUNTS_ENDPOINT, ACCOUNTS_API, "register", {
        name: name,
        password: password
    }, (success, result, error) => {
        if (success) {
            accounts_login(name, password);
        } else {
            get("register-error").innerText = error
        }
    });
}

function accounts_verify(success, failure) {
    api(ACCOUNTS_ENDPOINT, ACCOUNTS_API, "verify", null, (status) => {
        if (status) {
            success(true);
        } else {
            failure();
        }
    }, accounts_fill());
}
