// Tracker implementations for different modes

class ObjectTracker {
    constructor() {
        this.trackingMode = 'marker';
        this.isTracking = false;
        this.template = null;
        this.templateRect = null;
        this.sam2Data = null;
        this.arucoDetector = null;
        this.qrDetector = null;
        this.tracker = null;
        
        this.initDetectors();
    }
    
    initDetectors() {
        // Initialize ArUco detector - check if module is available
        try {
            if (typeof cv.aruco !== 'undefined' && typeof cv.aruco.getPredefinedDictionary === 'function') {
                const dictionary = cv.aruco.getPredefinedDictionary(cv.aruco.DICT_6X6_250);
                const parameters = new cv.aruco.DetectorParameters();
                this.arucoDetector = new cv.aruco.ArucoDetector(dictionary, parameters);
                console.log('ArUco detector initialized');
            } else if (typeof cv.getPredefinedDictionary === 'function') {
                // Try alternative API
                const dictionary = cv.getPredefinedDictionary(cv.DICT_6X6_250);
                const parameters = new cv.aruco_DetectorParameters();
                this.arucoDetector = new cv.aruco_ArucoDetector(dictionary, parameters);
                console.log('ArUco detector initialized (alternative API)');
            } else {
                // ArUco not available - will use contour-based fallback
                console.log('ArUco module not available - using contour-based marker detection');
            }
        } catch (e) {
            console.warn('ArUco detector initialization failed:', e);
            this.arucoDetector = null;
        }
        
        // Initialize QR Code detector - check if module is available
        try {
            if (typeof cv.QRCodeDetector !== 'undefined') {
                this.qrDetector = new cv.QRCodeDetector();
                console.log('QR Code detector initialized');
            } else if (typeof cv.wechat_qrcode !== 'undefined') {
                // Try wechat QR code detector as alternative
                this.qrDetector = new cv.wechat_qrcode.WeChatQRCode();
                console.log('WeChat QR Code detector initialized');
            } else {
                // QR Code not available - will use contour-based fallback
                console.log('QR Code detector not available - using contour-based marker detection');
            }
        } catch (e) {
            console.warn('QR Code detector initialization failed:', e);
            this.qrDetector = null;
        }
        
        // Initialize feature detector as fallback for marker-less detection
        // Note: Not critical since marker-less tracking uses template matching
        try {
            if (typeof cv.ORB !== 'undefined') {
                // Try different ORB API variations
                if (typeof cv.ORB === 'function') {
                    this.orbDetector = cv.ORB();
                } else if (typeof cv.ORB.create === 'function') {
                    this.orbDetector = cv.ORB.create();
                } else {
                    this.orbDetector = null;
                }
                
                if (this.orbDetector && typeof cv.BFMatcher !== 'undefined') {
                    this.bfMatcher = new cv.BFMatcher(cv.NORM_HAMMING, false);
                    console.log('Feature detector initialized for fallback');
                } else {
                    this.orbDetector = null;
                }
            } else {
                this.orbDetector = null;
            }
        } catch (e) {
            // Not critical - marker-less tracking uses template matching anyway
            this.orbDetector = null;
        }
    }
    
    setMode(mode) {
        this.trackingMode = mode;
        this.reset();
    }
    
    reset() {
        this.template = null;
        this.templateRect = null;
        this.sam2Data = null;
        this.tracker = null;
    }
    
    // Marker-based tracking (ArUco/QR with fallback)
    trackMarker(src, dst) {
        let found = false;
        
        // Try ArUco marker detection first
        if (this.arucoDetector) {
            try {
                const cornersVec = new cv.MatVector();
                const idsVec = new cv.MatVector();
                const rejectedVec = new cv.MatVector();
                
                this.arucoDetector.detectMarkers(src, cornersVec, idsVec, rejectedVec);
                
                if (idsVec.size() > 0) {
                    found = true;
                    const corners = cornersVec.get(0);
                    this.drawMarker(dst, corners);
                }
                
                cornersVec.delete();
                idsVec.delete();
                rejectedVec.delete();
            } catch (e) {
                console.warn('ArUco detection error:', e);
            }
        }
        
        // If ArUco not found, try QR code
        if (!found && this.qrDetector) {
            try {
                const points = new cv.Mat();
                const straightQrcode = new cv.Mat();
                
                const detected = this.qrDetector.detectAndDecode(src, points, straightQrcode);
                
                if (detected && points.rows > 0) {
                    found = true;
                    this.drawQRCode(dst, points);
                }
                
                points.delete();
                straightQrcode.delete();
            } catch (e) {
                console.warn('QR detection error:', e);
            }
        }
        
        // Fallback: Use contour-based marker detection
        if (!found) {
            found = this.trackMarkerContours(src, dst);
        }
        
        return found;
    }
    
    // Fallback marker detection using contours and shape recognition
    trackMarkerContours(src, dst) {
        try {
            // Convert to grayscale
            const gray = new cv.Mat();
            if (src.channels() === 3 || src.channels() === 4) {
                cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            } else {
                gray = src.clone();
            }
            
            // Apply threshold to find dark markers
            const thresh = new cv.Mat();
            cv.threshold(gray, thresh, 127, 255, cv.THRESH_BINARY_INV);
            
            // Find contours
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
            
            let found = false;
            const color = new cv.Scalar(0, 255, 0);
            
            // Look for square/rectangular markers
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                // Filter by area (markers should be reasonably sized)
                if (area > 500 && area < 50000) {
                    // Approximate contour to polygon
                    const epsilon = 0.02 * cv.arcLength(contour, true);
                    const approx = new cv.Mat();
                    cv.approxPolyDP(contour, approx, epsilon, true);
                    
                    // Check if it's roughly square (4 corners)
                    if (approx.rows >= 4 && approx.rows <= 6) {
                        // Get bounding rect
                        const rect = cv.boundingRect(approx);
                        
                        // Check aspect ratio (should be roughly square)
                        const aspectRatio = rect.width / rect.height;
                        if (aspectRatio > 0.7 && aspectRatio < 1.3) {
                            // Draw bounding box using two points (OpenCV.js API)
                            const pt1 = new cv.Point(rect.x, rect.y);
                            const pt2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
                            cv.rectangle(dst, pt1, pt2, color, 2);
                            
                            // Draw center
                            const center = new cv.Point(
                                rect.x + rect.width / 2,
                                rect.y + rect.height / 2
                            );
                            cv.circle(dst, center, 5, color, -1);
                            
                            found = true;
                        }
                    }
                    approx.delete();
                }
                contour.delete();
            }
            
            // Clean up
            gray.delete();
            thresh.delete();
            contours.delete();
            hierarchy.delete();
            
            return found;
        } catch (e) {
            console.error('Contour-based marker detection error:', e);
            return false;
        }
    }
    
    drawMarker(dst, corners) {
        if (!corners || corners.rows === 0) return;
        
        const color = new cv.Scalar(0, 255, 0);
        const thickness = 3;
        
        // Draw marker outline
        for (let i = 0; i < corners.rows; i++) {
            const pt1 = new cv.Point(corners.data32F[i * 8], corners.data32F[i * 8 + 1]);
            const pt2 = new cv.Point(corners.data32F[i * 8 + 2], corners.data32F[i * 8 + 3]);
            const pt3 = new cv.Point(corners.data32F[i * 8 + 4], corners.data32F[i * 8 + 5]);
            const pt4 = new cv.Point(corners.data32F[i * 8 + 6], corners.data32F[i * 8 + 7]);
            
            cv.line(dst, pt1, pt2, color, thickness);
            cv.line(dst, pt2, pt3, color, thickness);
            cv.line(dst, pt3, pt4, color, thickness);
            cv.line(dst, pt4, pt1, color, thickness);
        }
        
        // Draw center
        const centerX = (corners.data32F[0] + corners.data32F[2] + corners.data32F[4] + corners.data32F[6]) / 4;
        const centerY = (corners.data32F[1] + corners.data32F[3] + corners.data32F[5] + corners.data32F[7]) / 4;
        cv.circle(dst, new cv.Point(centerX, centerY), 5, color, -1);
    }
    
    drawQRCode(dst, points) {
        if (!points || points.rows === 0) return;
        
        const color = new cv.Scalar(255, 0, 0);
        const thickness = 3;
        
        // Draw QR code outline
        const pt1 = new cv.Point(points.data32F[0], points.data32F[1]);
        const pt2 = new cv.Point(points.data32F[2], points.data32F[3]);
        const pt3 = new cv.Point(points.data32F[4], points.data32F[5]);
        const pt4 = new cv.Point(points.data32F[6], points.data32F[7]);
        
        cv.line(dst, pt1, pt2, color, thickness);
        cv.line(dst, pt2, pt3, color, thickness);
        cv.line(dst, pt3, pt4, color, thickness);
        cv.line(dst, pt4, pt1, color, thickness);
        
        // Draw center
        const centerX = (points.data32F[0] + points.data32F[2] + points.data32F[4] + points.data32F[6]) / 4;
        const centerY = (points.data32F[1] + points.data32F[3] + points.data32F[5] + points.data32F[7]) / 4;
        cv.circle(dst, new cv.Point(centerX, centerY), 5, color, -1);
    }
    
    // Marker-less tracking using template matching
    setTemplate(rect, frame) {
        this.templateRect = rect;
        const x = Math.max(0, rect.x);
        const y = Math.max(0, rect.y);
        const w = Math.min(rect.width, frame.cols - x);
        const h = Math.min(rect.height, frame.rows - y);
        
        this.template = frame.roi(new cv.Rect(x, y, w, h));
    }
    
    trackMarkerless(src, dst) {
        if (!this.template || this.template.empty()) {
            return false;
        }
        
        try {
            // Convert to grayscale if needed
            let srcGray = new cv.Mat();
            let templateGray = new cv.Mat();
            
            if (src.channels() === 3) {
                cv.cvtColor(src, srcGray, cv.COLOR_RGBA2GRAY);
            } else {
                srcGray = src.clone();
            }
            
            if (this.template.channels() === 3) {
                cv.cvtColor(this.template, templateGray, cv.COLOR_RGBA2GRAY);
            } else {
                templateGray = this.template.clone();
            }
            
            // Template matching
            const result = new cv.Mat();
            cv.matchTemplate(srcGray, templateGray, result, cv.TM_CCOEFF_NORMED);
            
            const minMax = cv.minMaxLoc(result);
            const maxPoint = minMax.maxLoc;
            const maxVal = minMax.maxVal;
            
            // Threshold for detection
            if (maxVal > 0.6) {
                const rect = new cv.Rect(
                    maxPoint.x,
                    maxPoint.y,
                    this.template.cols,
                    this.template.rows
                );
                
                // Draw bounding box
                const color = new cv.Scalar(0, 255, 255);
                cv.rectangle(dst, rect, color, 2);
                
                // Draw center
                const center = new cv.Point(
                    maxPoint.x + this.template.cols / 2,
                    maxPoint.y + this.template.rows / 2
                );
                cv.circle(dst, center, 5, color, -1);
                
                result.delete();
                srcGray.delete();
                templateGray.delete();
                return true;
            }
            
            result.delete();
            srcGray.delete();
            templateGray.delete();
            return false;
        } catch (e) {
            console.error('Template matching error:', e);
            return false;
        }
    }
    
    // SAM2 segmentation-based tracking
    loadSAM2Data(npzData) {
        // Store the raw NPZ data
        // In a full implementation, you would parse the NPZ file here
        // NPZ files are compressed numpy arrays (zip format)
        this.sam2Data = npzData;
        this.sam2Masks = null;
        this.sam2Centroids = [];
        
        // Attempt to parse NPZ (simplified - full implementation needs proper parser)
        this.parseSAM2Data(npzData);
        console.log('SAM2 data loaded');
    }
    
    parseSAM2Data(data) {
        // Note: Full NPZ parsing requires:
        // 1. Unzip the NPZ file (it's a zip archive)
        // 2. Parse numpy array format (.npy files)
        // 3. Extract mask arrays and metadata
        
        // For demonstration, we'll create a structure that can be populated
        // In production, use a library like 'numpy-loader' or implement NPZ parser
        try {
            // Placeholder structure - replace with actual NPZ parsing
            this.sam2Masks = [];
            this.sam2Centroids = [];
            
            // If you have a proper NPZ parser, you would do:
            // const npz = parseNPZ(data);
            // this.sam2Masks = npz.masks; // Array of mask arrays
            // this.sam2Centroids = npz.centroids; // Array of centroid coordinates
            
            console.log('SAM2 data structure initialized (NPZ parsing needed for full functionality)');
        } catch (e) {
            console.warn('SAM2 parsing error:', e);
        }
    }
    
    trackSAM2(src, dst) {
        if (!this.sam2Data) {
            return false;
        }
        
        try {
            // If we have parsed masks, use them for tracking
            if (this.sam2Masks && this.sam2Masks.length > 0) {
                return this.trackWithMasks(src, dst);
            }
            
            // Otherwise, use a simplified tracking approach
            // This demonstrates the framework - replace with actual mask-based tracking
            return this.trackWithPlaceholder(src, dst);
        } catch (e) {
            console.error('SAM2 tracking error:', e);
            return false;
        }
    }
    
    trackWithMasks(src, dst) {
        // Track objects using actual segmentation masks
        // This would iterate through masks and track their centroids
        const color = new cv.Scalar(255, 0, 255);
        let found = false;
        
        // For each mask in the SAM2 data
        for (let i = 0; i < this.sam2Masks.length; i++) {
            const mask = this.sam2Masks[i];
            const centroid = this.sam2Centroids[i];
            
            if (centroid) {
                // Draw centroid
                cv.circle(dst, new cv.Point(centroid.x, centroid.y), 5, color, -1);
                
                // Draw bounding box around mask region
                // (In full implementation, compute bounding box from mask)
                const rect = new cv.Rect(
                    Math.max(0, centroid.x - 50),
                    Math.max(0, centroid.y - 50),
                    100,
                    100
                );
                cv.rectangle(dst, rect, color, 2);
                found = true;
            }
        }
        
        return found;
    }
    
    trackWithPlaceholder(src, dst) {
        // Placeholder implementation for demonstration
        // Shows where segmentation-based tracking would work
        const color = new cv.Scalar(255, 0, 255);
        
        // Draw a placeholder region
        // In real implementation, this would be replaced with actual mask rendering
        const rect = new cv.Rect(
            Math.floor(src.cols * 0.3),
            Math.floor(src.rows * 0.3),
            Math.floor(src.cols * 0.4),
            Math.floor(src.rows * 0.4)
        );
        
        cv.rectangle(dst, rect, color, 2);
        
        // Draw center point
        const center = new cv.Point(
            rect.x + rect.width / 2,
            rect.y + rect.height / 2
        );
        cv.circle(dst, center, 5, color, -1);
        
        // Note: Full SAM2 integration requires:
        // 1. NPZ file parser (using pako.js for decompression + numpy format parser)
        // 2. Mask array extraction and conversion to OpenCV Mat
        // 3. Mask overlay rendering using cv.bitwise_and or similar
        // 4. Centroid computation from masks: cv.moments() -> centroid
        // 5. Frame-to-frame tracking using mask matching or optical flow
        
        return true;
    }
    
    processFrame(src, dst) {
        switch (this.trackingMode) {
            case 'marker':
                return this.trackMarker(src, dst);
            case 'markerless':
                return this.trackMarkerless(src, dst);
            case 'sam2':
                return this.trackSAM2(src, dst);
            default:
                return false;
        }
    }
}

