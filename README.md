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

### 4. Configure PostgreSQL database

Ensure your PostgreSQL database is set up and update the `DATABASES` setting in `backend/settings.py`:

```python
# settings.py

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_db_name',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

Install the required PostgreSQL driver:

```bash
pip install psycopg2-binary
```

### 5. Apply migrations and create a superuser:

```bash
python manage.py migrate
python manage.py createsuperuser
```

### 6. Run the development server:

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

## ✅ You're all set!


