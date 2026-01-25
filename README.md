# ComfyUI Instructions

## Installation

- Install CUDA 13.0
#### [Github version](https://github.com/comfyanonymous/ComfyUI)  
- Install python 3.12 https://www.python.org/downloads/   
- Run `git clone https://github.com/comfyanonymous/ComfyUI.git` to clone the public repo
- Navigate to ComfyUI directory
- Create virtual python environment `python -m venv .venv`
- Run `.venv\Scripts\activate` to start the virtual environment
- Install dependencies `pip install -r requirements.txt`
- Install pytorch `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121`
- If you get the error "Torch not compiled with CUDA" uninstall via `pip uninstall torch torchvision torchaudio` and reinstall with the command above
#### Running Github version
- Activate python virtual environment `.\.venv\Scripts\activate`
- Run in api mode `python main.py --listen 0.0.0.0 --port 8188 --enable-cors-header * --front-end-version Comfy-Org/ComfyUI_frontend@latest --preview-method taesd`
- Run GUI `python main.py --front-end-version Comfy-Org/ComfyUI_frontend@latest`
#### Portable version
- Download [ComfyUI Portable](https://docs.comfy.org/installation/comfyui_portable_windows)
- Extract `ComfyUI_windows_portable_nvidia\ComfyUI_windows_portable` to `c:\ComfyUI_windows_portable`
- Ensure Python is not installed on the Windows system
- Navigate to `C:\ComfyUI_windows_portable`
- Run `.\python_embeded\python.exe -m pip uninstall torch torchvision torchaudio`
- Run `.\python_embeded\python.exe -m pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu130`
#### Running portable version
- Navigate to `c:\ComfyUI_windows_portable`
- Run in api mode `.\python_embeded\python.exe .\ComfyUI\main.py --listen 0.0.0.0 --port 8188 --enable-cors-header * --front-end-version Comfy-Org/ComfyUI_frontend@latest --preview-method taesd`
- Add `C:\ComfyUI_windows_portable\python_embeded\Scripts` to PATH