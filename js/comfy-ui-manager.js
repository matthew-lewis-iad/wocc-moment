const WORKFLOW_INPUT_TYPE = {
    TEXT: 'text',
    CAMERA: 'camera',
    OUTPUT_IMAGE: 'outputImage'
}

const WORKFLOW_OUTPUT_TYPE = {
    IMAGE: 'image',
    MULTI_IMAGE: 'multiImage'
}

const ComfyUIManager = {
    CLIENT_ID: 'comfy-ui-manager',
    // websocketHostUrl: 'ws://127.0.0.1:8188',
    // apiHostUrl: 'http://127.0.0.1:8188',
    websocketHostUrl: 'ws://10.0.0.154:8188',
    apiHostUrl: 'http://10.0.0.154:8188',
    socket: null,
    init: function (delegate)
    {
        console.log('ComfyUIManager : init');
        this.delegate = delegate;
        this.socket = new WebSocket(`${this.websocketHostUrl}/ws?clientId=${this.CLIENT_ID}`);

        this.socket.onopen = function () {
            console.log('ComfyUIManager : WebSocket connection established');
        };
        
        this.socket.onmessage = function (event) {
            const eventData = JSON.parse(event.data);
            // console.log('ComfyUIManager : WebSocket message received - ' + eventData.type);
            if (eventData.type == 'progress')
            {
                console.log('ComfyUIManager : progress');
            }
            else if (eventData.type == 'progress_state')
            {
                console.log('ComfyUIManager : progress_state');
                const totalNodes = ComfyUIManager.currentWorkflow.totalProgressNodes ?? Object.keys(ComfyUIManager.currentWorkflow.data).length;
                let finishedNodes = 0;
                for (const nodeId in eventData.data.nodes)
                {
                    if (eventData.data.nodes[nodeId].state == 'finished')
                    {
                        finishedNodes++;
                    }
                }
                const progressPercent = Math.floor((finishedNodes / totalNodes) * 100);
                ComfyUIManager.updateProgress(progressPercent);
             
                if (ComfyUIManager.currentWorkflow.outputType == WORKFLOW_OUTPUT_TYPE.IMAGE)
                {
                    const saveNodeIds = ComfyUIManager.currentWorkflow.saveImageNodeIds;
                    let allFinished = true;
                    for (let i = 0; i < saveNodeIds.length; i++)
                    {
                        const nodeId = saveNodeIds[i];
                        if (eventData.data?.nodes?.[nodeId]?.state != 'finished')
                        {
                            allFinished = false;
                            break;
                        }
                    }
                    if (allFinished)
                    {
                        console.log('ComfyUIManager : Detected workflow finished state for promptId: ' + ComfyUIManager.currentPromptId);
                        ComfyUIManager.getHistory(ComfyUIManager.currentPromptId);
                    }
                }
                else
                {
                    console.log('ComfyUIManager : progress_state unhandled');
                }
            }
            else if (eventData.type == 'execution_start')
            {
                console.log('ComfyUIManager : execution_start');
            }
            else if (eventData.type == 'execution_cached')
            {
                console.log('ComfyUIManager : execution_cached');
            }
            else if (eventData.type == 'executing')
            {
                console.log('ComfyUIManager : executing');
            }
            else if (eventData.type == 'executed')
            {
                console.log('ComfyUIManager : executed');
            }
            else if (eventData.type == 'execution_error')
            {
                console.log('ComfyUIManager : execution_error');
            }
            console.dir(eventData);
        };
        
        this.socket.onclose = function () {
            console.log('ComfyUIManager : WebSocket connection closed');
        };
    },

    updateProgress(progressPercent)
    {
        if (ComfyUIManager.delegate && ComfyUIManager.delegate.comfyUIManagerDidUpdateProgress)
        {
            ComfyUIManager.delegate.comfyUIManagerDidUpdateProgress(progressPercent);
        }
        if ($('#workflow-progress-text')[0] && $('#workflow-progress-bar-fill')[0])
        {
            $('#workflow-progress-text')[0].innerHTML = progressPercent + '%';
            $('#workflow-progress-bar-fill')[0].style.width = progressPercent + '%';
        }
    },

    startWorkflow: function (workflow, callback)
    {
        if (ComfyUIManager.socket && ComfyUIManager.socket.readyState === WebSocket.OPEN)
        {
            ComfyUIManager.updateProgress(0);
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
                clientId: ComfyUIManager.CLIENT_ID
            };
            fetch(`${ComfyUIManager.apiHostUrl}/prompt?clientId=${ComfyUIManager.CLIENT_ID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            })
            .then(response => response.json())
            .then(data => {
                console.log('ComfyUIManager : /prompt success with prompt_id = ' + data.prompt_id);
                ComfyUIManager.currentPromptId = data.prompt_id;
                ComfyUIManager.currentWorkflow = workflow;
                ComfyUIManager.currentWorkflowCallback = callback;
            })
            .catch(error => {
                console.log('ComfyUIManager : /prompt error: ' + JSON.stringify(error));
            });
            console.log('ComfyUIManager : Sent startWorkflow message');
        }
        else
        {
            console.log('ComfyUIManager : WebSocket is not open. Cannot start workflow.');
        }
    },

    uploadImage: function (imageFile, callback)
    {
        if (ComfyUIManager.socket && ComfyUIManager.socket.readyState === WebSocket.OPEN)
        {
            const filename = moment().format('YYYYMMDD_HHmmss') + '.png';
            const formData = new FormData();
            formData.append('image', imageFile, filename);
            fetch(`${ComfyUIManager.apiHostUrl}/upload/image`, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // data : {
                //     name,
                //     subfolder,
                //     type
                // }
                console.log('ComfyUIManager : Image upload success - ' + data.name);
                if (callback) {
                    callback(data);
                }
            })
            .catch(error => {
                console.log('ComfyUIManager : Image upload error: ' + JSON.stringify(error));
            });
        }
    },

    getHistory: function (promptId)
    {
        console.log('ComfyUIManager : getHistory for promptId ' + promptId);
        if (ComfyUIManager.socket && ComfyUIManager.socket.readyState === WebSocket.OPEN)
        {
            fetch(`${ComfyUIManager.apiHostUrl}/history/${promptId}?clientId=${ComfyUIManager.CLIENT_ID}`, {
            // fetch(`${this.apiHostUrl}/history?clientId=${this.CLIENT_ID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log('ComfyUIManager : History data for promptId ' + promptId);
                console.dir(data);
                // ComfyUIManager.showOutput(data[ComfyUIManager.currentPromptId]);
                if (ComfyUIManager.currentWorkflowCallback)
                {
                    ComfyUIManager.currentWorkflowCallback(data[ComfyUIManager.currentPromptId]);
                }
            })
            .catch(error => {
                console.log('ComfyUIManager : HTTP GET error: ' + JSON.stringify(error));
            });
        }
        else
        {
            console.log('ComfyUIManager : WebSocket is not open. Cannot get history.');
        }
    },

    showOutput: function (historyData)
    {
        const outputContainer = $('#output-container');
        outputContainer.empty();

        if (ComfyUIManager.currentWorkflow.outputType == WORKFLOW_OUTPUT_TYPE.IMAGE)
        {
            const saveImageNodeIds = ComfyUIManager.currentWorkflow.saveImageNodeIds;
            const images = [];
            for (const nodeId of saveImageNodeIds)
            {
                const nodeImages = historyData.outputs?.[nodeId]?.images;
                if (nodeImages && nodeImages.length > 0)
                {
                    images.push(...nodeImages);
                }
            }
            if (images.length > 0)
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