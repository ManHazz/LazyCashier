# LazyCashier Backend

This is the backend service for the LazyCashier application, built with FastAPI.

## Setup

1. Create a virtual environment:

```bash
python -m venv venv
```

2. Activate the virtual environment:

- Windows:

```bash
.\venv\Scripts\activate
```

- Unix/MacOS:

```bash
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

## Running the Server

Start the development server:

```bash
python main.py
```

The server will start at `http://localhost:8000`

## API Endpoints

- `GET /`: Welcome message
- `GET /api/analytics`: Get analytics data
- `POST /api/analytics/expenses`: Update expenses
- `GET /api/analytics/profit`: Get profit calculation

## API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
