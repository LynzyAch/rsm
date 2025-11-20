// ==========================================
// 1. SETUP AND VARIABLES
// ==========================================

// Select the Modal (Pop-up window) from the HTML
const mainModal = new bootstrap.Modal(document.getElementById('mainModal'));

// Variables to keep track of what we are doing
let currentId = null;       // ID of the student/item we are editing
let currentAction = '';     // What are we doing? (e.g., 'add_student', 'checkout')

// Lists to store our data locally
let allStudents = [];
let allInventory = [];


// ==========================================
// 2. NAVIGATION (Switching Views)
// ==========================================
function show(viewId) {
    // Hide all views first
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    
    // Show the specific view we clicked
    document.getElementById(viewId).classList.remove('hidden');
    
    // Update the sidebar highlighting
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    
    // Find the clicked link and make it active
    const activeLink = Array.from(document.querySelectorAll('.menu-item'))
                            .find(el => el.getAttribute('onclick').includes(viewId));
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // If we went to the dashboard, refresh the statistics
    if (viewId === 'dashboard') {
        loadStats();
    }
}


// ==========================================
// 3. API HELPER (Talking to PHP)
// ==========================================
async function api(url, data = null) {
    // If we have data, it's a POST request. If not, it's a GET request.
    let options = {};
    
    if (data) {
        options = {
            method: 'POST',
            body: JSON.stringify(data)
        };
    } else {
        options = { method: 'GET' };
    }

    // Send the request and wait for the answer
    const response = await fetch(url, options);
    return await response.json();
}


// ==========================================
// 4. LOADING DATA (Fetching from Database)
// ==========================================

// Load Dashboard Numbers
async function loadStats() {
    const data = await api('api/dashboard.php');
    document.getElementById('d-students').innerText = data.students;
    document.getElementById('d-items').innerText = data.items;
    document.getElementById('d-out').innerText = data.out;
}

// Load Students List
async function loadStudents() {
    allStudents = await api('api/students.php');
    renderStudents(allStudents);
}

// Load Inventory List
async function loadInventory() {
    allInventory = await api('api/inventory.php');
    renderInventory(allInventory);
}


// ==========================================
// 5. RENDERING (Drawing Tables)
// ==========================================

function renderStudents(data) {
    // --- A. Draw the Master List (All Students) ---
    const masterTable = document.getElementById('t-master');
    
    if (data.length === 0) {
        masterTable.innerHTML = '<tr><td colspan="6" class="text-center">No Data Found</td></tr>';
    } else {
        // Loop through each student and create a row
        masterTable.innerHTML = data.map(student => `
            <tr>
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.course}</td>
                <td>${student.email}</td>
                <td>${student.contact}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick='editStudent(${JSON.stringify(student)})'>Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${student.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    // --- B. Draw the BSIT Table (Filter only IT students) ---
    const itStudents = data.filter(student => student.course === 'BS Information Technology');
    document.getElementById('t-it').innerHTML = itStudents.map(s => 
        `<tr><td>${s.name}</td><td>${s.email}</td><td>${s.contact}</td></tr>`
    ).join('') || '<tr><td colspan="3" class="text-center">No Data</td></tr>';

    // --- C. Draw the BSIS Table (Filter only IS students) ---
    const isStudents = data.filter(student => student.course === 'BS Information System');
    document.getElementById('t-is').innerHTML = isStudents.map(s => 
        `<tr><td>${s.name}</td><td>${s.email}</td><td>${s.contact}</td></tr>`
    ).join('') || '<tr><td colspan="3" class="text-center">No Data</td></tr>';
}

function renderInventory(data) {
    const inventoryTable = document.getElementById('t-inventory');

    if (data.length === 0) {
        inventoryTable.innerHTML = '<tr><td colspan="6" class="text-center">No Items Found</td></tr>';
        return;
    }

    inventoryTable.innerHTML = data.map(item => {
        // Logic for buttons: 
        // If items are available, show "Out" button.
        // If available < total, show "In" button (Return).
        
        let actionButtons = '';
        
        if (item.available > 0) {
            actionButtons += `<button class="btn btn-sm btn-success me-1" onclick="checkout(${item.id})">Out</button>`;
        } else {
            actionButtons += `<span class="badge bg-secondary me-1">Stock Out</span>`;
        }

        if (item.available < item.quantity) {
            actionButtons += `<button class="btn btn-sm btn-info" onclick="checkin(${item.id})">In</button>`;
        }

        return `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.available}</td>
                <td>${item.holders || '-'}</td>
                <td>
                    ${actionButtons}
                    <button class="btn btn-sm btn-danger ms-2" onclick="deleteItem(${item.id})">Del</button>
                </td>
            </tr>
        `;
    }).join('');
}


// ==========================================
// 6. SEARCH FUNCTIONALITY
// ==========================================
document.getElementById('search-student').onkeyup = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allStudents.filter(s => s.name.toLowerCase().includes(term));
    renderStudents(filtered);
};

document.getElementById('search-inventory').onkeyup = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allInventory.filter(i => i.name.toLowerCase().includes(term));
    renderInventory(filtered);
};


// ==========================================
// 7. MODALS (Opening Forms)
// ==========================================

function openStudentModal() {
    currentAction = 'add_student';
    document.getElementById('mTitle').innerText = "Add Student";
    
    // Set the form HTML
    document.getElementById('mBody').innerHTML = `
        <div class="mb-2">
            <label>Name (Required)</label>
            <input id="sName" class="form-control">
        </div>
        <div class="mb-2">
            <label>Course (Required)</label>
            <select id="sCourse" class="form-select">
                <option value="" disabled selected>Select Course...</option>
                <option>BS Information Technology</option>
                <option>BS Information System</option>
            </select>
        </div>
        <div class="mb-2"><label>Email (Required)</label><input id="sEmail" class="form-control"></div>
        <div class="mb-2"><label>Contact (Required)</label><input id="sContact" class="form-control"></div>
    `;
    mainModal.show();
}

function editStudent(student) {
    currentAction = 'update_student';
    currentId = student.id;
    document.getElementById('mTitle').innerText = "Edit Student";

    // Logic to auto-select the correct course
    let itSelected = student.course.includes('Technology') ? 'selected' : '';
    let isSelected = student.course.includes('System') ? 'selected' : '';

    document.getElementById('mBody').innerHTML = `
        <div class="mb-2"><label>Name</label><input id="sName" class="form-control" value="${student.name}"></div>
        <div class="mb-2">
            <label>Course</label>
            <select id="sCourse" class="form-select">
                <option ${itSelected}>BS Information Technology</option>
                <option ${isSelected}>BS Information System</option>
            </select>
        </div>
        <div class="mb-2"><label>Email</label><input id="sEmail" class="form-control" value="${student.email}"></div>
        <div class="mb-2"><label>Contact</label><input id="sContact" class="form-control" value="${student.contact}"></div>
    `;
    mainModal.show();
}

function openItemModal() {
    currentAction = 'add_item';
    document.getElementById('mTitle').innerText = "Add Item";
    document.getElementById('mBody').innerHTML = `
        <div class="mb-2"><label>Item Name</label><input id="iName" class="form-control"></div>
        <div class="mb-2"><label>Quantity</label><input id="iQty" type="number" class="form-control"></div>
    `;
    mainModal.show();
}

async function checkout(itemId) {
    // Check if we have students first
    let students = await api('api/students.php');
    if (students.length === 0) {
        alert('No Students available to borrow items!');
        return;
    }

    currentAction = 'checkout';
    currentId = itemId;

    // Create the dropdown list of students
    let options = students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    document.getElementById('mTitle').innerText = "Checkout Item";
    document.getElementById('mBody').innerHTML = `
        <label>Select Student</label>
        <select id="selStudent" class="form-control">${options}</select>
    `;
    mainModal.show();
}


// ==========================================
// 8. SUBMITTING FORMS (Saving Data)
// ==========================================
async function submitForm() {
    let data = {};

    // A. IF WE ARE SAVING A STUDENT
    if (currentAction === 'add_student' || currentAction === 'update_student') {
        data = {
            action: (currentAction === 'add_student') ? 'add' : 'update',
            id: currentId,
            name: document.getElementById('sName').value,
            course: document.getElementById('sCourse').value,
            email: document.getElementById('sEmail').value,
            contact: document.getElementById('sContact').value
        };

        // Validation check
        if (!data.name || !data.course || !data.email) {
            alert('Please fill in all required fields');
            return;
        }

        await api('api/students.php', data);
        loadStudents(); // Refresh list
    } 
    
    // B. IF WE ARE SAVING AN ITEM
    else if (currentAction === 'add_item') {
        data = {
            action: 'add',
            name: document.getElementById('iName').value,
            qty: document.getElementById('iQty').value
        };

        if (!data.name || !data.qty) {
            alert('Please fill in all required fields');
            return;
        }

        await api('api/inventory.php', data);
        loadInventory(); // Refresh list
    } 
    
    // C. IF WE ARE CHECKING OUT
    else if (currentAction === 'checkout') {
        await api('api/inventory.php', {
            action: 'checkout',
            id: currentId,
            sid: document.getElementById('selStudent').value
        });
        loadInventory(); // Refresh list
    }

    // Close Modal and Update Dashboard Stats
    mainModal.hide();
    loadStats();
}


// ==========================================
// 9. DELETING AND RETURNING
// ==========================================
async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        await api('api/students.php', { action: 'delete', id: id });
        loadStudents();
        loadStats();
    }
}

async function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        await api('api/inventory.php', { action: 'delete', id: id });
        loadInventory();
        loadStats();
    }
}

async function checkin(id) {
    await api('api/inventory.php', { action: 'checkin', id: id });
    loadInventory();
    loadStats();
}

// ==========================================
// 10. START THE APP
// ==========================================
loadStats();
loadStudents();
loadInventory();