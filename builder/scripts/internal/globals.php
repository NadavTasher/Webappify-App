<?php
const MASTER_LIST = __DIR__ . DIRECTORY_SEPARATOR . "../../files/templates.json";
const FLAVOUR_DIRECTORY = __DIR__ . DIRECTORY_SEPARATOR . "../../files/flavours";
const APPS_DIRECTORY = __DIR__ . DIRECTORY_SEPARATOR . "../../files/webapps";
function removeDirectory($directory)
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

        if (!removeDirectory($directory . DIRECTORY_SEPARATOR . $item)) {
            return false;
        }

    }

    return rmdir($directory);
}

function unzip($file, $directory)
{
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

function rezip($file, $directory)
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