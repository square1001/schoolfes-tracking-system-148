var carray = document.cookie.split(";");
for(var i = 0; i < carray.length; ++i) {
	var csub = carray[i];
	if(csub.indexOf("login-id=") != -1) {
		var ref = document.getElementById("login-display");
		ref.href = "/logout.html";
		ref.innerHTML = "ログアウト";
	}
}
firebase.auth().onAuthStateChanged((user) => {
	if (!user) {
		document.getElementById("signed-in-or-not").innerHTML = "Not signed in";
	}
	else {
		var editor_id = get_editor_id();
		firebase.database().ref("names/student-" + editor_id).once("value", function(snapshot) {
			document.getElementById("signed-in-or-not").innerHTML = "Signed in as: " + user.email + "　/　" + editor_id + " " + snapshot.child("name-kanji").val();
		});
	}
});
function get_editor_id() {
	var pos = document.cookie.indexOf("login-id=");
	if(pos == -1) return "";
	return document.cookie.substring(pos + 9, pos + 13); // get "xxxx" from "login-id=xxxx"
}
function get_status() {
	var pos = document.cookie.indexOf("status=");
	if(pos == -1) return "";
	if(document.cookie.substring(pos + 7, pos + 11) == "none") return "none";
	if(document.cookie.substring(pos + 7, pos + 16) == "executive") return "executive";
	if(document.cookie.substring(pos + 7, pos + 12) == "admin") return "admin";
	return "";
}