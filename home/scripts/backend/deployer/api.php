<?php

include "mailer/PHPMailer.php";
include "mailer/OAuth.php";
include "mailer/POP3.php";
include "mailer/SMTP.php";
include "mailer/Exception.php";

include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "base" . DIRECTORY_SEPARATOR . "api.php";
include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "builder" . DIRECTORY_SEPARATOR . "api.php";
include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "accounts" . DIRECTORY_SEPARATOR . "api.php";

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\POP3;
use PHPMailer\PHPMailer\OAuth;
use PHPMailer\PHPMailer\Exception;

const DEPLOYER_API = "deployer";
const DEPLOYER_DIRECTORY = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "apps";
const DEPLOYER_DATABASE = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "deployer" . DIRECTORY_SEPARATOR . "database.json";
const DEPLOYER_RENEW_MAIL = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "resources" . DIRECTORY_SEPARATOR . "deployer" . DIRECTORY_SEPARATOR . "renew.html";
const DEPLOYER_ACTIVATE_MAIL = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "resources" . DIRECTORY_SEPARATOR . "deployer" . DIRECTORY_SEPARATOR . "activate.html";
const DEPLOYER_STYLESHEET = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "stylesheets" . DIRECTORY_SEPARATOR . "theme.css";
const DEPLOYER_LIFECYCLE = 30 * 24 * 60 * 60;
const DEPLOYER_GRACE = 7 * 24 * 60 * 60;
const DEPLOYER_APPLOCK_CONTENT = "Deny from all";
const DEPLOYER_APPLOCK_FILE = ".applock";

$deployer_database = json_decode(file_get_contents(DEPLOYER_DATABASE));

function deployer()
{
    api(DEPLOYER_API, function ($action, $parameters) {
        if ($action === "deploy") {
            $user = accounts();
            if ($user !== null) {
                if (isset($parameters->mail) && isset($parameters->parameters)) {
                    if (filter_var($parameters->mail, FILTER_VALIDATE_EMAIL)) {
                        $appParameters = $parameters->parameters;
                        $appId = random(12);
                        $directory = builder_create($appParameters->flavour, $appParameters->replacements);
                        if ($directory !== null) {
                            rename($directory . DIRECTORY_SEPARATOR . BUILDER_WEBAPP, DEPLOYER_DIRECTORY . DIRECTORY_SEPARATOR . $appId);
                            builder_rmdir($directory);
                            if (deployer_create($appId, $user->id, isset($appParameters->replacements->name) ? $appParameters->replacements->name : "Unknown", isset($appParameters->replacements->description) ? $appParameters->replacements->description : "Unknown", $parameters->mail)) {
                                deployer_mail_activate($appId, $user);
                                file_put_contents(DEPLOYER_DIRECTORY . DIRECTORY_SEPARATOR . $appId . DIRECTORY_SEPARATOR . DEPLOYER_APPLOCK_FILE, DEPLOYER_APPLOCK_CONTENT);
                                return [true, null];
                            }
                        } else {
                            return [false, "Build failure"];
                        }
                    } else {
                        return [false, "Bad email syntax"];
                    }
                } else {
                    return [false, "Missing information"];
                }
            } else {
                return [false, "User authentication failed"];
            }
        } else if ($action === "unlock") {
            if (isset($parameters->id) && isset($parameters->key)) {
                return deployer_unlock($parameters->id, $parameters->key);
            } else {
                return [false, "Missing information"];
            }
        } else if ($action === "renew") {
            if (isset($parameters->id) && isset($parameters->key)) {
                return deployer_renew($parameters->id, $parameters->key);
            } else {
                return [false, "Missing information"];
            }
        }
        return [false, null];
    }, false);
}

function deployer_mail_activate($appId, $user)
{
    global $deployer_database;
    $unlockKey = $deployer_database->$appId->keys->unlock;

    $mail = file_get_contents(DEPLOYER_ACTIVATE_MAIL);
    $mail = str_replace("FirstName", explode(" ", $user->name)[0], $mail);
    $mail = str_replace("AppID", $appId, $mail);
    $mail = str_replace("Key", $unlockKey, $mail);

    deployer_mail($user, $deployer_database->$appId->credentials->mail, "Deployment Activation #" . count((array)$deployer_database), $mail);
}

function deployer_mail_renew($appId, $user)
{
    global $deployer_database;
    $renewKey = $deployer_database->$appId->keys->renew;

    $mail = file_get_contents(DEPLOYER_RENEW_MAIL);
    $mail = str_replace("FirstName", explode(" ", $user->name)[0], $mail);
    $mail = str_replace("AppID", $appId, $mail);
    $mail = str_replace("Key", $renewKey, $mail);

    deployer_mail($user, $deployer_database->$appId->credentials->mail, "Deployment Renewal #" . ($deployer_database->$appId->renews + 1), $mail);
}

function deployer_mail($user, $email, $subject, $message)
{
    $private = json_decode(file_get_contents(__DIR__ . DIRECTORY_SEPARATOR . "private" . DIRECTORY_SEPARATOR . "credentials.json"));
    try {
        $mail = new PHPMailer(true);
        $mail->IsSMTP();
        $mail->SMTPAuth = true;
        $mail->SMTPSecure = "ssl";
        $mail->Host = "smtp.gmail.com";
        $mail->Port = 465;
        $mail->Username = $private->mail;
        $mail->Password = $private->password;
        $mail->AddAddress($email, $user->name);
        $mail->SetFrom("noreply@webappify.org", "Webappify");
        $mail->Subject = $subject;
        $mail->isHTML(true);
        $mail->Body = $message;
        $mail->Send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}

function deployer_scan()
{
    global $deployer_database;
    accounts_load();
    $time = time();
    foreach ($deployer_database as $appId => $app) {
        if ($time > $app->times->renew) {
            if ($time > $app->times->renew + DEPLOYER_GRACE) {
                deployer_remove($appId);
            } else {
                deployer_mail_renew($appId, accounts_user($app->credentials->owner));
            }
        }
    }
}

function deployer_renew($appId, $renewKey)
{
    global $deployer_database;
    if (isset($deployer_database->$appId) && $deployer_database->$appId->keys->renew === $renewKey) {
        $deployer_database->$appId->times->renew = time() + DEPLOYER_LIFECYCLE;
        $deployer_database->$appId->keys->renew = random(32);
        $deployer_database->$appId->renews += 1;
        deployer_save();
        return [true, null];
    } else {
        return [false, "Wrong key or non existent app"];
    }
}

function deployer_unlock($appId, $unlockKey)
{
    global $deployer_database;
    if (file_exists(DEPLOYER_DIRECTORY . DIRECTORY_SEPARATOR . $appId . DIRECTORY_SEPARATOR . DEPLOYER_APPLOCK_FILE)) {
        if (isset($deployer_database->$appId) && $deployer_database->$appId->keys->unlock === $unlockKey) {
            unlink(DEPLOYER_DIRECTORY . DIRECTORY_SEPARATOR . $appId . DIRECTORY_SEPARATOR . DEPLOYER_APPLOCK_FILE);
            return [true, null];
        } else {
            return [false, "Wrong key or non existent app"];
        }
    }
    return [true, null];
}

function deployer_create($appId, $userId, $appName, $appDescription, $deployEmail)
{
    global $deployer_database;
    if (isset($deployer_database->$appId)) return false;
    $deployer_database->$appId = new stdClass();
    $deployer_database->$appId->keys = new stdClass();
    $deployer_database->$appId->keys->unlock = random(32);
    $deployer_database->$appId->keys->renew = random(32);
    $deployer_database->$appId->times = new stdClass();
    $deployer_database->$appId->times->deploy = time();
    $deployer_database->$appId->times->renew = time() + DEPLOYER_LIFECYCLE;
    $deployer_database->$appId->credentials = new stdClass();
    $deployer_database->$appId->credentials->owner = $userId;
    $deployer_database->$appId->credentials->mail = $deployEmail;
    $deployer_database->$appId->name = $appName;
    $deployer_database->$appId->description = $appDescription;
    $deployer_database->$appId->renews = 0;
    deployer_save();
    return true;
}

function deployer_remove($appId)
{
    global $deployer_database;
    if (isset($deployer_database->$appId)) unset($deployer_database->$appId);
    builder_rmdir(DEPLOYER_DIRECTORY . DIRECTORY_SEPARATOR . $appId);
    deployer_save();
}

function deployer_save()
{
    global $deployer_database;
    file_put_contents(DEPLOYER_DATABASE, json_encode($deployer_database));
}