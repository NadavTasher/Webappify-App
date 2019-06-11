<?php

/*
Created By NadavTasher
https://github.com/NadavTasher/WebAppBase/
*/

include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "base" . DIRECTORY_SEPARATOR . "api.php";

const ACCOUNTS_API = "accounts";

const ACCOUNTS_DATABASE = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "accounts" . DIRECTORY_SEPARATOR . "database.json";
const ACCOUNTS_ONION = 10;
const ACCOUNTS_LOCKOUT_ATTEMPTS = 5;
const ACCOUNTS_LOCKOUT_TIME = 5 * 60;
const ACCOUNTS_MINIMUM_PASSWORD_LENGTH = 8;

const ACCOUNTS_REGISTER_ENABLED = true;
const ACCOUNTS_VERIFY_ENABLED = true;
const ACCOUNTS_LOGIN_ENABLED = true;

$accounts_database_file = ACCOUNTS_DATABASE;
$accounts_database = null;

function accounts()
{
    accounts_load();
    return api(ACCOUNTS_API, function ($action, $parameters) {
        switch ($action) {
            case "login":
                if (isset($parameters->name) && isset($parameters->password)) {
                    if (ACCOUNTS_LOGIN_ENABLED)
                        return accounts_login($parameters->name, $parameters->password);
                    else
                        return [false, "Login disabled"];
                } else {
                    return [false, "Missing information"];
                }
                break;
            case "register":
                if (isset($parameters->name) && isset($parameters->password)) {
                    if (ACCOUNTS_REGISTER_ENABLED)
                        return accounts_register($parameters->name, $parameters->password);
                    else
                        return [false, "Registration disabled"];
                } else {
                    return [false, "Missing information"];
                }
                break;
            case "verify":
                if (isset($parameters->certificate)) {
                    if (ACCOUNTS_VERIFY_ENABLED)
                        return accounts_verify($parameters->certificate);
                    else
                        return [false, "Verification disabled"];
                } else {
                    return [false, "Missing information"];
                }
                break;
        }
        return [false, null];
    }, true);
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

function accounts_database($database)
{
    global $accounts_database_file;
    $accounts_database_file = $database;
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

function accounts_load()
{
    global $accounts_database, $accounts_database_file;
    if ($accounts_database === null)
        $accounts_database = json_decode(file_get_contents($accounts_database_file));
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
    foreach ($accounts_database as $id => $account) {
        if ($account->name === $name) {
            if (!accounts_lockout($id)) {
                if (accounts_password($id, $password)) {
                    $certificate = accounts_certificate();
                    array_push($account->certificates, $certificate);
                    accounts_save();
                    return [true, $certificate];
                } else {
                    accounts_lock($id);
                    accounts_save();
                    return [false, "Incorrect password"];
                }
            } else {
                return [false, "Account locked"];
            }
        }
    }
    return [false, "Account not found"];
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
            $accounts_database->{accounts_id()} = $account;
            accounts_save();
            return [true, null];
        } else {
            return [false, "Password too short"];
        }
    } else {
        return [false, "Name already taken"];
    }
}

function accounts_salt()
{
    return random(128);
}

function accounts_save()
{
    global $accounts_database, $accounts_database_file;
    file_put_contents($accounts_database_file, json_encode($accounts_database));
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
    foreach ($accounts_database as $id => $account) {
        foreach ($account->certificates as $current) {
            if ($current === $certificate) {
                return [true, accounts_user($id)];
            }
        }
    }
    return [false, "Invalid certificate"];
}

