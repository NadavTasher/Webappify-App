<?php

$result = new stdClass();

function error($api, $type, $message)
{
    result($api, "errors", $type, $message);
}

function filter($source)
{
    $source = str_replace("<", "", $source);
    $source = str_replace(">", "", $source);
    return $source;
}

function random($length)
{
    $current = str_shuffle("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")[0];
    if ($length > 0) {
        return $current . random($length - 1);
    }
    return "";
}

function result($api, $type, $key, $value)
{
    global $result;
    if (!isset($result->$api)) $result->$api = new stdClass();
    if (!isset($result->$api->$type)) $result->$api->$type = new stdClass();
    $result->$api->$type->$key = $value;
}