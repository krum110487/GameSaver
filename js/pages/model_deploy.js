function getDate() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!

    var yyyy = today.getFullYear();
    if (dd < 10) {
    dd = '0' + dd;
    } 
    if (mm < 10) {
    mm = '0' + mm;
    } 
    var today = dd + '/' + mm + '/' + yyyy;
    return today;
}

if(document.getElementById("endDateType_0")) {
    document.getElementById("endDateType_0").click()
    document.getElementById("templateStatus_0").click()
    document.getElementById("startDate").value = '1/01/1900'
    document.getElementById("startDate").dispatchEvent(new Event('change'))
}


//check for variable to determine if it is a replacement, 
//then find the Display name if it matches otherwise leave it blank.