# Certificate Manager - Quick Setup & Testing

## Quick Start

### 1. Verify Database Setup ✓
Your tables are already set up with the correct schema:
- ✓ `events` table with `is_approved` field
- ✓ `event_registrations` table with `attendance_marked` field
- ✓ `profiles` table with `full_name` and `email` fields

### 2. Access Certificate Manager
1. Log in as **Admin**
2. Go to **Admin Dashboard**
3. Scroll to bottom → Find **🎖️ Certificate Manager** section

### 3. Quick Test

#### Test Scenario:
```
Step 1: Create/Use an Event
  - Event must have is_approved = true
  - At least 1 participant registered

Step 2: Mark Attendance
  - Use QR Scanner to mark participants as attended
  - Or manually update attendance_marked = true in database

Step 3: Upload Template
  - Create a simple certificate image (PNG/JPG)
  - Or use a sample certificate template
  - Upload in Certificate Manager

Step 4: Position Text
  - Click on certificate to place participant name
  - Adjust size, font, color as needed
  - Sample name shows preview

Step 5: Generate
  - Click "🚀 Generate Certificates"
  - Wait for processing

Step 6: Download
  - View certificates in Preview tab
  - Click "⬇️ Download All Certificates"
  - Files saved as PNG
```

## Sample Certificate Template

### Creating a Test Certificate

**Option A: Using Online Tool**
1. Go to: https://www.canva.com/certificates/
2. Design a simple certificate
3. Download as PNG (1200x800px minimum)
4. Upload to Certificate Manager

**Option B: Using PowerPoint**
1. Create blank presentation (landscape)
2. Add decorative borders/elements
3. Leave center area for name
4. Export as PNG (4:3 ratio)

**Option C: Simple Text-Only**
1. Create document with:
   - Title: "Certificate of Participation"
   - Some decorative lines
   - Blank space for name
2. Export/Screenshot as PNG

**Recommended Dimensions:**
- Width: 1024-1200px
- Height: 600-800px
- Format: PNG (transparent background optional)

## Feature Walkthrough

### Event Selection Dropdown
```
✓ Shows only approved events
✓ Displays event title
✓ Auto-fetches participants when selected
✓ Shows count of attended participants
```

### Template Upload
```
✓ Drag-and-drop support
✓ Click to browse files
✓ Shows preview
✓ Validates file type
```

### Certificate Editor
```
✓ Interactive canvas
✓ Click-to-position text
✓ Font size slider (12-100px)
✓ 20+ font families
✓ Color picker
✓ Alignment buttons (left/center/right)
✓ Advanced options:
  - Font weight
  - Letter spacing
  - Rotation
  - Opacity
  - Text shadow
✓ Real-time preview
```

### Generation
```
✓ Batch processes all participants
✓ Each gets personalized name
✓ Maintains position & styling
✓ Generates PNG for each
✓ Shows progress
```

### Preview & Download
```
✓ Gallery view of all certificates
✓ Thumbnail navigation
✓ Download individual or all
✓ Files named after participants
```

## Troubleshooting Checklist

- [ ] Event exists and is approved (is_approved = true)
- [ ] Event has at least 1 registration
- [ ] Registered participant has attendance_marked = true
- [ ] Participant profile has full_name filled
- [ ] Template image file is valid (PNG/JPG)
- [ ] Template image is at least 600x400px
- [ ] Browser has JavaScript enabled
- [ ] No console errors (F12 → Console tab)

## Browser Requirements

Supported Browsers:
- ✓ Chrome 90+
- ✓ Firefox 88+
- ✓ Safari 14+
- ✓ Edge 90+

Required APIs:
- Canvas API (for image processing)
- File API (for uploads)
- Blob API (for downloads)

All modern browsers support these APIs.

## Expected Behavior

### Timeline Example:

```
Event: Tech Conference 2024
Participants: 5 attended

1. Admin clicks dropdown → Sees "Tech Conference 2024 (5 attended)"
2. Admin uploads template.png (landscape certificate)
3. Editor shows template with sample text
4. Admin clicks to position name → Sees crosshair at click point
5. Admin adjusts font size to 48px
6. Admin clicks "Generate Certificates"
7. System creates 5 certificates:
   - Person1_Certificate.png
   - Person2_Certificate.png
   - Person3_Certificate.png
   - Person4_Certificate.png
   - Person5_Certificate.png
8. Preview tab shows all 5 thumbnails
9. Admin clicks "Download All"
10. Browser downloads: Person1_Certificate.png, Person2_Certificate.png, etc.
```

## Testing Commands

### Via Database (if you want to pre-populate test data)

```sql
-- Verify events
SELECT id, title, is_approved FROM events LIMIT 5;

-- Verify registrations with attendance
SELECT 
  er.id,
  ev.title as event_name,
  p.full_name as participant_name,
  er.attendance_marked
FROM event_registrations er
JOIN events ev ON er.event_id = ev.id
JOIN profiles p ON er.user_id = p.id
WHERE er.attendance_marked = true
LIMIT 10;

-- Mark all registrations as attended (for testing)
UPDATE event_registrations 
SET attendance_marked = true 
WHERE event_id = '[YOUR_EVENT_ID]';
```

## Common Issues & Solutions

### "No events available"
**Solution:** 
- Check if events exist: `SELECT * FROM events;`
- Ensure `is_approved = true`: `UPDATE events SET is_approved = true;`

### "No participants for event"
**Solution:**
- Check registrations exist: `SELECT * FROM event_registrations WHERE event_id = '...';`
- Mark as attended: `UPDATE event_registrations SET attendance_marked = true WHERE event_id = '...';`

### "Cannot upload template"
**Solution:**
- Use PNG or JPG only (not GIF, BMP, etc.)
- Ensure file size < 10MB
- Check browser console for specific error

### "Generated certificates are blank"
**Solution:**
- Template image must load properly
- Check image dimensions (should be at least 600x400)
- Verify canvas is rendering (check browser console)

### "Downloads not working"
**Solution:**
- Check browser download settings
- Ensure pop-ups aren't blocked
- Try a different browser
- Check if file was saved to Downloads folder

## Performance Expectations

| Action | Expected Time |
|--------|----------------|
| Event selection | <100ms |
| Template upload | <500ms |
| Editor render | <50ms |
| Certificate generation (5 certs) | 2-3 seconds |
| Certificate generation (50 certs) | 15-20 seconds |
| Download all | <1 second |
| File size per cert | 100-500KB |

## File Naming Convention

Generated files follow this pattern:
```
[ParticipantFullName]_Certificate.png

Examples:
- John_Doe_Certificate.png
- Sarah_Johnson_Certificate.png
- Rajesh_Kumar_Certificate.png
```

## Next Steps After Testing

1. ✓ Confirm feature works with your data
2. ✓ Design or create actual certificate template
3. ✓ Set up proper font styling for your brand
4. ✓ Train admins on how to use
5. ✓ (Optional) Enhance with custom branding

## Support Resources

- Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- File API: https://developer.mozilla.org/en-US/docs/Web/API/File
- Supabase Docs: https://supabase.com/docs

---

**You're all set! Start generating certificates now! 🎖️**
