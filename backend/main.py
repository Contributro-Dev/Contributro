from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

@app.route('/api/users', methods=['GET'])
def users():
    return jsonify({"users": ["Krrish", "Ishika", "Sanket"]})

if __name__ == '__main__':
    app.run(debug=True, port=8080)