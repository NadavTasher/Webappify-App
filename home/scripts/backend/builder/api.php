<?php

include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "base" . DIRECTORY_SEPARATOR . "api.php";

const BUILDER_API = "builder";

const BUILDER_MASTER_LIST = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "builder" . DIRECTORY_SEPARATOR . "templates.json";
const BUILDER_FLAVOUR_DIRECTORY = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "builder" . DIRECTORY_SEPARATOR . "flavours";
const BUILDER_APPS_DIRECTORY = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "builder" . DIRECTORY_SEPARATOR . "webapps";

const BUILDER_WEBAPP = "webapp";
const BUILDER_REBUNDLE = BUILDER_WEBAPP . ".zip";

$master = json_decode(file_get_contents(BUILDER_MASTER_LIST));

function builder()
{
    api(BUILDER_API, function ($action, $parameters) {
        global $master;
        if ($action === "build") {
            if (isset($parameters->flavour)) {
                $flavour = $parameters->flavour;
                if (isset($master->$flavour)) {
                    $directory = builder_create($flavour, $parameters->replacements);
                    if ($directory !== null) {
                        $result = builder_bundle($directory);
                        builder_rmdir($directory);
                        return [true, $result];
                    } else {
                        return [false, "Build failure"];
                    }
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

function builder_bundle($directory)
{
    builder_zip($directory . DIRECTORY_SEPARATOR . BUILDER_REBUNDLE, $directory . DIRECTORY_SEPARATOR . BUILDER_WEBAPP);
    return base64_encode(file_get_contents($directory . DIRECTORY_SEPARATOR . BUILDER_REBUNDLE));
}

function builder_create($flavour, $replacements)
{
    $id = random(10);
    $directory = BUILDER_APPS_DIRECTORY . DIRECTORY_SEPARATOR . $id;
    mkdir($directory);
    if (builder_unzip(BUILDER_FLAVOUR_DIRECTORY . DIRECTORY_SEPARATOR . $flavour . ".zip", $directory . DIRECTORY_SEPARATOR . BUILDER_WEBAPP)) {
        // Remove some files
        builder_remove($directory);
        builder_evaluate($directory, $flavour, $replacements);
        return $directory;
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
                            builder_replace($directory . DIRECTORY_SEPARATOR . BUILDER_WEBAPP . DIRECTORY_SEPARATOR . $haystack, $replacement->needle, $replacement->default);
                        }
                    }
                } else {
                    foreach ($replacement->haystacks as $haystack) {
                        builder_replace($directory . DIRECTORY_SEPARATOR . BUILDER_WEBAPP . DIRECTORY_SEPARATOR . $haystack, $replacement->needle, $info->$name);
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

function builder_remove($directory)
{
    if (file_exists($directory . DIRECTORY_SEPARATOR . "LICENSE")) unlink($directory . DIRECTORY_SEPARATOR . "LICENSE");
    if (file_exists($directory . DIRECTORY_SEPARATOR . ".git")) builder_rmdir($directory . DIRECTORY_SEPARATOR . ".git");
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

function builder_zip($file, $directory)
{
    $rootPath = realpath($directory);
    $zip = new ZipArchive();
    $zip->open($file, ZipArchive::CREATE | ZipArchive::OVERWRITE);
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
}