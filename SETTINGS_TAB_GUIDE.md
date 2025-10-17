# Settings Tab - Quick Visual Guide

## What You'll See

### Tab Navigation
At the top of the form builder, you now have three tabs:
- **🎨 Design** - Create form sections and questions
- **⚙️ Settings** - Configure form and team settings (NEW!)
- **👁️ Preview** - Preview your form (placeholder)

---

## Settings Tab Layout

### Section 1: Form Configuration
**Beautiful purple gradient header with gear icon**

#### Fields:
1. **Course ID**
   - Example: "CS 485 - Software Engineering"
   - Single line text input

2. **Course Description**
   - Multiline textarea
   - Describe your course

3. **Due Date & Time**
   - Side-by-side date and time pickers
   - Set evaluation deadline

4. **Accessibility** (Dropdown)
   - 📢 Public - All students in institution
   - 🏢 In Department - Department students only

5. **✅ Require Passcode** (Checkbox with description)
   - When checked: Yellow passcode input field appears
   - Students need this code to access evaluation

6. **✅ Anonymous Evaluations** (Checked by default)
   - Protects student identity
   - Professional checkbox design

7. **✅ Allow Draft Saving** (Checked by default)
   - Students can save and return later

---

### Section 2: Team Configuration
**Beautiful purple gradient header with users icon**

#### Fields:
1. **Team Size** (Side-by-side dropdowns)
   - Minimum: 2-5 members
   - Maximum: 5-10 members
   - Auto-validates (min ≤ max)

2. **Instructions for Students**
   - Large textarea
   - Default: "Form your team and evaluate each teammate based on the criteria below."
   - Shown to students at evaluation start

3. **✅ Allow Self-Evaluation**
   - Students can evaluate themselves
   - Optional feature

4. **ℹ️ Information Box** (Blue)
   - Explains question repetition
   - Individual response recording

---

## Visual Features

### Color Scheme
- **Headers**: Purple gradient (#667eea → #764ba2)
- **Passcode Field**: Yellow highlight (#FEF3C7)
- **Info Box**: Blue theme (#EFF6FF)
- **Checkboxes**: Clean white with hover effects

### Interactive Elements
- **Hover Effects**: Checkboxes highlight on hover
- **Smooth Transitions**: All changes animate
- **Auto-Save**: Everything saves automatically
- **Validation**: Alerts for invalid team sizes

### Layout
- **Centered**: Max width 1000px
- **Card Design**: Elevated cards with shadows
- **Spacing**: Consistent 1.5rem gaps
- **Responsive**: Adapts to screen size

---

## How to Use

1. **Click "Settings" tab** at the top
2. **Fill in course info** (ID and description)
3. **Set deadline** using date/time pickers
4. **Choose accessibility** level from dropdown
5. **Optional**: Check "Require Passcode" and enter code
6. **Review privacy** settings (anonymous, draft saving)
7. **Set team sizes** (min and max)
8. **Customize instructions** for students
9. **Optional**: Allow self-evaluation
10. **Done!** All changes auto-save

---

## What Gets Saved

Every change you make is automatically saved to:
- Browser localStorage (draft)
- Included when you click "Publish Form"

Settings data structure:
```
✓ Course ID
✓ Course Description
✓ Due Date & Time
✓ Accessibility Level
✓ Passcode (if enabled)
✓ Anonymous Evaluations
✓ Draft Saving
✓ Team Sizes (min/max)
✓ Student Instructions
✓ Self-Evaluation Option
```

---

## Pro Tips

💡 **Passcode Protection**: Great for controlled access
💡 **Anonymous**: Recommended for honest feedback
💡 **Draft Saving**: Helpful for long evaluations
💡 **Team Sizes**: Consider your class structure
💡 **Instructions**: Be clear and specific
💡 **Self-Evaluation**: Optional for reflection

---

## Mobile/Responsive

On smaller screens:
- Cards stack vertically
- Team size inputs stack
- Headers center-align
- Everything remains accessible

---

Enjoy your new Settings tab! 🎉
