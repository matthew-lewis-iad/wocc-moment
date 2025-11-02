window.onload = function()
{
    $.getJSON('config/config.json', onConfigDataDidLoad).fail(function() {
        log('Error parsing admin.config.json');
    });
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
    ComfyUIManager.startWorkflow(workflow);
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