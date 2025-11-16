# Real-Time Object Tracker - Assignment 5 Task 2

This project implements three different real-time object tracking methods:
1. **Marker-Based Tracking**: Uses ArUco markers or QR codes
2. **Marker-Less Tracking**: Template matching without markers
3. **SAM2 Segmentation-Based Tracking**: Uses pre-computed SAM2 segmentation masks

## Features

- Real-time video processing using webcam
- Three tracking modes with easy switching
- Modern, responsive UI
- Uses OpenCV.js for computer vision operations

## Setup

### Option 1: Simple HTTP Server (Recommended)

Since this uses OpenCV.js from a CDN, you can run it with any simple HTTP server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have http-server installed)
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

### Option 2: Direct File Opening

You can also open `index.html` directly in a modern browser, though some features may be limited due to CORS restrictions.

## Usage

### Marker-Based Tracking

1. Select "Marker-Based (ArUco/QR)" from the dropdown
2. Click "Start Camera"
3. Show an ArUco marker or QR code to the camera
4. The tracker will detect and highlight the marker

**To generate ArUco markers:**
- Use OpenCV's `cv2.aruco.drawMarker()` function
- Or use online ArUco marker generators
- Recommended dictionary: DICT_6X6_250

### Marker-Less Tracking

1. Select "Marker-Less" from the dropdown
2. Click "Start Camera"
3. Click "Select Region" button
4. Click and drag on the video to select the object you want to track
5. The tracker will follow the selected object

### SAM2 Segmentation-Based Tracking

1. Select "SAM2 Segmentation" from the dropdown
2. Prepare your SAM2 segmentation NPZ file (see notes below)
3. Click "Load Segmentation" and select your NPZ file
4. Click "Start Camera"
5. The tracker will use the segmentation masks to track objects

**Note on SAM2 NPZ files:**
- The NPZ file should contain segmentation masks
- Format: Typically contains arrays with mask data
- For full functionality, you may need to use a library like `numpy-loader` or implement NPZ parsing
- The current implementation provides a framework; full NPZ parsing can be added

## File Structure

```
.
├── index.html          # Main HTML file
├── styles.css          # Styling
├── app.js             # Main application logic
├── tracker.js         # Tracker implementations
├── task1_solution.md  # Task 1 derivations
└── README.md          # This file
```

## Technical Details

### Marker-Based Tracking
- Uses OpenCV's ArUco detector (DICT_6X6_250)
- Falls back to QR code detection if ArUco markers not found
- Draws bounding boxes and center points

### Marker-Less Tracking
- Uses template matching (TM_CCOEFF_NORMED)
- User selects region interactively
- Tracks using normalized cross-correlation

### SAM2 Segmentation Tracking
- Framework for loading NPZ segmentation files
- Can be extended with proper NPZ parsing
- Uses mask data for object tracking

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: May have limited camera access
- Requires modern browser with WebRTC support

## Dependencies

- OpenCV.js 4.8.0 (loaded from CDN)
- No additional npm packages required for basic functionality

## Notes

- Camera permissions are required
- Works best in well-lit environments
- For SAM2, ensure NPZ files are properly formatted
- Marker-less tracking works best with high-contrast objects

## Future Enhancements

- Full NPZ file parsing for SAM2
- Multiple object tracking
- Performance optimizations
- Export tracking data
- Video recording with tracking overlay

