import React, { useState } from 'react';
import './App.css';
import heic2any from "heic2any";

function App() {
  const [image, setImage] = useState(null);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [result, setResult] = useState(null);
  const [kernelSize, setKernelSize] = useState(17);
  const [blockSize, setBlockSize] = useState(35);

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
      updateErosion(kernelSize, blockSize);
    }
  };

  // UPDATE OUTPUT IMAGE
  const updateErosion = async (kern, block) => {
    const res = await fetch("http://127.0.0.1:5000/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kernelSize: kern, blockSize: block }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const resultURL = URL.createObjectURL(blob);
      setResult(resultURL);
    }
  };
  
  const handleKernelSlider = (e) => {
    const kern = parseInt(e.target.value);
    setKernelSize(kern);
    console.log("Kernel size:", kern);
    if (imageUploaded) {
      updateErosion(kern, blockSize);
    }
  };
  
  const handleBlockSlider = (e) => {
    let block = parseInt(e.target.value);
    // Ensure blockSize is odd (adaptiveThreshold requires odd blockSize ≥ 3)
    if (block % 2 === 0) block += 1;
    setBlockSize(block);
    console.log("Block size:", block);
    if (imageUploaded) {
      updateErosion(kernelSize, block);
    }
  };

  return (
    <div className="App">
      <div className="flex-container"> {/* Container for columns */}
        {/* Options Column */}
        <div className="column options">
          <h2>Upload a PNG or HEIC file</h2>
          <input type="file" accept="image/png, image/heic" onChange={handleUpload} />
  
          <div>
            <label>Kernel Size: {kernelSize} x {kernelSize}</label>
            <input
              type="range"
              min="1"
              max="9"
              step="1"
              value={kernelSize}
              onChange={handleKernelSlider}
            />
          </div>
  
          <div>
            <label>Block Size: {blockSize} x {blockSize}</label>
            <input
              type="range"
              min="1"
              max="69"
              step="2"
              value={blockSize}
              onChange={handleBlockSlider}
            />
          </div>
        </div>
  
        {/* Original Image Column */}
        <div className="column image-box">
          <h4>Original:</h4>
          {image && <img src={image} alt="original" />}
        </div>
  
        {/* Processed Image Column */}
        <div className="column image-box">
          <h4>Processed:</h4>
          {result && <img src={result} alt="processed" />}
        </div>
      </div>
    </div>
  );
  
}

export default App;
