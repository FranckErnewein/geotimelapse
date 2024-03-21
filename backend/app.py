import json
from flask import Flask, jsonify, abort
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
                 
