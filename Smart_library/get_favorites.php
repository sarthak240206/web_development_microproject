<?php
session_start();
header("Content-Type: application/json");
require_once "config.php";

if (!isset($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Please login first.", "favorites" => []]);
    exit;
}

$user_id = (int)$_SESSION["user_id"];
$stmt = $conn->prepare("SELECT book_key, title, author, publish_year, cover_id, edition_count, languages_json, subjects_json FROM favorites WHERE user_id = ? ORDER BY id DESC");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$favorites = [];
while ($row = $result->fetch_assoc()) {
    $favorites[] = [
        "key" => $row["book_key"],
        "title" => $row["title"],
        "author" => $row["author"],
        "year" => $row["publish_year"],
        "coverId" => $row["cover_id"],
        "editionCount" => $row["edition_count"],
        "languages" => json_decode($row["languages_json"], true) ?: [],
        "subjects" => json_decode($row["subjects_json"], true) ?: []
    ];
}

echo json_encode(["success" => true, "favorites" => $favorites]);
?>
