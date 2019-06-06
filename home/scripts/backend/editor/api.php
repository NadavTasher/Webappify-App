<?php
include __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "deployer" . DIRECTORY_SEPARATOR . "api.php";

const EDITOR_API = "editor";
const EDITOR_FILES = ["layouts/app.html", "stylesheets/app.css", "scripts/frontend/app.js"];

function editor()
{
    global $deployer_database;
    $user = accounts();
    if ($user !== null) {
        if (isset($_POST[EDITOR_API])) {
            // Not filtering because of HTML input
            $information = json_decode($_POST[EDITOR_API]);
            if (isset($information->action) && isset($information->parameters)) {
                $action = $information->action;
                $parameters = $information->parameters;
                result(DEPLOYER_API, $action, "success", false);
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
                                        result(DEPLOYER_API, $action, "success", true);
                                    } else {
                                        error(EDITOR_API, $action, "Invalid file");
                                    }
                                } else {
                                    error(EDITOR_API, $action, "Missing information");
                                }
                            } else if ($action === "read") {
                                $filesystem = new stdClass();
                                if (isset($parameters->file)) {
                                    $file = $parameters->file;
                                    editor_load_to_filesystem($id, $file, $filesystem);
                                } else {
                                    foreach (EDITOR_FILES as $file) {
                                        editor_load_to_filesystem($id, $file, $filesystem);
                                    }
                                }
                                result(EDITOR_API, $action, "filesystem", $filesystem);
                                result(DEPLOYER_API, $action, "success", true);
                            }
                        } else {
                            error(EDITOR_API, $action, "Ownership verification failure");
                        }
                    } else {
                        error(EDITOR_API, $action, "App does not exist");
                    }
                } else {
                    error(EDITOR_API, $action, "Missing information");
                }
            }
        }
    }
}

function editor_load_to_filesystem($id, $file, $filesystem)
{
    $filesystem->$file = new stdClass();
    $filesystem->$file->content = file_get_contents(DEPLOYER_DIRECTORY . DIRECTORY_SEPARATOR . $id . DIRECTORY_SEPARATOR . $file);
}