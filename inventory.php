<?php
require 'db.php';
header('Content-Type: application/json');
$d = json_decode(file_get_contents('php://input'), true);
$action = $d['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get items AND names of students holding them
    $sql = "SELECT i.*, GROUP_CONCAT(s.name SEPARATOR ', ') as holders 
            FROM inventory i
            LEFT JOIN transactions t ON i.id = t.item_id AND t.status = 'out'
            LEFT JOIN students s ON t.student_id = s.id
            GROUP BY i.id ORDER BY i.id DESC";
    echo json_encode($conn->query($sql)->fetch_all(MYSQLI_ASSOC));
} elseif ($action == 'add') {
    $stmt = $conn->prepare("INSERT INTO inventory (name, quantity, available) VALUES (?,?,?)");
    $stmt->bind_param("sii", $d['name'], $d['qty'], $d['qty']);
    $stmt->execute();
    echo json_encode(['success'=>true]);
} elseif ($action == 'checkout') {
    $conn->query("UPDATE inventory SET available = available - 1 WHERE id=" . $d['id']);
    $stmt = $conn->prepare("INSERT INTO transactions (item_id, student_id) VALUES (?,?)");
    $stmt->bind_param("ii", $d['id'], $d['sid']);
    $stmt->execute();
    echo json_encode(['success'=>true]);
} elseif ($action == 'checkin') {
    $conn->query("UPDATE inventory SET available = available + 1 WHERE id=" . $d['id']);
    $conn->query("UPDATE transactions SET status = 'returned' WHERE item_id = " . $d['id'] . " AND status = 'out' LIMIT 1");
    echo json_encode(['success'=>true]);
} elseif ($action == 'delete') {
    $conn->query("DELETE FROM inventory WHERE id=" . $d['id']);
    echo json_encode(['success'=>true]);
}
?>