/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

function load() {
    view("app");
    if (parameter("unlock") !== undefined && parameter("key") !== undefined) {
        deployer_unlock_load(parameter("unlock"), parameter("key"));
    } else if (parameter("renew") !== undefined && parameter("key") !== undefined) {
        deployer_renew_load(parameter("renew"), parameter("key"));
    } else {
        view("home");
    }
}