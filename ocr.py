import eventlet
import socketio
import os
from paddleocr import PaddleOCR

sio = socketio.Server(cors_allowed_origins='*')
app = socketio.WSGIApp(sio)

# Inisialisasi OCR (Global tapi hemat RAM)
ocr = PaddleOCR(use_angle_cls=True, lang='id', use_gpu=False, show_log=False)

@sio.on('process_receipt')
def handle_process(sid, data):
    # data['image'] adalah bytes atau path
    
    # STEP 1: OCR
    sio.emit('status', {'msg': 'Sedang membaca teks nota (OCR)...'}, to=sid)
    result = ocr.ocr(data['image_path'], cls=True)
    raw_text = "\n".join([line[1][0] for res in result for line in res])
    
    # STEP 2: LLM (Ollama)
    sio.emit('status', {'msg': 'AI sedang menyusun data JSON...'}, to=sid)
    
    prompt = f"Ekstrak list item dari teks nota ini ke JSON (name, qty, price, total). Teks: {raw_text}"
    print(prompt)
    
    # Panggil Ollama (Ini akan memakan RAM utama)
    # response = ollama.chat(model='qwen2.5:1.5b', messages=[
    #     {'role': 'user', 'content': prompt},
    # ])
    
    # STEP 3: Selesai
    sio.emit('finish', {'data': []}, to=sid)

if __name__ == '__main__':
    eventlet.wsgi.server(eventlet.listen(('', 5000)), app)