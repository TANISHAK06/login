from flask import Flask, request, jsonify
import os
from werkzeug.utils import secure_filename
import PyPDF2
import pandas as pd
import pytesseract
import groq
import magic
from docx import Document
from PIL import Image

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'csv', 'docx', 'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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

def summarize_text(text):
    """Uses Groq AI to summarize the extracted text."""
    try:
        client = groq.Client(api_key="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")
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": f"Summarize this text: {text[:4000]}"}],  # Limit to 4000 chars
            max_tokens=300
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error summarizing text: {e}"

@app.route('/upload', methods=['POST'])
def upload_file():
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
            
            summary = summarize_text(text)
            
            # Clean up the uploaded file
            os.remove(filepath)
            
            return jsonify({
                "filename": filename,
                "file_type": file_type,
                "extracted_text": text,
                "summary": summary
            })
            
        except Exception as e:
            # Clean up the uploaded file if something went wrong
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"error": "File type not allowed"}), 400

@app.route('/')
def index():
    return """
    <h1>Document Processing API</h1>
    <p>Send a POST request to /upload with a file to get a summary.</p>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="file">
      <input type="submit" value="Upload">
    </form>
    """

if __name__ == '__main__':
    app.run(debug=True)