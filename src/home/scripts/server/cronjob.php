<?php

/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "backend" . DIRECTORY_SEPARATOR . "webappify" . DIRECTORY_SEPARATOR . "api.php";

cronjob_update();

function cronjob_update()
{
    cronjob_clear(WEBAPPIFY_SOURCES);
    foreach (json_decode(file_get_contents("https://raw.githubusercontent.com/NadavTasher/Webappify/master/home/files/assortment.json")) as $flavor) {
        $template_name = null;
        preg_match("([A-Za-z]+)$", $flavor, $template_name);
        if ($template_name !== null) {
            $temporary = tempnam(null, "zip");
            file_put_contents($temporary, file_get_contents($flavor . "/archive/master.zip"));
            cronjob_extract($temporary, WEBAPPIFY_SOURCES . DIRECTORY_SEPARATOR . $template_name);
        }
    }
}

function cronjob_remove()
{

}

function cronjob_extract($file, $directory)
{
    if (!file_exists($directory))
        mkdir($directory);
    $zip = new ZipArchive;
    $zip->open($file);
    $zip->extractTo($directory);
    $zip->close();
}

function cronjob_clear($directory)
{
    foreach (scandir($directory) as $entry) {
        if ($entry !== "." && $entry !== ",,") {
            cronjob_unlink($path . DIRECTORY_SEPARATOR . $entry);
        }
    }
}

function cronjob_unlink($path)
{
    if (is_file($path)) {
        unlink($path);
    } else {
        if (is_dir($path)) {
            foreach (scandir($path) as $entry) {
                if ($entry !== "." && $entry !== ",,") {
                    cronjob_unlink($path . DIRECTORY_SEPARATOR . $entry);
                }
            }
            rmdir($path);
        }
    }
}