import os
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'
os.environ['FLAGS_selected_gpus'] = ''
os.environ['FLAGS_enable_pir_api'] = '0'  # Menonaktifkan PIR API yang menyebabkan error Unimplemented
os.environ['FLAGS_use_mkldnn'] = '0'       # Memastikan MKLDNN dimatikan jika hardware tidak support sempurna

import eventlet
eventlet.monkey_patch()
import socketio
import base64
import os
import json
from paddleocr import PaddleOCR
from io import BytesIO
from PIL import Image
import numpy as np

import requests
# import ollama

sio = socketio.Server(cors_allowed_origins='*')
app = socketio.WSGIApp(sio)

# Frontend URL base (adjust if Next.js runs on different port/host)
FRONTEND_URL = "http://localhost:3000"

print("Sedang memuat model PaddleOCR...")

# Gunakan parameter yang lebih stabil untuk nota
# Update: Menggunakan parameter versi terbaru untuk menghindari warning deprecation
ocr = PaddleOCR(
    lang='id',
    use_textline_orientation=False, # Pengganti use_angle_cls
    enable_mkldnn=False,
    text_det_thresh=0.3,           # Pengganti det_db_thresh
    text_det_box_thresh=0.5        # Pengganti det_db_box_thresh
)

print("✅ PaddleOCR Berhasil Dimuat!")

@sio.event
def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.on('process_receipt')
def handle_process(sid, data):
    try:
        # 1. Handle Image Data (Base64 atau URL)
        print(f"--- Processing request from {sid} ---")
        image_data = data.get('image') 
        image_url = data.get('url')   
        
        img_bytes = None

        if image_data:
            print("Mode: Base64")
            sio.emit('status', {'msg': 'Menerima data gambar (Base64)...'}, to=sid)
            eventlet.sleep(0) # Yield for emission
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            img_bytes = base64.b64decode(image_data)
        elif image_url:
            print(f"Mode: URL ({image_url})")
            sio.emit('status', {'msg': 'Menerima path gambar (URL)...'}, to=sid)
            eventlet.sleep(0)
            full_url = f"{FRONTEND_URL}{image_url}" if image_url.startswith('/') else image_url
            response = requests.get(full_url)
            if response.status_code != 200:
                sio.emit('error', {'msg': f'Gagal download gambar: {response.status_code}'}, to=sid)
                return
            img_bytes = response.content
        else:
            sio.emit('error', {'msg': 'Data tidak valid'}, to=sid)
            return

        img = Image.open(BytesIO(img_bytes)).convert('RGB')
        print(f"Image Size: {img.size}")
        
        # Simpan ke file sementara (PaddleOCR lebih stabil baca dari file di Windows)
        temp_img_path = "temp_receipt.png"
        img.save(temp_img_path)

        # 2. OCR Step
        print("Starting OCR from file...")
        sio.emit('status', {'msg': 'Sedang membaca teks nota (OCR)...'}, to=sid)
        eventlet.sleep(0)
        
        # Gunakan pemanggilan paling simpel
        result = ocr.ocr(temp_img_path)
        
        if not result or not result[0]:
            print("OCR Result empty or failed")
            sio.emit('error', {'msg': 'Gagal membaca teks dari gambar'}, to=sid)
            return

        # PaddleOCR result: [ [[box], [text, score]], ... ]
        raw_text = ""
        for line in result[0]:
            text = line[1][0]
            raw_text += text + " "
        
        raw_text = raw_text.strip()
        print(f"Detected Text:\n{raw_text}")

        # 3. Finish (Send back raw text so it shows in frontend)
        sio.emit('status', {'msg': 'Selesai!'}, to=sid)
        eventlet.sleep(0)
        sio.emit('finish', {'raw_text': raw_text}, to=sid)
        print(f"Successfully processed for {sid}")

    except Exception as e:
        print(f"Error processing: {str(e)}")
        sio.emit('error', {'msg': f"Terjadi kesalahan: {str(e)}"}, to=sid)

if __name__ == '__main__':
    print("Server OCR & LLM aktif di http://localhost:5000")
    eventlet.wsgi.server(eventlet.listen(('0.0.0.0', 5000)), app)