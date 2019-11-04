<?php

/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

// Include Base API
include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "base" . DIRECTORY_SEPARATOR . "api.php";

// Initialize constants
const WEBAPPIFY_API = "webappify";
const WEBAPPIFY_DATABASE = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "database.json";
const WEBAPPIFY_DOCKERFILE = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "Dockerfile";
const WEBAPPIFY_SOURCES = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "sources";
const WEBAPPIFY_DESTINATIONS = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "apps";

function webappify()
{
    return api(WEBAPPIFY_API, function ($action, $parameters) {
        if ($action === "create") {
            if (isset($parameters->flavor) && isset($parameters->configuration)) {
                $flavor = $parameters->flavor;
                $configuration = $parameters->configuration;
                if (is_dir(WEBAPPIFY_SOURCES . DIRECTORY_SEPARATOR . basename($flavor))) {
                    $app = webappify_create($flavor, $configuration);
                    return [true, $app];
                } else {
                    return [false, "No such flavor"];
                }
            } else {
                return [false, "Missing information"];
            }
        } else if ($action === "list") {
            $list = array();
            foreach (scandir(WEBAPPIFY_SOURCES) as $entry) {
                if ($entry !== "." && $entry !== ",,") {
                    if (is_dir(WEBAPPIFY_SOURCES . DIRECTORY_SEPARATOR . $entry)) {
                        array_push($list, $entry);
                    }
                }
            }
            return [true, $list];
        }
        return [false, null];
    }, false);
}

function webappify_load()
{
    return json_decode(file_get_contents(WEBAPPIFY_DATABASE));
}

function webappify_unload($database)
{
    file_put_contents(WEBAPPIFY_DATABASE, json_encode($database));
}

function webappify_create($flavour, $configuration)
{
    // Load database
    $database = webappify_load();
    // Generate ID
    $id = random(14);
    if (isset($database->$id)) {
        return webappify_create($flavour, $configuration);
    } else {
        // Generate app object
        $app = new stdClass();
        $app->id = $id;
        // Copy sources
        webappify_copy(WEBAPPIFY_SOURCES . DIRECTORY_SEPARATOR . $flavour, WEBAPPIFY_DESTINATIONS . DIRECTORY_SEPARATOR . $id);
        // Configure app
        webappify_replace("AppName", $configuration->name, WEBAPPIFY_DESTINATIONS . DIRECTORY_SEPARATOR . $id);
        webappify_replace("AppDescription", $configuration->description, WEBAPPIFY_DESTINATIONS . DIRECTORY_SEPARATOR . $id);
        webappify_replace("#FFFFFF", $configuration->color, WEBAPPIFY_DESTINATIONS . DIRECTORY_SEPARATOR . $id);
        webappify_replace("<!--App Layout-->", $configuration->layout, WEBAPPIFY_DESTINATIONS . DIRECTORY_SEPARATOR . $id);
        webappify_replace("/* App Style */", $configuration->style, WEBAPPIFY_DESTINATIONS . DIRECTORY_SEPARATOR . $id);
        webappify_replace("// App Load Code", $configuration->code->load, WEBAPPIFY_DESTINATIONS . DIRECTORY_SEPARATOR . $id);
        webappify_replace("// App Code", $configuration->code->app, WEBAPPIFY_DESTINATIONS . DIRECTORY_SEPARATOR . $id);
        // Pack app
        $app->sources = webappify_sources_bundle($id);
        $app->docker = webappify_docker_bundle($id);
        // Register app
        $database->$id = time();
        webappify_unload($database);
        return $app;
    }
}

function webappify_sources($id, $prefix = "")
{
    $zip = new ZipArchive();
    $zip->open(tempnam(null, "zip"), ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $rootPath = realpath(WEBAPPIFY_DESTINATIONS . DIRECTORY_SEPARATOR . $id);
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($rootPath), RecursiveIteratorIterator::LEAVES_ONLY) as $file) {
        if (!$file->isDir()) {
            $filePath = $file->getRealPath();
            $relativePath = substr($filePath, strlen($rootPath) + 1);
            $relativePath = $prefix . $relativePath;
            $zip->addFile($filePath, $relativePath);
        }
    }
    return $zip;
}

function webappify_sources_bundle($id)
{
    $zip = webappify_sources($id);
    $zip->close();
    return base64_encode(file_get_contents($zip->filename));
}

function webappify_docker_bundle($id)
{
    $zip = webappify_sources($id, "src" . DIRECTORY_SEPARATOR);
    $zip->addFile(WEBAPPIFY_DOCKERFILE, "Dockerfile");
    $zip->close();
    return base64_encode(file_get_contents($zip->filename));
}

function webappify_replace($needle, $replacement, $haystack)
{
    if (is_file($haystack)) {
        file_put_contents($haystack, str_replace($needle, $replacement, file_get_contents($haystack)));
    } else {
        if (is_dir($haystack)) {
            foreach (scandir($haystack) as $entry) {
                if ($entry !== "." && $entry !== ",,") {
                    webappify_replace($needle, $replacement, "$haystack/$entry");
                }
            }
        }
    }
}

function webappify_copy($source, $destination, $permissions = 0755)
{
    // Check for symlinks
    if (is_link($source)) {
        return symlink(readlink($source), $destination);
    }

    // Simple copy for a file
    if (is_file($source)) {
        return copy($source, $destination);
    }

    // Make destination directory
    if (!is_dir($destination)) {
        mkdir($destination, $permissions);
    }

    // Loop through the folder
    foreach (scandir($source) as $entry) {
        if ($entry !== "." && $entry !== ",,") {
            webappify_copy("$source/$entry", "$destination/$entry", $permissions);
        }
    }

    return true;
}