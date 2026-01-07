var cameraCanvas, cameraContext;

window.onload = function()
{
    $.getJSON('config/config.json', onConfigDataDidLoad).fail(function() {
        log('Error parsing admin.config.json');
    });
}

function onConfigDataDidLoad(data)
{
    window.config = data;

    function loadWorkflow(workflow) {
        return $.getJSON(workflow.url).done(function(workflowData) {
            workflow.data = workflowData;
        }).fail(function() {
            console.log('Error loading workflow from: ' + workflow.url);
        });
    }

    const workflowPromises = window.config.poseWorkflows.map(loadWorkflow);
    const sceneWorkflowPromises = window.config.sceneWorkflows.map(loadWorkflow);
    workflowPromises.push(...sceneWorkflowPromises);

    Promise.all(workflowPromises).then(init);
}
    
function init()
{
    console.log('Workflows loaded. Initializing ComfyUI Manager...');
    ComfyUIManager.init(window);

    $('#idle-view').on('click', showCameraCaptureView);
    $('#camera-capture-button').on('click', onCameraCaptureButtonClick);
    cameraCanvas = document.getElementById('camera-canvas');
    cameraContext = cameraCanvas.getContext('2d');
    $('#camera-retake-button').on('click', showCameraCaptureView);
    $('#camera-accept-button').on('click', onCameraAcceptButtonClick);
    for (let i=0; i < window.config.sceneWorkflows.length; i++)
    {
        const workflow = window.config.sceneWorkflows[i];
        const button = UI.createDiv({classes: 'default-button scene-select-button', html: workflow.name});
        button.dataset.index = i;
        $(button).on('click', onSceneSelectButtonClick);
        $('#scene-select-buttons').append(button);
    }
    $('#result-startover-button').on('click', showCameraCaptureView);

    // showIdleView();
    showCameraCaptureView();
}

function showIdleView()
{
    console.log('showIdleView');
    $('html')[0].dataset.view = 'idle';
}

function showCameraCaptureView()
{
    console.log('showCameraCaptureView');
    $('html')[0].dataset.view = 'camera-capture';
    startCameraCapture();
}

function startCameraCapture()
{
    console.log('startCameraCapture');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
    .then(function(stream) {
        $('#camera-video')[0].srcObject = stream;
    })
    .catch(function(err) {
        console.log('Error accessing camera: ' + err);
    });
}

function onCameraCaptureButtonClick()
{
    console.log('onCameraCaptureButtonClick');
    let countdown = 3;
    const countdownElement = $('#camera-countdown');
    countdownElement.text(countdown);
    countdownElement.addClass('show');

    const countdownInterval = setInterval(function() {
        countdown--;
        if (countdown > 0) {
            countdownElement.text(countdown);
        } else {
            clearInterval(countdownInterval);
            countdownElement.removeClass('show');
            showCameraAcceptView();
        }
    }, 1000);
}

function showCameraAcceptView()
{
    console.log('showCameraAcceptView');
    $('html')[0].dataset.view = 'camera-accept';

    const video = $('#camera-video')[0];
    cameraCanvas.width = video.videoWidth;
    cameraCanvas.height = video.videoHeight;
    cameraContext.drawImage(video, 0, 0, cameraCanvas.width, cameraCanvas.height);
    $('#camera-accept-image')[0].src = cameraCanvas.toDataURL('image/png');

    // canvas.toBlob(function(blob) {
    //     ComfyUIManager.uploadImage(blob, onComfyUIImageUploaded);
    // }, 'image/png');
}

function onCameraAcceptButtonClick()
{
    console.log('onCameraAcceptButtonClick');
    cameraCanvas.toBlob(function(blob) {
        ComfyUIManager.uploadImage(blob, onComfyUIImageUploaded);
    }, 'image/png');

    const stream = $('#camera-video')[0].srcObject;
    if (stream)
    {
        stream.getTracks().forEach(track => track.stop());
    }

    showProgressView();
}

function showProgressView()
{
    console.log('showProgressView');
    $('html')[0].dataset.view = 'progress';
    $('#progress-message')[0].innerHTML = 'Generating your Coca-Cola Moment...';
    $('#progress-percent')[0].innerHTML = '0%';
    $('#progress-bar-fill')[0].style.width = '0%';
}

function comfyUIManagerDidUpdateProgress(percent)
{
    console.log('comfyUIManagerDidUpdateProgress: ' + percent + '%');
    $('#progress-percent')[0].innerHTML = percent + '%';
    $('#progress-bar-fill')[0].style.width = percent + '%';
}

function onComfyUIImageUploaded(data)
{
    console.log('Image uploaded: ', data);
    window.currentPoseWorkflow = window.config.poseWorkflows[0]; // For now, just use the first pose workflow
    const workflow = window.currentPoseWorkflow;
    workflow.data[workflow.imageInputNodeId].inputs.image = data.name;
    ComfyUIManager.startWorkflow(workflow, onPoseWorkflowComplete);
}

function onPoseWorkflowComplete(historyData)
{
    console.log('onPoseWorkflowComplete');
    console.dir(historyData);

    const saveImageNodeIds = window.currentPoseWorkflow.saveImageNodeIds;
    const images = [];
    for (const nodeId of saveImageNodeIds)
    {
        const nodeImages = historyData.outputs?.[nodeId]?.images;
        if (nodeImages && nodeImages.length > 0)
        {
            for (const img of nodeImages)
            {
                const imageUrl = `${ComfyUIManager.apiHostUrl}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`;
                const outputImg = UI.createImg({src: imageUrl, classes: 'pose-image'});
                $(outputImg).data('promptInputFilename', `../${img.type}/${img.subfolder}/${img.filename}`);
                images.push(outputImg);
            }
        }
    }

    showPoseSelectView(images);
}

function showPoseSelectView(images)
{
    console.log('showPoseSelectView');
    $('#pose-select-images').empty();
    images.forEach((image, index) => {
        const imageWrapper = UI.createDiv({classes: 'pose-image-wrapper'});
        $(imageWrapper).append(image);
        $(imageWrapper).on('click', function() {
            onPoseImageSelected(image);
        });
        $('#pose-select-images').append(imageWrapper);
    });
    $('html')[0].dataset.view = 'pose-select';
}

function onPoseImageSelected(image)
{
    console.log('onPoseImageSelected: ', image);
    window.currentPoseImage = image;
    showSceneSelectView();
}

function showSceneSelectView()
{
    console.log('showSceneSelectView');
    $('html')[0].dataset.view = 'scene-select';
}

function onSceneSelectButtonClick(event)
{
    const button = event.currentTarget;
    const index = parseInt(button.dataset.index);
    console.log('onSceneSelectButtonClick: ' + index);

    window.currentSceneWorkflow = window.config.sceneWorkflows[index];
    const workflow = window.currentSceneWorkflow;
    workflow.data[workflow.imageInputNodeId].inputs.image = $(window.currentPoseImage).data('promptInputFilename');

    showProgressView();
    ComfyUIManager.startWorkflow(workflow, onSceneWorkflowComplete);
}

function onSceneWorkflowComplete(historyData)
{
    console.log('onSceneWorkflowComplete');
    console.dir(historyData);

    const saveImageNodeIds = window.currentSceneWorkflow.saveImageNodeIds;
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
        const img = images[0];
        const imageUrl = `${ComfyUIManager.apiHostUrl}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`;
        $('#result-image')[0].src = imageUrl;
    }

    showResultView();
}

function showResultView()
{
    console.log('showResultView');
    $('html')[0].dataset.view = 'result';
}

window.onkeydown = function(event)
{
    if (event.key === '1') {
        showIdleView();
    }
    else if (event.key === '2') {
        showCameraCaptureView();
    }
    else if (event.key === '3') {
        showCameraAcceptView();
    }
    else if (event.key === '4') {
        showProgressView();
    }
}