import React, { useState } from 'react';
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

  // When image uploaded, convert to PNG if necessary
  const handleUpload = async (e) => {
    let image = e.target.files[0];
  
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
    //console.log("Thickness:", thick);
    if (imageUploaded) {
      updateCartoon(thick, intensity, threshold);
    }
  };
  
  // Update intensity variable when slider updated
  const handleIntensitySlider = (e) => {
    const intense = parseInt(e.target.value);
    setIntensity(intense);
    //console.log("Intensity:", intense);
    if (imageUploaded) {
      updateCartoon(thickness, intense, threshold);
    }
  };

  // Update threshold variable when slider updated
  const handleThresholdSlider = (e) => {
    const thresh = parseInt(e.target.value);
    setThreshold(thresh);
    //console.log("Threshold:", thresh);
    if (imageUploaded) {
      updateCartoon(thickness, intensity, thresh);
    }
  };

  // HTML
  return (
    <div className="App">
      <div className="flex-container"> {/* Container for columns */}
        {/* Options Column */}
        <div className="column options">
          <h2>Upload a PNG or HEIC file</h2>
          <input type="file" accept="image/png, image/heic" onChange={handleUpload} />
  
          <div>
            <label>Edge Thickness: {thickness}</label>
            <input
              type="range"
              min="1"
              max="9"
              step="1"
              value={thickness}
              onChange={handleThicknessSlider}
            />
          </div>
  
          <div>
            <label>Edge Intensity: {intensity}</label>
            <input
              type="range"
              min="3"
              max="99"
              step="2"
              value={intensity}
              onChange={handleIntensitySlider}
            />
          </div>

          <div>
            <label>Edge Threshold: {threshold}</label>
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
  
        {/* Original Image Column */}
        <div className="column image-box">
          <h4>Original:</h4>
          {initialImage && <img src={initialImage} alt="original" />}
        </div>
  
        {/* Processed Image Column */}
        <div className="column image-box">
          <h4>Processed:</h4>
          {resultImage && <img src={resultImage} alt="processed" />}
        </div>
      </div>
    </div>
  );
  
}

export default App;
