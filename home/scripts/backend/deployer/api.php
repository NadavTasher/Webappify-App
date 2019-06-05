<?php

include "mailer/PHPMailer.php";
include "mailer/OAuth.php";
include "mailer/POP3.php";
include "mailer/SMTP.php";
include "mailer/Exception.php";

include __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "builder" . DIRECTORY_SEPARATOR . "api.php";
include __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "accounts" . DIRECTORY_SEPARATOR . "api.php";

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\POP3;
use PHPMailer\PHPMailer\OAuth;
use PHPMailer\PHPMailer\Exception;


const DEPLOYER_API = "deployer";
const DEPLOYMENT_DIRECTORY = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "apps";
const DEPLOYER_DATABASE = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "deployer" . DIRECTORY_SEPARATOR . "database.json";
const DEPLOYER_LIFECYCLE = 30 * 24 * 60 * 60;
const DEPLOYER_GRACE = 7 * 24 * 60 * 60;
const DEPLOYER_APPLOCK_CONTENT = "Deny from all";
const DEPLOYER_APPLOCK_FILE = ".applock";

$deployer_database = json_decode(file_get_contents(DEPLOYER_DATABASE));

function deployer()
{

    if (isset($_POST["deployer"])) {
        // Not filtering because of HTML input
        $information = json_decode($_POST["deployer"]);
        if (isset($information->action) && isset($information->parameters)) {
            $action = $information->action;
            $parameters = $information->parameters;
            result(DEPLOYER_API, $action, "success", false);
            if ($action === "deploy") {
                $user = accounts();
                if ($user !== null) {
                    if (isset($parameters->email) && isset($parameters->parameters)) {
                        if (filter_var($parameters->email, FILTER_VALIDATE_EMAIL)) {
                            $appParameters = $parameters->parameters;
                            $appId = random(12);
                            $directory = builder_create($appParameters->flavour, $appParameters->replacements);
                            if ($directory !== null) {
                                rename($directory . DIRECTORY_SEPARATOR . WEBAPP, DEPLOYMENT_DIRECTORY . DIRECTORY_SEPARATOR . $appId);
                                builder_rmdir($directory);
                                if (deployer_create($appId, $user->id, $parameters->email)) {
                                    deployer_mail_activate($appId, $user);
                                    file_put_contents(DEPLOYMENT_DIRECTORY . DIRECTORY_SEPARATOR . $appId . DIRECTORY_SEPARATOR . DEPLOYER_APPLOCK_FILE, DEPLOYER_APPLOCK_CONTENT);
                                    result(DEPLOYER_API, $action, "success", true);
                                }
                            }
                        }
                    }
                }
            } else if ($action === "unlock") {
                if (isset($parameters->id) && isset($parameters->key)) {
                    result(DEPLOYER_API, $action, "success", deployer_unlock($parameters->id, $parameters->key));
                }
            } else if ($action === "renew") {
                if (isset($parameters->id) && isset($parameters->key)) {
                    result(DEPLOYER_API, $action, "success", deployer_renew($parameters->id, $parameters->key));
                }
            }
        }
    }
}

function deployer_mail_activate($appId, $user)
{
    global $deployer_database;
    $unlockKey = $deployer_database->$appId->keys->unlock;
    deployer_mail($user, $deployer_database->$appId->email, "Deployment Activation", "Hi " . explode(" ", $user->name)[0] . ",\nYour app has been deployed on Webappify.org.\nIn order to activate it, open the following link: https://webappify.org/home/?unlock=$appId&key=$unlockKey\nYour app's url: https://webappify.org/apps/$appId\n\nBest Regards, The Webappify Team.");
}

function deployer_mail_renew($appId, $user)
{
    global $deployer_database;
    $renewKey = $deployer_database->$appId->keys->renew;
    deployer_mail($user, $deployer_database->$appId->email, "Deployment Renewal", "Hi " . explode(" ", $user->name)[0] . ",\nIt's been 30 days since you last renewed your app (https://webappify.org/apps/$appId).\nIt is now in it's grace period (7 days), and will be removed unless renewed.\nIn order to renew it, open the following link: https://webappify.org/home/?renew=$appId&key=$renewKey\n\nBest Regards, The Webappify Team.");
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
    $time = time();
    foreach ($deployer_database as $appId => $app) {
        if ($time > $app->times->renew) {
            if ($time > $app->times->renew + DEPLOYER_GRACE) {
                deployer_remove($appId);
            } else {
                deployer_mail_renew($appId, accounts_user($app->owner));
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
        deployer_save();
        return true;
    } else {
        return false;
    }
}

function deployer_unlock($appId, $unlockKey)
{
    global $deployer_database;
    if (file_exists(DEPLOYMENT_DIRECTORY . DIRECTORY_SEPARATOR . $appId . DIRECTORY_SEPARATOR . DEPLOYER_APPLOCK_FILE)) {
        if (isset($deployer_database->$appId) && $deployer_database->$appId->keys->unlock === $unlockKey) {
            unlink(DEPLOYMENT_DIRECTORY . DIRECTORY_SEPARATOR . $appId . DIRECTORY_SEPARATOR . DEPLOYER_APPLOCK_FILE);
        } else {
            return false;
        }
    }
    return true;
}

function deployer_create($appId, $userId, $deployEmail)
{
    global $deployer_database;
    if (isset($deployer_database->$appId)) return false;
    $deployer_database->$appId = new stdClass();
    $deployer_database->$appId->keys = new stdClass();
    $deployer_database->$appId->keys->unlock = random(32);
    $deployer_database->$appId->keys->renew = random(32);
    $deployer_database->$appId->times = new stdClass();
    $deployer_database->$appId->times->deploy = time();
    $deployer_database->$appId->times->renew = time();
    $deployer_database->$appId->owner = $userId;
    $deployer_database->$appId->email = $deployEmail;
    deployer_save();
    return true;
}

function deployer_remove($appId)
{
    global $deployer_database;
    if (isset($deployer_database->$appId)) unset($deployer_database->$appId);
    builder_rmdir(DEPLOYMENT_DIRECTORY . DIRECTORY_SEPARATOR . $appId);
    deployer_save();
}

function deployer_save()
{
    global $deployer_database;
    file_put_contents(DEPLOYER_DATABASE, json_encode($deployer_database));
}