# 🤖 2-Link Parallel Robot Simulator (Web Edition)

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-blue?style=for-the-badge&logo=github)

A browser-based interactive simulator for a 2-link parallel robot with inverse kinematics, contour-based text drawing, and live workspace visualization.

[🚀 Live Demo](https://goharimanesh.github.io/2RRR/) · [🐛 Report Bug](https://github.com/goharimanesh/2RRR/issues)

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Live Demo](#-live-demo)
- [Installation](#-installation)
- [Deploy to GitHub Pages](#-deploy-to-github-pages)
- [Project Structure](#-project-structure)
- [Robot Parameters](#-robot-parameters)
- [How to Use](#-how-to-use)
- [Inverse Kinematics](#-inverse-kinematics)
- [Contour-Based Text Drawing](#-contour-based-text-drawing)
- [Technical Notes](#-technical-notes)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Project Info](#-project-info)
- [License](#-license)

---

## 🎯 About

This project is a **web-based simulator** for a **2-link parallel robot** that runs entirely in the browser with **no installation required**.

It is a full port of the original Python + Tkinter desktop version to **HTML / CSS / JavaScript**, so it can be shared with anyone via a single link. The UI has been completely redesigned with a modern dark theme, and the text-drawing pipeline has been reimplemented in pure JavaScript using a **contour-tracing algorithm** equivalent to OpenCV's `findContours()`.

### Why the Web Version?

| Desktop (Python) | Web (this project) |
|:---:|:---:|
| Requires Python and libraries | ✅ Just a browser |
| OS-dependent | ✅ OS-independent |
| Hard to share | ✅ Just a link |
| Old Tkinter look | ✅ Modern, responsive UI |
| Needs `arabic_reshaper` and `bidi` | ✅ Native browser text rendering |
| Uses OpenCV for contours | ✅ Custom contour tracer in pure JS |

---

## ✨ Features

- 🎨 **Modern dark UI** with gradients, hover effects, and responsive layout
- 📐 **Live workspace visualization** with dashed reachability rings for each arm
- 🎚️ **Interactive sliders** for X/Y target positioning
- ✏️ **Contour-based text drawing** — traces the outline of each glyph, matching the Python version
- 📊 **Real-time motor angle display** in degrees
- 🎓 **University logo** displayed in the side panel
- ⚡ **Zero dependencies** — no CDN, no npm, no build step
- 🌐 **Free hosting on GitHub Pages**
- 📱 **Fully responsive** for desktop, tablet, and mobile
- 🧮 **Accurate inverse kinematics** with reachability checks

---

## 🚀 Live Demo

Once deployed, the project is available at:
