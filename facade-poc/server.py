from flask import Flask, jsonify, request
import ssl

app = Flask(__name__)

# Hardcoded API key
API_KEY = "TEST-API-KEY"
HEADER_NAME = "X-API-Key"

# Unsecured endpoint
@app.route('/unsecured', methods=['GET'])
def unsecured():
    data = {'message': 'This is an unsecured endpoint.'}
    return jsonify(data)

# Secured endpoint
@app.route('/secured', methods=['GET'])
def endpoint2():
    # Check if API key is provided in the request headers
    provided_api_key = request.headers.get(HEADER_NAME)

    # API key is invalid, return send unauthorized
    if provided_api_key != API_KEY:
        return jsonify({'error': 'Unauthorized access. Invalid API key.'}), 401


    data = {'message': 'This is a secured endpoint.'}
    return jsonify(data)

if __name__ == '__main__':
    # Generate SSL context
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain('certificates/server.crt', 'certificates/server.key')  # Provide paths to your certificate and private key files

    # Run Flask app with TLS/SSL enabled
    app.run(debug=True, ssl_context=context)
