# 🚀 Food Donation and Redistribution System (FDRS)

This project consists of two main parts:

- **Backend**: Django (`/backend` directory)
- **Frontend**: React + Vite (`/frontend` directory)

---

## 🐍 Backend Setup (Django)

### 1. Navigate to the backend directory:

```bash
cd backend
```

### 2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies:

```bash
pip install -r requirements.txt
```

### 4. Apply migrations and create superuser:

```bash
python manage.py migrate
python manage.py createsuperuser
```

### 5. Run the development server:

```bash
python manage.py runserver
```

> Backend runs at: `http://127.0.0.1:8000/`

---

## ⚛️ Frontend Setup (React + Vite)

### 1. Navigate to the frontend directory:

```bash
cd frontend
```

### 2. Install dependencies:

```bash
npm install
```

### 3. Run the development server:

```bash
npm run dev
```

> Frontend runs at: `http://localhost:5173/`

---

## 🌐 CORS Setup

In your `settings.py` for Django, ensure the following is configured:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]
```

Install the middleware if needed:

```bash
pip install django-cors-headers
```

---

## ✅ You're all set!

Your Django backend and React frontend are now connected and ready to use locally.
