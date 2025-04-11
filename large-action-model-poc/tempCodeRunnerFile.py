import os
from dotenv import load_dotenv
import json
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
from groq import Groq
import datetime
import re
from dateutil import parser
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from email.mime.text import MIMEText
import base64
import os
from werkzeug.utils import secure_filename
import PyPDF2
import pandas as pd
import pytesseract
import magic
from docx import Document
from PIL import Image

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app,
     resources={
         r"/*": {
             "origins": "*",
             "allow_headers": "*",
             "expose_headers": "*",
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
         }
     })

# Use MySQL or fallback to SQLite
db_uri = os.environ.get("MYSQL_URI", "sqlite:///poc.db")
app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# OAuth 2.0 scopes for Google Calendar
SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.modify'
]
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'csv', 'docx', 'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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


# ------ Remember Chat History --------------#


class ChatHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50))
    role = db.Column(db.String(20))  # "user" or "assistant"
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)


# ----- UTILITY FUNCTIONS -----


def send_email(recipient, subject, body, schedule_time=None, attachment=None):
    sender_email = os.environ.get('SENDER_EMAIL')
    sender_password = os.environ.get('SENDER_PASSWORD')
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))

    if not all([sender_email, sender_password]):
        return False, "Missing email configuration in environment variables."

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
            part.add_header(
                'Content-Disposition',
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
        new_task = Task(title=title.strip(),
                        description=data.get('description', ''),
                        due_date=data.get('due_date', ''))
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
    params = {"country": "us", "apiKey": api_key, "q": query_details}
    try:
        response = requests.get(url, params=params)
        if response.status_code != 200:
            return False, f"NewsAPI request failed with status code: {response.status_code}"
        data = response.json()
        if data.get("status") != "ok":
            return False, f"NewsAPI returned error: {data.get('message')}"
        articles = data.get("articles", [])
        headlines = [
            article.get("title") for article in articles
            if article.get("title")
        ]
        if not headlines:
            return False, "No headlines found."
        return True, headlines[:10]
    except Exception as e:
        return False, str(e)


# ----- Web Scraping for Summarization -----
def scrape_and_summarize(url):
    try:
        # Check if GROQ API key is available
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            return False, "Missing GROQ_API_KEY environment variable."

        # Fetch the webpage content
        headers = {
            "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an error for bad status codes

        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract text from the webpage
        text = " ".join([p.get_text() for p in soup.find_all('p')
                         ])  # Extract text from <p> tags
        if not text:
            return False, "No text found on the webpage."

        # Summarize the text using the LLM
        client = Groq(api_key=groq_api_key)
        messages = [
            {
                "role":
                "system",
                "content":
                "You are a helpful assistant that summarizes web content. Provide a concise summary of the following text."
            },
            {
                "role": "user",
                "content": f"Summarize this text: {text[:9000]}"
            }  # Limit input to 10000 characters
        ]

        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=messages,
            max_tokens=300,
            temperature=0.0,
            top_p=1,
        )

        summary = response.choices[0].message.content.strip()
        return True, summary

    except requests.RequestException as e:
        return False, f"Failed to fetch the webpage: {str(e)}"
    except Exception as e:
        return False, f"An error occurred: {str(e)}"


# ----- Web Search using SerpApi -----
def perform_web_search(query, api_key):
    """
    Perform a web search using SerpApi.
    """
    params = {
        "q": query,  # User's search query
        "api_key": api_key,  # SerpApi API key
        "engine": "google"  # Use Google as the search engine
    }

    try:
        response = requests.get("https://serpapi.com/search", params=params)
        response.raise_for_status()  # Raise an error for bad status codes
        data = response.json()

        # Extract and format search results
        if "organic_results" in data:
            results = []
            for result in data["organic_results"]:
                results.append({
                    "title":
                    result.get("title", "No title"),
                    "link":
                    result.get("link", "No link"),
                    "snippet":
                    result.get("snippet", "No description")
                })
            return True, results
        else:
            return False, "No search results found."
    except Exception as e:
        return False, str(e)


# ----- Messaging (WhatsApp/Telegram) -----
def send_whatsapp_message(recipient, message_text):
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    from_whatsapp_number = os.environ.get('TWILIO_WHATSAPP_NUMBER')

    if not (account_sid and auth_token and from_whatsapp_number):
        return False, "Missing Twilio configuration in environment variables."

    client = Client(account_sid, auth_token)
    try:
        # Format the recipient number correctly
        if not recipient.startswith('whatsapp:'):
            to_number = f'whatsapp:{recipient}'
        else:
            to_number = recipient

        message = client.messages.create(
            body=message_text,
            from_=f'whatsapp:{from_whatsapp_number}'
            if not from_whatsapp_number.startswith('whatsapp:') else
            from_whatsapp_number,
            to=to_number)

        # Check for potential error flags in the message status
        if message.status in ['failed', 'undelivered']:
            return False, f"Message creation succeeded but delivery failed. Status: {message.status}, Error: {message.error_message}"

        return True, f"WhatsApp message sent with SID {message.sid}, Status: {message.status}"
    except Exception as e:
        return False, f"Twilio Error: {str(e)}"


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


# ----- CALENDAR INTEGRATION -----
def get_calendar_service():
    """Get authenticated Google Calendar service."""
    creds = None
    token_path = os.environ.get('GOOGLE_TOKEN_PATH', 'token.json')
    credentials_path = os.environ.get('GOOGLE_CREDENTIALS_PATH',
                                      'credentials.json')

    # Check if token already exists
    if os.path.exists(token_path):
        try:
            creds = Credentials.from_authorized_user_file(token_path, SCOPES)
        except Exception as e:
            print(f"Error loading credentials: {e}")
            creds = None

    # If there are no valid credentials, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"Error refreshing token: {e}")
                creds = None
        else:
            if not os.path.exists(credentials_path):
                return False, "Missing Google Calendar credentials file."
            try:
                flow = InstalledAppFlow.from_client_secrets_file(
                    credentials_path, SCOPES)
                creds = flow.run_local_server(
                    port=0,
                    open_browser=True)  # Ensure the browser opens for OAuth
            except Exception as e:
                print(f"Error during OAuth flow: {e}")
                return False, f"OAuth flow failed: {str(e)}"

        # Save the credentials for the next run
        with open(token_path, 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('calendar', 'v3', credentials=creds)
        return True, service
    except Exception as e:
        print(f"Error building calendar service: {e}")
        return False, f"Failed to build calendar service: {str(e)}"


def parse_meeting_details(meeting_data):
    """Parse meeting details from calendar request data."""
    title = meeting_data.get('title', 'Untitled Meeting')
    description = meeting_data.get('description', '')
    location = meeting_data.get('location', '')
    date_str = meeting_data.get('date', '')
    time_str = meeting_data.get('time', '')
    duration_str = meeting_data.get('duration', '1 hour')
    attendees_list = meeting_data.get('attendees', [])
    phone_numbers = meeting_data.get('phone_numbers',
                                     [])  # New: Extract phone numbers

    # Parse date and time
    try:
        # Try to parse combined date and time if available
        if date_str and time_str:
            datetime_str = f"{date_str} {time_str}"
            start_time = parser.parse(datetime_str)
        elif date_str:
            # If only date is provided, default to noon
            start_time = parser.parse(date_str)
            default_time = datetime.time(12, 0)
            start_time = datetime.datetime.combine(start_time.date(),
                                                   default_time)
        else:
            # If no date/time, use tomorrow at noon
            tomorrow = datetime.date.today() + datetime.timedelta(days=1)
            start_time = datetime.datetime.combine(tomorrow,
                                                   datetime.time(12, 0))

        # Parse duration
        duration_hours = 1  # Default 1 hour
        if duration_str:
            duration_match = re.search(r'(\d+)\s*(?:hour|hr)', duration_str,
                                       re.IGNORECASE)
            if duration_match:
                duration_hours = int(duration_match.group(1))

            # Check for minutes
            minutes_match = re.search(r'(\d+)\s*(?:minute|min)', duration_str,
                                      re.IGNORECASE)
            minutes = 0
            if minutes_match:
                minutes = int(minutes_match.group(1))
                duration_hours += minutes / 60

        end_time = start_time + datetime.timedelta(hours=duration_hours)

        return True, {
            'title': title,
            'description': description,
            'location': location,
            'start_time': start_time,
            'end_time': end_time,
            'attendees': attendees_list,
            'phone_numbers':
            phone_numbers  # New: Include phone numbers in the result
        }
    except Exception as e:
        return False, f"Failed to parse meeting details: {str(e)}"


def add_calendar_event(meeting_data):
    """Add a calendar event using Google Calendar API with conflict checking."""
    try:
        # Get calendar service
        success, service_or_error = get_calendar_service()
        if not success:
            return False, service_or_error  # Return error message or auth info

        # If auth is required, return the auth info
        if isinstance(service_or_error, dict) and service_or_error.get('auth_required'):
            return False, service_or_error

        service = service_or_error  # If successful, service_or_error contains the service

        # Parse meeting details
        success, details = parse_meeting_details(meeting_data)
        if not success:
            return False, details  # Error message

        # Check for existing events in this time slot
        calendar_id = 'primary'
        start_time = details['start_time'].isoformat() + 'Z'  # Convert to UTC
        end_time = details['end_time'].isoformat() + 'Z'      # Convert to UTC

        # Query for existing events in this time range
        events_result = service.events().list(
            calendarId=calendar_id,
            timeMin=start_time,
            timeMax=end_time,
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        existing_events = events_result.get('items', [])

        # If there are existing events, return them for user confirmation
        if existing_events:
            conflict_messages = []
            for event in existing_events:
                event_start = event['start'].get(
                    'dateTime', event['start'].get('date'))
                event_end = event['end'].get(
                    'dateTime', event['end'].get('date'))
                conflict_messages.append(
                    f"Meeting '{event.get('summary', 'Untitled')}' "
                    f"(Description: {event.get('description', 'No description')}) "
                    f"already scheduled from {event_start} to {event_end}"
                )

            conflict_message = " ".join(conflict_messages)
            return False, {
                'conflict': True,
                'message': f"{conflict_message}. If you want to schedule anyway, say 'yes'. Otherwise say 'no'.",
                'existing_events': existing_events,
                'proposed_event': details
            }

        # Format attendees
        attendees = [{'email': email}
            for email in details['attendees']] if details['attendees'] else []

        # Create event
        event = {
            'summary': details['title'],
            'location': details['location'],
            'description': details['description'],
            'start': {
                'dateTime': details['start_time'].isoformat(),
                'timeZone': 'IST',  # Adjust as needed
            },
            'end': {
                'dateTime': details['end_time'].isoformat(),
                'timeZone': 'IST',  # Adjust as needed
            },
            'attendees': attendees,
            'reminders': {
                'useDefault': True
            },
        }

        # Insert the event
        event = service.events().insert(calendarId=calendar_id, body=event).execute()

        # Create meeting details message
        meeting_details = (
            f"Meeting: {details['title']}\n"
            f"Description: {details['description']}\n"
            f"Time: {details['start_time'].strftime('%Y-%m-%d %H:%M')} to {details['end_time'].strftime('%H:%M')}\n"
            f"Location: {details['location']}\n"
            f"Meeting Link: {event.get('htmlLink', 'No link available')}"
        )

        # Send email to attendees
        if attendees:
            subject = f"Invitation: {details['title']}"
            body = f"You have been invited to a meeting:\n\n{meeting_details}"

            for attendee in attendees:
                send_email(attendee['email'], subject, body)

        # Send WhatsApp messages to phone numbers
        whatsapp_results = []
        if details.get('phone_numbers'):
            for phone in details['phone_numbers']:
                # Format the message for WhatsApp
                whatsapp_message = f"📅 Meeting Invitation 📅\n\n{meeting_details}"

                # Send WhatsApp message
                success, message = send_whatsapp_message(
                    phone, whatsapp_message)
                whatsapp_results.append({
                    'phone': phone,
                    'success': success,
                    'message': message
                })

        return True, {
            'message': f"Meeting '{details['title']}' scheduled successfully.",
            'event_id': event.get('id'),
            'event_link': event.get('htmlLink'),
            'whatsapp_notifications': whatsapp_results
        }
    except Exception as e:
        return False, f"Failed to add calendar event: {str(e)}"
# ----- OAUTH CALLBACK ROUTE -----


@app.route('/oauth2callback')
def oauth2callback():
    """Handle the OAuth2 callback from Google."""
    credentials_path = os.environ.get('GOOGLE_CREDENTIALS_PATH',
                                      'credentials.json')
    token_path = os.environ.get('GOOGLE_TOKEN_PATH', 'token.json')

    if not os.path.exists(credentials_path):
        return jsonify({"error": "Missing credentials file"}), 500

    try:
        flow = InstalledAppFlow.from_client_secrets_file(
            credentials_path, SCOPES, redirect_uri=request.base_url)

        # Use the authorization code from the callback
        code = request.args.get('code')
        if not code:
            return jsonify({"error": "No authorization code provided"}), 400

        flow.fetch_token(code=code)
        creds = flow.credentials

        # Save the credentials
        with open(token_path, 'w') as token:
            token.write(creds.to_json())

        return jsonify(
            {"message":
             "Successfully authenticated with Google Calendar!"}), 200
    except Exception as e:
        return jsonify({"error": f"Authentication failed: {str(e)}"}), 500


def get_gmail_service():
    """Get authenticated Gmail service using the same credentials as Calendar."""
    token_path = os.environ.get('GOOGLE_TOKEN_PATH', 'token.json')

    # Check if token exists and load credentials directly
    if os.path.exists(token_path):
        try:
            with open(token_path, 'r') as token_file:
                creds_info = json.loads(token_file.read())
                creds = Credentials.from_authorized_user_info(
                    creds_info, SCOPES)

                # Verify credentials are valid
                if not creds.valid:
                    if creds.expired and creds.refresh_token:
                        creds.refresh(Request())
                    else:
                        return False, "Credentials expired and cannot be refreshed"

                # Build Gmail service with the credentials
                gmail_service = build('gmail', 'v1', credentials=creds)
                return True, gmail_service
        except Exception as e:
            return False, f"Failed to create Gmail service: {str(e)}"
    else:
        # If no token exists, we need authentication
        credentials_path = os.environ.get('GOOGLE_CREDENTIALS_PATH',
                                          'credentials.json')
        if not os.path.exists(credentials_path):
            return False, "Missing Google credentials file."

        try:
            flow = InstalledAppFlow.from_client_secrets_file(
                credentials_path, SCOPES)
            auth_url, _ = flow.authorization_url(access_type='offline',
                                                 include_granted_scopes='true')
            return False, {"auth_required": True, "auth_url": auth_url}
        except Exception as e:
            return False, f"Authentication failed: {str(e)}"


def find_latest_email(sender_email):
    """Find the most recent email from the specified sender."""
    try:
        # Get Gmail service
        success, service_or_error = get_gmail_service()
        if not success:
            return False, service_or_error

        service = service_or_error

        # Search for emails from the sender
        query = f"from:{sender_email}"
        result = service.users().messages().list(userId='me',
                                                 q=query,
                                                 maxResults=1).execute()
        messages = result.get('messages', [])

        if not messages:
            return False, f"No emails found from {sender_email}"

        # Get the most recent email
        msg_id = messages[0]['id']
        message = service.users().messages().get(userId='me',
                                                 id=msg_id,
                                                 format='full').execute()

        # Extract subject and body
        headers = message['payload']['headers']
        subject = next(
            (header['value']
             for header in headers if header['name'].lower() == 'subject'),
            'No Subject')
        thread_id = message['threadId']

        # Extract the body (might be in plain text or HTML)
        body = ""
        if 'parts' in message['payload']:
            for part in message['payload']['parts']:
                if part['mimeType'] == 'text/plain':
                    body = base64.urlsafe_b64decode(
                        part['body']['data']).decode('utf-8')
                    break
        elif 'body' in message['payload'] and 'data' in message['payload'][
                'body']:
            body = base64.urlsafe_b64decode(
                message['payload']['body']['data']).decode('utf-8')

        return True, {
            'id': msg_id,
            'thread_id': thread_id,
            'subject': subject,
            'body': body,
            'sender': sender_email
        }
    except Exception as e:
        return False, f"Error finding email: {str(e)}"


def generate_email_reply(email_content):
    """Generate an appropriate reply using the LLM."""
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        return False, "Missing GROQ_API_KEY environment variable."

    client = Groq(api_key=groq_api_key)

    messages = [{
        "role":
        "system",
        "content":
        ("You are an intelligent assistant that drafts professional and appropriate email replies. "
         "Consider the context, tone, and content of the original email. "
         "Keep your responses concise, clear, and professional. "
         "If the original email asks questions, make sure to address them. "
         "Use a formal but friendly tone unless the original email is casual."
         "Don't Include anything else apart from the Email like don't include Here's a potenial reply or anything and in salutation always use best regards"
         )
    }, {
        "role":
        "user",
        "content":
        f"Please draft a reply to the following email:\n\n{email_content}"
    }]

    try:
        response = client.chat.completions.create(model="llama3-70b-8192",
                                                  messages=messages,
                                                  max_tokens=500,
                                                  temperature=0.7)

        reply_content = response.choices[0].message.content.strip()
        return True, reply_content
    except Exception as e:
        return False, f"Failed to generate email reply: {str(e)}"


def send_email_reply(email_data, reply_content):
    """Send a reply to the specified email."""
    try:
        # Get Gmail service
        success, service_or_error = get_gmail_service()
        if not success:
            return False, service_or_error

        service = service_or_error

        # Create the message
        message = MIMEText(reply_content)
        message['To'] = email_data['sender']
        message['Subject'] = f"Re: {email_data['subject']}"
        message['In-Reply-To'] = email_data['id']
        message['References'] = email_data['id']

        # Encode the message
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

        # Create the draft message
        draft = {
            'message': {
                'raw': encoded_message,
                'threadId': email_data['thread_id']
            }
        }

        # Send the message
        sent_message = service.users().messages().send(
            userId='me',
            body={
                'raw': encoded_message,
                'threadId': email_data['thread_id']
            }).execute()

        return True, {
            'message_id': sent_message['id'],
            'thread_id': sent_message['threadId'],
            'reply_content': reply_content
        }
    except Exception as e:
        return False, f"Failed to send email reply: {str(e)}"


def handle_email_reply(sender_email):
    """Handle the full email reply process."""
    try:
        # Find the latest email
        success, email_data = find_latest_email(sender_email)
        if not success:
            return False, email_data

        # Generate a reply
        success, reply_content = generate_email_reply(email_data['body'])
        if not success:
            return False, reply_content

        # Send the reply
        success, reply_result = send_email_reply(email_data, reply_content)
        if not success:
            return False, reply_result

        return True, {
            'message': f"Successfully replied to email from {sender_email}",
            'email_subject': email_data['subject'],
            'reply_content': reply_content
        }
    except Exception as e:
        return False, f"Failed to handle email reply: {str(e)}"


# ----- GROQ INTEGRATION -----
def get_action_from_llm(query):
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        return False, "Missing GROQ_API_KEY environment variable."

    client = Groq(api_key=groq_api_key)

    messages = [{
        "role":
        "system",
        "content":
        ("You are an exceptionally intelligent, human-like, highly intuitive, and context-aware AI assistant specialized in deeply understanding the intent behind user requests and responding with exceptionally realistic, professional, empathetic, nuanced, and contextually accurate actions. "
         "Your responses should be indistinguishable from those crafted by a thoughtful human being, carefully considering subtle emotional nuances and interpersonal relationships. Respond ONLY with a valid JSON object containing thoroughly detailed and context-sensitive action data. Never include any explanations, markdown, or text outside the JSON object.\n\n"
         "You are an exceptionally intelligent, human-like AI assistant. "
         "For casual conversation like greetings or small talk, respond with ONLY a JSON object like: "
         "{\"action\": \"chat\", \"body\": \"your response here\"}\n"
         "For all other requests that require specific actions, respond with the appropriate action JSON. "
         "Never include any explanations, markdown, or text outside the JSON object."
         "IMPORTANT- IF SOMEONE SAYS HEY HI OR ANY OTHER KIND OF GREETINGS REPLY TO THEM LIKE A HUMAN AND IF SOMEONNE ASKS YOU YOUR NAME LIKE Hey, what's your name or in any way they asks your name remember that your name is TELIOLABS DEMO LAM OR If someone is interested in casual conversation then talk to them in a natural way"
         "If user asks you to SUMMARISE anything without an url then it is your responsibility to summarise about it and share with the user and you have to keep it crisp and as understandable as possible for example if he asks can you let me know about xyz then it is your responsibility to show the answers"
         "Also based on user language like hindi, english, hinglish, germany or any give answer in that language only"
         "Available actions:\n"
         "1) email - When the user wants to send an email\n"
         "2) task - When the user wants to manage tasks (create, read, update, delete)\n"
         "3) scrape - When the user wants news information\n"
         "4) message - When the user wants to send messages via WhatsApp or Telegram\n"
         "5) payment - When the user wants to process a payment\n"
         "6) chat - For normal conversation\n"
         "7) summarize - For summarizing a webpage\n"
         "8) web_search - For performing a web search\n"
         "9) calendar - When the user wants to schedule a meeting or event\n"
         "10) email_reply - When the user wants to reply to an email from a specific sender\n"
         "11) chat_history - When the user wants to retrieve their past conversation history\n\n"
         "12) workflow - When the user wants to make changes in any existing camunda workflows\n\n"
         "13) document - When the user wants to process a document (PDF, CSV, DOCX, or image)"
         "Intelligent Guidelines:\n"
         "- Email: Automatically craft realistic, highly personalized, and nuanced emails based on inferred interpersonal context, adjusting tone, language, and level of formality according to the recipient's relationship with the sender. Precisely infer appropriate salutations, subjects, and closing remarks.\n"
         "- Task: Precisely manage task actions (create, update, read, delete), intuitively understanding user intent, urgency, and priority, and include actionable, clear descriptions.\n"
         "- Scrape: Intelligently determine exactly what information the user needs and provide detailed extraction.\n"
         "- Message: Compose exceptionally realistic and emotionally nuanced WhatsApp or Telegram messages, reflecting genuine human warmth, empathy, casualness, humor, or professionalism based on context.\n"
         "- Payment: Clearly and accurately interpret transaction intent, providing explicit recipient details, amounts, currencies, and contextually appropriate descriptions.\n"
         "- Chat: Engage in authentic, human-like conversations, showcasing deep emotional intelligence, genuine empathy, sensitivity, warmth, humor, or seriousness, depending entirely on context.\n"
         "- Summarize: Provide succinct and intelligent summaries, skillfully capturing underlying nuances and the essence of provided content based on what user asks.\n"
         "- Web Search: Conduct highly precise, nuanced web searches accurately tailored to the exact intent and underlying context of the user's request.\n"
         "- Calendar: Accurately parse and intelligently convert natural language dates and times, proactively detailing comprehensive event information including nuanced contextual data such as location, attendees, duration, and descriptions (if not given, create one from the title using your own intelligence), with location set to remote if not mentioned.\n"
         "- Email Reply: Intelligently identify when a user wants to reply to an email from a specific sender, extracting the sender's email address from the query. Understand requests like 'reply to the email from john@example.com' or 'respond to the message I got from Sarah (sarah@company.com)'.\n"
         "- Chat History: Retrieve and summarize the user's past conversation history stored in the system if requested.\n\n"
         "Example formats:\n"
         "For email: {\"action\": \"email\", \"recipient\": \"email@example.com\", \"subject\": \"Meeting\", \"body\": \"Let's meet tomorrow\"}\n"
         "For web search: {\"action\": \"web_search\", \"query\": \"latest news\"}\n"
         "For chat: {\"action\": \"chat\", \"body\": \"I'm here to help!\"}\n"
         "For task: {\"action\": \"task\", \"task_action\": \"create\", \"task_data\": {\"title\": \"Meeting\", \"description\": \"Team meeting\"}}\n"
         "For summarize: {\"action\": \"summarize\", \"url\": \"https://example.com\"}\n"
         "For calendar: {\"action\": \"calendar\", \"meeting_data\": {\"title\": \"Team Meeting\", \"date\": \"2025-03-28\", \"time\": \"10:00\", \"duration\": \"1 hour\", \"attendees\": [\"colleague@example.com\"], \"phone_numbers\": [\"+1234567890\"]}}\n"
         "For message: {\"action\": \"message\", \"platform\": \"whatsapp\", \"recipient\": \"+1234567890\", \"message\": \"Hello there\"}\n"
         "For email_reply: {\"action\": \"email_reply\", \"sender_email\": \"john@example.com\"}\n"
         "For chat_history: {\"action\": \"chat_history\", \"user_id\": \"user123\"}\n"
         "For document: {\"action\": \"document\", \"file_path\": \"/path/to/file.pdf\"}"
         "ALWAYS return ONLY deeply intuitive, context-aware, realistic, emotionally intelligent, and comprehensive JSON responses without additional explanations, markdown, or formatting"
         )
    }, {
        "role": "user",
        "content": f'Query: "{query}"'
    }]

    try:
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=messages,
            max_tokens=300,
            temperature=0.0,
            top_p=1,
            response_format={"type": "json_object"})

        text = response.choices[0].message.content.strip()

        # Handle any potential non-JSON content by extracting just the JSON part
        try:
            # Try to parse as is first
            action_data = json.loads(text)
        except json.JSONDecodeError:
            # Try to extract just the JSON portion if there's extra text
            import re
            json_pattern = r'({.*})'
            match = re.search(json_pattern, text, re.DOTALL)
            if match:
                json_text = match.group(1)
                try:
                    action_data = json.loads(json_text)
                except:
                    # If still failing, provide a fallback response
                    action_data = {
                        "action":
                        "chat",
                        "body":
                        "I couldn't understand that request. Could you rephrase it?"
                    }
            else:
                # Fallback if no JSON-like structure found
                action_data = {
                    "action":
                    "chat",
                    "body":
                    "I couldn't understand that request. Could you rephrase it?"
                }

        return True, action_data

    except Exception as e:
        # Log the error for debugging
        print(f"Error in get_action_from_llm: {str(e)}")
        print(
            f"Raw response (if available): {getattr(response, 'choices', [])}")

        # Provide a fallback response rather than returning an error
        fallback_response = {
            "action":
            "chat",
            "body":
            "I encountered an issue processing your request. Could you try again?"
        }
        return True, fallback_response


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def detect_file_type(file_path):
    """Detects the file type using its content rather than relying on extensions."""
    try:
        mime = magic.Magic(mime=True)
        file_type = mime.from_file(file_path)
    except ImportError:
        print("python-magic not installed, falling back to extension-based detection.")
        file_type = None  # Use extension-based detection as fallback

    if file_type:
        if "pdf" in file_type:
            return "pdf"
        elif "csv" in file_type or file_path.endswith(".csv"):
            return "csv"
        elif "msword" in file_type or "officedocument" in file_type:
            return "docx"
        elif "image" in file_type:
            return "image"

    # Fallback based on extension
    if file_path.endswith(".pdf"):
        return "pdf"
    elif file_path.endswith(".csv"):
        return "csv"
    elif file_path.endswith(".docx"):
        return "docx"
    elif file_path.endswith((".png", ".jpg", ".jpeg")):
        return "image"

    return None


def extract_text_from_pdf(pdf_path):
    """Extracts text from a PDF file."""
    text = ""
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text if text else "No readable text found in the PDF."


def extract_text_from_csv(csv_path):
    """Extracts a summarized version of text from a CSV file."""
    try:
        df = pd.read_csv(csv_path)
        num_rows, num_cols = df.shape
        summary = f"CSV Summary: {num_rows} rows, {num_cols} columns.\n"
        summary += "Columns: " + ", ".join(df.columns) + "\n"
        summary += "First few rows:\n" + df.head(5).to_string()
        return summary
    except Exception as e:
        return f"Error reading CSV file: {e}"


def extract_text_from_docx(docx_path):
    """Extracts text from a Word document."""
    doc = Document(docx_path)
    return "\n".join([para.text for para in doc.paragraphs]) or "No readable text found in the document."


def extract_text_from_image(image_path):
    """Extracts text from an image using OCR."""
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        return text.strip() if text.strip() else "No readable text found in the image."
    except Exception as e:
        return f"Error processing image: {e}"


@app.route('/process_document', methods=['POST'])
def process_document():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            file_type = detect_file_type(filepath)

            if file_type == "pdf":
                text = extract_text_from_pdf(filepath)
            elif file_type == "csv":
                text = extract_text_from_csv(filepath)
            elif file_type == "docx":
                text = extract_text_from_docx(filepath)
            elif file_type == "image":
                text = extract_text_from_image(filepath)
            else:
                os.remove(filepath)
                return jsonify({"error": "Unsupported file type"}), 400

            # Clean up the uploaded file
            os.remove(filepath)

            return jsonify({
                "filename": filename,
                "file_type": file_type,
                "extracted_text": text
            })

        except Exception as e:
            # Clean up the uploaded file if something went wrong
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({"error": str(e)}), 500

    return jsonify({"error": "File type not allowed"}), 400


@app.route('/action', methods=['POST'])
def handle_action():
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({"error": "No query provided."}), 400

    query = data['query']
    user_id = data.get('user_id', 'anonymous')

    # Fetch the last 10 conversation messages for the user (ordered by timestamp ascending)
    history_records = ChatHistory.query.filter_by(user_id=user_id) \
                           .order_by(ChatHistory.timestamp.asc()).limit(10).all()

    # Build conversation context for the LLM prompt
    messages = [{
        "role":
        "system",
        "content":
        ("You are an exceptionally intelligent, human-like, highly intuitive, and context-aware AI assistant specialized in deeply understanding the intent behind user requests and responding with exceptionally realistic, professional, empathetic, nuanced, and contextually accurate actions. "
         "Your responses should be indistinguishable from those crafted by a thoughtful human being. Respond ONLY with a valid JSON object containing action data as instructed. Do not include any extra explanations or markdown."
         "\n\nAvailable actions: email, task, scrape, message, payment, chat, summarize, web_search, calendar, email_reply, chat_history."
         )
    }]

    # Append past conversation context from chat history
    for record in history_records:
        messages.append({"role": record.role, "content": record.message})

    # Append current query as the latest user message
    messages.append({"role": "user", "content": query})

    # Call your LLM function with the full conversation context
    success, result = get_action_from_llm(messages)
    if not success:
        return jsonify({
            "error": "Failed to process query",
            "details": result
        }), 500

    # Save the current user query in chat history
    try:
        new_user_msg = ChatHistory(user_id=user_id, role="user", message=query)
        db.session.add(new_user_msg)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error saving user message: {e}")

    # Process the action returned by the LLM
    action = result.get('action')
    known_actions = [
        'email', 'task', 'scrape', 'message', 'payment', 'chat', 'summarize',
        'web_search', 'calendar', 'email_reply', 'chat_history'
    ]
    if not action or action not in known_actions:
        fallback_response = result.get(
            'body',
            "I'm sorry, I didn't understand that. Can you please rephrase?")
        # Save assistant's fallback response in history
        try:
            new_assistant_msg = ChatHistory(
                user_id=user_id,
                role="assistant",
                message=f"Fallback: {fallback_response}")
            db.session.add(new_assistant_msg)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Error saving assistant message: {e}")
        return jsonify({"message": fallback_response}), 200

    # Handle chat_history action: simply return the stored conversation
    if action == 'chat_history':
        try:
            history = ChatHistory.query.filter_by(user_id=user_id).order_by(
                ChatHistory.timestamp.desc()).all()
            history_list = [{
                "role": h.role,
                "message": h.message,
                "timestamp": h.timestamp.isoformat()
            } for h in history]
            return jsonify({
                "message":
                f"Chat history for you is in the Inspect, please check",
                "history": history_list
            }), 200
        except Exception as e:
            return jsonify({
                "error": "Failed to retrieve chat history.",
                "details": str(e)
            }), 500

    # Handle email_reply action branch
    elif action == 'document':
        file_path = result.get('file_path')
        if not file_path:
                return jsonify({"error": "No file path provided for document processing."}), 400

    # Check if file exists
        if not os.path.exists(file_path):
                    return jsonify({"error": "File not found."}), 404
                
        file_type = detect_file_type(file_path)
        if file_type == "pdf":
            text = extract_text_from_pdf(file_path)
        elif file_type == "csv":
            text = extract_text_from_csv(file_path)
        elif file_type=="docx":
            text = extract_text_from_docx(file_path)
        elif file_type=="image":
            text = extract_text_from_image(file_path)
        else:
            return jsonify({"error":"Unsupported file type"}),400
        
        try:
            new_assistant_msg = ChatHistory( user_id=user_id, role ="assistant", message=f"Processed Document:{file_path}")
            db.session.add(new_assistant_msg)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Error Saving Asssistant Message : {e}")
            
        return jsonify({
             "message": "Document processed successfully.",
        "filename": os.path.basename(file_path),
        "file_type": file_type,
        "extracted_text": text
        }),200
            

    
    elif action == 'email_reply':
        sender_email = result.get('sender_email')
        if not sender_email:
            return jsonify({"error": "No sender email provided."}), 400

        success, reply_result = handle_email_reply(sender_email)
        if success:
            assistant_response = {
                "message": reply_result['message'],
                "details": {
                    "subject": reply_result['email_subject'],
                    "reply": reply_result['reply_content']
                }
            }
            try:
                new_assistant_msg = ChatHistory(
                    user_id=user_id,
                    role="assistant",
                    message=json.dumps(assistant_response))
                db.session.add(new_assistant_msg)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Error saving assistant message: {e}")
            return jsonify(assistant_response), 200
        else:
            return jsonify({
                "error": "Failed to reply to email.",
                "details": reply_result
            }), 500

    # Handle calendar action branch
    elif action == 'calendar':
        meeting_data = result.get('meeting_data', {})
        if not meeting_data:
            return jsonify({"error": "No meeting details provided."}), 400
        
        user_query = data.get('query','').lower()
        if 'conflict_response' in meeting_data and ('yes' in user_query or 'schedule' in user_query):
            success, response = add_calendar_event(meeting_data['proposed_event'])
        else:
            success, response = add_calendar_event(meeting_data)
        if success:
            return jsonify({
                "message": response['message'],
                "event_details": response
            }), 200
        else:
            if isinstance(response, dict) and response.get('auth_required'):
                return jsonify({
                    "status":
                    "auth_required",
                    "auth_url":
                    response.get('auth_url'),
                    "message":
                    "Google Calendar authentication required. Please visit the authentication URL."
                }), 202
            elif isinstance(response, dict) and response.get('conflict'):
            # Return conflict information to user
                 return jsonify({
                "status": "conflict",
                "message": response['message'],
                "existing_events": response['existing_events'],
                "proposed_event": response['proposed_event']
            }), 200
            return jsonify({
                "error": "Failed to schedule meeting.",
                "details": response
            }), 500

    # Handle chat (normal conversation) branch
    elif action == 'chat':
        chat_reply = result.get('body', "Hello! How can I help you?")
        try:
            new_assistant_msg = ChatHistory(user_id=user_id,
                                            role="assistant",
                                            message=chat_reply)
            db.session.add(new_assistant_msg)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Error saving assistant message: {e}")
        return jsonify({"message": chat_reply}), 200

    # Handle summarize action branch
    elif action == 'summarize':
        url = result.get('url')
        if not url:
            return jsonify({"error":
                            "No URL provided for summarization."}), 400

        success, summary = scrape_and_summarize(url)
        if success:
            try:
                new_assistant_msg = ChatHistory(user_id=user_id,
                                                role="assistant",
                                                message=summary)
                db.session.add(new_assistant_msg)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Error saving assistant message: {e}")
            return jsonify({"message": summary, "summary": summary}), 200
        else:
            return jsonify({
                "error": "Failed to generate summary.",
                "details": summary
            }), 500

    # Handle web_search action branch
    elif action == 'web_search':
        search_query = result.get('query')
        if not search_query:
            return jsonify({"error": "No search query provided."}), 400

        api_key = os.environ.get("SERPAPI_API_KEY")
        if not api_key:
            return jsonify(
                {"error":
                 "Missing SERPAPI_API_KEY environment variable."}), 500

        success, search_results = perform_web_search(search_query, api_key)
        if success:
            results_message = f"Search results for '{search_query}':\n\n"
            for idx, result_item in enumerate(search_results, 1):
                results_message += f"{idx}. {result_item['title']}\n"
                results_message += f"   {result_item['link']}\n"
                results_message += f"   {result_item['snippet']}\n\n"
            try:
                new_assistant_msg = ChatHistory(user_id=user_id,
                                                role="assistant",
                                                message=results_message)
                db.session.add(new_assistant_msg)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Error saving assistant message: {e}")
            return jsonify({
                "message": results_message,
                "results": search_results
            }), 200
        else:
            return jsonify({
                "error": "Failed to perform web search.",
                "details": search_results
            }), 500

    # Handle email sending action branch
    elif action == 'email':
        recipient = result.get('recipient')
        subject = result.get('subject', 'No Subject')
        body = result.get('body', '')

        if not recipient:
            return jsonify({"error": "No recipient provided for email."}), 400

        success, message = send_email(recipient, subject, body)
        if success:
            try:
                new_assistant_msg = ChatHistory(
                    user_id=user_id,
                    role="assistant",
                    message="Email sent successfully.")
                db.session.add(new_assistant_msg)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Error saving assistant message: {e}")
            return jsonify({"message": "Email sent successfully."}), 200
        else:
            return jsonify({
                "error": "Failed to send email.",
                "details": message
            }), 500

    # Handle task operations action branch
    elif action == 'task':
        task_action = result.get('task_action', 'create')
        task_data = result.get('task_data', {})

        if task_action == 'create':
            success, message = create_task(task_data)
        elif task_action == 'read':
            success, message = read_task(task_data)
        elif task_action == 'update':
            success, message = update_task(task_data)
        elif task_action == 'delete':
            success, message = delete_task(task_data)
        else:
            return jsonify({"error":
                            f"Unknown task action: {task_action}"}), 400

        if success:
            try:
                new_assistant_msg = ChatHistory(
                    user_id=user_id,
                    role="assistant",
                    message="Task operation successful.")
                db.session.add(new_assistant_msg)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Error saving assistant message: {e}")
            return jsonify({
                "message": "Task operation successful.",
                "result": message
            }), 200
        else:
            return jsonify({
                "error": "Task operation failed.",
                "details": message
            }), 500

    # Handle news scraping action branch
    elif action == 'scrape':
        query = result.get('query')
        if not query:
            return jsonify({"error": "No query provided for scraping."}), 400

        success, headlines = perform_scraping_news(query)
        if success:
            try:
                new_assistant_msg = ChatHistory(user_id=user_id,
                                                role="assistant",
                                                message=f"News: {headlines}")
                db.session.add(new_assistant_msg)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Error saving assistant message: {e}")
            return jsonify({
                "message": "News scraped successfully.",
                "headlines": headlines
            }), 200
        else:
            return jsonify({
                "error": "Failed to scrape news.",
                "details": headlines
            }), 500

    # Handle messaging action branch
    elif action == 'message':
        platform = result.get('platform')
        recipient = result.get('recipient')
        message_text = result.get('message', '')

        if not platform:
            return jsonify({"error": "No messaging platform specified."}), 400
        if not recipient:
            return jsonify({"error":
                            "No recipient provided for message."}), 400

        success, message = send_message(platform, recipient, message_text)
        if success:
            try:
                new_assistant_msg = ChatHistory(user_id=user_id,
                                                role="assistant",
                                                message=message)
                db.session.add(new_assistant_msg)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Error saving assistant message: {e}")
            return jsonify({
                "message": "Message sent successfully.",
                "details": message
            }), 200
        else:
            return jsonify({
                "error": "Failed to send message.",
                "details": message
            }), 500

    # Handle payment processing action branch
    elif action == 'payment':
        amount = result.get('amount')
        currency = result.get('currency', 'USD')
        order_id = result.get(
            'order_id', 'order_' + str(hash(str(amount) + currency))[1:8])
        description = result.get('description', 'Payment processed')

        if not amount:
            return jsonify({"error": "No amount provided for payment."}), 400

        success, message = process_payment(amount, currency, order_id,
                                           description)
        if success:
            try:
                new_assistant_msg = ChatHistory(
                    user_id=user_id,
                    role="assistant",
                    message="Payment processed successfully.")
                db.session.add(new_assistant_msg)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Error saving assistant message: {e}")
            return jsonify({
                "message": "Payment processed successfully.",
                "details": message
            }), 200
        else:
            return jsonify({
                "error": "Failed to process payment.",
                "details": message
            }), 500

    # Fallback for unknown actions
    return jsonify(
        {"error":
         f"Action '{action}' is recognized but not implemented."}), 501


# ----- RUN APPLICATION -----
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
