import os
import json
import requests
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', '')
DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

KNOWLEDGE_PATH = os.path.join(os.path.dirname(__file__), 'knowledge', 'ai_basics.json')

SYSTEM_PROMPT = (
    '你是一位面向小学3-4年级学生的AI知识问答助手。'
    '你的任务是用简单易懂的语言回答学生关于人工智能的问题。\n\n'
    '回答要求：\n'
    '1. 使用小学生能理解的词汇，避免专业术语\n'
    '2. 举生活中的例子帮助理解\n'
    '3. 回答简洁，不超过100字\n'
    '4. 语气亲切友好，像一位耐心的老师\n'
    '5. 鼓励学生思考和探索'
)


def load_knowledge_base():
    try:
        with open(KNOWLEDGE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def find_local_answer(question, knowledge_base):
    question_lower = question.strip().lower()
    for item in knowledge_base:
        q = item.get('question', '').strip().lower()
        if q and (q == question_lower or q in question_lower or question_lower in q):
            return item.get('answer', '')
    return None


def call_deepseek_api(message):
    if not DEEPSEEK_API_KEY or DEEPSEEK_API_KEY == 'your_api_key_here':
        return None

    try:
        response = requests.post(
            DEEPSEEK_API_URL,
            headers={
                'Authorization': f'Bearer {DEEPSEEK_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'deepseek-chat',
                'messages': [
                    {'role': 'system', 'content': SYSTEM_PROMPT},
                    {'role': 'user', 'content': message}
                ],
                'max_tokens': 150,
                'temperature': 0.7,
                'stream': False
            },
            timeout=15
        )

        if response.status_code == 200:
            data = response.json()
            return data['choices'][0]['message']['content']
        else:
            print(f'DeepSeek API error: {response.status_code} - {response.text}')
            return None

    except requests.exceptions.Timeout:
        print('DeepSeek API timeout')
        return None
    except requests.exceptions.RequestException as e:
        print(f'DeepSeek API request failed: {e}')
        return None


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': '请输入问题'}), 400

    user_message = data['message'].strip()
    if not user_message:
        return jsonify({'error': '问题不能为空'}), 400

    if len(user_message) > 500:
        return jsonify({'error': '问题太长了，请简短一些吧！'}), 400

    knowledge_base = load_knowledge_base()
    local_answer = find_local_answer(user_message, knowledge_base)

    if local_answer:
        return jsonify({'reply': local_answer, 'source': 'local'})

    api_reply = call_deepseek_api(user_message)

    if api_reply:
        return jsonify({'reply': api_reply, 'source': 'deepseek'})

    fallback = (
        '这个问题有点难到我了！不过我可以告诉你，'
        '人工智能是一个非常有趣的领域，它让电脑变得更聪明，'
        '能帮助我们做很多事情。你可以试试问问其他问题哦！'
    )
    return jsonify({'reply': fallback, 'source': 'fallback'})


if __name__ == '__main__':
    print('AI 小助手启动中...')
    if not DEEPSEEK_API_KEY or DEEPSEEK_API_KEY == 'your_api_key_here':
        print('提示：未配置 DEEPSEEK_API_KEY，将使用本地知识库和默认回答。')
    print('访问地址：http://127.0.0.1:5000')
    app.run(debug=True, host='127.0.0.1', port=5000)
