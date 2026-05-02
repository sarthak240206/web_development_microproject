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
$book_key = trim($payload["key"] ?? "");
if ($book_key === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Book key is required."]);
    exit;
}

$user_id = (int)$_SESSION["user_id"];
$stmt = $conn->prepare("DELETE FROM favorites WHERE user_id = ? AND book_key = ?");
$stmt->bind_param("is", $user_id, $book_key);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Favorite removed."]);
    exit;
}

http_response_code(500);
echo json_encode(["success" => false, "message" => "Could not remove favorite."]);
?>
