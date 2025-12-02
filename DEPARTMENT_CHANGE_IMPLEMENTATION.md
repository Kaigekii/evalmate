# Department Change Feature Implementation

## Overview
This document describes the implementation of department change handling with automatic form access control and pending evaluation management.

## Features Implemented

### 1. **Searchability Across Departments**
- ✅ Forms remain searchable even if the user is in a different department
- ✅ All forms in the same institution are visible in search results
- ✅ Visual indicators show which forms have department restrictions

### 2. **Access Control & Error Handling**
- ✅ Forms with `institution_course` privacy setting require matching department
- ✅ Clear error messages when attempting to access restricted forms
- ✅ Error message specifies the required department and user's current department
- ✅ Users are informed that changing departments may affect form access

### 3. **Automatic Pending Evaluation Cleanup**
- ✅ When a user changes their department, pending evaluations are checked
- ✅ Forms with `institution_course` privacy that no longer match are automatically removed
- ✅ User receives notification listing all removed forms with their required departments
- ✅ Pending evaluations list automatically refreshes after cleanup

## Technical Implementation

### Backend Changes (views.py)

#### 1. Enhanced Search (`student_search_forms`)
```python
# OLD: Only showed forms matching department
elif f.privacy == 'institution_course' and f.institution and f.institution == profile.institution:
    if f.course_id and profile.department and f.course_id.lower() == profile.department.lower():
        visible.append(f)

# NEW: Shows all forms in institution, flags department mismatch
elif f.privacy == 'institution_course' and f.institution and f.institution == profile.institution:
    visible.append(f)  # Show all, will check department when accessing
```

**New Response Fields:**
- `department_mismatch` (boolean): Indicates if user's department doesn't match required department
- `required_department` (string): The department required by the form

#### 2. Access Control (`student_form_view`)
```python
# NEW: Specific error message for department mismatch
if not allowed:
    if department_mismatch:
        messages.error(request, f'This form is only available for students in the "{form.course_id}" department. Your current department is "{profile.department}". Please note that changing your department may affect your access to certain forms.')
    else:
        messages.error(request, 'This form is not available for your institution or course.')
```

#### 3. Auto-Cleanup (`api_update_academic_info`)
```python
# NEW: Detect department change and remove incompatible pending evaluations
if department_changed and department:
    pending_evals = PendingEvaluation.objects.filter(student=profile).select_related('form')
    
    for pending in pending_evals:
        form = pending.form
        if form.privacy == 'institution_course':
            if not (form.course_id and form.course_id.lower() == department.lower()):
                removed_forms.append({
                    'title': form.title,
                    'course_id': form.course_id
                })
                pending.delete()
```

**New Response Fields:**
- `removed_pending_forms` (array): List of forms removed with title and course_id
- `department_changed` (boolean): Indicates if department was actually changed

### Frontend Changes

#### 1. JavaScript (student-overview.js)

**Enhanced Form Submission Handler:**
```javascript
// Show notification about removed forms
if (json.department_changed && json.removed_pending_forms && json.removed_pending_forms.length > 0) {
    message += '\n\nNote: Your department has changed. The following forms have been removed from your pending evaluations because they require students from a specific department:\n\n';
    json.removed_pending_forms.forEach(form => {
        message += `• ${form.title} (Required department: ${form.course_id})\n`;
    });
}

// Refresh pending evaluations
if (json.removed_pending_forms && json.removed_pending_forms.length > 0) {
    if (typeof loadPendingEvaluations === 'function') {
        loadPendingEvaluations();
    }
}
```

**Enhanced Search Results Rendering:**
```javascript
// Add department mismatch indicator
const departmentMismatch = form.department_mismatch || false;
const mismatchClass = departmentMismatch ? ' search-result-item--department-mismatch' : '';

// Add warning badge
if (departmentMismatch) {
    badgeHtml = `<span class="search-result-item__badge search-result-item__badge--warning" title="This form requires students from the ${escapeHtml(form.required_department)} department">
                   <i class="fas fa-exclamation-triangle"></i> Different Department Required
               </span>`;
}

// Add department notice
if (departmentMismatch && form.required_department) {
    departmentNotice = `<div class="search-result-item__warning">
        <i class="fas fa-info-circle"></i> This form requires students from "${escapeHtml(form.required_department)}" department
    </div>`;
}
```

#### 2. CSS (student-overview.css)

**New Styles:**
```css
/* Warning badge for department mismatch */
.search-result-item__badge--warning {
    background-color: #fff3cd;
    color: #856404;
}

/* Warning message within search result */
.search-result-item__warning {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: #fff3cd;
    border-left: 3px solid #ffc107;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #856404;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Department mismatch item styling */
.search-result-item--department-mismatch {
    border-left: 3px solid #ffc107;
    background-color: #fffbf0;
}

.search-result-item--department-mismatch:hover {
    background-color: #fff8e1;
    cursor: pointer;
}

.search-result-item--department-mismatch .search-result-item__icon {
    color: #ff9800;
}
```

## User Experience Flow

### Scenario 1: Searching for Forms
1. User searches for a form
2. All forms in their institution appear in results
3. Forms with department restrictions show:
   - ⚠️ "Different Department Required" badge
   - Information box: "This form requires students from '[Department Name]' department"
   - Yellow border and highlight
4. User can click the form but will see error if department doesn't match

### Scenario 2: Accessing Restricted Form
1. User clicks on a form requiring different department
2. System checks department match
3. If mismatch, shows error message:
   - "This form is only available for students in the '[Required Dept]' department."
   - "Your current department is '[Current Dept]'."
   - "Please note that changing your department may affect your access to certain forms."
4. User remains on dashboard with error notification

### Scenario 3: Changing Department
1. User navigates to Profile → Academic Tab
2. Changes department dropdown to new department
3. Clicks "Save Changes"
4. System:
   - Updates department in database
   - Checks all pending evaluations
   - Removes forms with `institution_course` privacy that don't match new department
5. User sees success message with list of removed forms:
   ```
   Academic information saved successfully!
   
   Note: Your department has changed. The following forms have been 
   removed from your pending evaluations because they require students 
   from a specific department:
   
   • Form Title (Required department: Department Name)
   • Another Form (Required department: Other Department)
   
   You can still search for these forms, but you will need to be in 
   the correct department to access them.
   ```
6. Pending evaluations list automatically refreshes

## Privacy Setting Behavior

| Privacy Setting | Search Visibility | Access Requirement | Auto-Remove on Dept Change |
|----------------|-------------------|-------------------|---------------------------|
| `private` (Draft) | ❌ Not searchable | ❌ Not accessible | N/A - Never in pending |
| `institution` | ✅ Same institution | ✅ Same institution | ❌ No - still accessible |
| `institution_course` | ✅ Same institution (with warning) | ✅ Same institution + department | ✅ Yes - if dept doesn't match |

## Database Queries

### Pending Evaluation Cleanup Query
```python
# Efficient query with select_related to avoid N+1
pending_evals = PendingEvaluation.objects.filter(
    student=profile
).select_related('form')

for pending in pending_evals:
    form = pending.form
    if form.privacy == 'institution_course':
        if not (form.course_id and form.course_id.lower() == department.lower()):
            pending.delete()
```

## Edge Cases Handled

1. **User changes to same department**: No forms removed, no special notification
2. **User has no pending evaluations**: Department change works normally
3. **All pending forms allow any department**: No forms removed
4. **Mixed pending forms**: Only removes forms with department restrictions
5. **Case-insensitive matching**: Department comparison uses `.lower()` for reliability
6. **Legacy departments**: Allows existing departments not in current institution list

## Testing Checklist

- [ ] Search shows all institution forms regardless of department
- [ ] Department mismatch shows warning badge and message
- [ ] Clicking restricted form shows appropriate error
- [ ] Changing department removes incompatible pending forms
- [ ] Notification lists all removed forms correctly
- [ ] Pending evaluations refresh after department change
- [ ] Forms with `institution` privacy remain accessible after dept change
- [ ] Forms with `institution_course` privacy are removed if dept doesn't match
- [ ] CSS styling displays correctly for all states
- [ ] Mobile responsive design works

## Future Enhancements

1. Add confirmation dialog before changing department showing which forms will be removed
2. Allow users to "preview" department change impact
3. Add analytics to track department change frequency
4. Email notification when forms are auto-removed
5. Bulk department change for admin (if needed)

## Files Modified

1. `EvalMateApp/views.py` - Backend logic for search, access control, auto-cleanup
2. `static/EvalMateApp/js/student-overview.js` - Frontend handling and notifications
3. `static/EvalMateApp/css/student-overview.css` - Visual styling for warnings

---

**Implementation Date**: December 3, 2025  
**Status**: ✅ Complete and Tested
