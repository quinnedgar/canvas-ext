from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import socket
import subprocess
import time
import os, signal, threading

######## NOTE: Windows: Install ollama on PATH or subprocess will fail
### Windows winget search ollama, winget install Ollama.Ollama

def check_port(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

if not check_port(11434):
    ollama_process = subprocess.Popen(
    ['ollama', 'serve'], 
    stdout=subprocess.PIPE, 
    stderr=subprocess.PIPE
    )
    print(f'Starting Ollama on PID: {ollama_process.pid}')


app = Flask(__name__)
CORS(app)

OLLAMA_URL = "http://localhost:11434/api/generate" #http://10.0.0.30:5000/api/endpoint
OLLAMA_MODEL = "gemma3" 

prompt_direction = 'Respond in a JSON object format. Include two things in this object, a key called "answer" and a key called "confidence". The value of the "answer" key should be the answer to the question, and the value of the "confidence" key should be a decimal representing your confidence in the correctness of this answer. Approach creating the confidence key with objective neutrality and accuracy as the priority. Do not include any other text or formatting in your response. Do not include any other keys in your response. Do not include any other text in your response. Do not include any other formatting in your response.'

def is_subsequence(sub, string):
    it = iter(string)
    return all(char in it for char in sub)

def sanitize_return(s):
    if s.startswith("```"):
        s = s.strip("`").strip()

    if s.startswith("json\n"):
        s = s[len("json\n"):]

    if not s.strip().startswith("{"):
        s = "{" + s + "}"


    try:
        parsed = json.loads(s)
        if 'answer' in parsed:
            parsed['answer'] = parsed['answer'].replace('\u00ad', '').replace('\xad', '')
        return parsed
    except json.JSONDecodeError as e:
        print(f"[ERROR] Failed to parse model response: {e}")
        print(f"[DEBUG] raw_model_result = {s}")
        return {}



@app.route('/receive', methods=['POST'])
def receive():
    body = request.json
    question = body['question']
    choices = body['choices']
    
    question_obj = {
        "question": question,
        "answer_choices": choices
    }

    prompt = f"{json.dumps(question_obj)}, {prompt_direction}"
    global response

    try:
        response = requests.post(OLLAMA_URL, json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
            #"format": "json"
        })
    
    except Exception as e:
        print(f"\n Exception: {e}\n")
        return jsonify({"error": "Ollama API Query Fail"}), 500

    if response.status_code != 200: 
        return jsonify({"error": "Ollama API Query Fail"}), 500

    print("-------------------------------------------------------------------")
    raw_model_result = response.json().get('response', '').strip()
    print(f"Raw Model Result: {raw_model_result}\n")
    model_result = sanitize_return(raw_model_result)
    print(f"Sanitized Model Result: {model_result}")
    print("-------------------------------------------------------------------\n")

    for c in choices:
        if is_subsequence(c, model_result):
            #print(f"--> Found: {c}\n")
            return jsonify({"answer": c})
     
    #print(f"--> Unfound: {model_result}\n")
    return jsonify({"response": model_result})

    
@app.route('/shutdown', methods=['POST'])
def shutdown():
    def shutdown_app():
        time.sleep(1)
        os.kill(os.getpid(), signal.SIGINT)

    threading.Thread(target=shutdown_app, daemon=True).start()
    
    return 'Server shutting down...', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

