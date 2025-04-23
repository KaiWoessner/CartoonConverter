from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from io import BytesIO
import cv2
import numpy as np

app = Flask(__name__)
#CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
CORS(app)

stored_image = None

@app.route('/upload', methods=['POST'])
def upload_file():
    
    print("UPLOADED")
    global stored_image
    file = request.files['file']
    kernel_size = int(request.form.get('kernelSize', 17))
    
    print(f"Received file: {file.filename} with kernel size: {kernel_size}")
    
    if file.filename.endswith('.png'):
        in_memory_file = BytesIO()
        file.save(in_memory_file)
        data = np.frombuffer(in_memory_file.getvalue(), dtype=np.uint8)
        stored_image = cv2.imdecode(data, cv2.IMREAD_COLOR)
        return jsonify({'message': 'Image uploaded'}), 200
    
    return 'Invalid file type', 400

@app.route('/process', methods=['POST'])
def apply_erosion():
    print("PROCESSED")
    
    global stored_image
    if stored_image is None:
        return jsonify({'error': 'No image uploaded'}), 400
    
    data = request.get_json()
    kernel_size = int(data.get('kernelSize', 17))
    print("Applying erosion with kernel size:", kernel_size)

    kernel = np.ones((kernel_size, kernel_size), np.uint8)
    eroded_img = cv2.erode(stored_image, kernel, iterations=1)
    
    # GRAYSCALE
    gray = cv2.cvtColor(stored_image, cv2.COLOR_BGR2GRAY)
    gray_1 = cv2.medianBlur(gray, ksize=3)
    gray_output = cv2.adaptiveThreshold(gray_1, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 5)
    
    # ERODE
    gray_output = cv2.erode(gray_output, kernel, iterations=1)
    
    # COLOR
    color_output = cv2.medianBlur(stored_image, ksize=3)
    
    # CARTOON
    cartoon = cv2.bitwise_and(color_output, color_output, mask=gray_output)
    
    _, buffer = cv2.imencode('.png', cartoon)
    return send_file(BytesIO(buffer.tobytes()), mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True)