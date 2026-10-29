# ✨ Air Doodle Studio

**Draw in the air. Play with colors. Make a little magic.**

Air Doodle Studio is a webcam-based drawing application that lets users create digital artwork using hand gestures. Built with React and MediaPipe, it transforms hand movements into an interactive drawing experience without requiring a mouse or touchscreen.

## 🌟 Features

- 🎨 **Air Drawing** — Draw on a digital canvas by moving your index finger.
- 🌈 **Color Palette** — Choose from multiple brush colors.
- 🖌️ **Brush Customization** — Adjust brush size and switch between Matte, Glossy, and Sparkle textures.
- ✨ **Sparkle Effects** — Add glowing, four-pointed stars to your drawings.
- 🧽 **Gesture-Based Erasing** — Use an open-palm gesture to erase parts of your artwork.
- 💖 **Interactive Stickers** — Place emoji stickers on the canvas using a pinch gesture.
- ↩️ **Undo** — Undo your most recent drawing or sticker action.
- 🗑️ **Clear Canvas** — Remove the current artwork and start again.
- 📸 **Capture Artwork** — Save your creation as a PNG image.
- 📷 **Live Webcam Preview** — Draw directly over the mirrored webcam feed.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface and component management |
| Vite | Development server and build tool |
| JavaScript | Application logic and gesture handling |
| HTML Canvas API | Rendering drawings, effects, and stickers |
| MediaPipe Tasks Vision | Real-time hand landmark detection |
| CSS | Styling and responsive layout |
| Browser MediaDevices API | Webcam access |

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm, which comes with Node.js
- A webcam
- A modern browser with camera access support

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/air-doodle-studio.git
```

Replace `YOUR-USERNAME` with your GitHub username.

### 2. Open the project folder

```bash
cd air-doodle-studio
```

### 3. Install dependencies

```bash
npm install
```

### 4. Check the hand-tracking model

The application expects the MediaPipe hand landmark model at:

```text
public/models/hand_landmarker.task
```

Make sure this file exists in your project. If it is missing, download the appropriate Hand Landmarker model from the [MediaPipe documentation](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker).

### 5. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

Allow camera access when your browser asks for permission.

## 🖐️ Gesture Controls

| Gesture | Action |
|---|---|
| Index finger extended | Draw in the air |
| Open palm | Erase while moving your hand |
| Pinch thumb and index finger | Place the selected sticker |
| Brush size slider | Manually adjust brush thickness |

**Tip:** Keep your hand visible inside the camera frame and use a well-lit environment for better tracking.

## 🎨 Customization

Air Doodle Studio includes several creative controls:

- **Colors:** Choose from a selection of pastel colors.
- **Textures:** Switch between Matte, Glossy, and Sparkle.
- **Brush Size:** Adjust the brush thickness using the slider.
- **Sparkle Effect:** Toggle decorative stars on or off.
- **Stickers:** Select from emojis such as stars, hearts, flowers, butterflies, and more.

## 📸 Capture Your Artwork

Click the **Capture** button to download your drawing as a PNG image. The captured image combines the mirrored webcam feed with the doodles rendered on the canvas.

## 🔒 Privacy

The application requests webcam access through your browser. Camera access requires user permission.

Hand tracking runs in the browser using MediaPipe. This project does not intentionally upload webcam footage to a project-owned backend.

## 🧠 What I Learned

Building this project provided practical experience with:

- Integrating MediaPipe hand tracking into a React application.
- Using hand landmarks to detect gestures.
- Drawing and erasing dynamically with the HTML Canvas API.
- Managing React state and refs for real-time interactions.
- Implementing brush effects, stickers, undo functionality, and image capture.
- Working with webcam streams and browser permissions.

## 🔮 Future Improvements

Potential enhancements include:

- Saving and restoring complete drawing sessions.
- Adding more brush styles and color palettes.
- Improving gesture detection in different lighting conditions.
- Supporting additional hand gestures and multi-hand interactions.
- Adding a gallery to organize saved artwork.

## 👩‍💻 Author

**Ritika Kushwaha**

Built with ❤️ and a little bit of magic ✨

---

⭐ If you like this project, consider giving the repository a star!
