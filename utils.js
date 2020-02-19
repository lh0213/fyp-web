function GetSortOrder(prop) {
    return function(a, b) {
        if (a[prop] > b[prop]) {
            return 1;
        } else if (a[prop] < b[prop]) {
            return -1;
        }
        return 0;
    }
}

function calc_util(util_array) {
    /* Basically mortality probability here */
    const util_values = [1, 1, 1, 1, 1, 0];
    let re = 0;
    for (let i = 0; i < util_array.length; i++) {
        re += util_array[i] * util_values[i];
    }

    /* Times 4 since original data are in 4-hour windows */
    return re * 4;
}
