import React, { useState, useRef, useEffect } from 'react';
import { saveToIDB, getFromIDB } from './db';
import './App.css';
import heic2any from "heic2any";

function App() {
  // Initialize react state variables
  const [initialImage, setInitalImage] = useState(null);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  // If state variables already saved default to them otherwise use defaults
  const [thickness, setThickness] = useState(() =>
    parseInt(localStorage.getItem("thickness")) || 2
  );
  const [intensity, setIntensity] = useState(() =>
    parseInt(localStorage.getItem("intensity")) || 31
  );
  const [threshold, setThreshold] = useState(() =>
    parseInt(localStorage.getItem("threshold")) || 3
  );
  const [originalFileName, setOriginalFileName] = useState(null);

  const fileInputRef = useRef(null);

  // When image uploaded, convert to PNG if necessary
  const handleUpload = async (e) => {
    let image = e.target.files[0];
    setOriginalFileName(image.name);


    //let imageToUpload;
  
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

    // save image in IDB
    const reader = new FileReader();
    reader.onloadend = async () => {
      await saveToIDB('imageBase64', reader.result);
      await saveToIDB('originalImageName', image.name);
    };
    reader.readAsDataURL(image);
  
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
    //setInputValue(thick.toString());  // Sync input value
    //console.log("Thickness:", thick);
    if (imageUploaded) {
      updateCartoon(thick, intensity, threshold);
    }
  };
  
  const handleIntensitySlider = (e) => {
    const intense = parseInt(e.target.value);
    setIntensity(intense);
    //setIntensityInputValue(intense);
    if (imageUploaded) {
      updateCartoon(thickness, intense, threshold);
    }
  };

  const handleThresholdSlider = (e) => {
    const thresh = parseInt(e.target.value);
    setThreshold(thresh);
    //setThresholdInputValue(thresh);
    if (imageUploaded) {
      updateCartoon(thickness, intensity, thresh);
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

  //*********************************
  // LOCAL STORAGE + INDEXEDDB
  //*********************************
  
  // Save and updates slider variables on change
  useEffect(() => {
    localStorage.setItem('thickness', thickness);
    localStorage.setItem('intensity', intensity);
    localStorage.setItem('threshold', threshold);
  }, [thickness, intensity, threshold]);

  // retrieves saved local storage and indexeddb items on load
  useEffect(() => {
    (async () => {
      const savedThickness = localStorage.getItem('thickness');
      const savedIntensity = localStorage.getItem('intensity');
      const savedThreshold = localStorage.getItem('threshold');
  
      const savedBase64 = await getFromIDB('imageBase64');
      const savedFileName = await getFromIDB('originalImageName');
  
      if (savedThickness) setThickness(parseInt(savedThickness));
      if (savedIntensity) setIntensity(parseInt(savedIntensity));
      if (savedThreshold) setThreshold(parseInt(savedThreshold));
  
      if (savedBase64 && savedFileName) {
        setInitalImage(savedBase64);
        setOriginalFileName(savedFileName);
        setImageUploaded(true);
  
        // Convert base64 back to image and upload
        const byteString = atob(savedBase64.split(',')[1]);
        const mimeString = savedBase64.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const image = new File([blob], savedFileName, { type: mimeString });
  
        const formData = new FormData();
        formData.append("image", image);
  
        const res = await fetch("http://127.0.0.1:5000/upload", {
          method: "POST",
          body: formData,
        });
  
        if (res.ok) {
          updateCartoon(
            parseInt(savedThickness) || 2,
            parseInt(savedIntensity) || 31,
            parseInt(savedThreshold) || 3
          );
        }
      }
    })();
  }, []);

  // Erase local storage and indexeddb
  const handleEraseData = async () => {
    // Clear localStorage
    localStorage.clear();
  
    // Open indexeddb
    const dbRequest = indexedDB.open('CartoonizerDB', 1);
  
    // If indexeddb exists
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
  
      // Clear saved indexeddb data
      const tx = db.transaction('images', 'readwrite');
      const store = tx.objectStore('images');
      store.clear();
      window.location.reload();
    };

  };


  // HTML
  return (
    <div className="App">
      {/* Columns container */}
      <div className="flex-container">
        <div className="options-column">
          <img className='title-img' src="/assets/cartoonizer_logo.png"/>

          {/* Upload container */}
          <div className="upload-container">
            <div className="drop-zone" onClick={handleClick} onDrop={handleDrop} onDragOver={handleDragOver}>
              <p>Drag and drop an image here or click</p>
              <input type="file" accept="image/png, image/heic" onChange={handleUpload} ref={fileInputRef} style={{ display: 'none' }} />
            </div>
          </div>

          {/* Sliders container */}
          <div className="all-sliders-container">
            {/* Thickness slider */}
            <div className="slider-container">
              <div className="slider-label">Edge Thickness: {thickness}</div>
              <input
                type="range"
                min="1"
                max="9"
                step="1"
                value={thickness}
                onChange={handleThicknessSlider}
              />
            </div>

            {/* Intensity slider */}
            <div className="slider-container">
              <div className="slider-label">Edge Intensity: {intensity}</div>
              <input
                type="range"
                min="3"
                max="299"
                step="2"
                value={intensity}
                onChange={handleIntensitySlider}
              />
            </div>

            {/* Threshold slider */}
            <div className="slider-container">
              <div className="slider-label">Edge Threshold: {threshold}</div>
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

          {/* Button container */}
          <div className="button-container">
            <a href={resultImage || "#"}
              download={ resultImage ? `${originalFileName.replace(/\.[^/.]+$/, "")}_cartoonized.png` : undefined}
              className={`download-button ${!resultImage ? "disabled" : ""}`}
              onClick={(e) => {
                if (!resultImage) e.preventDefault();
              }}>
              Download Cartoon
            </a>

            <button className="erase-button" onClick={handleEraseData}>Erase Data</button>
          </div>
      </div>

        {/* Original Image Column */}
        <div className="image-column">
          <img src="/assets/original_text.png" className='original-label-img'/>
          <div className="image-box">
            {initialImage && <img src={initialImage} alt="original" />}
          </div>
        </div>
  
        {/* Processed Image Column */}
        <div className="image-column">
          <img src="/assets/cartoonized_text.png" className='cartoonized-label-img'/>
          <div className="image-box">
            {resultImage && <img src={resultImage} alt="processed" />}
          </div>
        </div>
      </div>
    </div>
  );
  
}

export default App;
