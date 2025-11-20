<?php
require 'db.php';
header('Content-Type: application/json');
$d = json_decode(file_get_contents('php://input'), true);
$action = $d['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode($conn->query("SELECT * FROM students ORDER BY id DESC")->fetch_all(MYSQLI_ASSOC));
} elseif ($action == 'add') {
    $stmt = $conn->prepare("INSERT INTO students (name, course, email, contact) VALUES (?,?,?,?)");
    $stmt->bind_param("ssss", $d['name'], $d['course'], $d['email'], $d['contact']);
    $stmt->execute();
    echo json_encode(['success'=>true]);
} elseif ($action == 'update') {
    $stmt = $conn->prepare("UPDATE students SET name=?, course=?, email=?, contact=? WHERE id=?");
    $stmt->bind_param("ssssi", $d['name'], $d['course'], $d['email'], $d['contact'], $d['id']);
    $stmt->execute();
    echo json_encode(['success'=>true]);
} elseif ($action == 'delete') {
    $conn->query("DELETE FROM students WHERE id=" . $d['id']);
    echo json_encode(['success'=>true]);
}
?>