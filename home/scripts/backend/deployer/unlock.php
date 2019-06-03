<?php
include __DIR__ . DIRECTORY_SEPARATOR . "api.php";
if (isset($_GET["app"]) && isset($_GET["key"])) {
    if (deployer_unlock($_GET["app"], $_GET["key"])) {
        header("Location: https://webappify.org/apps/" . $_GET["app"]);
    } else {
        echo "Unlock Failed";
    }
}