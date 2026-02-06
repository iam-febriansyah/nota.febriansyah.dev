This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```

"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function ReceiptUploader() {
  const [status, setStatus] = useState("Idle");
  const [result, setResult] = useState(null);

  useEffect(() => {
    socket.on("status", (data) => setStatus(data.msg));
    socket.on("finish", (data) => {
      setResult(JSON.parse(data.data));
      setStatus("Selesai!");
    });
  }, []);

  const uploadFile = async (e) => {
    // 1. Kirim file ke API/Folder Server
    // 2. Emit event ke socket untuk mulai proses
    socket.emit("process_receipt", { image_path: "path/to/img.jpg" });
  };

  return (
    <div className="p-8">
      <input type="file" onChange={uploadFile} />
      <div className="mt-4 font-bold text-blue-600">Status: {status}</div>
      {result && <pre className="bg-gray-100 p-4">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

```
python -m venv venv
venv\Scripts\activate
pip install eventlet python-socketio paddleocr paddlepaddle
python ocr.py
```
