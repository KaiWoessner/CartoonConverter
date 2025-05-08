import React, { useState, useRef } from 'react';
import './App.css';
import heic2any from "heic2any";

function App() {
  // Initialize react state variables
  const [initialImage, setInitalImage] = useState(null);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [thickness, setThickness] = useState(3);
  const [intensity, setIntensity] = useState(35);
  const [threshold, setThreshold] = useState(1);
  const [originalFileName, setOriginalFileName] = useState(null);
  const [thicknessInputValue, setInputValue] = useState("3");
  const [intensityInputValue, setIntensityInputValue] = useState(35);
  const [thresholdInputValue, setThresholdInputValue] = useState(1);

  const fileInputRef = useRef(null);

  // When image uploaded, convert to PNG if necessary
  const handleUpload = async (e) => {
    let image = e.target.files[0];
    setOriginalFileName(image.name);
  
    // If HEIC, convert to PNG
    if (image.type === "image/heic" || image.name.toLowerCase().endsWith(".heic")) {
      const reader = new FileReader();
      reader.onload = async () => {
        const arrayBuffer = reader.result;
        const blob = await heic2any({
          blob: new Blob([arrayBuffer], { type: "image/heic" }),
          toType: "image/png",
        });
  
        const convertedImage = new File([blob],image.name.replace(/\.heic$/i, ".png"),{ type: "image/png" });
  
        await uploadImage(convertedImage);
      };
  
      reader.readAsArrayBuffer(image);
      return;
    }
    
    // If PNG, continue to uploadImage
    await uploadImage(image);
  };
  
  // When image uploaded and type handled
  const uploadImage = async (image) => {
    // Converts initial image to binary object that is able to be displayed
    setInitalImage(URL.createObjectURL(image));
  
    // Send initial image to backend
    const formData = new FormData();
    formData.append("image", image);
    const res = await fetch("http://127.0.0.1:5000/upload", {
      method: "POST",
      body: formData,
    });
  
    // If fetch successfully receives response from backend
    if (res.ok) {
      setImageUploaded(true);
      updateCartoon(thickness, intensity, threshold);
    }
  };

  // Send the updated slider values to the backend to be processed
  const updateCartoon = async (thick, intense, thresh) => {
    // send updated slider values to backend
    const res = await fetch("http://127.0.0.1:5000/cartoon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thickness: thick, intensity: intense, threshold: thresh}),
    });

    // If fetch successfully receives response from backend
    if (res.ok) {
      const blob = await res.blob();
      // Converts processed image to binary object that is able to be displayed
      const resultURL = URL.createObjectURL(blob);
      setResultImage(resultURL);
    }
  };
  
  // Update thickness variable when slider updated
  const handleThicknessSlider = (e) => {
    const thick = parseInt(e.target.value);
    setThickness(thick);
    setInputValue(thick.toString());  // Sync input value
    //console.log("Thickness:", thick);
    if (imageUploaded) {
      updateCartoon(thick, intensity, threshold);
    }
  };

  const handleThicknessInput = (e) => {
    const value = e.target.value;

    // Allow empty string for backspacing
    if (value === "") {
      setInputValue("");
      return;
    }

    const numericValue = parseInt(value);

    // Update only if value is within range
    if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 9) {
      setThickness(numericValue);
      setInputValue(value);
    }
  };
  
  const handleIntensitySlider = (e) => {
    const intense = parseInt(e.target.value);
    setIntensity(intense);
    setIntensityInputValue(intense);
    if (imageUploaded) {
      updateCartoon(thickness, intense, threshold);
    }
  };

  const handleIntensityInput = (e) => {
    const value = e.target.value;
    if (value === "") {
      setIntensityInputValue("");
      return;
    }
    const numericValue = parseInt(value);
    if (!isNaN(numericValue) && numericValue >= 3 && numericValue <= 99) {
      setIntensity(numericValue);
      setIntensityInputValue(value);
    }
  };

  const handleThresholdSlider = (e) => {
    const thresh = parseInt(e.target.value);
    setThreshold(thresh);
    setThresholdInputValue(thresh);
    if (imageUploaded) {
      updateCartoon(thickness, intensity, thresh);
    }
  };

  const handleThresholdInput = (e) => {
    const value = e.target.value;
    if (value === "") {
      setThresholdInputValue("");
      return;
    }
    const numericValue = parseInt(value);
    if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 15) {
      setThreshold(numericValue);
      setThresholdInputValue(value);
    }
  };



  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };
  
  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleUpload({ target: { files: [file] } });
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };


  // HTML
  return (
    <div className="App">
      <div className="flex-container"> {/* Container for columns */}
        {/* Options Column */}
        <div className="column options">
          <h2>CARTOONIZER</h2>

          <div className="drop-zone" onClick={handleClick} onDrop={handleDrop} onDragOver={handleDragOver}>
            <p>Drag and drop an image here or click</p>
            <input type="file" accept="image/png, image/heic" onChange={handleUpload} ref={fileInputRef} style={{ display: 'none' }} />
          </div>
  
          <div>
            <label>Edge Thickness:</label>
            <input
                type="number"
                min="1"
                max="9"
                value={thicknessInputValue}
                onChange={handleThicknessInput}
                style={{ marginLeft: '10px' }}
                className="input"
              />
            <div className="slider">
              <input
                type="range"
                min="1"
                max="9"
                step="1"
                value={thickness}
                onChange={handleThicknessSlider}
              />
            </div>
            
          </div>
  
          <div>
            <label>Edge Intensity:</label>
            <input
              type="number"
              min="3"
              max="99"
              value={intensityInputValue}
              onChange={handleIntensityInput}
              style={{ marginLeft: '10px' }}
              className="input"
            />
            <div className="slider">
              <input
                type="range"
                min="3"
                max="99"
                step="2"
                value={intensity}
                onChange={handleIntensitySlider}
              />
            </div>
          </div>

          <div>
            <label>Edge Threshold:</label>
            <input
              type="number"
              min="1"
              max="15"
              value={thresholdInputValue}
              onChange={handleThresholdInput}
              style={{ marginLeft: '10px' }}
              className="input"
            />
            <div className="slider">
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={threshold}
                onChange={handleThresholdSlider}
              />
            </div>
          </div>


          {resultImage && (
              <a href={resultImage} download={`${originalFileName.replace(/\.[^/.]+$/, "")}_cartoonized.png`} className="download-button">
                Download Cartoon
              </a>)}
        </div>
  
        {/* Original Image Column */}
        <div className="column image-column">
          <h4>Original:</h4>
          <div className="image-box">
            {initialImage && <img src={initialImage} alt="original" />}
          </div>
        </div>
  
        {/* Processed Image Column */}
        <div className="column image-column">
          <h4>Cartoonized:</h4>
          <div className="image-box">
            {resultImage && <img src={resultImage} alt="processed" />}
          </div>
        </div>
      </div>
    </div>
  );
  
}

export default App;
