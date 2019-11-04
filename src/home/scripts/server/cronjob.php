<?php

/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "backend" . DIRECTORY_SEPARATOR . "webappify" . DIRECTORY_SEPARATOR . "api.php";

cronjob_update();
cronjob_remove();

/**
 * This function updates the template sources.
 */
function cronjob_update()
{
    cronjob_clear(WEBAPPIFY_SOURCES);
    foreach (json_decode(file_get_contents("https://raw.githubusercontent.com/NadavTasher/Webappify/master/src/home/files/assortment.json")) as $flavor) {
        $matches = null;
        preg_match("/([A-Za-z]+)$/", $flavor, $matches);
        if (count($matches) > 0) {
            shell_exec("git clone $flavor.git " . WEBAPPIFY_SOURCES . DIRECTORY_SEPARATOR . $matches[0]);
        }
    }
}

/**
 * This function removes apps that are deployed for more than 60 days.
 */
function cronjob_remove()
{
    $database = webappify_load();
    foreach ($database as $id => $created) {
        if ($created + 60 * 24 * 60 * 60 < time()) {
            cronjob_unlink(WEBAPPIFY_DESTINATIONS . DIRECTORY_SEPARATOR . $id);
            unset($database->$id);
            webappify_unload($database);
        }
    }
}

/**
 * This function clears the directory.
 * @param string $directory Directory to clear
 */
function cronjob_clear($directory)
{
    foreach (scandir($directory) as $entry) {
        if ($entry !== "." && $entry !== "..") {
            cronjob_unlink($directory . DIRECTORY_SEPARATOR . $entry);
        }
    }
}

/**
 * This function recursively unlinks the path.
 * @param string $path Path
 */
function cronjob_unlink($path)
{
    if (is_file($path)) {
        unlink($path);
    } else {
        if (is_dir($path)) {
            foreach (scandir($path) as $entry) {
                if ($entry !== "." && $entry !== "..") {
                    cronjob_unlink($path . DIRECTORY_SEPARATOR . $entry);
                }
            }
            rmdir($path);
        }
    }
}