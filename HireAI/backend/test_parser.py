from utils.resume_parser import parse_resume

resume_path = r"C:/Users/gannabathula/Desktop/Python training/ATS/resumes/Ankesh_Data Engineer.pdf"

result = parse_resume(resume_path)

print("\n==============================")
print("PARSE RESULT")
print("==============================")

for key, value in result.items():

    if key != "text":
        print(f"{key}: {value}")

print("\n==============================")
print("EXTRACTED TEXT")
print("==============================")

print(result["text"][:3000])