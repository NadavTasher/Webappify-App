<?php

include "../host/globals.php";

const WEBAPP = "webapp";
const REBUNDLE = WEBAPP . ".zip";

$master = json_decode(file_get_contents(MASTER_LIST));
$result = new stdClass();
$result->success = false;

if (get("info") !== null) {
    $id = random(10);
    $info = json_decode(get("info"));
    $directory = APPS_DIRECTORY . $id;
    // Update flavour
    if (isset($info->flavour)) {
        $flavour = $info->flavour;
        if (isset($master->$flavour)) {
            // Create ID Directory
            mkdir($directory);
            // Unbundle
            if (unzip(FLAVOUR_DIRECTORY . DIRECTORY_SEPARATOR . $flavour . ".zip", $directory)) {
                // Change Files
                change($directory, $flavour, $info->replacements);
                // Rebundle
                rezip($directory . DIRECTORY_SEPARATOR . REBUNDLE, $directory);
                // Add To JSON
                $result->content = base64_encode(file_get_contents($directory . DIRECTORY_SEPARATOR . REBUNDLE));
                // Remove ID Directory
                removeDirectory($directory);
                // Add Success Flag
                $result->success = true;
            }
        }
    }

}
echo json_encode($result);

function change($directory, $flavour, $info)
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
                            if (preg_match("/^" . $replacement->pattern . "$/", $info->$name)) {
                                $change = true;
                            }
                        }
                    }
                }
                if (!$change) {
                    if (isset($replacement->default)) {
                        foreach ($replacement->haystacks as $haystack) {
                            replace($directory . DIRECTORY_SEPARATOR . $haystack, $replacement->needle, $replacement->default);
                        }
                    }
                } else {
                    foreach ($replacement->haystacks as $haystack) {
                        replace($directory . DIRECTORY_SEPARATOR . $haystack, $replacement->needle, $info->$name);
                    }
                }
            }
        }
    }
}

function replace($file, $search, $replacement)
{
    if ($search !== $replacement) {
        $contents = file_get_contents($file);
        $contents = str_replace($search, $replacement, $contents);
        file_put_contents($file, $contents);
    }
}

function random($length)
{
    $current = str_shuffle("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")[0];
    if ($length > 0) {
        return $current . random($length - 1);
    }
    return "";
}

function get($id)
{
    if (isset($_POST[$id])) {
        return $_POST[$id];
    } else if (isset($_GET[$id])) {
        return $_GET[$id];
    }
    return null;
}