from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from io import BytesIO
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)

# initialize image global variable
image = None

# When image receieved from frontend
@app.route('/upload', methods=['POST'])
def uploadImage():
    # Extract image from frontend form data
    global image
    image = request.files['image']
    
    # If image is PNG, convert to image array
    if image.filename.endswith(('.png', '.jpg', '.jpeg')):
        in_memory_file = BytesIO()
        image.save(in_memory_file)
        data = np.frombuffer(in_memory_file.getvalue(), dtype=np.uint8)
        image = cv2.imdecode(data, cv2.IMREAD_COLOR)
        
        return jsonify({'message': 'Image uploaded'}), 200
    
    return 'Invalid file type', 400

# Run cartoon pipeline
@app.route('/cartoon', methods=['POST'])
def apply_cartoon():
    global image

    # Extract slider values from frontend form data json
    data = request.get_json()
    thickness = int(data.get('thickness', 3))
    intensity = int(data.get('intensity', 35))
    threshold = int(data.get('threshold', 1))
    
    # print("Thickness", thickness)
    # print("Intensity", intensity)
    # print("Threshold", threshold)
    
    # ============ CARTOON PIPELINE ==============
    # 1. Convert initial image to grayscale
    grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 2. Convert grayscale image to binary (black and white) using thresholding
    #       blockSize = Size of the pixel neighborhood used for thresholding (must be odd) (45 was looking good)
    #       C = constant subtracted from the mean
    binary = cv2.adaptiveThreshold(grayscale, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, blockSize= intensity, C= threshold)
    
    # 3. Apply closing to binary image to remove black specks
    closingKernel = np.ones((3, 3), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, closingKernel)

    # 4. Apply erosion to binary image to thicken edges
    erosionKernel = np.ones((thickness, thickness), np.uint8)
    binary = cv2.erode(binary, erosionKernel, iterations=1)
    
    # 5. Apply edge-preservation smoothing to initial colored image based on intensity of nearby pixels
    #       d = diameter of pixels filtered
    #       sigmaColor (0-300) = how much to blur colors (lower = less blurred)
    #       sigmaSpace (0-300) = how far away pixels can be to impact blur
    color = cv2.bilateralFilter(image, d=5, sigmaColor=100, sigmaSpace=100)
    
    # 6. Apply bitwise and to overlap smoothed color image with binary image
    cartoon = cv2.bitwise_and(color, color, mask=binary)
    
    # 7. Convert processed image array back to PNG
    cartoon_bgra = cv2.cvtColor(cartoon, cv2.COLOR_BGR2BGRA)
    _, buffer = cv2.imencode('.png', cartoon_bgra)
   # _, buffer = cv2.imencode('.png', binary)
    
    # 8. Send processed image back to frontend
    return send_file(BytesIO(buffer.tobytes()), mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True)