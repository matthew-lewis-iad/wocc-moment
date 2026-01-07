window.onload = function()
{
    $.getJSON('config/comfy-config.json', onConfigDataDidLoad).fail(function() {
        log('Error parsing admin.config.json');
    });

    $('#camera-capture-button').on('click', onCameraCaptureButtonClick);
    $('#camera-capture-scrim').on('click', onCameraCaptureScrimClick);
}

function onConfigDataDidLoad(data)
{
    window.config = data;

    // Wait for all workflows to load before initializing ComfyUI
    const workflowPromises = window.config.workflows.map(workflow => 
        $.getJSON(workflow.url).done(function(workflowData) {
            workflow.data = workflowData;
            createWorkflowElements(workflow);
        }).fail(function() {
            log('Error loading workflow from: ' + workflow.url);
        })
    );

    Promise.all(workflowPromises).then(init);
}

function createWorkflowElements(workflow)
{
    const workflowContainer = UI.createDiv({classes: 'workflow'});
    $('#workflows').append(workflowContainer);
    const workflowButton = UI.createDiv({classes: 'default-button workflow-button', html: workflow.name});
    $(workflowContainer).append(workflowButton);
    if (workflow.type == 'textInput')
    {
        const textInput = UI.createInput({classes: 'workflow-text-input', text: workflow.data[workflow.textInputNodeId]?.inputs?.text || '', placeholder: 'Enter prompt here...'});
        $(workflowContainer).append(textInput);
        workflow.textInputElement = textInput;
    }
    $(workflowButton).on('click', function() {
        onWorkflowButtonClick(workflow);
    });
}
    
function init()
{
    log('Workflows loaded. Initializing ComfyUI Manager...');
    ComfyUIManager.init();
}

function onWorkflowButtonClick(workflow)
{
    log('Starting workflow: ' + workflow.name);
    window.currentWorkflow = workflow;
    if (workflow.inputType == WORKFLOW_INPUT_TYPE.CAMERA)
    {
        startCameraCapture();
    }
    else
    {
        ComfyUIManager.startWorkflow(workflow, onWorkflowComplete);
    }
}

function startCameraCapture()
{
    $('#camera-capture').addClass('show');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
    .then(function(stream) {
        $('#camera-video')[0].srcObject = stream;
    })
    .catch(function(err) {
        log('Error accessing camera: ' + err);
    });
}

function onCameraCaptureButtonClick()
{
    const canvas = document.getElementById('camera-canvas');
    const context = canvas.getContext('2d');
    const video = $('#camera-video')[0];
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(function(blob) {
        ComfyUIManager.uploadImage(blob, onComfyUIImageUploaded);
    }, 'image/png');
}

function onCameraCaptureScrimClick()
{
    $('#camera-capture').removeClass('show');
}

function onComfyUIImageUploaded(data)
{
    log('Image uploaded: ', data);
    const workflow = window.currentWorkflow;
    if (workflow?.inputType == WORKFLOW_INPUT_TYPE.CAMERA)
    {
        workflow.data[workflow.imageInputNodeId].inputs.image = data.name;
        ComfyUIManager.startWorkflow(workflow, onWorkflowComplete);
        const stream = $('#camera-video')[0].srcObject;
        if (stream)
        {
            stream.getTracks().forEach(track => track.stop());
        }
        $('#camera-capture').removeClass('show');
    }
}

function onWorkflowComplete(historyData)
{
    log('Workflow complete');
    // data[ComfyUIManager.currentPromptId]
    ComfyUIManager.showOutput(historyData);
}

// Override console.log to capture all logs
(function() {
    const originalConsoleLog = console.log;
    console.log = function(message, omitTimestamp = false) {
        // Call original console.log
        originalConsoleLog.apply(console, [message]);
        
        // Add to log textarea
        if (!omitTimestamp) {
            $('#log')[0].value += moment().format('MMM-DD-YYYY HH:mm:ss') + ' - ';
        }
        $('#log')[0].value += message + '\n';
        $('#log')[0].scrollTop = $('#log')[0].scrollHeight;
    };
})();

function log(message, omitTimestamp = false)
{
    console.log(message, omitTimestamp);
}

window.onkeydown = function(e)
{
    // if (e.key == '`')
    // {
    // }
}