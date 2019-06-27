var simpleinforef = firebase.database().ref().child("sandan-info-simple");
simpleinforef.once("value", function(snapshot) {
	var options = "";
	options += "<option value=\"none\">参団を選択してください</option>"
	snapshot.forEach(i => {
		var id = i.key.substring(7); // take "xx" from string "sandan-xx"
		options += "<option value=" + "\"" + i.key + "\"" + ">";
		options += id + " - " + i.child("sandan-name").val();
		options += "</option>";
	});
	document.getElementById("sandan-option").innerHTML = options;
});