<?php
$host = "localhost";
$user = "root"; // default for XAMPP
$pass = "";
$dbname = "smart_library";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}
?>
