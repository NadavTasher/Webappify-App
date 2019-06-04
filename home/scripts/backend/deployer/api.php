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
const DEPLOYER_HTACCESS_CONTENT = "Deny from all";

$deployer_database = json_decode(file_get_contents(DEPLOYER_DATABASE));

function deployer()
{
    $user = accounts();
    if ($user !== null) {
        if (isset($_POST["deployer"])) {
            // Not filtering because of HTML input
            $information = json_decode($_POST["deployer"]);
            if (isset($information->action) && isset($information->parameters)) {
                $action = $information->action;
                $parameters = $information->parameters;
                result(DEPLOYER_API, $action, "success", false);
                if ($action === "deploy") {
                    if (isset($parameters->email) && isset($parameters->parameters)) {
                        if (filter_var($parameters->email, FILTER_VALIDATE_EMAIL)) {
                            $appParameters = $parameters->parameters;
                            $appId = random(12);
                            $appKey = random(128);
                            $directory = builder_create($appParameters->flavour, $appParameters->replacements);
                            if ($directory !== null) {
                                rename($directory . DIRECTORY_SEPARATOR . WEBAPP, DEPLOYMENT_DIRECTORY . DIRECTORY_SEPARATOR . $appId);
                                builder_rmdir($directory);
                                deployer_app_add($appId, $user->id, $appKey, $parameters->email);
                                file_put_contents(DEPLOYMENT_DIRECTORY . DIRECTORY_SEPARATOR . $appId . DIRECTORY_SEPARATOR . ".htaccess", DEPLOYER_HTACCESS_CONTENT);
                                deployer_mail($user, $parameters->email, "Deployment Activation", "Hi " . explode(" ", $user->name)[0] . ",\nYour app has been deployed on Webappify.org.\nIn order to activate it, go to the following link: https://webappify.org/unlock?app=$appId&key=$appKey\nYour app url: https://webappify.org/apps/$appId\nBest Regards, The Webappify Team.");
                                result(DEPLOYER_API, $action, "success", true);
                            }
                        }
                    }
                }
            }
        }
    }
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

function deployer_unlock($appId, $appKey)
{
    global $deployer_database;
    if (file_exists(DEPLOYMENT_DIRECTORY . DIRECTORY_SEPARATOR . $appId) && isset($deployer_database->$appId)) {
        if (!isset($deployer_database->$appId->unlock)) return true;
        if ($deployer_database->$appId->unlock === $appKey) {
            unset($deployer_database->$appId->unlock);
            unlink(DEPLOYMENT_DIRECTORY . DIRECTORY_SEPARATOR . $appId . DIRECTORY_SEPARATOR . ".htaccess");
            deployer_save();
            return true;
        }
    }
    return false;
}

function deployer_app_add($appId, $userId, $appKey, $deploymentEmail)
{
    global $deployer_database;
    $deployer_database->$appId = new stdClass();
    $deployer_database->$appId->deployment = time();
    $deployer_database->$appId->renewment = time();
    $deployer_database->$appId->owner = $userId;
    $deployer_database->$appId->unlock = $appKey;
    $deployer_database->$appId->email = $deploymentEmail;
    deployer_save();
}

function deployer_save()
{
    global $deployer_database;
    file_put_contents(DEPLOYER_DATABASE, json_encode($deployer_database));
}