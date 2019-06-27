function set_diary_table() {
	document.getElementById("diary-table-message").innerHTML = "データをロードしています・・・";
	var tablehead = "";
	tablehead += "<tr>";
	tablehead += "<th>#</th>";
	tablehead += "<th>時刻</th>";
	tablehead += "<th colspan=\"2\">入力者</th>";
	tablehead += "<th width=\"450\">日誌の内容</th>";
	tablehead += "</tr>";
	var normal_content = tablehead;
	var executive_content = tablehead;
	var diariesref = firebase.database().ref("committee/diaries");
	diariesref.once("value", function(snapshot) {
		snapshot.forEach(i => {
			var dt = new Date(i.child("time").val());
			var subcontent = "";
			subcontent += "<tr>";
			subcontent += "<td>" + parseInt(i.key.substring(8)) + "</td>"; // take "xxxxxx" from "diaries-xxxxxx"
			subcontent += "<td>" + (dt.toLocaleDateString() + " " + dt.toLocaleTimeString()) + "</td>";			
			subcontent += "<td>" + i.child("editor-id").val() + "</td>";
			subcontent += "<td>" + i.child("editor-name").val() + "</td>";
			subcontent += "<td>" + i.child("content").val() + "</td>";
			subcontent += "</tr>";
			if(i.child("type").val() == "normal") {
				normal_content += subcontent;
			}
			if(i.child("type").val() == "executive") {
				executive_content += subcontent;
			}
		});
		document.getElementById("normal-diary-table").innerHTML = normal_content;
		document.getElementById("executive-diary-table").innerHTML = executive_content;
		document.getElementById("diary-table-message").innerHTML = "データがすべて読み込まれました！";
	});
}