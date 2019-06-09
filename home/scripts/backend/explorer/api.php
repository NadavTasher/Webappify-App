<?php
include __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "deployer" . DIRECTORY_SEPARATOR . "api.php";

const EXPLORER_API = "explorer";

function explorer()
{
    api(EXPLORER_API, function ($action, $parameters) {
        if ($action === "list") {
            return [true, explorer_list()];
        } else if ($action === "random") {
            $array = explorer_list();
            shuffle($array);
            return [true, $array[0]];
        }
        return [false, null];
    }, true);
}

function explorer_list()
{
    global $deployer_database;
    $array = array();
    foreach ($deployer_database as $id => $app) {
        $object = new stdClass();
        $object->id = $id;
        $object->name = $app->name;
        $object->description = $app->description;
        array_push($array, $object);
    }
    return $array;
}