var content = "";
content += "<h1>148th文化祭：参団トラッキングシステム";
content += "<table class=\"nav-bar\">";
content += "<tr>";
content += "<td><a href=\"/index.html\">Home</a></td>"
if (document.cookie.indexOf("login-id=") != -1) {
	content += "<td><a href=\"/sandan/input.html\">参団の管理</a></td>";
	content += "<td><a href=\"/sandan/stats.html\">参団の記録</a></td>";
	content += "<td><a href=\"/sandan/recent.html\">活動データ</a></td>";
	content += "<td><a href=\"/committee/input.html\">文準関連</a></td>";
	var pos = document.cookie.indexOf("status=");
	if(document.cookie.substring(pos + 7, pos + 12) == "admin") {
		content += "<td><a href=\"/admin.html\">Admin</a></td>";
	}
	content += "<td><a href=\"/logout.html\">Logout</a></td>";
}
else {
	content += "<td><a id=\"login-display\" href=\"/login.html\">Login</a></td>";
}
content += "</tr>";
content += "</table>";
content += "<div style=\"height: 20px; text-align: right; background-color: #555555\">";
content += "<p style=\"font-size: 12px; color: white;\" id=\"signed-in-or-not\"></p>";
content += "</div>";
document.getElementById("nav-bar").innerHTML = content;
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