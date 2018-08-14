angular.module('go-plan-do.filters', [])
 .filter('highlight', ['$sce', function($sce) {
  
    return function(text, phrase) {
      if (phrase) text = text.replace(new RegExp('('+phrase+')', 'gi'),
        '<span class="highlighted">$1</span>')

      return $sce.trustAsHtml(text)
    }
  }])
.filter('propsFilter', function() {
  return function(items, props) {
    var out = [];

    if (angular.isArray(items)) {
      items.forEach(function(item) {
        var itemMatches = false;

        var keys = Object.keys(props);
        for (var i = 0; i < keys.length; i++) {
          var prop = keys[i];
          var text = props[prop].toLowerCase();
          if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
            itemMatches = true;
            break;
          }
        }

        if (itemMatches) {
          out.push(item);
        }
      });
    } else {
      // Let the output be the input untouched
      out = items;
    }

    return out;
  };
})
.filter("getTruncateProjectName",function(){
	return function(input){
		var a = "..";
		if(input.length > 20){
			var c = input.length - 20;
			console.log(c);
			a = input.substring(c,input.length) + "..." ;
			return a; 
				
		}else{
			console.log("less");
		}
		console.log(input);
		
		return input;
	}
}) ;