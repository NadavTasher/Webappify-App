<?php

/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

include "mailer/PHPMailer.php";
include "mailer/OAuth.php";
include "mailer/POP3.php";
include "mailer/SMTP.php";
include "mailer/Exception.php";

include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "base" . DIRECTORY_SEPARATOR . "api.php";
include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "builder" . DIRECTORY_SEPARATOR . "api.php";

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

const DEPLOYER_API = "deployer";
const DEPLOYER_DIRECTORY = __DIR__ . DIRECTORY_SEPARATOR;
const DEPLOYER_DATABASE = __DIR__ . DIRECTORY_SEPARATOR;
const DEPLOYER_REACTIVATE_MAIL = __DIR__ . DIRECTORY_SEPARATOR . DIRECTORY_SEPARATOR . "reactivate.html";
const DEPLOYER_ACTIVATE_MAIL = __DIR__ . DIRECTORY_SEPARATOR . DIRECTORY_SEPARATOR . "activate.html";
const DEPLOYER_STYLESHEET = __DIR__ . DIRECTORY_SEPARATOR;
const DEPLOYER_LIFECYCLE = 30 * 24 * 60 * 60;
const DEPLOYER_GRACE = 7 * 24 * 60 * 60;
const DEPLOYER_APPLOCK_CONTENT = "Deny from all";
const DEPLOYER_APPLOCK_FILE = ".applock";

$deployer_database = json_decode(file_get_contents(DEPLOYER_DATABASE));

function deployer()
{
    api(DEPLOYER_API, function ($action, $parameters) {
        if ($action === "deploy") {
            if (isset($parameters->email)) {
                if (filter_var($parameters->email, FILTER_VALIDATE_EMAIL)) {
                    $app = builder();
                    if ($app !== null) {
                        $appId = random(20);
                        $file = tempnam(null, "zip");
                        file_put_contents($file, base64_decode($app));
                        builder_unzip($file, DEPLOYER_DIRECTORY . DIRECTORY_SEPARATOR . $appId);
                        file_put_contents(DEPLOYER_DIRECTORY . DIRECTORY_SEPARATOR . $appId . DIRECTORY_SEPARATOR . DEPLOYER_APPLOCK_FILE, DEPLOYER_APPLOCK_CONTENT);
                        deployer_create($appId, $parameters->email);
                        return [true, null];
                    } else {
                        return [false, "Build failure"];
                    }
                } else {
                    return [false, "Bad email syntax"];
                }
            } else {
                return [false, "Missing information"];
            }
        } else if ($action === "activate") {
            if (isset($parameters->id) && isset($parameters->key)) {
                return deployer_activate($parameters->id, $parameters->key);
            } else {
                return [false, "Missing information"];
            }
        } else if ($action === "reactivate") {
            if (isset($parameters->id) && isset($parameters->key)) {
                return deployer_reactivate($parameters->id, $parameters->key);
            } else {
                return [false, "Missing information"];
            }
        }
        return [false, null];
    }, false);
}

function deployer_scan()
{
    global $deployer_database;
    $time = time();
    foreach ($deployer_database as $appId => $app) {
        if ($time > $app->times->reactivate) {
            if ($time > $app->times->reactivate + DEPLOYER_GRACE) {
                deployer_remove($appId);
            }
        }
    }
}

function deployer_create($appId, $deployEmail)
{
    global $deployer_database;
    if (isset($deployer_database->$appId))
        return false;
    $deployer_database->$appId = new stdClass();
    $deployer_database->$appId->keys = new stdClass();
    $deployer_database->$appId->keys->activate = random(32);
    $deployer_database->$appId->keys->reactivate = random(32);
    $deployer_database->$appId->times = new stdClass();
    $deployer_database->$appId->times->deploy = time();
    $deployer_database->$appId->times->reactivate = time() + DEPLOYER_LIFECYCLE;
    $deployer_database->$appId->email = $deployEmail;
    deployer_save();
    return true;
}

function deployer_remove($appId)
{
    global $deployer_database;
    if (isset($deployer_database->$appId))
        unset($deployer_database->$appId);
    builder_rmdir(DEPLOYER_DIRECTORY . DIRECTORY_SEPARATOR . $appId);
    deployer_save();
}

function deployer_save()
{
    global $deployer_database;
    file_put_contents(DEPLOYER_DATABASE, json_encode($deployer_database));
}