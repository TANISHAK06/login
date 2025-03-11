import os
from dotenv import load_dotenv
import json
import openai
import smtplib
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from twilio.rest import Client
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import requests
from bs4 import BeautifulSoup
from flask_cors import CORS
import pandas as pd
from io import BytesIO
import traceback

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "allow_headers": "*", "expose_headers": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}})

# Use MySQL or fallback to SQLite
db_uri = os.environ.get("MYSQL_URI", "sqlite:///poc.db")
app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# ----- MODELS -----
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)  # required
    description = db.Column(db.Text)
    due_date = db.Column(db.String(50))

    def as_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date
        }

# ----- UTILITY FUNCTIONS -----

def send_email(recipient, subject, body, schedule_time=None, attachment=None):
    sender_email = os.environ.get('SENDER_EMAIL')
    sender_password = os.environ.get('SENDER_PASSWORD')
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))

    message = MIMEMultipart()
    message['From'] = sender_email
    message['To'] = recipient
    message['Subject'] = subject
    message.attach(MIMEText(body, 'plain'))

    if attachment:
        try:
            with open(attachment, 'rb') as file:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(file.read())
            encoders.encode_base64(part)
            part.add_header('Content-Disposition',
                            f'attachment; filename="{os.path.basename(attachment)}"')
            message.attach(part)
        except Exception as e:
            return False, f"Attachment error: {e}"

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient, message.as_string())
        return True, "Email sent successfully."
    except Exception as e:
        return False, str(e)

# ----- CRUD for Task Management -----

def create_task(data):
    title = data.get('title')
    if not title or title.strip() == "":
        return False, "Title cannot be null or empty."
    try:
        new_task = Task(
            title=title.strip(),
            description=data.get('description', ''),
            due_date=data.get('due_date', '')
        )
        db.session.add(new_task)
        db.session.commit()
        return True, new_task.as_dict()
    except Exception as e:
        db.session.rollback()
        return False, str(e)

def read_task(data):
    task_id = data.get('id')
    if task_id:
        try:
            task_id = int(task_id)
        except ValueError:
            return False, f"Task id '{task_id}' is not a valid integer."
        task = Task.query.get(task_id)
        if task:
            return True, task.as_dict()
        else:
            return False, f"Task with id {task_id} not found."
    else:
        # read all tasks
        tasks = Task.query.all()
        return True, [t.as_dict() for t in tasks]

def update_task(data):
    task_id = data.get('id')
    if not task_id:
        return False, "Task id not provided."
    try:
        task_id = int(task_id)
    except ValueError:
        return False, f"Task id '{task_id}' is not a valid integer."
    task = Task.query.get(task_id)
    if not task:
        return False, f"Task with id {task_id} not found."
    try:
        if 'title' in data:
            new_title = data.get('title')
            if not new_title or new_title.strip() == "":
                return False, "Title cannot be empty."
            task.title = new_title.strip()
        if 'description' in data:
            task.description = data['description']
        if 'due_date' in data:
            task.due_date = data['due_date']
        db.session.commit()
        return True, task.as_dict()
    except Exception as e:
        db.session.rollback()
        return False, str(e)

def delete_task(data):
    task_id = data.get('id')
    if not task_id:
        return False, "Task id not provided."
    try:
        task_id = int(task_id)
    except ValueError:
        return False, f"Task id '{task_id}' is not a valid integer."
    task = Task.query.get(task_id)
    if not task:
        return False, f"Task with id {task_id} not found."
    try:
        db.session.delete(task)
        db.session.commit()
        return True, f"Task with id {task_id} deleted."
    except Exception as e:
        db.session.rollback()
        return False, str(e)

# ----- Web Scraping (News) -----
def perform_scraping_news(query_details):
    api_key = os.environ.get("NEWSAPI_KEY")
    if not api_key:
        return False, "Missing NEWSAPI_KEY environment variable."
    url = "https://newsapi.org/v2/top-headlines"
    params = {
        "country": "us",
        "apiKey": api_key,
        "q": query_details
    }
    try:
        response = requests.get(url, params=params)
        if response.status_code != 200:
            return False, f"NewsAPI request failed with status code: {response.status_code}"
        data = response.json()
        if data.get("status") != "ok":
            return False, f"NewsAPI returned error: {data.get('message')}"
        articles = data.get("articles", [])
        headlines = [article.get("title") for article in articles if article.get("title")]
        if not headlines:
            return False, "No headlines found."
        return True, headlines[:10]
    except Exception as e:
        return False, str(e)

def perform_scraping(target, query_details):
    if target.lower() == "news":
        return perform_scraping_news(query_details)
    elif target.lower() == "stocks":
        return True, f"Simulated stock data for query '{query_details}'."
    elif target.lower() == "weather":
        return True, f"Simulated weather info for query '{query_details}'."
    else:
        return False, "Unsupported scraping target."

# ----- Messaging (WhatsApp/Telegram) -----
def send_whatsapp_message(recipient, message_text):
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    from_whatsapp_number = os.environ.get('TWILIO_WHATSAPP_NUMBER')
    if not (account_sid and auth_token and from_whatsapp_number):
        return False, "Missing Twilio configuration in environment variables."
    client = Client(account_sid, auth_token)
    try:
        message = client.messages.create(
            body=message_text,
            from_=from_whatsapp_number,
            to=f'whatsapp:{recipient}'
        )
        return True, f"WhatsApp message sent with SID {message.sid}"
    except Exception as e:
        return False, str(e)

def send_message(platform, recipient, message_text):
    if platform.lower() == "whatsapp":
        return send_whatsapp_message(recipient, message_text)
    elif platform.lower() == "telegram":
        return True, f"Telegram message simulated to {recipient}: {message_text}"
    else:
        return False, "Unsupported messaging platform."

# ----- Payment Gateway (Razorpay simulation) -----
def process_payment(amount, currency, order_id, description):
    # In a real integration, you'd call Razorpay's API here.
    return True, f"Processed payment of {amount} {currency} for order {order_id}. Description: {description}"

# ----- OPENAI INTEGRATION -----
def get_action_from_llm(query):
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    messages = [

        {

            "role": "system",

            "content": (

                "You can handle these actions:\n"

                "1) email\n"

                "2) task\n"

                "3) scrape\n"

                "4) message\n"

                "5) payment\n"

                "6) chat (for normal conversation)\n\n"

                "If the user is just greeting or saying 'Hello', produce:\n"

                "{\n"

                "  \"action\": \"chat\",\n"

                "  \"body\": \"Hi there! How can I help you today?\"\n"

                "}\n\n"

                "For an email, you MUST include 'recipient', 'subject', 'body'.\n"

                "For a task, 'operation' must be exactly one of: 'create', 'read', 'update', 'delete'.\n"

                "For a payment, you MUST provide 'amount' or fallback defaults.\n"

                "For a message, you MUST produce 'platform', 'recipient', 'message'.\n"

                "Output only valid JSON.\n"

            )

        },

        {"role": "user", "content": f'Query: "{query}"'}

    ]
 
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=300,
            temperature=0.0,
            top_p=1,
        )

        text = response.choices[0].message.content.strip()
        action_data = json.loads(text)  # Ensure response is valid JSON
        return True, action_data

    except json.JSONDecodeError:
        return False, "Invalid JSON response from LLM"

    except Exception as e:
        return False, traceback.format_exc()

# ----- MAIN ENDPOINT -----
@app.route('/action', methods=['POST'])
def handle_action():
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({"error": "No query provided."}), 400

    query = data['query']
    success, result = get_action_from_llm(query)
    if not success:
        return jsonify({"error": "Failed to process query", "details": result}), 500

    action = result.get('action')
    known_actions = ['email', 'task', 'scrape', 'message', 'payment', 'chat']

    if not action or action not in known_actions:
        fallback_response = result.get('body', "I'm sorry, I didn't understand that. Can you please rephrase?")
        return jsonify({"message": fallback_response}), 200

    if action == 'chat':
        chat_reply = result.get('body', "Hello! How can I help you?")
        return jsonify({"message": chat_reply}), 200

    elif action == 'email':
        sub_action = result.get('sub_action', 'send')
        recipient = result.get('recipient')
        subject = result.get('subject')
        body = result.get('body') or "No body provided."
        schedule_time = result.get('schedule_time')
        attachment = result.get('attachment')
        if not recipient or not subject or not body.strip():
            return jsonify({"error": "Incomplete email details."}), 400
        success, res = send_email(recipient, subject, body, schedule_time, attachment)
        if success:
            return jsonify({"message": f"Email {sub_action} operation successful.", "result": res}), 200
        else:
            return jsonify({"error": "Email operation failed.", "details": res}), 500

    elif action == 'task':
        # 1. Attempt to read 'operation'
        operation = (result.get('operation') or '').lower()

        # 2. Map synonyms to official ops
        op_map = {
            'createtask': 'create', 'add': 'create', 'new': 'create',
            'readtask': 'read', 'get': 'read', 'show': 'read',
            'updatetask': 'update', 'modify': 'update',
            'deletetask': 'delete', 'remove': 'delete'
        }
        if operation in op_map:
            operation = op_map[operation]

        # 3. If STILL no recognized operation, guess one based on presence of fields
        if operation not in ['create', 'read', 'update', 'delete']:
            # If there's a "task_id" or "id" plus new fields => "update", 
            # if there's a "task_id" or "id" with no new fields => "read", 
            # if there's a "title" but no id => "create", 
            # else default to "read" all
            has_title = 'title' in result or ('data' in result and 'title' in result['data'])
            has_description = 'description' in result or ('data' in result and 'description' in result['data'])
            has_due_date = 'due_date' in result or ('data' in result and 'due_date' in result['data'])

            # unify id or task_id into data_payload
            data_payload = result.get('data', {})
            # if top-level "task_id" or "id" not in data, copy it
            for possible_id_key in ['task_id', 'taskId', 'id']:
                if possible_id_key in result and 'id' not in data_payload:
                    data_payload['id'] = result[possible_id_key]

            # guess logic
            if 'id' in data_payload:
                if has_title or has_description or has_due_date:
                    operation = 'update'
                else:
                    operation = 'read'
            else:
                if has_title:
                    operation = 'create'
                else:
                    operation = 'read'

            # 4. Prepare data payload (merging top-level if missing)
            data_payload = result.get('data', {})
            # unify top-level fields into data if absent
            for possible_id_key in ['task_id', 'taskId', 'id']:
                if possible_id_key in result and 'id' not in data_payload:
                    data_payload['id'] = result[possible_id_key]
            if 'title' in result and 'title' not in data_payload:
                data_payload['title'] = result['title']
            if 'description' in result and 'description' not in data_payload:
                data_payload['description'] = result['description']
            if 'due_date' in result and 'due_date' not in data_payload:
                data_payload['due_date'] = result['due_date']

            # 5. Execute the recognized operation
            if operation == 'create':
                success, res = create_task(data_payload)
            elif operation == 'read':
                success, res = read_task(data_payload)
            elif operation == 'update':
                success, res = update_task(data_payload)
            elif operation == 'delete':
                success, res = delete_task(data_payload)
            else:
                return jsonify({
                    "error": "Invalid task operation specified.",
                    "result": result
                }), 400

            if success:
                return jsonify({"message": "Task operation successful.", "result": res}), 200
            else:
                return jsonify({"error": "Task operation failed.", "details": res}), 500

    elif action == 'scrape':
        target = result.get('target')
        query_details = result.get('query')
        if not target or not query_details:
            return jsonify({"error": "Incomplete scraping details."}), 400
        success, res = perform_scraping(target, query_details)
        if success:
            return jsonify({"message": "Scraping successful.", "result": res}), 200
        else:
            return jsonify({"error": "Scraping failed.", "details": res}), 500

    elif action == 'message':
        platform = result.get('platform')
        recipient = result.get('recipient')
        message_text = result.get('message')
        if not platform or not recipient or not message_text:
            return jsonify({"error": "Incomplete messaging details."}), 400
        success, res = send_message(platform, recipient, message_text)
        if success:
            return jsonify({"message": "Messaging operation successful.", "result": res}), 200
        else:
            return jsonify({"error": "Messaging operation failed.", "details": res}), 500

    elif action == 'payment':
        # fallback defaults if missing
        amount = result.get('amount')
        currency = result.get('currency') or "INR"
        order_id = result.get('order_id') or "testOrder"
        description = result.get('description') or "Simulated Payment"

        # Must at least have an amount
        if not amount:
            return jsonify({"error": "Incomplete payment details."}), 400

        success, res = process_payment(amount, currency, order_id, description)
        if success:
            # Overridden success message for test payments
            return jsonify({
                "message": "Simulated payment transfer successful, but it will not be credited in your account because it's a test payment",
                "result": res
            }), 200
        else:
            return jsonify({"error": "Payment processing failed.", "details": res}), 500
    else:
        fallback_response = result.get('body', "I'm sorry, I didn't understand that. Please try again.")
        return jsonify({"message": fallback_response}), 200
    

# ----- RUN APPLICATION -----
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
