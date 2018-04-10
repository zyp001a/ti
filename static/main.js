var inp = document.getElementById("inp");
var c = document.getElementById("c");	
inp.addEventListener("keyup", function(event) {
  event.preventDefault();
  if (event.keyCode === 13) {
  	c.innerHTML += "<p>"+inp.value+"</p>"
  	var r = new XMLHttpRequest();
		r.open("GET", "/api/"+encodeURIComponent(inp.value), true);
		r.onreadystatechange = function () {
  		if (r.readyState != 4 || r.status != 200) return;
  		c.innerHTML += "<p>"+r.responseText+"</p>"
		};
		r.send()
  }
})
