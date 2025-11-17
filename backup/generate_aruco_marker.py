#!/usr/bin/env python3
"""
Script to generate ArUco markers for testing the marker-based tracker.
Usage: python generate_aruco_marker.py [marker_id] [output_file]
"""

import cv2
import numpy as np
import sys

def generate_aruco_marker(marker_id=0, output_file='aruco_marker.png', size=200):
    """
    Generate an ArUco marker image.
    
    Args:
        marker_id: ID of the marker (0-249 for DICT_6X6_250)
        output_file: Output filename
        size: Size of the output image in pixels
    """
    # Use the same dictionary as the web tracker (DICT_6X6_250)
    aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)
    
    # Generate marker
    marker_img = np.zeros((size, size), dtype=np.uint8)
    marker_img = cv2.aruco.generateImageMarker(aruco_dict, marker_id, size, marker_img, 1)
    
    # Add white border for better detection
    bordered = np.ones((size + 40, size + 40), dtype=np.uint8) * 255
    bordered[20:size+20, 20:size+20] = marker_img
    
    # Save marker
    cv2.imwrite(output_file, bordered)
    print(f"ArUco marker (ID: {marker_id}) saved to {output_file}")
    print(f"Size: {size + 40}x{size + 40} pixels")
    
    return bordered

if __name__ == "__main__":
    marker_id = 0
    output_file = "aruco_marker.png"
    
    if len(sys.argv) > 1:
        marker_id = int(sys.argv[1])
    
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    
    generate_aruco_marker(marker_id, output_file)

