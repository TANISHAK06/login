import autopep8

def format_code(file_path):
    try:
        with open(file_path, 'r') as file:
            code = file.read()
        
        formatted_code = autopep8.fix_code(code)
        
        with open(file_path, 'w') as file:
            file.write(formatted_code)
        
        print(f"Code in {file_path} has been formatted successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")

# Example usage
file_path = 'large-action-model-poc/app.py'
format_code(file_path)
