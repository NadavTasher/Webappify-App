<?php

include __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "builder" . DIRECTORY_SEPARATOR . "api.php";
include __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "accounts" . DIRECTORY_SEPARATOR . "api.php";

const DEPLOYER_API = "deployer";

const DEPLOYMENT_DIRECTORY = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "apps";

const HTACCESS_CONTENT = "Deny from all";

function deployer()
{
    $userID = accounts();
    if ($userID !== null) {
        if (isset($_POST["deployer"])) {
            // Not filtering because of HTML input
            $information = json_decode($_POST["deployer"]);
            if (isset($information->action) && isset($information->parameters)) {
                $action = $information->action;
                $parameters = $information->parameters;
                result(DEPLOYER_API, $action, "success", false);
                if ($action === "deploy") {
                    if (isset($parameters->email) && isset($parameters->parameters)) {
                        $appParameters = $parameters->parameters;
                        $appId = random(12);
                        $directory = builder_create($appParameters->flavour, $appParameters->replacements);
                        if ($directory !== null) {
                            rename($directory . DIRECTORY_SEPARATOR . WEBAPP, DEPLOYMENT_DIRECTORY . DIRECTORY_SEPARATOR . $appId);
                            file_put_contents(DEPLOYMENT_DIRECTORY . DIRECTORY_SEPARATOR . $appId . DIRECTORY_SEPARATOR . ".htaccess", HTACCESS_CONTENT);
                            builder_rmdir($directory);
                            deployer_mail($userID, $parameters->email, $appId);
                            result(DEPLOYER_API, $action, "success", true);
                        }
                    }
                }
            }
        }
    }
}

function deployer_mail($user, $email, $appId)
{
    $headers = "From: noreply@webappify.org\r\nReply-To: noreply@webappify.org\r\nX-Mailer: PHP/" . phpversion();
//    $email = "\"" . $user->name . "\" <$email>";
    result(DEPLOYER_API, "deploy", "mail", mail($email, "Webappify Deployment", wordwrap(deployer_message($appId), 70, "\r\n"), $headers));
}

function deployer_message($appId)
{
    return "Message, $appId, Done.";
}