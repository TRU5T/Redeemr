#!/bin/bash

echo "Setting up Redeemr application..."

# Create and activate virtual environment
echo "Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate

# Install required packages
echo "Installing backend dependencies..."
pip install fastapi sqlalchemy uvicorn python-jose[cryptography] passlib[bcrypt] python-multipart

# Create the database tables and a test user
echo "Initializing database..."
python3 -c "from database import Base, engine; import models; Base.metadata.create_all(bind=engine)"
python3 create_test_user.py

# Start the backend server
echo "Starting backend server..."
echo "Backend will be available at http://localhost:8000"
uvicorn main:app --reload &
BACKEND_PID=$!

# Change to the frontend directory and install dependencies
echo "Setting up frontend..."
cd ../frontend
echo "Installing frontend dependencies..."
npm install

# Start the frontend
echo "Starting frontend server..."
echo "Frontend will be available at http://localhost:3000"
npm start &
FRONTEND_PID=$!

echo "Setup complete! Services are running."
echo "Test user has been created:"
echo "  Email: test@example.com"
echo "  Password: password123"

# Wait for user to press Ctrl+C
echo "Press Ctrl+C to stop the servers"
wait $BACKEND_PID $FRONTEND_PID 