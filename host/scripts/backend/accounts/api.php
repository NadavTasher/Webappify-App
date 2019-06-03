<?php

include __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "base" . DIRECTORY_SEPARATOR . "api.php";

const ACCOUNTS_API = "accounts";

const ACCOUNTS_DATABASE = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "accounts" . DIRECTORY_SEPARATOR . "database.json";
const ACCOUNTS_ONION = 10;
const ACCOUNTS_LOCKOUT_ATTEMPTS = 5;
const ACCOUNTS_LOCKOUT_TIME = 5 * 60;
const ACCOUNTS_MINIMUM_PASSWORD_LENGTH = 8;

const ACCOUNTS_REGISTER_ENABLED = true;
const ACCOUNTS_VERIFY_ENABLED = true;
const ACCOUNTS_LOGIN_ENABLED = true;

$accounts_database = null;

function accounts()
{
    accounts_load();
    if (isset($_POST["accounts"])) {
        $information = json_decode(filter($_POST["accounts"]));
        if (isset($information->action) && isset($information->parameters)) {
            $action = $information->action;
            $parameters = $information->parameters;
            switch ($action) {
                case "login":
                    if (isset($parameters->name) && isset($parameters->password)) {
                        if (ACCOUNTS_LOGIN_ENABLED)
                            accounts_login($parameters->name, $parameters->password);
                        else
                            error(ACCOUNTS_API, "login", "Login disabled");
                    } else {
                        error(ACCOUNTS_API, "login", "Missing information");
                    }
                    break;
                case "register":
                    if (isset($parameters->name) && isset($parameters->password)) {
                        if (ACCOUNTS_REGISTER_ENABLED)
                            accounts_register($parameters->name, $parameters->password);
                        else
                            error(ACCOUNTS_API, "register", "Registration disabled");
                    } else {
                        error(ACCOUNTS_API, "register", "Missing information");
                    }
                    break;
                case "verify":
                    if (isset($parameters->certificate)) {
                        if (ACCOUNTS_VERIFY_ENABLED)
                            return accounts_verify($parameters->certificate);
                        else
                            error(ACCOUNTS_API, "verify", "Verify disabled");
                    } else {
                        error(ACCOUNTS_API, "verify", "Missing information");
                    }
                    break;
            }
            accounts_save();
        }
    }
    return null;
}

function accounts_certificate()
{
    global $accounts_database;
    $random = random(64);
    foreach ($accounts_database as $id => $account) {
        foreach ($account->certificates as $certificate) {
            if ($certificate === $random) return accounts_certificate();
        }
    }
    return $random;
}

function accounts_hashed($password, $saltA, $saltB, $onion = 0)
{
    if ($onion === 0)
        return hash("sha256", $saltA . $password . $saltB);
    return hash("sha256", ($onion % 2 === 0 ? $saltA : $saltB) . accounts_hashed($password, $saltA, $saltB, $onion - 1) . ($onion % 2 === 0 ? $saltB : $saltA));
}

function accounts_id()
{
    global $accounts_database;
    $random = random(10);
    if (isset($accounts_database->$random)) return accounts_id();
    return $random;
}

function accounts_load($database = ACCOUNTS_DATABASE)
{
    global $accounts_database;
    $accounts_database = json_decode(file_get_contents($database));
}

function accounts_lock($id)
{
    global $accounts_database;
    $accounts_database->$id->lockout->attempts++;
    if ($accounts_database->$id->lockout->attempts >= ACCOUNTS_LOCKOUT_ATTEMPTS) {
        $accounts_database->$id->lockout->attempts = 0;
        $accounts_database->$id->lockout->time = time() + ACCOUNTS_LOCKOUT_TIME;
    }
}

function accounts_lockout($id)
{
    global $accounts_database;
    return isset($accounts_database->$id->lockout->time) && $accounts_database->$id->lockout->time > time();
}

function accounts_login($name, $password)
{
    global $accounts_database;
    $found = false;
    result(ACCOUNTS_API, "login", "success", false);
    foreach ($accounts_database as $id => $account) {
        if ($account->name === $name) {
            $found = true;
            if (!accounts_lockout($id)) {
                if (accounts_password($id, $password)) {
                    $certificate = accounts_certificate();
                    array_push($account->certificates, $certificate);
                    result(ACCOUNTS_API, "login", "certificate", $certificate);
                    result(ACCOUNTS_API, "login", "success", true);
                } else {
                    accounts_lock($id);
                    error(ACCOUNTS_API, "login", "Incorrect password");
                }
            } else {
                error(ACCOUNTS_API, "login", "Account locked");
            }
        }
    }
    if (!$found)
        error(ACCOUNTS_API, "login", "Account not found");
}

function accounts_name($name)
{
    global $accounts_database;
    foreach ($accounts_database as $id => $account) {
        if ($account->name === $name) return true;
    }
    return false;
}

function accounts_password($id, $password)
{
    global $accounts_database;
    return accounts_hashed($password, $accounts_database->$id->saltA, $accounts_database->$id->saltB, ACCOUNTS_ONION) === $accounts_database->$id->hashed;
}


function accounts_register($name, $password)
{
    global $accounts_database;
    result(ACCOUNTS_API, "register", "success", false);
    if (!accounts_name($name)) {
        if (strlen($password) >= ACCOUNTS_MINIMUM_PASSWORD_LENGTH) {
            $account = new stdClass();
            $account->certificates = array();
            $account->lockout = new stdClass();
            $account->lockout->attempts = 0;
            $account->name = $name;
            $account->saltA = accounts_salt();
            $account->saltB = accounts_salt();
            $account->hashed = accounts_hashed($password, $account->saltA, $account->saltB, ACCOUNTS_ONION);
            $id = accounts_id();
            $accounts_database->$id = $account;
            result(ACCOUNTS_API, "register", "success", true);
        } else {
            error(ACCOUNTS_API, "register", "Password too short");
        }
    } else {
        error(ACCOUNTS_API, "register", "Name already taken");
    }
}

function accounts_salt()
{
    return random(128);
}

function accounts_save($database = ACCOUNTS_DATABASE)
{
    global $accounts_database;
    file_put_contents($database, json_encode($accounts_database));
}

function accounts_user($id)
{
    global $accounts_database;
    $user = $accounts_database->$id;
    $user->id = $id;
    unset($user->saltA);
    unset($user->saltB);
    unset($user->hashed);
    unset($user->certificates);
    return $user;
}

function accounts_verify($certificate)
{
    global $accounts_database;
    result(ACCOUNTS_API, "verify", "success", false);
    foreach ($accounts_database as $id => $account) {
        foreach ($account->certificates as $current) {
            if ($current === $certificate) {
                result(ACCOUNTS_API, "verify", "name", $account->name);
                result(ACCOUNTS_API, "verify", "success", true);
                return accounts_user($id);
            }
        }
    }
    return null;
}

