<?php
session_start();
header("Content-Type: application/json");

$logged_in = isset($_SESSION["user_id"]);
echo json_encode([
    "logged_in" => $logged_in,
    "user" => $logged_in ? [
        "id" => (int)$_SESSION["user_id"],
        "name" => $_SESSION["user_name"] ?? "",
        "email" => $_SESSION["user_email"] ?? ""
    ] : null
]);
?>
