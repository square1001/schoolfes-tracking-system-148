function get_accident_records() {
	var accidentref = firebase.database().ref("accidents");
	var simpleinforef = firebase.database().ref("sandan-info-simple");
	document.getElementById("accident-record-message").innerHTML = "データを取得中です・・・";
	accidentref.once("value", function(snapshot) {
		simpleinforef.once("value", function(snapshot_info) {
			var content = "";
			content += "<tr>";
			content += "<th colspan=\"2\">参団名</th>";
			content += "<th>#</th>";
			content += "<th>入力時刻</th>";
			content += "<th width=\"400\">事故内容</th>";
			content += "</th>";
			snapshot.forEach(accidents => {
				var sandan_id = accidents.key.substring(7); // take "xx" from "sandan-xx"
				var sandan_name = snapshot_info.child("sandan-" + sandan_id + "/sandan-name").val();
				var subcontent = "";
				var cnt = 0;
				accidents.forEach(i => {
					var request_id = parseInt(i.key.substring(8)); // take "xxxxxx" from "request-xxxxxx"
					var dt = new Date(i.child("time").val());
					subcontent += "<tr>";
					if(cnt == 0) {
						subcontent += "<td rowspan=\"" + accidents.numChildren() + "\">" + sandan_id + "</td>";
						subcontent += "<td rowspan=\"" + accidents.numChildren() + "\">" + sandan_name + "</td>";
					}
					subcontent += "<td>" + request_id + "</td>";
					subcontent += "<td>" + get_time_string(dt) + "</td>";
					subcontent += "<td>" + i.child("content").val() + "</td>";
					subcontent += "</tr>";
				});
				content += subcontent;
			});
			document.getElementById("accident-record-table").innerHTML = content;
			document.getElementById("accident-record-message").innerHTML = "データが正常に取得できました！";
		});
	});
}