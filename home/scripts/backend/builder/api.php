<?php

/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/Webappify/
 **/

include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "base" . DIRECTORY_SEPARATOR . "api.php";

const BUILDER_API = "builder";

const BUILDER_DOCKERFILE_FILE = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "builder" . DIRECTORY_SEPARATOR . "Dockerfile";
const BUILDER_MASTER_FILE = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "builder" . DIRECTORY_SEPARATOR . "templates.json";
const BUILDER_FLAVOUR_DIRECTORY = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "builder" . DIRECTORY_SEPARATOR . "flavours";
const BUILDER_APPS_DIRECTORY = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "builder" . DIRECTORY_SEPARATOR . "apps";

$master = json_decode(file_get_contents(BUILDER_MASTER_FILE));

function builder()
{
    return api(BUILDER_API, function ($action, $parameters) {
        global $master;
        if ($action === "bundle") {
            if (isset($parameters->flavour)) {
                $flavour = $parameters->flavour;
                if (isset($master->$flavour)) {
                    $result = builder_create($flavour, $parameters->replacements, false);
                    if ($result !== null)
                        return [true, $result, $result];
                    else
                        return [false, "Build failure"];
                } else {
                    return [false, "Non existent template"];
                }
            } else {
                return [false, "Missing information"];
            }
        } else if ($action === "docker") {
            if (isset($parameters->flavour)) {
                $flavour = $parameters->flavour;
                if (isset($master->$flavour)) {
                    $result = builder_create($flavour, $parameters->replacements, true);
                    if ($result !== null)
                        return [true, $result, $result];
                    else
                        return [false, "Build failure"];
                } else {
                    return [false, "Non existent template"];
                }
            } else {
                return [false, "Missing information"];
            }
        }
        return [false, null];
    }, false);
}

function builder_copy($source, $destination)
{
    file_put_contents($destination, file_get_contents($source));
}

function builder_create($flavour, $replacements, $docker = false)
{
    $id = random(10);
    $directory = BUILDER_APPS_DIRECTORY . DIRECTORY_SEPARATOR . $id;
    mkdir($directory);
    $buildDirectory = $directory . DIRECTORY_SEPARATOR . "src";
    mkdir($buildDirectory);
    if (builder_unzip(BUILDER_FLAVOUR_DIRECTORY . DIRECTORY_SEPARATOR . $flavour . ".zip", $buildDirectory)) {
        builder_evaluate($buildDirectory, $flavour, $replacements);
        if ($docker) {
            builder_copy(BUILDER_DOCKERFILE_FILE, $directory . DIRECTORY_SEPARATOR . "Dockerfile");
            $result = builder_zip($directory);
        } else {
            $result = builder_zip($buildDirectory);
        }
        builder_rmdir($directory);
        return $result;
    }
    return null;
}

function builder_evaluate($directory, $flavour, $info)
{
    global $master;
    if (isset($master->$flavour)) {
        $template = $master->$flavour;
        foreach ($template as $replacement) {
            $name = $replacement->name;
            if (isset($info->$name)) {
                $change = false;
                if (!empty($info->$name)) {
                    if ($info->$name !== $replacement->needle) {
                        if (strpos($info->$name, $replacement->needle) === false) {
                            if (preg_match("/^" . $replacement->pattern . "$/m", $info->$name)) {
                                $change = true;
                            }
                        }
                    }
                }
                if (!$change) {
                    if (isset($replacement->default)) {
                        foreach ($replacement->haystacks as $haystack) {
                            builder_replace($directory . DIRECTORY_SEPARATOR . $haystack, $replacement->needle, $replacement->default);
                        }
                    }
                } else {
                    foreach ($replacement->haystacks as $haystack) {
                        builder_replace($directory . DIRECTORY_SEPARATOR . $haystack, $replacement->needle, $info->$name);
                    }
                }
            }
        }
    }
}

function builder_replace($file, $search, $replacement)
{
    if ($search !== $replacement) {
        $contents = file_get_contents($file);
        $contents = str_replace($search, $replacement, $contents);
        file_put_contents($file, $contents);
    }
}

function builder_rmdir($directory)
{
    if (!file_exists($directory)) {
        return true;
    }

    if (!is_dir($directory)) {
        return unlink($directory);
    }

    foreach (scandir($directory) as $item) {
        if ($item == '.' || $item == '..') {
            continue;
        }

        if (!builder_rmdir($directory . DIRECTORY_SEPARATOR . $item)) {
            return false;
        }

    }

    return rmdir($directory);
}

function builder_unzip($file, $directory)
{
    if (!file_exists($directory))
        mkdir($directory);
    $zip = new ZipArchive;
    if ($zip->open($file) === true) {
        $zip->extractTo($directory);
        $zip->close();
        return true;
    } else {
        return false;
    }
}

function builder_zip($directory)
{
    $output = tempnam(null, "zip");
    $zip = new ZipArchive();
    $zip->open($output, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $rootPath = realpath($directory);
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($rootPath),
        RecursiveIteratorIterator::LEAVES_ONLY
    );
    foreach ($files as $name => $file) {
        if (!$file->isDir()) {
            $filePath = $file->getRealPath();
            $relativePath = substr($filePath, strlen($rootPath) + 1);
            $zip->addFile($filePath, $relativePath);
        }
    }
    $zip->close();
    builder_rmdir($directory);
    return base64_encode(file_get_contents($output));
}