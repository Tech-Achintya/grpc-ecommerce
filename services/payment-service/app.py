from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "service": "payment-service",
        "status": "UP"
    })

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)