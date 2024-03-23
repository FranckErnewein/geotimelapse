import json
import requests
import zlib
from flask import Flask, jsonify, abort, stream_with_context, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.errorhandler(404)
def not_found(e):
    return jsonify(code=404, name="Not Found", message="Ressource not found")

@app.route("/api/ping", methods=['GET'])
def ping():
    return jsonify(ping="pong")

with open('all_config.json') as all_config_file:
  all_config = json.load(all_config_file)

@app.route("/api/config/<id>", methods=['GET'])
def config(id):
    for config in all_config:
        if(config['id'] == id):
            return jsonify(config)
    abort(404)
                 

@app.route("/api/csv/<id>", methods=["GET"])
def csv(id):
    for config in all_config:
        if(config['id'] == id):
            url=config['csv']
            csvResponse = requests.get(url, stream=True)
            if csvResponse.status_code != 200:
                abort(404)
            decompressor = zlib.decompressobj(32 + zlib.MAX_WBITS)

            def generate_decompressed_content():
                for chunk in csvResponse.iter_content(chunk_size=1024):
                    yield decompressor.decompress(chunk)
                yield decompressor.flush()

            response = Response(generate_decompressed_content(), mimetype='text/csv')
            response.headers['Access-Control-Expose-Headers'] = 'Content-Range'
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response
    abort(404)
