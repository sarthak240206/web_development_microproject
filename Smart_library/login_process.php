<?php
session_start();
require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: login.html");
    exit;
}

$email = trim($_POST["email"] ?? "");
$password = $_POST["password"] ?? "";

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
    header("Location: login.html?error=" . urlencode("Invalid login credentials."));
    exit;
}

$stmt = $conn->prepare("SELECT id, full_name, email, password_hash FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user || !password_verify($password, $user["password_hash"])) {
    header("Location: login.html?error=" . urlencode("Email or password is incorrect."));
    exit;
}

$_SESSION["user_id"] = (int)$user["id"];
$_SESSION["user_name"] = $user["full_name"];
$_SESSION["user_email"] = $user["email"];

header("Location: home.html");
exit;
?>
