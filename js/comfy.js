window.onload = function()
{
    $.getJSON('config/config.json', onConfigDataDidLoad).fail(function() {
        log('Error parsing admin.config.json');
    });

    $('#camera-capture-button').on('click', onCameraCaptureButtonClick);
}

function onConfigDataDidLoad(data)
{
    window.config = data;

    for (const workflow of window.config.workflows)
    {
        $.getJSON(workflow.url).done(function(workflowData) {
            workflow.data = workflowData;
        }).fail(function() {
            console.log('Error loading workflow from: ' + workflow.url);
        });
    }

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
    if (workflow.type == 'cameraInput')
    {
        startCameraCapture(workflow);
    }
    else
    {
        ComfyUIManager.startWorkflow(workflow);
    }
}

function startCameraCapture(workflow)
{
    $('#camera-capture').addClass('show');
    navigator.mediaDevices.getUserMedia({ video: true })
    .then(function(stream) {
        $('#camera-video')[0].srcObject = stream;
    })
    .catch(function(err) {
        log('Error accessing camera: ' + err);
    });
}

function onCameraCaptureButtonClick(workflow)
{
    const canvas = document.getElementById('camera-canvas');
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(function(blob) {
        const reader = new FileReader();
        reader.onloadend = function() {
            // const base64data = reader.result.split(',')[1];
            // workflow.data[workflow.imageInputNodeId].inputs.image = base64data;
            // ComfyUIManager.startWorkflow(workflow);
            // stream.getTracks().forEach(track => track.stop());
            // $('#camera-capture').removeClass('show');
        }
        reader.readAsDataURL(blob);
    }, 'image/png');
}

function log(message, omitTimestamp = false)
{
    console.log(message);
    if (!omitTimestamp) {
        $('#log')[0].value += moment().format('MMM-DD-YYYY HH:mm:ss') + ' - ';
    }
    $('#log')[0].value += message + '\n';
    $('#log')[0].scrollTop = $('#log')[0].scrollHeight;
}

window.onkeydown = function(e)
{
    // if (e.key == '`')
    // {
    // }
}