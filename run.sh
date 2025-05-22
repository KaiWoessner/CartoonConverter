# Use ./run.sh to run web app

# Start Flask backend
# cd backend
# source venv/bin/activate
# echo "Starting backend..."
# python app.py &
# cd ..

# # Start React frontend
# cd frontend
# echo "Starting frontend..."
# npm run dev



# ===== Manan's run script ==========
# Use ./run.sh to run web app

# Start Flask backend
cd backend
#source venv/bin/activate
echo "Starting backend..."
python3 app.py &
cd ..

# Start React frontend
cd frontend
echo "Starting frontend..."
npm run dev