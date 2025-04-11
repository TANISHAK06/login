import pandas as pd
import requests
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from fastapi import FastAPI, Query
import re
import os

# Load CSV data
df = pd.read_csv("course_data.csv")

# Extract only course name from 'course_label'
df["course_label"] = df["course_label"].apply(lambda x: re.sub(r"-.*", "", x).strip())

# Train a vectorizer
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(df["user_preference"])

def retrieve_similar_courses(user_input, top_n=3):
    user_vec = vectorizer.transform([user_input])
    similarity = cosine_similarity(user_vec, X).flatten()
    top_indices = similarity.argsort()[-top_n:][::-1]
    
    recommendations = []
    for idx in top_indices:
        recommendations.append({
            "course_label": df.iloc[idx]["course_label"],
            "course_url": df.iloc[idx]["course_url"]
        })
    return recommendations

# FastAPI app
app = FastAPI()

# Updated Groq API configuration
groq_api_key = "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"
groq_api_url = "https://api.groq.com/openai/v1/chat/completions"  # Updated endpoint

@app.get("/recommend")
def get_course_recommendation(query: str = Query(..., title="User Interest")):
    if not groq_api_key:
        return {"error": "GROQ_API_KEY not found in environment variables"}

    # Retrieve top 3 similar courses
    courses = retrieve_similar_courses(query)

    recommendations = []

    for course_info in courses:
        retrieved_course = course_info["course_label"]
        course_url = course_info["course_url"]

        # Create the prompt for the Groq API
        prompt = (
            f"""You are an AI expert in education and career counseling. A student has expressed the following interest: "{query}". 
            Based on this, one relevant course is "{retrieved_course}". Please provide a detailed and engaging recommendation explaining 
            why this course is a great choice for the student. Highlight key skills, career opportunities, and benefits of this course."""
        )

        # Prepare the request payload
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Groq-API-Python/1.0"
        }
        payload = {
            "model": "mixtral-8x7b-32768",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 500
        }

        try:
            response = requests.post(groq_api_url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            groq_response = response.json()
            llm_suggestion = groq_response["choices"][0]["message"]["content"]
        except requests.exceptions.RequestException as e:
            print(f"Request Error: {e}")
            llm_suggestion = f"We couldn't fetch a detailed recommendation at this time. Please explore the course at: {course_url}"
        except (KeyError, IndexError) as e:
            print(f"Response parsing error: {e}")
            llm_suggestion = f"This course looks interesting: {retrieved_course}. Learn more at: {course_url}"

        recommendations.append({
            "course_label": retrieved_course,
            "course_url": course_url,
            "llm_suggestion": llm_suggestion
        })

    return {
        "recommended_courses": recommendations
    }

# Run FastAPI server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)