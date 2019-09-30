<?php

/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/WebAppBase/
 **/

$result = new stdClass();

function api($api, $callback, $filter = true)
{
    if (isset($_POST[$api])) {
        $content = $_POST[$api];
        if ($filter) $content = filter($content);
        $information = json_decode($content);
        if (isset($information->action) && isset($information->parameters)) {
            $action = $information->action;
            $parameters = $information->parameters;
            $return = $callback($action, $parameters);
            if (is_array($return)) {
                if (count($return) === 2) {
                    $success = $return[0];
                    $result = $return[1];
                    if (is_bool($success)) {
                        if ($success) {
                            success($api, $action, true);
                            result($api, $action, $result);
                            return $result;
                        } else {
                            success($api, $action, false, $result);
                            result($api, $action, null);
                            return null;
                        }
                    }
                }
            }
        }
    }
    return null;
}

function filter($source)
{
    $source = str_replace("<", "", $source);
    $source = str_replace(">", "", $source);
    return $source;
}

function put($api, $type, $key, $value)
{
    global $result;
    if (!isset($result->$api)) $result->$api = new stdClass();
    if (!isset($result->$api->$type)) $result->$api->$type = new stdClass();
    $result->$api->$type->$key = $value;
}

function random($length)
{
    $current = str_shuffle("0123456789abcdefghijklmnopqrstuvwxyz")[0];
    if ($length > 0) {
        return $current . random($length - 1);
    }
    return "";
}

function result($api, $action, $result)
{
    put($api, "result", $action, $result);
}

function success($api, $action, $success = true, $error = "Unknown Error")
{
    if ($success) {
        put($api, "status", $action, true);
    } else {
        put($api, "status", $action, $error);
    }
}