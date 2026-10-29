import { useEffect, useRef, useState } from "react";
import "./App.css";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handLandmarkerRef = useRef(null);

  const lastPointRef = useRef(null);
  const isDrawingRef = useRef(false);
  const drawingHistoryRef = useRef([]);

  const brushColorRef = useRef("#B69CFF");
  const brushSizeRef = useRef(7);
  const brushTextureRef = useRef("matte");
  const sparkleEffectRef = useRef(false);
  const isErasingRef = useRef(false);
  const selectedStickerRef = useRef(null);

  const wasPinchingRef = useRef(false);
  const lastRecordedStrokeRef = useRef(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [brushColor, setBrushColor] = useState("#B69CFF");
  const [brushSize, setBrushSize] = useState(7);
  const [isErasing, setIsErasing] = useState(false);
  const [brushTexture, setBrushTexture] = useState("matte");
  const [sparkleEffect, setSparkleEffect] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(null);

  useEffect(() => {
    brushColorRef.current = brushColor;
  }, [brushColor]);

  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  useEffect(() => {
    brushTextureRef.current = brushTexture;
  }, [brushTexture]);

  useEffect(() => {
    sparkleEffectRef.current = sparkleEffect;
  }, [sparkleEffect]);

  useEffect(() => {
    isErasingRef.current = isErasing;
  }, [isErasing]);

  useEffect(() => {
    selectedStickerRef.current = selectedSticker;
  }, [selectedSticker]);

  // Start webcam.
  useEffect(() => {
    let stream;


const startCamera = async () => {
  try {
    setCameraError("");

    const video = videoRef.current;

    if (!video) return;

    // Stop any previous camera stream
    if (video.srcObject) {
      const oldStream = video.srcObject;

      oldStream.getTracks().forEach((track) => track.stop());

      video.srcObject = null;
    }

    // Request camera access
    stream = await navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: "user",
  },
  audio: false,
});

    // Make sure the video element still exists
    if (!videoRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    video.srcObject = stream;

    // Wait until the video has loaded
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
    });

    await video.play();

    setCameraOn(true);
  } catch (error) {
    console.error("Camera error:", error);

    setCameraOn(false);
    setCameraError(
      "Unable to access camera. Please allow camera permission."
    );
  }
};


    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Hand tracking and gesture controls.
  useEffect(() => {
    let animationId;
    let handLandmarker;
    let lastVideoTime = -1;
    let cancelled = false;

    async function initializeHandTracking() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

        if (cancelled) {
          handLandmarker.close();
          return;
        }

        handLandmarkerRef.current = handLandmarker;
        detectHand();
      } catch (error) {
        console.error("Hand tracking error:", error);
        setCameraError(
          "Unable to initialize hand tracking. Check your model file."
        );
      }
    }

    function stopCurrentAction() {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      lastRecordedStrokeRef.current = false;
    }

    function saveHistory(canvas) {
      drawingHistoryRef.current.push(canvas.toDataURL());

      // Keep history from growing without limit.
      if (drawingHistoryRef.current.length > 30) {
        drawingHistoryRef.current.shift();
      }
    }

  
function drawSegment(ctx, from, to, erase = false) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(distance / 3));

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    ctx.lineTo(from.x + dx * t, from.y + dy * t);
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 1;

  if (erase) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.shadowBlur = 0;
    ctx.lineWidth = brushSizeRef.current * 3;
    ctx.strokeStyle = "#000000";
    ctx.stroke();

    ctx.restore();
    return;
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = brushColorRef.current;
  ctx.lineWidth = brushSizeRef.current;

  // MATTE: simple, clean line
  if (brushTextureRef.current === "matte") {
    ctx.shadowBlur = 0;
    ctx.stroke();
  }

  // GLOSSY: colored glow around the line
  else if (brushTextureRef.current === "glossy") {
    ctx.shadowColor = brushColorRef.current;
    ctx.shadowBlur = 18;
    ctx.stroke();

    // Draw a brighter highlight over the colored line
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(1, brushSizeRef.current * 0.25);
    ctx.stroke();
  }

  // SPARKLE: glowing white outline
  else if (brushTextureRef.current === "sparkle") {
    ctx.shadowColor = "#FFFFFF";
    ctx.shadowBlur = 20;
    ctx.stroke();

    // Add a bright center highlight
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(1, brushSizeRef.current * 0.2);
    ctx.stroke();
  }

  // OPTIONAL: add four-pointed stars when Sparkle Effect is enabled
  if (sparkleEffectRef.current) {
    const count = Math.max(2, Math.min(12, Math.ceil(distance / 8)));

    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const sx = from.x + dx * t;
      const sy = from.y + dy * t;
      const size = Math.random() * 3 + 2;

      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "#FFFFFF";
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(sx, sy - size * 2);
      ctx.lineTo(sx + size * 0.5, sy - size * 0.5);
      ctx.lineTo(sx + size * 2, sy);
      ctx.lineTo(sx + size * 0.5, sy + size * 0.5);
      ctx.lineTo(sx, sy + size * 2);
      ctx.lineTo(sx - size * 0.5, sy + size * 0.5);
      ctx.lineTo(sx - size * 2, sy);
      ctx.lineTo(sx - size * 0.5, sy - size * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  ctx.restore();
}

    
function placeSticker(ctx, x, y) {
  const sticker = selectedStickerRef.current;

  // Don't draw anything when no sticker is selected.
  if (!sticker) return;

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(sticker, x, y);
  ctx.restore();
}


    function detectHand() {
      if (cancelled) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        !video ||
        !canvas ||
        !handLandmarkerRef.current ||
        video.readyState < 2
      ) {
        animationId = requestAnimationFrame(detectHand);
        return;
      }

      const ctx = canvas.getContext("2d");

      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;

        if (
          canvas.width !== video.videoWidth ||
          canvas.height !== video.videoHeight
        ) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const results = handLandmarkerRef.current.detectForVideo(
          video,
          performance.now()
        );

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];

          const wrist = landmarks[0];
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const indexPip = landmarks[6];
          const middleTip = landmarks[12];
          const middlePip = landmarks[10];
          const ringTip = landmarks[16];
          const ringPip = landmarks[14];
          const pinkyTip = landmarks[20];
          const pinkyPip = landmarks[18];

          const x = (1 - indexTip.x) * canvas.width;
          const y = indexTip.y * canvas.height;

          // Finger extension detection.
          const indexExtended = indexTip.y < indexPip.y;
          const middleExtended = middleTip.y < middlePip.y;
          const ringExtended = ringTip.y < ringPip.y;
          const pinkyExtended = pinkyTip.y < pinkyPip.y;

          const pinchDistance = Math.hypot(
            indexTip.x - thumbTip.x,
            indexTip.y - thumbTip.y
          );

          const isPinching = pinchDistance < 0.05;

          // Detect an open palm using the finger joints.
const isOpenPalm =
  indexTip.y < landmarks[5].y &&
  middleTip.y < landmarks[9].y &&
  ringTip.y < landmarks[13].y &&
  pinkyTip.y < landmarks[17].y;


          const isIndexDrawing =
            indexExtended &&
            !middleExtended &&
            !ringExtended &&
            !pinkyExtended &&
            !isPinching;

          // Priority 1: Open palm erases.
          // Priority 2: Two fingers adjust brush size.
          // Priority 3: Pinch places a sticker.
          // Priority 4: Index finger draws.

          
if (isOpenPalm) {
  // Open palm: erase while moving the hand.
  const erasePoint = {
    x: (1 - landmarks[9].x) * canvas.width,
    y: landmarks[9].y * canvas.height,
  };

  if (!lastRecordedStrokeRef.current) {
    saveHistory(canvas);
    lastRecordedStrokeRef.current = true;
  }

  if (lastPointRef.current) {
    drawSegment(ctx, lastPointRef.current, erasePoint, true);
  }

  lastPointRef.current = erasePoint;
  isDrawingRef.current = true;
  wasPinchingRef.current = false;
} else if (isPinching) {
  stopCurrentAction();

  // Place a sticker only if one is selected.
  if (
    !wasPinchingRef.current &&
    selectedStickerRef.current
  ) {
    saveHistory(canvas);
    placeSticker(ctx, x, y);
  }

  wasPinchingRef.current = true;
          } else if (isIndexDrawing || isErasingRef.current) {
            wasPinchingRef.current = false;

            const point = { x, y };
            const erase = isErasingRef.current;

            if (!lastPointRef.current) {
              if (!lastRecordedStrokeRef.current) {
                saveHistory(canvas);
                lastRecordedStrokeRef.current = true;
              }

              lastPointRef.current = point;
            } else {
              drawSegment(ctx, lastPointRef.current, point, erase);
              lastPointRef.current = point;
            }

            isDrawingRef.current = true;
          } else {
            stopCurrentAction();
            wasPinchingRef.current = false;
          }

          // Show fingertip indicator only during an active drawing gesture.
         
        } else {
          stopCurrentAction();
          wasPinchingRef.current = false;
        }
      }

      animationId = requestAnimationFrame(detectHand);
    }

    initializeHandTracking();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationId);

      if (handLandmarker) {
        handLandmarker.close();
      }

      handLandmarkerRef.current = null;
    };
  }, []);

  function undoDrawing() {
    const canvas = canvasRef.current;

    if (!canvas || drawingHistoryRef.current.length === 0) return;

    const previousDrawing = drawingHistoryRef.current.pop();
    const ctx = canvas.getContext("2d");
    const image = new Image();

    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
    };

    image.src = previousDrawing;
  }

  function clearDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawingHistoryRef.current = [];
    lastPointRef.current = null;
    isDrawingRef.current = false;
    wasPinchingRef.current = false;
    lastRecordedStrokeRef.current = false;
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const photoCanvas = document.createElement("canvas");
    photoCanvas.width = video.videoWidth;
    photoCanvas.height = video.videoHeight;

    const ctx = photoCanvas.getContext("2d");

    // Mirror the webcam image.
    ctx.translate(photoCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, photoCanvas.width, photoCanvas.height);

    // Overlay the doodles.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(canvas, 0, 0, photoCanvas.width, photoCanvas.height);

    const link = document.createElement("a");
    link.download = `air-doodle-photo-${Date.now()}.png`;
    link.href = photoCanvas.toDataURL("image/png");
    link.click();
  }

  const colors = [
    "#B69CFF",
    "#FF83B5",
    "#FFCA80",
    "#8DE7D0",
    "#83C8FF",
    "#FFFFFF",
  ];

  const stickers = [
  "⭐", "❤️", "🌸", "🦋", "✨",
  "🌈", "🌻", "💖", "🔥", "🍀",
  "🎀", "☀️", "🌙", "💎", "🪄"
];

  return (
    <main className="studio">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-icon">✳</span>
          <span>
            air<span className="brand-accent">doodle</span>
          </span>
        </a>

        <div className="topbar-center">
          <span className="live-dot" />
          CREATIVE STUDIO
        </div>

        <button
          className="top-button"
          onClick={() => window.location.reload()}
        >
          ↻ Restart
        </button>
      </header>

      <section className="workspace">
        <div className="intro">
          <div className="eyebrow">YOUR HANDS, YOUR MAGIC ✨</div>
          <h1>
            Make something
            <br />
            <span>out of thin air.</span>
          </h1>
          <p>Draw in the air. Play with colors. Make a little magic.</p>
        </div>

        <div className="studio-layout">
          <aside className="toolbar">
            <div className="tool-label">TOOLS</div>

            <button
              className={`tool ${!isErasing ? "active" : ""}`}
              title="Air drawing"
              onClick={() => setIsErasing(false)}
            >
              <span>✎</span>
              <small>Draw</small>
            </button>

            <button
              className={`tool ${isErasing ? "active" : ""}`}
              title="Manual eraser"
              onClick={() => setIsErasing((value) => !value)}
            >
              <span>◩</span>
              <small>{isErasing ? "Drawing" : "Eraser"}</small>
            </button>

            
<div className="sticker-section">
  <div className="sticker-heading">
    <label>STICKERS</label>

    {selectedSticker && (
      <button
        className="deselect-sticker"
        onClick={() => setSelectedSticker(null)}
      >
        Deselect ✕
      </button>
    )}
  </div>

  <div className="sticker-carousel">
    {stickers.map((sticker) => (
      <button
        key={sticker}
        type="button"
        className={`sticker-option ${
          selectedSticker === sticker ? "selected" : ""
        }`}
        onClick={() => {
          setSelectedSticker(
            selectedSticker === sticker ? null : sticker
          );
        }}
        aria-label={`Select ${sticker} sticker`}
        aria-pressed={selectedSticker === sticker}
      >
        {sticker}
      </button>
    ))}
  </div>

  <p className="sticker-hint">
    Slide to explore · Click again to deselect
  </p>
</div>


            <button className="tool" onClick={undoDrawing} title="Undo">
              <span>↩</span>
              <small>Undo</small>
            </button>

            <button className="tool" onClick={clearDrawing} title="Clear">
              <span>✕</span>
              <small>Clear</small>
            </button>
          </aside>

          <section className="camera-card">
            <div className="camera-heading">
              <div>
                <span className="status-dot" />
                <span>LIVE CANVAS</span>
              </div>
              <span className="resolution">HD · MIRROR MODE</span>
            </div>

            <div className="camera-stage">
              <video
                ref={videoRef}
                className="camera-video"
                autoPlay
                muted
                playsInline
              />

              <canvas ref={canvasRef} className="camera-canvas" />

              <div className="camera-overlay">
                {!cameraOn && !cameraError && (
                  <div className="camera-message">
                    <div className="loading-ring" />
                    <p>Waking up your camera...</p>
                  </div>
                )}

                {cameraError && (
                  <div className="camera-message">
                    <span className="error-icon">!</span>
                    <p>{cameraError}</p>
                    <button
                      className="primary-button"
                      onClick={() => window.location.reload()}
                    >
                      Try again
                    </button>
                  </div>
                )}

                {cameraOn && (
                  <>
                    <div className="corner corner-tl" />
                    <div className="corner corner-tr" />
                    <div className="corner corner-bl" />
                    <div className="corner corner-br" />

                    <div className="camera-hint">
                      <span>✧</span> Your canvas is ready
                    </div>

                    <div className="camera-footer">
                      <span className="footer-pill">
                        <span className="live-dot" /> CAMERA ACTIVE
                      </span>
                      <span className="footer-pill">✦ LET'S CREATE</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="camera-controls">
              <div className="control-info">
                <span className="control-icon">☝</span>
                <div>
                  <strong>Hand gesture controls</strong>
                  <small>Index: draw · Palm: erase · Slider: brush size</small>
                </div>
              </div>

              <button
                className="capture-button"
                disabled={!cameraOn}
                onClick={capturePhoto}
              >
                <span>◉</span> Capture
              </button>
            </div>
          </section>

          <aside className="settings-card">
            <div className="panel-heading">
              <span>THE BRUSH BAR</span>
              <span className="sparkle">✧</span>
            </div>

            <div className="setting-section">
              <label>COLORS</label>

              <div className="color-palette">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`color-swatch ${
                      brushColor === color ? "selected" : ""
                    }`}
                    style={{ "--swatch-color": color }}
                    aria-label={`Select ${color}`}
                    onClick={() => setBrushColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="setting-section">
              <label>BRUSH TEXTURE</label>

              {[
                ["matte", "Matte", "Soft & smooth"],
                ["glossy", "Glossy", "Liquid shine"],
                ["sparkle", "Sparkle", "Magic glow"],
              ].map(([texture, title, description]) => (
                <button
                  key={texture}
                  className={`brush-option ${
                    brushTexture === texture ? "selected" : ""
                  }`}
                  onClick={() => setBrushTexture(texture)}
                >
                  <span className={`brush-preview ${texture}`} />
                  <span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                  {brushTexture === texture && (
                    <span className="check">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="setting-section">
              <button
                className={`brush-option ${
                  sparkleEffect ? "selected" : ""
                }`}
                onClick={() => setSparkleEffect((value) => !value)}
              >
                <span>✨</span>
                <span>
                  <strong>Sparkle Effect</strong>
                  <small>{sparkleEffect ? "Effect enabled" : "Add magical stars"}</small>
                </span>
                <span>{sparkleEffect ? "✓" : "+"}</span>
              </button>
            </div>

            <div className="setting-section">
              <div className="slider-heading">
                <label>BRUSH SIZE</label>
                <span>{brushSize} px</span>
              </div>

              <input
  type="range"
  min="2"
  max="30"
  value={brushSize}
  onChange={(event) => {
    const size = Number(event.target.value);
    brushSizeRef.current = size;
    setBrushSize(size);
  }}
  aria-label="Brush size"
/>
            </div>

            <div className="tip-card">
              <span>✦</span>
              <div>
                <strong>A little tip</strong>
                <p>Keep your hand clearly visible to the camera.</p>
              </div>
            </div>
          </aside>
        </div>

        <footer className="page-footer">
          <span>MADE FOR THE JOY OF CREATING</span>
          <span>LESS SCROLLING, MORE DOODLING ✳</span>
        </footer>
      </section>
    </main>
  );
}

export default App;