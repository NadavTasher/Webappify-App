<?php

/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

// Include Base API
include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "base" . DIRECTORY_SEPARATOR . "api.php";

// Constants
const WEBAPPIFY_API = "webappify";
const WEBAPPIFY_DOCKERFILE = "Dockerfile";
const WEBAPPIFY_DEPLOYMENT = "deployment";
const WEBAPPIFY_TIMEOUT = 60 * 24 * 60 * 60;
// Initialize constant paths
const WEBAPPIFY_PATH = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "..";
const WEBAPPIFY_PATH_DOCKERFILE = WEBAPPIFY_PATH . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "others" . DIRECTORY_SEPARATOR . "Dockerfile";
const WEBAPPIFY_PATH_TEMPLATES = WEBAPPIFY_PATH . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "sources";
const WEBAPPIFY_PATH_APPLICATIONS = WEBAPPIFY_PATH . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "apps";

/**
 * This is the main API function.
 * @return mixed|null
 */
function webappify()
{
    return api(WEBAPPIFY_API, function ($action, $parameters) {
        if ($action === "create") {
            if (isset($parameters->flavor) && isset($parameters->configuration)) {
                $flavor = $parameters->flavor;
                $configuration = $parameters->configuration;
                if (is_dir(WEBAPPIFY_PATH_TEMPLATES . DIRECTORY_SEPARATOR . basename($flavor))) {
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
            foreach (scandir(WEBAPPIFY_PATH_TEMPLATES) as $entry) {
                if ($entry !== "." && $entry !== "..") {
                    if (is_dir(WEBAPPIFY_PATH_TEMPLATES . DIRECTORY_SEPARATOR . $entry)) {
                        array_push($list, $entry);
                    }
                }
            }
            return [true, $list];
        }
        return [false, null];
    }, false);
}

/**
 * This function creates a new application and returns an app object.
 * @param string $flavour App Flavor
 * @param stdClass $configuration App Configuration
 * @return stdClass App Object
 */
function webappify_create($flavour, $configuration)
{
    // Generate ID
    $id = random(14);
    $directory = WEBAPPIFY_PATH_APPLICATIONS . DIRECTORY_SEPARATOR . $id;
    if (file_exists($directory)) {
        return webappify_create($flavour, $configuration);
    } else {
        // Generate app object
        $app = new stdClass();
        $app->id = $id;
        // Copy sources
        webappify_copy(WEBAPPIFY_PATH_TEMPLATES . DIRECTORY_SEPARATOR . $flavour, $directory);
        // Configure app
        webappify_replace("AppName", $configuration->name, $directory);
        webappify_replace("AppDescription", $configuration->description, $directory);
        webappify_replace("#FFFFFF", $configuration->color, $directory);
        webappify_replace("<!--App Layout-->", $configuration->layout, $directory);
        webappify_replace("/* App Style */", $configuration->style, $directory);
        webappify_replace("// App Load Code", $configuration->load, $directory);
        webappify_replace("// App Code", $configuration->code, $directory);
        // Pack app
        $app->sources = webappify_sources_bundle($id);
        $app->docker = webappify_docker_bundle($id);
        // Register app
        file_put_contents($directory . DIRECTORY_SEPARATOR . WEBAPPIFY_DEPLOYMENT, time());
        return $app;
    }
}

/**
 * This function creates a ZipArchive with the app's sources.
 * @param string $file Temporary File
 * @param string $id App ID
 * @param string $prefix Prefix
 * @return ZipArchive Zip with sources
 */
function webappify_sources($file, $id, $prefix = "")
{
    $zip = new ZipArchive();
    $zip->open($file, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $rootPath = realpath(WEBAPPIFY_PATH_APPLICATIONS . DIRECTORY_SEPARATOR . $id);
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

/**
 * This function creates a source bundle and returns an encoded base64 string.
 * @param string $id App ID
 * @return string Base64 Encoded Sources Bundle
 */
function webappify_sources_bundle($id)
{
    $file = tempnam(null, "zip");
    $zip = webappify_sources($file, $id);
    $zip->close();
    return base64_encode(file_get_contents($file));
}

/**
 * This function creates a docker sources bundle and returns an encoded base64 string.
 * @param string $id App ID
 * @return string Base64 Encoded Docker Sources Bundle
 */
function webappify_docker_bundle($id)
{
    $file = tempnam(null, "zip");
    $zip = webappify_sources($file, $id, "src" . DIRECTORY_SEPARATOR);
    $zip->addFile(WEBAPPIFY_PATH_DOCKERFILE, WEBAPPIFY_DOCKERFILE);
    $zip->close();
    return base64_encode(file_get_contents($file));
}

/**
 * This function recursively walks the haystack and replaces any occurrence of needle with haystack
 * @param string $needle Needle
 * @param string $replacement Replacement
 * @param string $haystack Haystack Path
 */
function webappify_replace($needle, $replacement, $haystack)
{
    if (is_file($haystack)) {
        file_put_contents($haystack, str_replace($needle, $replacement, file_get_contents($haystack)));
    } else {
        if (is_dir($haystack)) {
            foreach (scandir($haystack) as $entry) {
                if ($entry !== "." && $entry !== "..") {
                    webappify_replace($needle, $replacement, "$haystack/$entry");
                }
            }
        }
    }
}

/**
 * This function copies the source directory to the destination directory.
 * @param string $source Source Directory
 * @param string $destination Destination Directory
 * @param int $permissions Directory R/W/X Permissions
 * @return bool Success
 */
function webappify_copy($source, $destination, $permissions = 0755)
{
    if (is_link($source)) {
        return symlink(readlink($source), $destination);
    }
    if (is_file($source)) {
        return copy($source, $destination);
    }
    if (!is_dir($destination)) {
        mkdir($destination, $permissions);
    }
    foreach (scandir($source) as $entry) {
        if ($entry !== "." && $entry !== "..") {
            webappify_copy("$source/$entry", "$destination/$entry", $permissions);
        }
    }
    return true;
}