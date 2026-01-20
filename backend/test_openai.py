from dotenv import load_dotenv
load_dotenv()

from openai import OpenAI
import os

print("KEY FOUND:", bool(os.getenv("OPENAI_API_KEY")))

client = OpenAI()

response = client.responses.create(
    model="gpt-5-mini",
    input="Suggest a vegan main dish"
)

print(response.output_text)
