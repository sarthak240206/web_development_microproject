<?php
session_start();
header("Content-Type: application/json");
require_once "config.php";

if (!isset($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Please login first."]);
    exit;
}

$payload = json_decode(file_get_contents("php://input"), true);
if (!$payload) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid request payload."]);
    exit;
}

$user_id = (int)$_SESSION["user_id"];
$book_key = trim($payload["key"] ?? "");
$title = trim($payload["title"] ?? "");
$author = trim($payload["author"] ?? "Unknown");
$publish_year = trim((string)($payload["year"] ?? "N/A"));
$cover_id = trim((string)($payload["coverId"] ?? ""));
$edition_count = trim((string)($payload["editionCount"] ?? "N/A"));
$languages = json_encode($payload["languages"] ?? []);
$subjects = json_encode($payload["subjects"] ?? []);

if ($book_key === "" || $title === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Book key and title are required."]);
    exit;
}

$stmt = $conn->prepare(
    "INSERT INTO favorites (user_id, book_key, title, author, publish_year, cover_id, edition_count, languages_json, subjects_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        author = VALUES(author),
        publish_year = VALUES(publish_year),
        cover_id = VALUES(cover_id),
        edition_count = VALUES(edition_count),
        languages_json = VALUES(languages_json),
        subjects_json = VALUES(subjects_json)"
);
$stmt->bind_param(
    "issssssss",
    $user_id,
    $book_key,
    $title,
    $author,
    $publish_year,
    $cover_id,
    $edition_count,
    $languages,
    $subjects
);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Favorite saved."]);
    exit;
}

http_response_code(500);
echo json_encode(["success" => false, "message" => "Failed to save favorite."]);
?>
