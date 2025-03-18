import os
from proprietary_hardware import app
        

if __name__ == "__main__":
    
    app.run(
        host=os.environ.get("IP"),
        port=int(os.environ.get("PORT")) + 1,
        debug=True
        )