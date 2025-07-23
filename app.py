from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)

@app.route('/')
def login():
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/buscar')
def buscar():
    termo = request.args.get('termo', '')
    if not termo:
        return jsonify({"erro": "Termo de busca não informado"}), 400

    url = f"https://duckduckgo.com/html/?q={termo}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }

    try:
        res = requests.get(url, headers=headers)
        res.raise_for_status()

        soup = BeautifulSoup(res.text, 'html.parser')
        resultados = []

        for result in soup.select('.result__body'):
            titulo = result.select_one('.result__title')
            link = result.select_one('.result__a')
            snippet = result.select_one('.result__snippet')

            if titulo and link:
                resultados.append({
                    "titulo": titulo.get_text(strip=True),
                    "link": link['href'],
                    "descricao": snippet.get_text(strip=True) if snippet else ""
                })

            if len(resultados) >= 10:
                break

        return jsonify({"resultados": resultados})

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
