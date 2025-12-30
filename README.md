# ComfyUI Instructions

## Installation

Reference the [Github repo](https://github.com/comfyanonymous/ComfyUI)  
- Install python 3.12 https://www.python.org/downloads/   
- Run `git clone https://github.com/comfyanonymous/ComfyUI.git` to clone the public repo
- Navigate to ComfyUI directory
- Create virtual python environment `python -m venv .venv`
- Run `.venv\Scripts\activate` to start the virtual environment
- Install dependencies `pip install -r requirements.txt`
- Install pytorch `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121`
- If you get the error "Torch not compiled with CUDA" uninstall via `pip uninstall torch torchvision torchaudio` and reinstall with the command above

## Running
- Activate python virtual environment `.\.venv\Scripts\activate`
- Run in api mode `python main.py --listen 0.0.0.0 --port 8188 --enable-cors-header * --front-end-version Comfy-Org/ComfyUI_frontend@latest`
- Run GUI `python main.py --front-end-version Comfy-Org/ComfyUI_frontend@latest`