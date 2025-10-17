# Minor UX Improvements - Passcode & Time Format

## Summary
Two minor improvements to enhance user experience and data consistency in the form builder settings and preview.

---

## 1. Passcode Input - Numerical & 6 Digits Only

### Issue
The passcode input accepted any characters and had no length restrictions, making it inconsistent and potentially confusing for students.

### Solution

#### A. HTML Changes
**File**: `templates/EvalMateApp/form-builder.html` (line 323-325)

**Before:**
```html
<label for="passcode">Passcode</label>
<input type="text" id="passcode" placeholder="Enter passcode">
<small>Students will need this passcode to access the evaluation</small>
```

**After:**
```html
<label for="passcode">Passcode (6 digits)</label>
<input type="text" id="passcode" placeholder="Enter 6-digit passcode" maxlength="6" pattern="[0-9]{6}" inputmode="numeric">
<small>Students will need this 6-digit numerical passcode to access the evaluation</small>
```

**HTML Attributes Added:**
- `maxlength="6"` - Prevents entering more than 6 characters
- `pattern="[0-9]{6}"` - HTML5 validation for exactly 6 digits
- `inputmode="numeric"` - Shows numeric keyboard on mobile devices

#### B. JavaScript Validation
**File**: `static/EvalMateApp/js/form-builder.js` (lines 767-787)

**Before:**
```javascript
passcodeInput.addEventListener('input', (e) => {
    this.formData.settings.passcode = e.target.value;
    this.saveDraft();
});
```

**After:**
```javascript
// Only allow numeric input and limit to 6 digits
passcodeInput.addEventListener('input', (e) => {
    // Remove any non-numeric characters
    let value = e.target.value.replace(/[^0-9]/g, '');
    // Limit to 6 digits
    if (value.length > 6) {
        value = value.slice(0, 6);
    }
    e.target.value = value;
    this.formData.settings.passcode = value;
    this.saveDraft();
});

// Validate on blur
passcodeInput.addEventListener('blur', (e) => {
    const value = e.target.value;
    if (value && value.length !== 6) {
        alert('Passcode must be exactly 6 digits');
        e.target.focus();
    }
});
```

**Validation Features:**
1. **Real-time Filtering**: Non-numeric characters are removed as user types
2. **Length Enforcement**: Automatically caps at 6 digits
3. **Blur Validation**: Alerts user if they leave field with incomplete passcode
4. **Auto-focus**: Returns focus to field if validation fails

### User Experience Improvements

#### Input Behavior
- ✅ Only numbers can be typed
- ✅ Automatically limited to 6 digits
- ✅ Numeric keyboard on mobile devices
- ✅ Clear placeholder showing format
- ✅ Label indicates 6-digit requirement

#### Validation Flow
1. User clicks passcode input
2. Types numbers (letters/symbols ignored)
3. After 6 digits, no more input accepted
4. If they try to leave with < 6 digits, get alert
5. Focus returns to input for correction

#### Error Prevention
- ❌ Can't enter letters: "ABC123" → "123"
- ❌ Can't enter symbols: "12-34*56" → "123456"
- ❌ Can't enter spaces: "12 34 56" → "123456"
- ❌ Can't enter 7+ digits: "1234567" → "123456"
- ❌ Can't leave incomplete: "12345" → Alert + refocus

### Examples

**Valid Passcodes:**
- ✅ `123456`
- ✅ `000000`
- ✅ `999999`
- ✅ `654321`

**Invalid Attempts (Auto-Corrected):**
- ❌ `ABC123` → Becomes `123`
- ❌ `12-34-56` → Becomes `123456`
- ❌ `EVAL25` → Becomes `25`
- ❌ `Pass123` → Becomes `123`

---

## 2. Preview Time Format - 12-Hour with AM/PM

### Issue
The preview displayed due time in 24-hour military format (e.g., "14:30") which is less familiar to most users, especially students.

### Solution

#### JavaScript Time Conversion
**File**: `static/EvalMateApp/js/form-builder.js` (lines 949-955)

**Before:**
```javascript
if (dueTime) {
    dueDateText += ` at ${dueTime}`;
}
```

**After:**
```javascript
if (dueTime) {
    // Convert military time to 12-hour format with AM/PM
    const [hours, minutes] = dueTime.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for midnight
    dueDateText += ` at ${hour12}:${minutes} ${ampm}`;
}
```

### Conversion Logic

#### Algorithm Breakdown
```javascript
// 1. Split time string into hours and minutes
const [hours, minutes] = dueTime.split(':');
// "14:30" → hours = "14", minutes = "30"

// 2. Convert hours to integer
const hour = parseInt(hours);
// "14" → 14

// 3. Determine AM or PM
const ampm = hour >= 12 ? 'PM' : 'AM';
// 14 >= 12 → "PM"

// 4. Convert to 12-hour format
const hour12 = hour % 12 || 12;
// 14 % 12 = 2, but || 12 handles midnight (0 → 12)

// 5. Build final time string
dueDateText += ` at ${hour12}:${minutes} ${ampm}`;
// "at 2:30 PM"
```

### Conversion Examples

#### Morning Times (AM)
| Military | 12-Hour | Calculation |
|----------|---------|-------------|
| `00:00` | `12:00 AM` | 0 % 12 = 0 → 12 |
| `00:30` | `12:30 AM` | Midnight hour |
| `01:00` | `1:00 AM` | 1 % 12 = 1 |
| `06:15` | `6:15 AM` | 6 % 12 = 6 |
| `11:45` | `11:45 AM` | 11 % 12 = 11 |

#### Afternoon/Evening (PM)
| Military | 12-Hour | Calculation |
|----------|---------|-------------|
| `12:00` | `12:00 PM` | 12 % 12 = 0 → 12 |
| `12:30` | `12:30 PM` | Noon hour |
| `13:00` | `1:00 PM` | 13 % 12 = 1 |
| `14:30` | `2:30 PM` | 14 % 12 = 2 |
| `18:45` | `6:45 PM` | 18 % 12 = 6 |
| `23:59` | `11:59 PM` | 23 % 12 = 11 |

### Edge Cases Handled

#### Midnight (00:00)
```javascript
hour = 0
hour % 12 = 0
0 || 12 = 12  // The || operator returns 12 if left side is 0
Result: "12:00 AM" ✅
```

#### Noon (12:00)
```javascript
hour = 12
hour % 12 = 0
0 || 12 = 12
hour >= 12 → "PM"
Result: "12:00 PM" ✅
```

### Display Examples

**Full Preview Display:**

**Before:**
```
Due: Dec 20, 2024 at 14:30
```

**After:**
```
Due: Dec 20, 2024 at 2:30 PM
```

**Multiple Examples:**
- `09:00` → "Dec 20, 2024 at 9:00 AM"
- `12:00` → "Dec 20, 2024 at 12:00 PM"
- `15:45` → "Dec 20, 2024 at 3:45 PM"
- `23:59` → "Dec 20, 2024 at 11:59 PM"

---

## Testing Checklist

### Passcode Input
- [ ] Type only numbers - works correctly
- [ ] Try typing letters - ignored
- [ ] Try typing symbols - ignored
- [ ] Enter 7+ digits - stops at 6
- [ ] Enter 5 digits and click away - shows alert
- [ ] Enter 6 digits - no alert, saves successfully
- [ ] Mobile device shows numeric keyboard
- [ ] Paste non-numeric text - filters to numbers only

### Time Format in Preview
- [ ] Set due time to 00:00 - shows "12:00 AM"
- [ ] Set due time to 01:00 - shows "1:00 AM"
- [ ] Set due time to 11:59 - shows "11:59 AM"
- [ ] Set due time to 12:00 - shows "12:00 PM"
- [ ] Set due time to 13:00 - shows "1:00 PM"
- [ ] Set due time to 14:30 - shows "2:30 PM"
- [ ] Set due time to 23:59 - shows "11:59 PM"
- [ ] No due time set - doesn't show time at all

---

## Browser Compatibility

### Passcode Features
- `maxlength` attribute: ✅ All browsers
- `pattern` attribute: ✅ Chrome 4+, Firefox 4+, Safari 5+, Edge 12+
- `inputmode` attribute: ✅ Chrome 66+, iOS Safari 12.2+, Android 7+
- `replace()` with regex: ✅ All modern browsers
- `addEventListener`: ✅ All modern browsers

### Time Conversion
- `split()` method: ✅ All browsers
- `parseInt()`: ✅ All browsers
- Template literals: ✅ Chrome 41+, Firefox 34+, Safari 9+, Edge 12+
- Ternary operator: ✅ All browsers
- Modulo operator: ✅ All browsers

---

## Code Quality

### Validation Approach
- ✅ Client-side validation (immediate feedback)
- ✅ HTML5 attributes (progressive enhancement)
- ✅ JavaScript enforcement (guaranteed correctness)
- ⚠️ Note: Server-side validation should also be added

### Time Conversion
- ✅ Pure JavaScript (no libraries needed)
- ✅ Handles all edge cases
- ✅ Efficient calculation (no lookup tables)
- ✅ Readable and maintainable

---

## User Impact

### Passcode Benefits
1. **Consistency**: All passcodes are 6-digit numbers
2. **Easier to Share**: Faculty can verbally share "one-two-three-four-five-six"
3. **Easier to Remember**: Numeric-only is simpler
4. **Reduced Errors**: Can't typo with letters
5. **Mobile-Friendly**: Numeric keyboard is faster

### Time Format Benefits
1. **Familiarity**: Most users know 12-hour format
2. **Clarity**: AM/PM removes ambiguity
3. **Consistency**: Matches common U.S. expectations
4. **Readability**: "2:30 PM" is clearer than "14:30"

---

## Future Enhancements

### Passcode
1. **Auto-Generate Button**: Create random 6-digit passcode
2. **Copy to Clipboard**: One-click copy functionality
3. **QR Code**: Generate QR code with passcode
4. **Multiple Passcodes**: Support different codes for different sections
5. **Expiring Passcodes**: Time-limited access codes

### Time Format
1. **Timezone Display**: Show timezone (e.g., "2:30 PM EST")
2. **Relative Time**: Show "Due in 2 days" alongside date
3. **User Preference**: Allow switching between 12/24 hour
4. **Countdown Timer**: Live countdown in preview
5. **Calendar Integration**: Add to calendar button

---

## Files Modified

1. **templates/EvalMateApp/form-builder.html**
   - Line 323: Updated passcode label to indicate 6 digits
   - Line 324: Added maxlength, pattern, inputmode attributes
   - Line 325: Updated help text to mention 6-digit requirement

2. **static/EvalMateApp/js/form-builder.js**
   - Lines 767-787: Enhanced passcode validation with numeric filtering and length enforcement
   - Lines 949-955: Added time format conversion from 24-hour to 12-hour with AM/PM

---

## Conclusion

Both improvements enhance data quality and user experience:

1. **Passcode Restriction**: Ensures consistent, memorable, and easy-to-communicate access codes
2. **Time Format**: Provides familiar, unambiguous time display in preview

These changes maintain backward compatibility (existing passcodes still work) while improving the experience for new forms.

**Status**: ✅ **COMPLETE** - Both improvements implemented and ready for testing.
