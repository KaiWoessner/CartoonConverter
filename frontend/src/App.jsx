import React, { useState } from 'react';
import './App.css';
import heic2any from "heic2any";

function App() {
  const [image, setImage] = useState(null);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [result, setResult] = useState(null);
  const [kernelSize, setKernelSize] = useState(17);

  // IMAGE IS UPLOADED
  const handleUpload = async (e) => {
    let file = e.target.files[0];
  
    // If HEIC, convert to PNG
    if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
      const reader = new FileReader();
      reader.onload = async () => {
        const arrayBuffer = reader.result;
        const blob = await heic2any({
          blob: new Blob([arrayBuffer], { type: "image/heic" }),
          toType: "image/png",
        });
  
        const convertedFile = new File(
          [blob],
          file.name.replace(/\.heic$/i, ".png"),
          { type: "image/png" }
        );
  
        await uploadImage(convertedFile);
      };
  
      reader.readAsArrayBuffer(file);
      return; // Prevents early upload
    }
  
    // Otherwise, just upload the file
    await uploadImage(file);
  };
  
  const uploadImage = async (file) => {
    setImage(URL.createObjectURL(file));
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kernelSize", kernelSize);
  
    const res = await fetch("http://127.0.0.1:5000/upload", {
      method: "POST",
      body: formData,
    });
  
    if (res.ok) {
      setImageUploaded(true);
      updateErosion(kernelSize);
    }
  };

  // UPDATE OUTPUT IMAGE
  const updateErosion = async (size) => {
    const res = await fetch("http://127.0.0.1:5000/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kernelSize: size }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const resultURL = URL.createObjectURL(blob);
      setResult(resultURL);
    }
  };
  
  // SLIDER IS DRAGGED
  const handleSliderChange = (e) => {
    const kern = parseInt(e.target.value);
    setKernelSize(parseInt(e.target.value));
    console.log("Slider dragged with kern size:", kern);
    //console.log(kern);
    if (imageUploaded){
      updateErosion(kern);
    }
  };

  return (
    <div className="App">
      <h2>Upload a PNG or HEIC file</h2>
      <input type="file" accept="image/png, image/heic" onChange={handleUpload} />

      {/* Slider */}
      <div>
        <label>Kernel Size: {kernelSize} x {kernelSize}</label>
        <input
          type="range"
          min="1"
          max="21"
          step="1"
          value={kernelSize}
          onChange={handleSliderChange}
        />
      </div>

      {/* Image container */}
      <div className="image-container">

        {/* Original Image */}
        {image && (
          <div className="image-box">
            <h4>Original:</h4>
            <img src={image} alt="original" width="300" />
          </div>
        )}

        {/* Processed Image */}
        {result && (
          <div className="image-box">
            <h4>Processed Image:</h4>
            <img src={result} alt="processed" width="300" />
          </div>
        )}
      </div>

    </div>
  );
}

export default App;
