// === INSTITUTIONS AND DEPARTMENTS DATA ===

const institutionsData = {
    "University of San Carlos (USC)": [
        "School of Architecture, Fine Arts & Design",
        "School of Arts & Sciences",
        "School of Business & Economics",
        "School of Education",
        "School of Engineering",
        "School of Health Care Professions",
        "School of Law & Governance"
    ],
    "University of San Jose–Recoletos (USJ-R)": [
        "School of Arts & Sciences",
        "School of Business & Management",
        "School of Education",
        "School of Engineering",
        "School of Computer Studies",
        "School of Allied Medical Sciences",
        "School of Law"
    ],
    "Cebu Normal University (CNU)": [
        "College of Nursing and Allied Health Sciences",
        "College of Teacher Education",
        "College of Culture, Arts, and Sports",
        "College of Computing, Artificial Intelligence, and Science",
        "College of Public Governance, Safety, and Sustainability",
        "College of Tourism, Hospitality, and Hotel Management"
    ],
    "Cebu Institute of Technology – University (CIT-U)": [
        "College of Engineering and Architecture",
        "College of Management, Business, and Accountancy",
        "College of Arts, Sciences, and Education",
        "College of Nursing and Allied Health Sciences",
        "College of Computer Studies",
        "College of Criminal Justice"
    ],
    "Southwestern University PHINMA (SWU PHINMA)": [
        "School of Medicine",
        "College of Dentistry",
        "College of Pharmacy",
        "College of Nursing",
        "College of Physical Therapy",
        "College of Veterinary Medicine",
        "School of Design + Communication",
        "College of Business and Accountancy",
        "College of Education",
        "College of Computer Studies",
        "College of Engineering",
        "College of Criminology",
        "College of Maritime Education"
    ],
    "University of the Visayas (UV)": [
        "College of Allied Health Sciences",
        "College of Business Administration",
        "College of Arts & Sciences",
        "College of Engineering, Technology, & Architecture",
        "College of Maritime Education",
        "College of Criminal Justice Education",
        "College of Education",
        "College of Law",
        "Graduate School"
    ],
    "Cebu Technological University — Main Campus (CTU Main)": [
        "College of Engineering & Technology",
        "College of Business, Management, & Administration",
        "College of Arts, Sciences, & Education",
        "College of Computer Studies / Information Technology",
        "College of Architecture",
        "College of Agriculture & Technical Vocations",
        "College of Nursing & Allied Health Sciences",
        "Other Technical or Vocational Departments"
    ],
    "University of the Philippines Cebu (UP Cebu)": [
        "College of Science — Department of Biology & Environmental Science",
        "College of Science — Department of Computer Science",
        "College of Science — Department of Mathematics & Statistics",
        "College of Communication, Arts, & Design",
        "College of Social Sciences",
        "School of Management"
    ]
};

// Function to populate institution dropdown
function populateInstitutions() {
    const institutionSelect = document.getElementById('institution');
    if (!institutionSelect) {
        console.error('Institution select element not found');
        return;
    }

    institutionSelect.innerHTML = '<option value="">Select your institution</option>';

    Object.keys(institutionsData).forEach(institution => {
        const option = document.createElement('option');
        option.value = institution;
        option.textContent = institution;
        institutionSelect.appendChild(option);
    });
    
    console.log('Institutions populated');
}

// Function to populate department dropdown based on selected institution
function populateDepartments(selectedInstitution) {
    const departmentSelect = document.getElementById('department');
    if (!departmentSelect) return;

    departmentSelect.innerHTML = '<option value="">Select your department</option>';
    departmentSelect.disabled = !selectedInstitution;

    if (selectedInstitution && institutionsData[selectedInstitution]) {
        institutionsData[selectedInstitution].forEach(department => {
            const option = document.createElement('option');
            option.value = department;
            option.textContent = department;
            departmentSelect.appendChild(option);
        });
    }
}

// Initialize institution and department dropdowns
function initInstitutionDepartment() {
    const institutionSelect = document.getElementById('institution');
    const departmentSelect = document.getElementById('department');

    if (!institutionSelect || !departmentSelect) {
        console.error('Institution or Department select not found');
        return;
    }

    // Populate institutions on load
    populateInstitutions();

    // Disable department initially
    departmentSelect.disabled = true;

    // Listen for institution changes
    institutionSelect.addEventListener('change', function() {
        const selectedInstitution = this.value;
        populateDepartments(selectedInstitution);
        
        // Clear department validation when institution changes
        if (typeof clearFieldError === 'function') {
            clearFieldError('department');
        }
        departmentSelect.classList.remove('success');
    });
    
    console.log('Institution/Department initialization complete');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInstitutionDepartment);
} else {
    initInstitutionDepartment();
}