<?php
session_start();
require_once "config.php";

if (!isset($_SESSION["user_id"])) {
    header("Location: login.html");
    exit;
}

$user_id = (int)$_SESSION["user_id"];
$name = $_SESSION["user_name"] ?? "User";
$email = $_SESSION["user_email"] ?? "";

$stmt = $conn->prepare("SELECT title, author, publish_year, edition_count FROM favorites WHERE user_id = ? ORDER BY id DESC");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Profile | BookVerse</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header>
    <nav class="navbar container">
      <a class="brand" href="home.html">📚 BookVerse</a>
      <ul class="nav-links">
        <li><a href="home.html">Dashboard</a></li>
        <li><a href="favorites.html">Favorites</a></li>
        <li><a href="profile.php">Profile</a></li>
        <li><a href="logout.php">Logout</a></li>
      </ul>
    </nav>
  </header>

  <main class="container section">
    <h1>User Profile</h1>
    <div class="about-box" style="margin-top: 10px;">
      <p><strong>Name:</strong> <?php echo htmlspecialchars($name); ?></p>
      <p><strong>Email:</strong> <?php echo htmlspecialchars($email); ?></p>
      (XAMPP)</p>
    </div>

    <div class="table-box" style="margin-top: 14px;">
      <h2>Favorite Books Saved in Database</h2>
      <table>
        <tr>
          <th>Title</th>
          <th>Author</th>
          <th>Publish Year</th>
          <th>Edition Count</th>
        </tr>
        <?php if ($result->num_rows === 0): ?>
          <tr><td colspan="4">No favorite books saved yet.</td></tr>
        <?php else: ?>
          <?php while ($row = $result->fetch_assoc()): ?>
            <tr>
              <td><?php echo htmlspecialchars($row["title"]); ?></td>
              <td><?php echo htmlspecialchars($row["author"]); ?></td>
              <td><?php echo htmlspecialchars($row["publish_year"]); ?></td>
              <td><?php echo htmlspecialchars($row["edition_count"]); ?></td>
            </tr>
          <?php endwhile; ?>
        <?php endif; ?>
      </table>
    </div>
  </main>
</body>
</html>
