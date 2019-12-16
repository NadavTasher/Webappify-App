<?php

/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/BaseTemplate/
 **/

$result = new stdClass();

/**
 * This function handles API calls by handing them over to the callback.
 * @param string $API The API to listen to
 * @param callable $callback The callback to be called with action and parameters
 * @param bool $filter Whether to filter XSS characters
 * @return mixed|null A result array with [success, result|error]
 */
function api($API, $callback, $filter = true)
{
    global $result;
    if (isset($_POST["api"])) {
        $request = $_POST["api"];
        if ($filter)
            $request = filter($request);
        $APIs = json_decode($request);
        if (isset($APIs->$API)) {
            if (isset($APIs->$API->action) && isset($APIs->$API->parameters)) {
                $action = $APIs->$API->action;
                $action_parameters = $APIs->$API->parameters;
                $action_result = $callback($action, $action_parameters);
                if (is_array($action_result)) {
                    if (count($action_result) >= 2) {
                        if (is_bool($action_result[0])) {
                            $result->$API = new stdClass();
                            $result->$API->success = $action_result[0];
                            $result->$API->result = $action_result[1];
                            if (count($action_result) >= 3) {
                                return $action_result[2];
                            } else {
                                return $action_result;
                            }
                        }
                    }
                }
            }
        }
    }
    return null;
}

/**
 * This function filters XSS characters.
 * @param string $source The original string
 * @return string The filtered string
 */
function filter($source)
{
    $source = str_replace("<", "", $source);
    $source = str_replace(">", "", $source);
    return $source;
}

/**
 * This function generates a random string by the given length, with a complexity of 36^$length.
 * @param int $length Length of random
 * @return string Random string
 */
function random($length)
{
    $current = str_shuffle("0123456789abcdefghijklmnopqrstuvwxyz")[0];
    if ($length > 0) {
        return $current . random($length - 1);
    }
    return "";
}