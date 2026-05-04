<!-- HEADER BANNER -->
<div align="center">

# 🎬 OP Video Compressor

```
██╗   ██╗██╗██████╗    ██████╗ ██████╗ ███╗   ███╗██████╗ 
██║   ██║██║██╔══██╗   ██╔════╝██╔═══██╗████╗ ████║██╔══██╗
██║   ██║██║██║  ██║   ██║     ██║   ██║██╔████╔██║██████╔╝
╚██╗ ██╔╝██║██║  ██║   ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ 
 ╚████╔╝ ██║██████╔╝   ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     
  ╚═══╝  ╚═╝╚═════╝     ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     
```

> compress videos like you actually know what you're doing

---

![Node](https://img.shields.io/badge/node-18+-green)
![FFmpeg](https://img.shields.io/badge/ffmpeg-required-red)
![License](https://img.shields.io/badge/license-MIT-blue)
![Build](https://img.shields.io/github/actions/workflow/status/git-keysh/VidComp/ci.yml?label=CI)

</div>

---

## ⚡ What this actually is

A **video compressor that doesn’t guess**.

You set:
- target size  
- quality  
- speed  

It handles the rest using FFmpeg math + bitrate control.

---

## 🔥 Features

- 📦 Batch compression (10 files max)
- 🎯 Exact size targeting (no random outputs)
- 🎚️ Quality control (Low → Very High)
- ⚡ Speed presets (ultrafast → veryslow)
- 📊 Real-time progress updates
- 💾 Compression ratio stats
- 🔒 Secure API (rate limit + Helmet)
- 🧠 Smart bitrate calculation
- 🎨 Clean drag & drop UI

---

## 🚀 Quick Start (1 command setup)

```bash
git clone https://github.com/git-keysh/VidComp.git
cd VidComp
npm install
npm run dev
````

Open:

```
http://localhost:1082
```

---

## ⚙️ How it works (simple version)

```text
video → ffmpeg probe → bitrate math → encode → output file
```

No magic. Just controlled encoding.

---

## 📡 API

### POST `/process`

```json
FormData:
videos: File[]
targetSize: number
unit: KB | MB | GB
quality: low | medium | high | veryhigh
preset: ultrafast | fast | medium | slow | veryslow
```

### Response

```json
{
  "success": true,
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  },
  "results": []
}
```

---

## 🧱 Tech Stack

* Node.js
* Express
* FFmpeg
* TypeScript
* Winston (logging)
* Helmet (security)

---

## 🧪 Dev Mode

```bash
npm run dev
```

---

## 🏗 Production

```bash
npm run build
npm start
```

---

## 🤖 GitHub Actions (CI)

Create this file:

```
.github/workflows/ci.yml
```

```yaml
name: CI

on:
  push:
    branches: [ "main" ]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install deps
        run: npm install

      - name: Build
        run: npm run build
```

---

## 🧯 Common issues

### FFmpeg not found

```bash
ffmpeg -version
```

If it fails → install FFmpeg and add to PATH.

---

### Port already used

```bash
PORT=3000 npm run dev
```

---

## ⚡ Performance tips

* ultrafast = speed
* veryslow = smallest file size
* lower target = more compression
* high quality + slow = best balance

---

## 🧠 Roadmap

* [ ] Queue system (multi-job handling)
* [ ] GPU encoding support
* [ ] Cloud upload (S3 / Drive)
* [ ] WebSocket live progress
* [ ] User presets system
* [ ] Auto cleanup worker

---

## 🤝 Contributing

If you break it, fix it.

```bash
fork → branch → code → PR
```

---

## 📜 License

MIT — do whatever, just don’t sell it as “your SaaS AI compressor” 💀

---

## 💬 Final note

This isn’t a “click button and pray” compressor.

It’s controlled encoding — you decide what happens to the video.