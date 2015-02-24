// # **GenericCountModel**
/**
 * A Backbone.Model that represents the count of a set CMap databbase items
 * The data model captures the total count of perturbagens that meet a search criteria
 * optional arguments:
 * @param {string} search_field  the document field the model with count over upon fetching data,
 *                               defaults to *"pert_iname"*
 * @param {string} url           the url of the api service to fetch data from, defaults to
 *                               *"//api.lincscloud.org/a2/pertinfo"*
 * `generic_count_model = new GenericCountModel()`
 */

Barista.Models.GenericCountModel = Backbone.Model.extend({
  /**
   * describes the model's default parameters
   * @param {string} search_field  the document field the model with count over upon fetching data,
   *                               defaults to *"pert_iname"*
   * @param {string} url           the url of the api service to fetch data from, defaults to
   *                               *"//api.lincscloud.org/a2/pertinfo"*
   */
  defaults: {
    "search_field": "pert_iname",
    "url": "//api.lincscloud.org/a2/pertinfo",
    "count": 0,
    "last_update": (new Date()).getTime(),
    "search_string": "",
    "distinct": false
  },

  /**
   * custom initialization to make sure we have the correct url for jsonp
   */
  initialize: function(){
    var re = new RegExp("/?callback=/?");
    if (!re.test(this.get("url"))){
      this.set({"url": this.get("url") + "?callback=?"});
    }
  },

  /**
   * fetches new data from the API
   * the count is updated with a new count based on the results of the api call
   * @param  {string}  search_string  value to search for
   */
  fetch: function(search_string){
    // update the model's search string attribute
    this.set("search_string",search_string);

    // set up API call parameters
    search_string = (search_string[0] === "*") ? search_string.replace("*",".*") : search_string;
    var params = {q:'{"' + this.get("search_field") + '":{"$regex":"^' + search_string + '","$options":"i"}}',
              c:true};
    if (this.get("distinct")){
        _.extend(params,{d:this.get("search_field")});
    }

    // run the api request
    var self = this;
    var count;
    $.getJSON(this.get("url"),params,function(res) {
      if (res === 0){
        count = 0;
      }else{
        count = res.count;
      }
      var t = (new Date()).getTime();
      self.set({count: count,last_update: t});
    });
  }
});
