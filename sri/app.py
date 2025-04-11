import os
import time
import asyncio
import pandas as pd
import numpy as np
import requests
from dotenv import load_dotenv
from typing import List
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.metrics.pairwise import cosine_similarity
from langchain.docstore.document import Document
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
 
# Load environment variables
GROQ_API_KEY = "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"
HF_TOKEN="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"
 
if not GROQ_API_KEY or not HF_TOKEN:
    raise RuntimeError("Missing GROQ_API_KEY or HF_TOKEN in environment")
 
# Initialize embeddings and LLM
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
llm = ChatGroq(groq_api_key=GROQ_API_KEY, model_name="llama3-8b-8192")
 
# Load and preprocess data
try:
    df = pd.read_csv("course_data.csv")
    df["course_label"] = df["course_label"].astype(str)
    df["user_preference"] = df["user_preference"].astype(str)
    df["course_url"] = df["course_url"].astype(str)
except Exception as e:
    raise RuntimeError(f"Failed to read or preprocess CSV: {str(e)}")
 
# Build FAISS vector store
def initialize_faiss():
    documents = []
    for _, row in df.iterrows():
        content = f"User Preference: {row['user_preference']}\nCourse: {row['course_label']}\nURL: {row['course_url']}"
        documents.append(Document(page_content=content, metadata=row.to_dict()))
    return FAISS.from_documents(documents, embeddings)
 
vectorstore = initialize_faiss()
retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})
 
# FastAPI app setup
app = FastAPI()
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
class RecommendationRequest(BaseModel):
    query: str
 
async def get_llm_suggestion(query: str, course_label: str) -> str:
    prompt = f"""
You are an expert education counselor. A student is interested in: "{query}".
Recommend the course "{course_label}" in 70-80 words, highlighting 2–3 key benefits, career prospects, and skills gained.
Keep the tone enthusiastic yet professional, short and impactful. Don't talk like an individual—you have to reply like an institute is suggesting
the Courses based on their availability.
    """
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama3-8b-8192",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 300,
        "top_p": 0.9
    }
    try:
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return f"Recommended course based on your interest in '{query}'."
 
@app.get("/recommend")
async def get_course_recommendation(query: str = Query(..., min_length=3, max_length=100)):
    try:
        query_embedding = embeddings.embed_query(query)
        retrieved_docs = retriever.get_relevant_documents(query)
 
        seen_courses = set()
        recommendations = []
 
        for doc in retrieved_docs:
            course = doc.metadata.get("course_label")
            url = doc.metadata.get("course_url")
            if course not in seen_courses:
                doc_embedding = embeddings.embed_query(doc.page_content)
                score = cosine_similarity([query_embedding], [doc_embedding])[0][0]
                recommendations.append({
                    "course": course,
                    "url": url,
                    "score": round(score, 3)
                })
                seen_courses.add(course)
 
        top_courses = recommendations[:3]
        suggestions = await asyncio.gather(*[
            get_llm_suggestion(query, course["course"]) for course in top_courses
        ])
 
        for i in range(len(top_courses)):
            top_courses[i]["llm_suggestion"] = suggestions[i]
 
        return {
            "query": query,
            "top_recommendations": top_courses
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")
 
@app.post("/recommend")
async def post_course_recommendation(request: RecommendationRequest):
    return await get_course_recommendation(request.query)
 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
 