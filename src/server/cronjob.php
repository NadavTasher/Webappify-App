<?php

/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "home" . DIRECTORY_SEPARATOR . "apis" . DIRECTORY_SEPARATOR . "webappify" . DIRECTORY_SEPARATOR . "api.php";

cronjob_update();
cronjob_remove();

/**
 * This function updates the template sources.
 */
function cronjob_update()
{
    cronjob_clear(WEBAPPIFY_PATH_TEMPLATES);
    foreach (json_decode(file_get_contents("https://raw.githubusercontent.com/NadavTasher/Webappify/master/src/home/files/assortment.json")) as $flavor) {
        $matches = null;
        preg_match("/([A-Za-z]+)$/", $flavor, $matches);
        if (count($matches) > 0) {
            shell_exec("git clone $flavor.git " . WEBAPPIFY_PATH_TEMPLATES . DIRECTORY_SEPARATOR . $matches[0]);
        }
    }
}

/**
 * This function removes apps that are deployed for more than 60 days.
 */
function cronjob_remove()
{
    foreach (scandir(WEBAPPIFY_PATH_APPLICATIONS) as $entry) {
        if ($entry[0] !== ".") {
            $directory = WEBAPPIFY_PATH_APPLICATIONS . DIRECTORY_SEPARATOR . $entry;
            $deployment = intval(file_get_contents($directory . DIRECTORY_SEPARATOR . WEBAPPIFY_DEPLOYMENT));
            if ($deployment + WEBAPPIFY_TIMEOUT < time()) {
                cronjob_unlink($directory);
            }
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