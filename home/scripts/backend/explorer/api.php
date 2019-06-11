<?php

/*
Created By NadavTasher
https://github.com/NadavTasher/WebAppBase/
*/

include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "deployer" . DIRECTORY_SEPARATOR . "api.php";

const EXPLORER_API = "explorer";

function explorer()
{
    api(EXPLORER_API, function ($action, $parameters) {
        if ($action === "list") {
            $array = explorer_list();
            shuffle($array);
            return [true, $array];
        } else if ($action === "random") {
            $array = explorer_list();
            if (count($array) > 0) {
                shuffle($array);
                return [true, $array[0]];
            } else {
                return [false, "No apps"];
            }
        }
        return [false, null];
    }, true);
}

function explorer_list()
{
    global $deployer_database;
    $array = array();
    foreach ($deployer_database as $id => $app) {
        array_push($array, deployer_app($id));
    }
    return $array;
}