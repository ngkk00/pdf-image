import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/webpack";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import './App.css'

function App() {
  const [images, setImages] = useState([]);
  const [format, setFormat] = useState("jpeg"); // default to JPG

  const handleFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
      const typedArray = new Uint8Array(e.target.result);
      const pdf = await pdfjsLib.getDocument(typedArray).promise;

      const newImages = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        const imgData = canvas.toDataURL(`image/${format}`);
        newImages.push(imgData);
      }
      setImages(newImages);
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadAllAsZip = async () => {
    if (images.length === 0) return;

    const zip = new JSZip();
    images.forEach((imgData, index) => {
      const base64 = imgData.split(",")[1];
      const byteString = atob(base64);
      const arrayBuffer = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) arrayBuffer[i] = byteString.charCodeAt(i);
      zip.file(`page-${index + 1}.${format}`, arrayBuffer);
    });


    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "pdf-pages.zip");
  };

  return (
    <>
      <div style={{ position: "relative", zIndex: 1, padding: "20px" }}>
        <h1>PDF to Image Converter</h1>
        <p>Upload a PDF file and convert it into JPG images directly in your browser.</p>
        <div style={{ margin: "20px 0" }}>
          <label htmlFor="format-select" style={{ marginRight: "10px", fontWeight: "bold" }}>
            Choose Image Format:
          </label>
          <select
            id="format-select"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", fontSize: "16px" }}
          >
            <option value="jpeg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </div>

        <div style={{ marginTop: "20px" }}>
          {/* Hidden file input */}
          <input
            type="file"
            id="pdf-upload"
            accept="application/pdf"
            onChange={handleFile}
            style={{ display: "none" }}
          />

          {/* Styled label acting as button */}
          <label htmlFor="pdf-upload" className="file-btn">
            📄 Choose PDF File
          </label>
        </div>



        {/* Download All */}
        {images.length > 0 && (
          <div style={{ margin: "20px 0" }}>
            <button onClick={downloadAllAsZip}>Download All as ZIP</button>
          </div>
        )}

        {/* Single Downloads */}
        <div style={{ marginTop: "20px" }}>
          {images.map((src, index) => (
            <div key={index} className="page-container">
              <p>Page {index + 1}</p>
              <img src={src} alt={`Page ${index + 1}`} />
              <div>
                <a
                  href={src}
                  download={`page-${index + 1}.${format}`}
                  className="download-btn"
                >
                  Download Single {format.toUpperCase()}
                </a>

              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ marginTop: "40px", fontSize: "12px", color: "#555", lineHeight: "1.5" }}>
        Disclaimer: This PDF to Image converter works entirely in your browser. Your files are never uploaded or stored on any server.
        For your privacy, we recommend using non-sensitive documents only. Use this tool at your own discretion.
      </footer>
    </>

  );
}

export default App;
