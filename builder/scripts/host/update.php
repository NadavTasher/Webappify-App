<?php
include "globals.php";
const ASSORTMENT_URL = "https://raw.githubusercontent.com/NadavTasher/Webappify/master/builder/files/assortment.json";
const TEMPORARY_DIRECTORY = "bundling";
const TEMPORARY_FILE = "bundling.zip";
const TEMPLATE_FILE = "template.json";
echo "Downloading assortment from \"" . ASSORTMENT_URL . "\" - ";
$assortment = json_decode(file_get_contents(ASSORTMENT_URL));
echo "Done\n";
$master = new stdClass();
foreach ($assortment as $flavour) {
    echo "\n";
    removeDirectory(TEMPORARY_DIRECTORY);
    removeDirectory(TEMPORARY_FILE);
    $repository_zip = $flavour . "/archive/master.zip";
    echo "Downloading template from \"" . $repository_zip . "\" - ";
    file_put_contents(TEMPORARY_FILE, file_get_contents($repository_zip));
    echo "Done\n";
    echo "Extracting to \"" . TEMPORARY_DIRECTORY . "\" - ";
    unzip(TEMPORARY_FILE, TEMPORARY_DIRECTORY);
    echo "Done\n";
    $repository_directory = glob(TEMPORARY_DIRECTORY . DIRECTORY_SEPARATOR . "*", GLOB_ONLYDIR)[0];
    if (file_exists($repository_directory . DIRECTORY_SEPARATOR . TEMPLATE_FILE)) {
        echo "Writing to master list - ";
        $template = json_decode(file_get_contents($repository_directory . DIRECTORY_SEPARATOR . TEMPLATE_FILE));
        $template_name = $template->name;
        $master->$template_name = $template->replacements;
        echo "Done\n";
        echo "Compressing to \"" . FLAVOUR_DIRECTORY . DIRECTORY_SEPARATOR . $template_name . ".zip" . "\" - ";
        rezip(FLAVOUR_DIRECTORY . DIRECTORY_SEPARATOR . $template_name . ".zip", $repository_directory);
        echo "Done\n";
    }
}
echo "\n";
removeDirectory(TEMPORARY_DIRECTORY);
removeDirectory(TEMPORARY_FILE);
echo "Writing master list - ";
file_put_contents(MASTER_LIST, json_encode($master));
echo "Done\n";
echo "\n";
echo "Update complete\n";