# Face Attendance API (Patched v2)

Windows/Python 3.11 friendly pins (removed `tensorflow-io-gcs-filesystem`).

## Run
python -m venv .venv
. .venv/bin/activate   # Windows: .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
