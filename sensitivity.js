/**
 * Adjust the given variable in given range, and calculate utility for each step
 * @param tree_data root of the tree data
 * @param var_name The name of the variable to be changed, in this case name of diagnosis
 * @param attr_name The name of the attribue to be changed, in this case always "diagnosis_prob"
 * @param var_min
 * @param var_max
 * @param step
 * @returns {*[]} treatment names, and JSON array of utilities over different values of variable
 */
function adjustAndCalcUtil(tree_data, var_name,  var_min, var_max, step, attr_name="diagnosis_prob") {
   const num_steps = (var_max - var_min) / step;
   const treatment_nodes = tree_data.children;
   let re_JSON_utils = Array(num_steps);
   let re_treatments = Array(treatment_nodes.length);
   treatment_nodes.forEach((t, i) => {
      re_treatments[i] = t.name;
   });
   let var_init_value = 0;
   // First find the current value
   tree_data.children.forEach((t) => {
      if (var_init_value > 0) return;
      t.children.forEach((d) => {
         if (var_init_value > 0) return;
         if (d.name === var_name) {
               var_init_value = d[attr_name];
         }
      });
   });

   let c = 0;
   for (let var_value = var_min; var_value < var_max; var_value += step) {
      let new_data = JSON.parse(JSON.stringify(tree_data));
      let re_obj = {};
      adjustRecursive(new_data, var_name, attr_name, var_init_value, var_value);
      re_obj["value"] = var_value;
      re_obj["utility"] = calculateUtil(new_data);
      re_JSON_utils[c] = re_obj;
      c++;
   }
   return [re_treatments, re_JSON_utils];
}

/**
 * Adjust the value of a given variable down a tree in place
 * Will also discount other probabilites if name does not match
 * @param tree
 * @param attr_name
 * @param var_name
 * @param from_value
 * @param to_value
 */
function adjustRecursive(tree, var_name, attr_name, from_value, to_value) {
   if (tree.name === var_name) {
      tree[attr_name] = to_value;
   } else if (tree[attr_name]){
      tree[attr_name] = getDiscountedProb(from_value, to_value, tree[attr_name]);
   }

   if (tree.children) {
      tree.children.forEach((c) => adjustRecursive(c, var_name, attr_name, from_value, to_value));
   }
}

/**
 * See documentation under "Sensitivity analysis"
 * To ensure that the sum of probability remains 1, all other diagnosis probabilities will be discounted.
 * For example, let {di} be the set of diagnosis probabilities. If we vary the value of dk to dk',
 * then for all other di, di' = (1 - dk' / 1 - dk) x di
 * @param init_prob
 * @param adjust_prob
 * @param prob_to_discount
 * @returns {number}
 */
function getDiscountedProb(init_prob, adjust_prob, prob_to_discount) {
    return (1 - adjust_prob) / (1 - init_prob) * prob_to_discount;
}