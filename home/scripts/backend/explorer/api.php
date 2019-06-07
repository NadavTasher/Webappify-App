<?php
include __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "deployer" . DIRECTORY_SEPARATOR . "api.php";

const EXPLORER_API = "explorer";

function explorer()
{
    if (isset($_POST[EXPLORER_API])) {
        $information = json_decode(filter($_POST[EXPLORER_API]));
        if (isset($information->action) && isset($information->parameters)) {
            $action = $information->action;
            $parameters = $information->parameters;
            result(EXPLORER_API, $action, "success", false);
            if ($action === "list") {
                result(EXPLORER_API, $action, "apps", explorer_list());
                result(EXPLORER_API, $action, "success", true);
            } else if ($action === "random") {
                $array = explorer_list();
                shuffle($array);
                result(EXPLORER_API, $action, "app", $array[0]);
                result(EXPLORER_API, $action, "success", true);
            }
        }
    }
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