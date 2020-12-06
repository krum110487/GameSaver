console.log("businessProcesses.js Injected.")
let hostVal = location.hostname;

//Replace the ID with a Hyperlink to allow direct access to the Activiti page.
let templateTable = document.querySelectorAll('#templateListTable_TBODY > tr > td#templateListTableCol_1');
templateTable.forEach(element => {
    let inHTML = element.innerHTML;
    let templateId = inHTML.substr(0, inHTML.indexOf('<'));
    let newInnerHTML = inHTML.replace(templateId, `<a target="_blank" href="https://${hostVal}/bpm-admin/#/deployment/${templateId}">${templateId}</a>`)
    element.innerHTML = newInnerHTML
});

let modelTable = document.querySelectorAll('#templateListTable_TBODY > tr > td#templateListTableCol_8');
modelTable.forEach(element => {
    let inHTML = element.innerHTML;
    let modelId = inHTML.substr(0, inHTML.indexOf('<')).replace(/\r?\n|\r/gm,"");
    let newInnerHTML = inHTML.replace(modelId, `<a target="_blank" href="https://${hostVal}/bpm-designer/editor/#/processes/${modelId}">${modelId}</a>`)
    element.innerHTML = newInnerHTML
});

//var connection = new WebSocket('ws://html5rocks.websocket.org/echo');
//on the new page to delete use this "angular.element($0).scope().deleteDeployment()"
/*
https://childrenshospitalo-uat.npr.mykronos.com/bpm-admin/#/deployment/27501, verify then...

if (result === true) {
    $http({method: 'DELETE', url: '/app/rest/activiti/deployments/27501', params: {serverId: activeServer.id, cascade: true}}).
    success(function(data, status, headers, config) {
        //Delete was completed and now we must refresh the page.
    }).
    error(function(data, status, headers, config) {
        //log data for error.
    });
}
*/


//The following code is used to get the server id
/*
https://childrenshospitalo-uat.npr.mykronos.com/bpm-admin/#/deployment/27501
$http({method: 'GET', url: '/app/rest/cluster-configs'}).
        success(function(data, status, headers, config) {
            if (data.length > 0) {
                data[0].serverConfigs[0];
            }
        }).
        error(function(data, status, headers, config) {
            console.log('Something went wrong: ' + data);
        });
}
*/