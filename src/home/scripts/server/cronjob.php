<?php

/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "backend" . DIRECTORY_SEPARATOR . "webappify" . DIRECTORY_SEPARATOR . "api.php";

function cronjob_update()
{
    cronjob_clear(WEBAPPIFY_SOURCES);
    foreach (json_decode(file_get_contents("https://raw.githubusercontent.com/NadavTasher/Webappify/master/home/files/assortment.json")) as $flavor) {
        // Find Template's Name
        $template_name = null;
        preg_match("([A-Za-z]+)$", $flavor, $template_name);
        if ($template_name !== null) {
            $temporary = tempnam(null, "zip");
            file_put_contents($temporary, file_get_contents($flavor . "/archive/master.zip"));

        }


        builder_unzip(TEMPORARY_FILE, TEMPORARY_DIRECTORY);
        echo "Done\n";
        $repository_directory = glob(TEMPORARY_DIRECTORY . DIRECTORY_SEPARATOR . "*", GLOB_ONLYDIR)[0];
        if (file_exists($repository_directory . DIRECTORY_SEPARATOR . TEMPLATE_FILE)) {
            echo "Writing to master list - ";
            $template = json_decode(file_get_contents($repository_directory . DIRECTORY_SEPARATOR . TEMPLATE_FILE));
            $template_name = $template->name;
            $master->$template_name = $template->replacements;
            echo "Done\n";
            echo "Compressing to \"" . BUILDER_FLAVOUR_DIRECTORY . DIRECTORY_SEPARATOR . $template_name . ".zip" . "\" - ";
            file_put_contents(BUILDER_FLAVOUR_DIRECTORY . DIRECTORY_SEPARATOR . $template_name . ".zip", base64_decode(builder_zip($repository_directory)));
            echo "Done\n";
        }
    }
    echo "\n";
    builder_rmdir(TEMPORARY_DIRECTORY);
    builder_rmdir(TEMPORARY_FILE);
    echo "Writing master list - ";
    file_put_contents(BUILDER_MASTER_FILE, json_encode($master));
    echo "Done\n";
    echo "\n";
    echo "Update complete\n";
}

function cronjob_remove()
{

}

function cronjob_extract($file, $directory){

}

function cronjob_clear($directory)
{
    foreach (scandir($directory) as $entry) {
        cronjob_unlink($directory . DIRECTORY_SEPARATOR . $entry);
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