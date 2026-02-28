from app import create_app

app = create_app()

# Run the App (Only once, at the very end)
if __name__ == '__main__':
    # You had two app.run blocks; I kept the one with port 8080
    app.run(debug=True, port=8080)