<?php
require 'db.php';
header('Content-Type: application/json');
$data = [];
$data['students'] = $conn->query("SELECT COUNT(*) as c FROM students")->fetch_assoc()['c'];
$data['items'] = $conn->query("SELECT SUM(quantity) as c FROM inventory")->fetch_assoc()['c'] ?? 0;
$data['out'] = $conn->query("SELECT SUM(quantity - available) as c FROM inventory")->fetch_assoc()['c'] ?? 0;
echo json_encode($data);
?>