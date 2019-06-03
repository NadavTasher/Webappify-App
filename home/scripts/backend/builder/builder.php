<?php
include __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "base" . DIRECTORY_SEPARATOR . "api.php";
include __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "builder" . DIRECTORY_SEPARATOR . "api.php";
builder();
echo json_encode($result);