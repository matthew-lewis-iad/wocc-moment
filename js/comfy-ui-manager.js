var ComfyUIManager = {
    CLIENT_ID: 'comfy-ui-manager',
    // websocketHostUrl: 'ws://127.0.0.1:8188',
    // apiHostUrl: 'http://127.0.0.1:8188',
    websocketHostUrl: 'ws://10.0.0.170:8188',
    apiHostUrl: 'http://10.0.0.170:8188',
    socket: null,
    init: function ()
    {
        log('ComfyUIManager : init');
        this.socket = new WebSocket(`${this.websocketHostUrl}/ws?clientId=${this.CLIENT_ID}`);

        this.socket.onopen = function () {
            log('ComfyUIManager : WebSocket connection established');
        };
        
        this.socket.onmessage = function (event) {
            const eventData = JSON.parse(event.data);
            // log('ComfyUIManager : WebSocket message received - ' + eventData.type);
            if (eventData.type == 'progress')
            {
                log('ComfyUIManager : progress ' + eventData.data.value + ' ' + eventData.data.max);
                const progressPercent = Math.floor((eventData.data.value / eventData.data.max) * 100);
                $('#workflow-progress-text')[0].innerHTML = progressPercent + '%';
                $('#workflow-progress-bar-fill')[0].style.width = progressPercent + '%';
            }
            else if (eventData.type == 'progress_state')
            {
                if (ComfyUIManager.currentWorkflow.type == 'textInput' || ComfyUIManager.currentWorkflow.type == 'cameraInput')
                {
                    if (eventData.data?.nodes?.[ComfyUIManager.currentWorkflow.saveImageNodeId]?.state == 'finished')
                    {
                        log('ComfyUIManager : Detected workflow finished state for promptId: ' + ComfyUIManager.currentPromptId);
                        ComfyUIManager.getHistory(ComfyUIManager.currentPromptId);
                    }
                }
                else
                {
                    log('ComfyUIManager : Workflow finished processing promptId: ' + ComfyUIManager.currentPromptId);
                }
            }
        };
        
        this.socket.onclose = function () {
            log('ComfyUIManager : WebSocket connection closed');
        };
    },

    startWorkflow: function (workflow)
    {
        if (this.socket && this.socket.readyState === WebSocket.OPEN)
        {
            $('#workflow-progress-text')[0].innerHTML = '0%';
            $('#workflow-progress-bar-fill')[0].style.width = '0px';
            const workflowData = workflow.data;
            if (workflow.type == 'textInput')
            {
                const textInput = workflow.textInputElement.value;
                if (textInput) {
                    workflowData[workflow.textInputNodeId].inputs.text = textInput;
                }
            }
            const message = {
                prompt: workflowData,
                clientId: this.CLIENT_ID
            };
            fetch(`${this.apiHostUrl}/prompt?clientId=${this.CLIENT_ID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            })
            .then(response => response.json())
            .then(data => {
                log('ComfyUIManager : /prompt success with prompt_id = ' + data.prompt_id);
                ComfyUIManager.currentPromptId = data.prompt_id;
                ComfyUIManager.currentWorkflow = workflow;
            })
            .catch(error => {
                log('ComfyUIManager : /prompt error: ' + JSON.stringify(error));
            });
            log('ComfyUIManager : Sent startWorkflow message');
        }
        else
        {
            log('ComfyUIManager : WebSocket is not open. Cannot start workflow.');
        }
    },

    uploadImage: function (imageFile, callback)
    {
        if (this.socket && this.socket.readyState === WebSocket.OPEN)
        {
            const filename = moment().format('YYYYMMDD_HHmmss') + '.png';
            const formData = new FormData();
            formData.append('image', imageFile, filename);
            fetch(`${this.apiHostUrl}/upload/image`, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                log('ComfyUIManager : Image upload success with URL = ' + data.url);
                if (callback) {
                    callback(data, filename);
                }
            })
            .catch(error => {
                log('ComfyUIManager : Image upload error: ' + JSON.stringify(error));
            });
        }
    },

    getHistory: function (promptId)
    {
        log('ComfyUIManager : getHistory for promptId ' + promptId);
        if (this.socket && this.socket.readyState === WebSocket.OPEN)
        {
            fetch(`${this.apiHostUrl}/history/${promptId}?clientId=${this.CLIENT_ID}`, {
            // fetch(`${this.apiHostUrl}/history?clientId=${this.CLIENT_ID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                log('ComfyUIManager : History data for promptId ' + promptId);
                // log(JSON.stringify(data, null, 2));
                ComfyUIManager.showOutput(data[ComfyUIManager.currentPromptId]);
            })
            .catch(error => {
                log('ComfyUIManager : HTTP GET error: ' + JSON.stringify(error));
            });
        }
        else
        {
            log('ComfyUIManager : WebSocket is not open. Cannot get history.');
        }
    },

    showOutput: function (historyData)
    {
        const outputContainer = $('#output-container');
        outputContainer.empty();

        if (ComfyUIManager.currentWorkflow.type == 'textInput' || ComfyUIManager.currentWorkflow.type == 'cameraInput')
        {
            const saveImageNodeId = ComfyUIManager.currentWorkflow.saveImageNodeId;
            const images = historyData.outputs?.[saveImageNodeId]?.images;
            if (images && images.length > 0)
            {
                images.forEach(image => {
                    const imageUrl = `${ComfyUIManager.apiHostUrl}/view?filename=${image.filename}&subfolder=${image.subfolder}&type=${image.type}`;
                    const outputImg = UI.createImg({src: imageUrl, classes: 'output-image'});
                    outputContainer.append(outputImg);
                });
            }
        }
    }
};
    // "outputs": {
    //   "9": {
    //     "images": [
    //       {
    //         "filename": "ComfyUI_00002_.png",
    //         "subfolder": "",
    //         "type": "output"
    //       }
    //     ]
    //   }
    // },