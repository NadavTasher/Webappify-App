<?php

/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

include __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "backend" . DIRECTORY_SEPARATOR . "builder" . DIRECTORY_SEPARATOR . "api.php";

const ASSORTMENT_URL = "https://raw.githubusercontent.com/NadavTasher/Webappify/master/home/files/builder/assortment.json";

const TEMPORARY_DIRECTORY = "bundling";
const TEMPORARY_FILE = "bundling.zip";

const TEMPLATE_FILE = "template.json";

echo "Downloading assortment from \"" . ASSORTMENT_URL . "\" - ";
$assortment = json_decode(file_get_contents(ASSORTMENT_URL));
echo "Done\n";
$master = new stdClass();
foreach ($assortment as $flavour) {
    echo "\n";
    builder_rmdir(TEMPORARY_DIRECTORY);
    builder_rmdir(TEMPORARY_FILE);
    $repository_zip = $flavour . "/archive/master.zip";
    echo "Downloading template from \"" . $repository_zip . "\" - ";
    file_put_contents(TEMPORARY_FILE, file_get_contents($repository_zip));
    echo "Done\n";
    echo "Extracting to \"" . TEMPORARY_DIRECTORY . "\" - ";
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
        builder_zip(BUILDER_FLAVOUR_DIRECTORY . DIRECTORY_SEPARATOR . $template_name . ".zip", $repository_directory);
        echo "Done\n";
    }
}
echo "\n";
builder_rmdir(TEMPORARY_DIRECTORY);
builder_rmdir(TEMPORARY_FILE);
echo "Writing master list - ";
file_put_contents(BUILDER_DOCKERFILE_FILE, json_encode($master));
echo "Done\n";
echo "\n";
echo "Update complete\n";