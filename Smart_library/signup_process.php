<?php
session_start();
require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: signup.html");
    exit;
}

$full_name = trim($_POST["full_name"] ?? "");
$email = trim($_POST["email"] ?? "");
$password = $_POST["password"] ?? "";
$confirm_password = $_POST["confirm_password"] ?? "";

if (strlen($full_name) < 3 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6 || $password !== $confirm_password) {
    header("Location: signup.html?error=" . urlencode("Invalid signup details. Please check your input."));
    exit;
}

$check_stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$check_stmt->bind_param("s", $email);
$check_stmt->execute();
$check_stmt->store_result();
if ($check_stmt->num_rows > 0) {
    header("Location: login.html?error=" . urlencode("Email already registered. Please login."));
    exit;
}
$check_stmt->close();

$password_hash = password_hash($password, PASSWORD_DEFAULT);
$insert_stmt = $conn->prepare("INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)");
$insert_stmt->bind_param("sss", $full_name, $email, $password_hash);

if ($insert_stmt->execute()) {
    header("Location: login.html?success=" . urlencode("Signup successful. Please login."));
    exit;
}

header("Location: signup.html?error=" . urlencode("Signup failed. Please try again."));
exit;
?>
