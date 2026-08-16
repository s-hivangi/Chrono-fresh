# 🥑 Chronofresh — Produce Quality & Shelf-Life Intelligence Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.0-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-Computer%20Vision-EE4C2C.svg?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Resilient-4169E1.svg?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> An end-to-end computer vision and Decision Support System (DSS) platform engineered for real-time produce quality assessment, continuous shelf-life degradation tracking, and automated cold-chain logistics dispatch.

---

## 🌟 Key Features

- **🔍 Computer Vision Degradation Inference**: Dual-backbone feature extraction to classify produce freshness (`Fresh`, `Early Ripe`, `Mid Ripe`, `Late Ripe`, `Spoiled`) and calculate continuous remaining shelf-life in days.
- **⚡ Interactive Glassmorphic Operations Dashboard**: Real-time batch inventory monitoring with theme switching (Light/Dark mode), search filters, and instant status updates.
- **📈 Shelf-Life Timeline & Audit Trail**: Interactive Recharts visualizations mapping batch degradation over time alongside full capture history.
- **🚚 DSS Logistics Command Engine**: Automated FIFO (First-In, First-Out) priority ranking and 4°C cold-chain refrigeration triggers to minimize post-harvest food waste.
- **📦 Multi-Mode Batch Processing**: Flexible single image, multi-angle same produce, and multi-produce batch upload pipelines with auto-image compression.

---

## 🏛 System Architecture

The Chronofresh ecosystem seamlessly integrates computer vision models with a resilient backend API and a dynamic glassmorphic user interface:

![Chronofresh Architecture](docs/assets/architecture.png)

### Core Components
1. **Frontend Client**: React 18 + Vite dashboard with responsive CSS design tokens and real-time state synchronization.
2. **Backend API Service**: FastAPI ASGI application handling image ingestion, SQLite/PostgreSQL persistence via SQLAlchemy, and asynchronous static asset serving.
3. **Inference Pipeline**: Model inference engine processing input produce images, evaluating degradation stages, and outputting actionable decision metrics.

---

## 📂 Repository Structure

```text
Chronofresh/
├── README.md                      # Primary GitHub Project Documentation
├── LICENSE                        # Open-Source MIT License
├── .env.example                   # Global Environment Configuration Template
├── .gitignore                     # Git Exclusion Rules
├── docs/                          # Architecture Diagrams & Model Handoff Notes
│   ├── assets/
│   │   └── architecture.png       # System Architecture Diagram
│   └── MODEL_HANDOFF.md           # Model Export & Deployment Guidelines
├── backend/                       # Computer Vision Backend Service (FastAPI)
│   ├── .env.example               # Backend Environment Template
│   ├── requirements.txt           # Python Dependencies
│   ├── uploads/
│   │   └── .gitkeep               # Media Uploads Directory Placeholder
│   └── app/                       # FastAPI Source Code
│       ├── main.py                # REST Endpoints & Application Initialization
│       ├── database.py            # Database Engine & Migration Handlers
│       ├── models.py              # SQLAlchemy ORM Data Models
│       ├── schemas.py             # Pydantic Schemas & DTOs
│       ├── prediction_service.py # Inference Engine & Logic
│       └── image_utils.py        # Image Processing & Compression Helpers
├── frontend/                      # Operations Web Dashboard (React + Vite)
│   ├── package.json               # Node.js Dependencies & Scripts
│   ├── index.html                 # HTML Root Entry
│   ├── vite.config.js             # Vite Configuration
│   └── src/                       # Refactored Modular React Architecture
│       ├── main.jsx               # React DOM Rendering Entry
│       ├── App.jsx                # Application Frame & Navigation State
│       ├── api/                   # API HTTP Service Layer
│       ├── components/            # Reusable UI Components
│       │   ├── Header.jsx         # App Navigation & Theme Toggle
│       │   ├── StatsRow.jsx       # Real-Time Inventory Metrics
│       │   ├── AlertBanner.jsx    # Actionable Refrigeration Alerts
│       │   ├── Dashboard.jsx      # Inventory Cards & Search Controls
│       │   ├── UploadTab.jsx      # Image Upload & Prediction Result View
│       │   ├── AnalyticsTab.jsx   # Interactive Degradation Timeline
│       │   └── LogisticsTab.jsx   # DSS Dispatch Command Matrix
│       ├── utils/                 # Formatting & Helper Utilities
│       └── styles.css             # Glassmorphic Styling System
└── data_prep/                     # Computer Vision Dataset Tools
    ├── README.md                  # Dataset Augmentation Guide
    └── augment_and_rename_produce.py # Dataset Preparation Script
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.9 or higher
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
> The API server will be available at `http://127.0.0.1:8000` (Swagger docs available at `http://127.0.0.1:8000/docs`).

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Run Vite development server
npm run dev
```
> Access the web dashboard at `http://localhost:5173`.

---

## 📡 API Reference Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/dashboard` | Fetch all tracked produce items with latest freshness status |
| `GET` | `/dashboard/stats` | Retrieve real-time inventory aggregated KPI metrics |
| `GET` | `/products/{id}/timeline` | Retrieve chronological shelf-life degradation history for a batch |
| `POST` | `/uploads` | Upload produce images for multi-mode model inference and storage |
| `GET` | `/history` | Search global audit trail of capture events |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request for improvements, feature requests, or bug fixes.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
