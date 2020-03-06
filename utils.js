function getSortOrder(prop) {
    return function(a, b) {
        if (a[prop] > b[prop]) {
            return 1;
        } else if (a[prop] < b[prop]) {
            return -1;
        }
        return 0;
    }
}

/**
 * Calculates utility based on probabilities in the tree; ignores predefined utilities in the data itself
 * Assumes data has at least 1 treatment, 1 diagnosis and 1 state to transition to
 * @param tree_root
 * @returns any[] array of utilities corresponding to treatments; order following give data
 */
function calculateUtil(tree_root) {
    const treatment_nodes = tree_root.children;
    let re_utilities = Array(treatment_nodes.length);
    // Assuming transitioning to same set of states
    const num_states = tree_root.num_states;
    const num_diagnosis = num_states;
    treatment_nodes.forEach((treatment, i) => {
        let treatment_util = 0;
        treatment.children.forEach((diagnosis) => {
            if (!diagnosis.children) return;
            let treat_diag_util = 0;
            diagnosis.children.forEach((next_state) => treat_diag_util += next_state.tr_prob *
                    (num_states - 1 - next_state.severity) / (num_states - 1));
            treat_diag_util *= diagnosis.diagnosis_prob;
            treatment_util += treat_diag_util;
        });
        re_utilities[i] = treatment_util;
    });

    return re_utilities;
}

/**
 * Retrieves GET parameter
 * https://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
 * @param parameterName
 * @returns {null}
 */
function findGetParameter(parameterName) {
    let result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}