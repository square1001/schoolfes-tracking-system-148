function make_active_days_table() {
	var activedaysref = firebase.database().ref("sandan-active-days");
	var simpleinforef = firebase.database().ref("sandan-info-simple");
	activedaysref.once("value", function(snapshot) {
		simpleinforef.once("value", function(snapshot_info) {
			var dayslist = [];
			snapshot.forEach(sandan => {
				var active_days = sandan.val();
				if(active_days == null) active_days = [];
				for(var i = 0; i < active_days.length; ++i) {
					if(dayslist.indexOf(active_days[i]) == -1) {
						dayslist.push(active_days[i]);
					}
				}
			});
			dayslist.sort();
			var content = "";
			content += "<tr>";
			content += "<th colspan=\"2\">参団名</th>";
			content += "<th>活動日数</th>";
			for(var i = 0; i < dayslist.length; ++i) {
				var date_parse = parseInt(dayslist[i].substring(5, 7)) + "/" + parseInt(dayslist[i].substring(8, 10));
				content += "<th style=\"width: 45px\">" + date_parse + "</th>";
			}
			content += "</tr>";
			snapshot_info.forEach(sandan => {
				var active_days = snapshot.child(sandan.key).val();
				if(active_days == null) active_days = [];
				var subcontent = "";
				subcontent += "<tr>";
				subcontent += "<td>" + sandan.key.substr(7) + "</td>"; // take "xx" from "sandan-xx"
				subcontent += "<td>" + sandan.child("sandan-name").val() + "</td>";
				subcontent += "<td>" + active_days.length + "</td>";
				for(var i = 0; i < dayslist.length; ++i) {
					if(active_days.indexOf(dayslist[i]) != -1) {
						subcontent += "<td>〇</td>";
					}
					else {
						subcontent += "<td>✖</td>";
					}
				}
				subcontent += "</tr>";
				content += subcontent;
			});
			document.getElementById("active-days-table").innerHTML = content;
		});
	});
}