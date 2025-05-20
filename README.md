# LazyCashier

A modern receipt management system that helps businesses track their revenue, expenses, and profits through OCR technology.

## Features

- 📸 Receipt scanning with OCR
- 💰 Revenue tracking
- 💸 Expense management
- 📊 Analytics dashboard
- 📱 Responsive design
- 🔥 Real-time updates with Firebase

## Tech Stack

- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Python (FastAPI)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- Firebase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/LazyCashier.git
cd LazyCashier
```

2. Install frontend dependencies:

```bash
npm install
```

3. Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

4. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

5. Start the development servers:

Frontend:

```bash
npm run dev
```

Backend:

```bash
cd backend
uvicorn main:app --reload
```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Sign in with your credentials
3. Start scanning receipts and managing your business finances

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
