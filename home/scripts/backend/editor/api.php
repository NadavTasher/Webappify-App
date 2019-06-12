<?php

/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "base" . DIRECTORY_SEPARATOR . "api.php";
include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "deployer" . DIRECTORY_SEPARATOR . "api.php";

const EDITOR_API = "editor";
const EDITOR_FILES = ["layouts/app.html", "stylesheets/app.css", "scripts/frontend/app.js"];

function editor()
{
    api(EDITOR_API, function ($action, $parameters) {
        global $deployer_database;
        $user = accounts();
        if ($user !== null) {
            if (isset($parameters->id)) {
                $id = $parameters->id;
                if (isset($deployer_database->$id)) {
                    if ($deployer_database->$id->credentials->owner === $user->id) {
                        if ($action === "write") {
                            if (isset($parameters->file) && isset($parameters->content)) {
                                $valid = false;
                                foreach (EDITOR_FILES as $allowed) {
                                    if ($parameters->file === $allowed) {
                                        $valid = true;
                                    }
                                }
                                if ($valid) {
                                    file_put_contents(DEPLOYER_DIRECTORY . DIRECTORY_SEPARATOR . $id . DIRECTORY_SEPARATOR . $parameters->file, $parameters->content);
                                    return [true, null];
                                } else {
                                    return [false, "Invalid file"];
                                }
                            } else {
                                return [false, "Missing information"];
                            }
                        } else if ($action === "read") {
                            if (isset($parameters->file)) {
                                $file = $parameters->file;
                                $valid = false;
                                foreach (EDITOR_FILES as $allowed) {
                                    if ($file === $allowed) {
                                        $valid = true;
                                    }
                                }
                                if ($valid) {
                                    return [true, file_get_contents(DEPLOYER_DIRECTORY . DIRECTORY_SEPARATOR . $id . DIRECTORY_SEPARATOR . $file)];
                                }
                            } else {
                                return [true, EDITOR_FILES];
                            }
                        }
                    } else {
                        return [false, "Ownership verification failure"];
                    }
                } else {
                    return [false, "App does not exist"];
                }
            } else {
                return [false, "Missing information"];
            }
        } else {
            return [false, "User authentication failure"];
        }
        return [false, null];
    }, false);
}

function editor_load_to_filesystem($id, $file, $filesystem)
{
    $filesystem->$file = new stdClass();
    $filesystem->$file->content = file_get_contents(DEPLOYER_DIRECTORY . DIRECTORY_SEPARATOR . $id . DIRECTORY_SEPARATOR . $file);
}