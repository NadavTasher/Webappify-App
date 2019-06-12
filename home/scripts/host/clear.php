<?php

/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "backend" . DIRECTORY_SEPARATOR . "deployer" . DIRECTORY_SEPARATOR . "api.php";
include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "backend" . DIRECTORY_SEPARATOR . "accounts" . DIRECTORY_SEPARATOR . "api.php";
include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "backend" . DIRECTORY_SEPARATOR . "builder" . DIRECTORY_SEPARATOR . "api.php";

global $deployer_database;

$empty = new stdClass();
// Remove accounts
file_put_contents(ACCOUNTS_DATABASE, json_encode($empty));
// Remove apps
foreach ($deployer_database as $id => $app) {
    builder_rmdir(DEPLOYER_DIRECTORY . DIRECTORY_SEPARATOR . $id);
}
// Remove database
file_put_contents(DEPLOYER_DATABASE, json_encode($empty));
echo "Clear\n";